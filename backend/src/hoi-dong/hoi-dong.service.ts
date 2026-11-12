import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  CapDanhGia, ChucDanhHoiDong, LoaiMinhChungBaoVe, PhieuHoiDong, QuyCheBaoVe,
  TrangThaiDeTai, TrangThaiHocVien, TrangThaiMinhChung, TrinhDo, VaiTro,
} from '../common/enums';
import { DefenseReadinessService, editableDefenseStatuses } from '../de-tai/defense-readiness.service';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { MinhChungBaoVe } from '../de-tai/entities/minh-chung-bao-ve.entity';
import { UploadService } from '../upload/upload.service';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { ChamDiemHoiDongDto, CreateHoiDongDto, GhiNhanKetQuaDto } from './dto';
import { HoiDong } from './entities/hoi-dong.entity';
import { ThanhVienHoiDong } from './entities/thanhvien-hoidong.entity';

type Actor = { maNd: string; vaiTro: VaiTro };
const chairRole = ChucDanhHoiDong.ChuTich;
const secretaryRole = ChucDanhHoiDong.ThuKy;
const reviewerRoles = [ChucDanhHoiDong.PhanBien1, ChucDanhHoiDong.PhanBien2];
const twoHours = 2 * 60 * 60 * 1000;

@Injectable()
export class HoiDongService {
  constructor(
    @InjectRepository(HoiDong) private readonly hoiDongRepo: Repository<HoiDong>,
    private readonly dataSource: DataSource,
    private readonly readiness: DefenseReadinessService,
    private readonly uploads: UploadService,
  ) {}

  async create(dto: CreateHoiDongDto, user: Actor): Promise<HoiDong> {
    const ngayBaoVe = new Date(dto.ngayBaoVe);
    if (!Number.isFinite(ngayBaoVe.getTime()) || ngayBaoVe <= new Date()) {
      throw new BadRequestException('Ngày bảo vệ phải ở tương lai');
    }
    if (!dto.diaDiem?.trim() || !dto.daKiemTraTieuChuan) {
      throw new BadRequestException('Nhập địa điểm và xác nhận đã thẩm tra tiêu chuẩn, xung đột lợi ích của thành viên');
    }
    const isFinal = dto.capDanhGia === CapDanhGia.CapTruong;
    const maHd = await this.dataSource.transaction(async (manager) => {
      // Serialize schedule changes so two requests cannot book the same lecturer concurrently.
      await manager.query('SELECT pg_advisory_xact_lock(418021, 14)');
      const topic = await manager.getRepository(DeTai).createQueryBuilder('dt')
        .innerJoinAndSelect('dt.hocVien', 'hv')
        .leftJoinAndSelect('hv.chuyenNganh', 'cn')
        .where('dt.maDt = :id', { id: dto.maDt })
        .setLock('pessimistic_write', undefined, ['dt'])
        .getOne();
      if (!topic) throw new NotFoundException('Không tìm thấy đề tài');
      if (topic.hocVien.trangThai !== TrangThaiHocVien.DangHoc) {
        throw new BadRequestException('Chỉ lập hội đồng cho học viên đang học');
      }

      const isDoctoral = topic.hocVien.trinhDo === TrinhDo.TienSi;
      const checklist = await this.readiness.build(topic, user, manager);
      if (isFinal) {
        if (topic.trangThai !== TrangThaiDeTai.DuDKBaoVe || !topic.ngayXacNhanBaoVe || !checklist.duDieuKien) {
          throw new BadRequestException('Cần hồ sơ đầy đủ và xác nhận điều kiện trước khi lập hội đồng bảo vệ');
        }
      } else {
        const core = ['HocPhan', 'TienDo', LoaiMinhChungBaoVe.BanThao, LoaiMinhChungBaoVe.CongBo];
        if (!isDoctoral || !editableDefenseStatuses.includes(topic.trangThai)
          || checklist.tieuChi.some((item) => core.includes(item.id) && !item.dat)) {
          throw new BadRequestException('Đánh giá tại đơn vị chuyên môn yêu cầu hồ sơ tiến sĩ đủ học phần, tiến độ, bản thảo và công bố');
        }
      }

      const existing = await manager.find(HoiDong, {
        where: { maDt: dto.maDt, capDanhGia: dto.capDanhGia },
        relations: { thanhVien: true },
        order: { lanBaoVe: 'DESC' },
      });
      const previous = existing[0];
      if (previous && (!isFinal || !previous.kienNghiBaoVeLai || previous.lanBaoVe >= 2)) {
        throw new ConflictException('Hồ sơ đã có hội đồng ở cấp đánh giá này');
      }
      if (previous?.quyChe && previous.quyChe !== dto.quyChe) {
        throw new BadRequestException('Lần đánh giá lại phải áp dụng cùng quy chế với lần đầu');
      }
      if (previous?.ngayBaoVe) {
        const deadline = this.addMonths(previous.ngayBaoVe, isDoctoral ? 6 : 3);
        if (ngayBaoVe > deadline) throw new BadRequestException('Lịch đánh giá lại vượt quá thời hạn');
      }

      await this.validateMembers(dto, topic, manager, previous);
      if (isFinal && isDoctoral && !previous) {
        const review = await manager.findOneBy(MinhChungBaoVe, { maDt: topic.maDt, loai: LoaiMinhChungBaoVe.PhanBien });
        if (review?.ngayDuyet && ngayBaoVe > this.addMonths(review.ngayDuyet, 3)) {
          throw new BadRequestException('Lịch bảo vệ vượt quá 3 tháng kể từ ngày ghi nhận kết quả phản biện');
        }
      }

      const ids = dto.thanhVien.map((member) => member.maGv);
      const conflict = await manager.getRepository(ThanhVienHoiDong).createQueryBuilder('tv')
        .innerJoin('tv.hoiDong', 'hd')
        .where('tv.maGv IN (:...ids)', { ids })
        .andWhere('hd.ngayBaoVe BETWEEN :start AND :end', {
          start: new Date(ngayBaoVe.getTime() - twoHours), end: new Date(ngayBaoVe.getTime() + twoHours),
        })
        .getOne();
      if (conflict) throw new ConflictException('Có thành viên đã được xếp hội đồng khác trong khoảng hai giờ');

      const hd = await manager.save(HoiDong, manager.create(HoiDong, {
        maDt: topic.maDt, capDanhGia: dto.capDanhGia, quyChe: dto.quyChe,
        ngayBaoVe, diaDiem: dto.diaDiem.trim(), lanBaoVe: previous ? previous.lanBaoVe + 1 : 1,
      }));
      await manager.insert(ThanhVienHoiDong, dto.thanhVien.map((member) => ({
        ...member, maHd: hd.maHd, coQuanCt: member.coQuanCt?.trim() || 'TrongCoSoDaoTao',
      })));
      if (isFinal) {
        await manager.update(DeTai, topic.maDt, { trangThai: TrangThaiDeTai.DangBaoVe });
      }
      return hd.maHd;
    });
    return this.findById(maHd, user);
  }

  private async validateMembers(dto: CreateHoiDongDto, topic: DeTai, manager: EntityManager, previous?: HoiDong) {
    const members = dto.thanhVien;
    const ids = members.map((member) => member.maGv);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Thành viên hội đồng bị trùng');
    const chair = members.filter((member) => member.chucDanh === chairRole);
    const secretary = members.filter((member) => member.chucDanh === secretaryRole);
    const reviewers = members.filter((member) => reviewerRoles.includes(member.chucDanh));
    if (chair.length !== 1 || secretary.length !== 1 ||
      new Set(reviewers.map((member) => member.chucDanh)).size !== reviewers.length) {
      throw new BadRequestException('Hội đồng cần một chủ tịch, một thư ký và các vị trí phản biện riêng biệt');
    }
    const lecturers = await manager.findBy(GiangVien, { maGv: In(ids) });
    if (lecturers.length !== ids.length) throw new BadRequestException('Danh sách có giảng viên không tồn tại');
    const supervisors = members.filter((member) => this.isSupervisor(topic, member.maGv));
    if (supervisors.length > 1 || supervisors.some((member) => member.chucDanh !== ChucDanhHoiDong.UyVien)) {
      throw new BadRequestException('Tối đa một người hướng dẫn được tham gia với tư cách ủy viên');
    }

    const doctoral = topic.hocVien.trinhDo === TrinhDo.TienSi;
    const isNew = dto.quyChe === QuyCheBaoVe.ThongTu53;
    if (dto.capDanhGia === CapDanhGia.CoSo) return;
    const external = (member: { coQuanCt?: string }) => Boolean(member.coQuanCt?.trim() && member.coQuanCt.trim() !== 'TrongCoSoDaoTao');
    const minMembers = !doctoral && isNew ? 3 : 5;
    if (members.length < minMembers || (isNew && members.length % 2 === 0)) {
      throw new BadRequestException(`Hội đồng cần ${isNew ? 'số thành viên lẻ và ' : ''}ít nhất ${minMembers} người`);
    }
    if ((!isNew && reviewers.length !== 2) || (doctoral && isNew && !reviewers.some((member) => !external(member)))) {
      throw new BadRequestException('Thành phần phản biện chưa phù hợp quy chế đã chọn');
    }
    if (!isNew && (!reviewers.some(external) || external(chair[0]))) {
      throw new BadRequestException('Cần chủ tịch cơ hữu và ít nhất một phản biện ngoài cơ sở');
    }
    if (doctoral) {
      const isProfessor = (gv: GiangVien) => /^(gs|pgs)\b|giáo sư|professor/i.test(gv.hocHam?.trim() || '');
      const chairLecturer = lecturers.find((gv) => gv.maGv === chair[0].maGv)!;
      const externalCount = members.filter(external).length;
      if (!isProfessor(chairLecturer)) throw new BadRequestException('Chủ tịch hội đồng tiến sĩ phải là GS hoặc PGS');
      if (isNew && externalCount < Math.ceil(members.length * 0.4)) {
        throw new BadRequestException('Hội đồng tiến sĩ theo TT 53 cần ít nhất 40% thành viên ngoài cơ sở');
      }
      if (!isNew && (externalCount < 2 || !reviewers.some((member) => !external(member))
        || lecturers.filter((gv) => !isProfessor(gv)).length > 2)) {
        throw new BadRequestException('Hội đồng chuyển tiếp cần ít nhất hai người ngoài cơ sở, một phản biện nội bộ và tối đa hai người chưa là GS/PGS');
      }
    }

    if (doctoral && previous) {
      const repeat = members.filter((member) => previous.thanhVien.some((old) => old.maGv === member.maGv));
      if (!isNew && repeat.length < 3) throw new BadRequestException('Hội đồng lần hai cần ít nhất ba thành viên từ lần đầu');
      if (isNew && (repeat.length > Math.floor(members.length / 2) || repeat.some((member) =>
        member.chucDanh !== ChucDanhHoiDong.UyVien && previous.thanhVien.some((old) =>
          old.maGv === member.maGv && (old.chucDanh === member.chucDanh
            || (reviewerRoles.includes(old.chucDanh) && reviewerRoles.includes(member.chucDanh))))))) {
        throw new BadRequestException('Thành phần hội đồng lần hai không đạt quy tắc thay đổi thành viên hoặc chức danh');
      }
    }
  }

  async findAll(user: Actor): Promise<HoiDong[]> {
    const qb = this.hoiDongRepo.createQueryBuilder('hd')
      .innerJoinAndSelect('hd.deTai', 'dt')
      .leftJoinAndSelect('dt.hocVien', 'hv')
      .leftJoinAndSelect('hv.nguoiDung', 'ndHv')
      .leftJoinAndSelect('hv.chuyenNganh', 'cn')
      .leftJoinAndSelect('dt.giangVienHuongDan', 'gvhd')
      .leftJoinAndSelect('gvhd.nguoiDung', 'ndGvhd')
      .leftJoinAndSelect('hd.thanhVien', 'tv')
      .leftJoinAndSelect('tv.giangVien', 'gv')
      .leftJoinAndSelect('gv.nguoiDung', 'ndGv')
      .orderBy('hd.ngayBaoVe', 'DESC');
    if (user.vaiTro === VaiTro.HocVien) qb.where('dt.maHv = :id', { id: user.maNd });
    if (user.vaiTro === VaiTro.GiangVien) {
      qb.where(`dt.maGvhd = :id OR dt.maGvhd2 = :id OR EXISTS (
        SELECT 1 FROM thanhvien_hoidong member WHERE member.ma_hd = hd.ma_hd AND member.ma_gv = :id
      )`, { id: user.maNd });
    }
    return (await qb.getMany()).map((hd) => this.hidePrivateVotes(hd, user));
  }

  async findById(maHd: string, user: Actor): Promise<HoiDong> {
    const hd = await this.hoiDongRepo.findOne({
      where: { maHd },
      relations: {
        deTai: { hocVien: { nguoiDung: true, chuyenNganh: true }, giangVienHuongDan: { nguoiDung: true } },
        thanhVien: { giangVien: { nguoiDung: true } },
      },
    });
    if (!hd) throw new NotFoundException('Không tìm thấy hội đồng');
    if ((user.vaiTro === VaiTro.HocVien && hd.deTai.maHv !== user.maNd)
      || (user.vaiTro === VaiTro.GiangVien && !this.isSupervisor(hd.deTai, user.maNd)
        && !hd.thanhVien.some((member) => member.maGv === user.maNd))) {
      throw new ForbiddenException('Bạn không có quyền truy cập hội đồng này');
    }
    return this.hidePrivateVotes(hd, user);
  }

  async chamDiem(maHd: string, user: Actor, dto: ChamDiemHoiDongDto): Promise<HoiDong> {
    await this.dataSource.transaction(async (manager) => {
      const hd = await this.lockOpenCouncil(maHd, manager);
      const member = await manager.findOneBy(ThanhVienHoiDong, { maHd, maGv: user.maNd });
      if (!member || user.vaiTro !== VaiTro.GiangVien) {
        throw new ForbiddenException('Chỉ thành viên hội đồng mới được nộp phiếu của mình');
      }
      const doctoral = hd.deTai.hocVien.trinhDo === TrinhDo.TienSi;
      if (!doctoral && this.isSupervisor(hd.deTai, user.maNd)) {
        throw new ForbiddenException('Người hướng dẫn không chấm điểm luận văn của học viên mình');
      }
      if (doctoral && hd.capDanhGia === CapDanhGia.CapTruong && !dto.quyetNghi) {
        throw new BadRequestException('Cần chọn tán thành hoặc không tán thành');
      }
      const { diemTieuChi1, diemTieuChi2, diemTieuChi3, diemTieuChi4, nhanXet } = dto;
      const tongDiem = Number((diemTieuChi1 + diemTieuChi2 + diemTieuChi3 + diemTieuChi4).toFixed(2));
      await manager.update(ThanhVienHoiDong, { maHd, maGv: user.maNd }, {
        diemTieuChi1, diemTieuChi2, diemTieuChi3, diemTieuChi4, nhanXet, tongDiem, phieu: dto.quyetNghi,
      });
    });
    return this.findById(maHd, user);
  }

  async ghiNhanKetQua(maHd: string, dto: GhiNhanKetQuaDto, user: Actor): Promise<HoiDong> {
    await this.dataSource.transaction(async (manager) => {
      const hd = await this.lockOpenCouncil(maHd, manager);
      await this.uploads.requireOwnedFile(dto.bienBanUrl, user.maNd, manager);
      const members = await manager.findBy(ThanhVienHoiDong, { maHd });
      const present = members.filter((member) => dto.thanhVienCoMat.includes(member.maGv));
      if (present.length !== dto.thanhVienCoMat.length) {
        throw new BadRequestException('Danh sách có mặt chứa người ngoài hội đồng');
      }
      const doctoral = hd.deTai.hocVien.trinhDo === TrinhDo.TienSi;
      const isNew = hd.quyChe === QuyCheBaoVe.ThongTu53;
      const isFinal = hd.capDanhGia === CapDanhGia.CapTruong;
      const minPresent = doctoral
        ? isNew ? Math.ceil(members.length * 0.8) : Math.max(5, members.length - 1)
        : Math.ceil(members.length * 2 / 3);
      const hasRole = (role: ChucDanhHoiDong) => present.some((member) => member.chucDanh === role);
      if ((isFinal && present.length < minPresent) || !hasRole(chairRole) || !hasRole(secretaryRole)
        || (!doctoral && !isNew && !reviewerRoles.some(hasRole))) {
        throw new BadRequestException('Số lượng hoặc thành phần có mặt chưa đáp ứng yêu cầu của phiên đánh giá');
      }

      const graders = doctoral ? present : present.filter((member) => !this.isSupervisor(hd.deTai, member.maGv));
      const scores = graders.filter((member) => member.tongDiem != null);
      const average = scores.length
        ? Number((scores.reduce((sum, member) => sum + Number(member.tongDiem), 0) / scores.length).toFixed(2))
        : undefined;
      let passed: boolean;
      if (doctoral && isFinal) {
        if (graders.some((member) => !member.phieu)) throw new BadRequestException('Còn thành viên có mặt chưa nộp phiếu');
        const yes = graders.filter((member) => member.phieu === PhieuHoiDong.TanThanh).length;
        passed = isNew ? yes >= Math.ceil(members.length * 0.8) : yes >= graders.length - 1;
      } else if (!doctoral && !isNew && isFinal) {
        if (!scores.length || scores.length !== graders.length) throw new BadRequestException('Còn thành viên có mặt chưa nộp điểm');
        passed = average! >= 5.5;
      } else {
        if (!dto.quyetNghi) throw new BadRequestException('Cần chọn kết luận theo biên bản của hội đồng');
        passed = dto.quyetNghi === PhieuHoiDong.TanThanh;
      }

      await manager.update(HoiDong, maHd, {
        diemTb: average, ketQua: passed ? 'Thông qua' : 'Không thông qua',
        bienBanUrl: dto.bienBanUrl, thanhVienCoMat: dto.thanhVienCoMat,
        ngayChotKetQua: new Date(), maNguoiChot: user.maNd,
        kienNghiBaoVeLai: isFinal && !passed && hd.lanBaoVe < 2 && (!doctoral || Boolean(dto.kienNghiBaoVeLai)),
      });
      if (isFinal) {
        await manager.update(DeTai, hd.maDt, { trangThai: passed ? TrangThaiDeTai.DaBaoVe : TrangThaiDeTai.KhongDat });
      } else if (passed) {
        await manager.getRepository(MinhChungBaoVe).save({
          maDt: hd.maDt, loai: LoaiMinhChungBaoVe.DanhGiaDonVi, fileUrl: dto.bienBanUrl,
          trangThai: TrangThaiMinhChung.DaDuyet, ghiChu: 'Biên bản đánh giá tại đơn vị chuyên môn',
          maNguoiDuyet: user.maNd, ngayDuyet: new Date(),
        });
      }
    });
    return this.findById(maHd, user);
  }

  private async lockOpenCouncil(maHd: string, manager: EntityManager) {
    const hd = await manager.getRepository(HoiDong).createQueryBuilder('hd')
      .innerJoinAndSelect('hd.deTai', 'dt').innerJoinAndSelect('dt.hocVien', 'hv')
      .where('hd.maHd = :maHd', { maHd }).setLock('pessimistic_write', undefined, ['hd']).getOne();
    if (!hd) throw new NotFoundException('Không tìm thấy hội đồng');
    if (hd.ketQua) throw new ConflictException('Kết quả hội đồng đã được chốt');
    if (hd.deTai.hocVien.trangThai !== TrangThaiHocVien.DangHoc) {
      throw new BadRequestException('Chỉ ghi nhận kết quả hội đồng khi học viên đang học');
    }
    if (!hd.ngayBaoVe || hd.ngayBaoVe > new Date()) {
      throw new BadRequestException('Chỉ ghi nhận phiếu và kết quả từ thời điểm bảo vệ');
    }
    return hd;
  }

  private hidePrivateVotes(hd: HoiDong, user: Actor) {
    if (user.vaiTro === VaiTro.Admin) return hd;
    hd.thanhVien = hd.thanhVien.map((member) => {
      if (member.maGv === user.maNd) return member;
      const { phieu, nhanXet, diemTieuChi1, diemTieuChi2, diemTieuChi3, diemTieuChi4, tongDiem, ...publicMember } = member;
      return publicMember;
    });
    return hd;
  }

  private isSupervisor(topic: DeTai, id: string) {
    return id === topic.maGvhd || id === topic.maGvhd2;
  }

  private addMonths(date: Date, months: number) {
    const result = new Date(date);
    const day = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months + 1, 0);
    result.setUTCDate(Math.min(day, result.getUTCDate()));
    return result;
  }
}
