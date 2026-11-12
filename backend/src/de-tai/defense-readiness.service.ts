import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  CapDanhGia, LoaiHocPhan, LoaiMinhChungBaoVe, TrangThaiDangKy, TrangThaiDeTai, TrangThaiHocVien, TrangThaiMinhChung, TrinhDo, VaiTro,
} from '../common/enums';
import { DangKyMonHoc } from '../mon-hoc/entities/dangky-monhoc.entity';
import { MonHoc } from '../mon-hoc/entities/mon-hoc.entity';
import { TienDo } from '../tien-do/entities/tien-do.entity';
import { UploadService } from '../upload/upload.service';
import { DuyetMinhChungBaoVeDto, NopMinhChungBaoVeDto } from './dto';
import { DeTai } from './entities/de-tai.entity';
import { MinhChungBaoVe } from './entities/minh-chung-bao-ve.entity';
import { HoiDong } from '../hoi-dong/entities/hoi-dong.entity';

type Actor = { maNd: string; vaiTro: VaiTro };

export const editableDefenseStatuses = [
  TrangThaiDeTai.DaDuyet, TrangThaiDeTai.DangThucHien, TrangThaiDeTai.KhongDat,
];

const evidenceLabels: Record<LoaiMinhChungBaoVe, string> = {
  BanThao: 'Bản thảo được người hướng dẫn thông qua',
  NgoaiNgu: 'Minh chứng ngoại ngữ theo chương trình',
  CongBo: 'Kết quả nghiên cứu hoặc công bố theo quy chế áp dụng',
  DanhGiaDonVi: 'Kết quả đánh giá tại đơn vị chuyên môn',
  PhanBien: 'Kết quả phản biện độc lập hoặc văn bản xác nhận miễn theo quy chế',
  LiemChinh: 'Kết quả rà soát liêm chính học thuật',
};

const commonEvidence = [LoaiMinhChungBaoVe.BanThao, LoaiMinhChungBaoVe.NgoaiNgu, LoaiMinhChungBaoVe.LiemChinh];
const doctoralEvidence = [LoaiMinhChungBaoVe.CongBo, LoaiMinhChungBaoVe.DanhGiaDonVi, LoaiMinhChungBaoVe.PhanBien];
const studentEvidence = [LoaiMinhChungBaoVe.BanThao, LoaiMinhChungBaoVe.NgoaiNgu];
const passedProgress = ['Dat', 'DatYeuCau', 'XuatSac'];

function isEditable(topic: DeTai) {
  return topic.hocVien.trangThai === TrangThaiHocVien.DangHoc &&
    (editableDefenseStatuses.includes(topic.trangThai) ||
      (!topic.ngayXacNhanBaoVe && [TrangThaiDeTai.DuDKBaoVe, TrangThaiDeTai.DuDieuKienBaoVe].includes(topic.trangThai)));
}

@Injectable()
export class DefenseReadinessService {
  constructor(private readonly dataSource: DataSource, private readonly uploads: UploadService) {}

  private async getTopic(maDt: string, manager: EntityManager, lock = false) {
    const query = manager.getRepository(DeTai).createQueryBuilder('dt')
      .innerJoinAndSelect('dt.hocVien', 'hv')
      .leftJoinAndSelect('hv.chuyenNganh', 'cn')
      .where('dt.maDt = :maDt', { maDt });
    if (lock) query.setLock('pessimistic_write', undefined, ['dt']);
    const topic = await query.getOne();
    if (!topic) throw new NotFoundException('Không tìm thấy đề tài');
    return topic;
  }

  private checkAccess(topic: DeTai, user: Actor) {
    if (user.vaiTro === VaiTro.Admin) return;
    const allowed = user.vaiTro === VaiTro.HocVien
      ? topic.maHv === user.maNd
      : topic.maGvhd === user.maNd || topic.maGvhd2 === user.maNd;
    if (!allowed) throw new ForbiddenException('Bạn không có quyền truy cập hồ sơ bảo vệ này');
  }

  async getChecklist(maDt: string, user: Actor) {
    const topic = await this.getTopic(maDt, this.dataSource.manager);
    this.checkAccess(topic, user);
    return this.build(topic, user, this.dataSource.manager);
  }

  async build(topic: DeTai, user: Actor, manager: EntityManager) {
    const isDoctoral = topic.hocVien.trinhDo === TrinhDo.TienSi;
    const canEdit = isEditable(topic);
    const majorId = topic.hocVien.maChuyenNganh;
    const programCredits = topic.hocVien.chuyenNganh?.soTinChiHocPhan;
    const courseRepo = manager.getRepository(MonHoc);
    const required = majorId ? await courseRepo.findBy({ maCn: majorId, loaiHp: LoaiHocPhan.BatBuoc }) : [];
    const registrations = await manager.getRepository(DangKyMonHoc).find({
      where: { maHv: topic.maHv, trangThai: TrangThaiDangKy.DaHoanThanh },
      relations: { monHoc: true },
    });
    const earned = new Map(registrations
      .filter((row) => row.diem != null && Number(row.diem) >= 5 && row.monHoc &&
        (row.monHoc.maCn == null || row.monHoc.maCn === majorId))
      .map((row) => [row.maMh, row.monHoc.soTinChi]));
    const credits = [...earned.values()].reduce((sum, value) => sum + value, 0);
    const missing = required.filter((course) => !earned.has(course.maMh)).map((course) => course.tenMh);
    const entries = [{
      id: 'HocPhan',
      ten: 'Hoàn thành học phần',
      dat: programCredits != null && missing.length === 0 && credits >= programCredits,
      chiTiet: programCredits == null
        ? 'Phòng đào tạo cần cấu hình số tín chỉ học phần của chương trình.'
        : `${credits}/${programCredits} tín chỉ đạt${missing.length ? '. Còn thiếu ' + missing.join(', ') : ''}`,
      evidence: null as Partial<MinhChungBaoVe> | null,
      canSubmit: false,
      canReview: false,
    }];

    if (isDoctoral) {
      const reports = await manager.getRepository(TienDo).findBy({ maDt: topic.maDt });
      const verified = reports.filter((report) => passedProgress.includes(report.danhGiaKq || '')).length;
      const start = topic.hocVien.ngayNhapHoc ? new Date(topic.hocVien.ngayNhapHoc) : null;
      const today = new Date();
      const elapsedMonths = start ? (today.getUTCFullYear() - start.getUTCFullYear()) * 12
        + today.getUTCMonth() - start.getUTCMonth() - Number(today.getUTCDate() < start.getUTCDate()) : 0;
      const expected = Math.floor(Math.max(0, elapsedMonths) / 6);
      entries.push({
        id: 'TienDo', ten: 'Báo cáo tiến độ định kỳ',
        dat: Boolean(start) && verified >= expected && verified === reports.length,
        chiTiet: start
          ? `${verified}/${reports.length} báo cáo được duyệt. Đã đến hạn ${expected} kỳ.`
          : 'Hồ sơ cần ngày nhập học để xác định kỳ báo cáo.',
        evidence: null, canSubmit: false, canReview: false,
      });
    }

    const evidenceRows = await manager.getRepository(MinhChungBaoVe).findBy({ maDt: topic.maDt });
    const types = isDoctoral ? [...commonEvidence, ...doctoralEvidence] : commonEvidence;
    for (const loai of types) {
      const row = evidenceRows.find((item) => item.loai === loai);
      const confidential = loai === LoaiMinhChungBaoVe.PhanBien && user.vaiTro !== VaiTro.Admin;
      const studentCanSubmit = user.vaiTro === VaiTro.HocVien && studentEvidence.includes(loai)
        && row?.trangThai !== TrangThaiMinhChung.DaDuyet;
      entries.push({
        id: loai, ten: evidenceLabels[loai],
        dat: row?.trangThai === TrangThaiMinhChung.DaDuyet,
        chiTiet: confidential ? '' : row?.ghiChu || '',
        evidence: row ? { trangThai: row.trangThai, fileUrl: confidential ? undefined : row.fileUrl } : null,
        canSubmit: canEdit && (user.vaiTro === VaiTro.Admin || studentCanSubmit),
        canReview: canEdit && user.vaiTro === VaiTro.Admin,
      });
    }
    return { duDieuKien: entries.every((entry) => entry.dat), coTheXacNhan: canEdit && user.vaiTro !== VaiTro.HocVien, tieuChi: entries };
  }

  async submit(maDt: string, dto: NopMinhChungBaoVeDto, user: Actor) {
    await this.dataSource.transaction(async (manager) => {
      const topic = await this.getTopic(maDt, manager, true);
      this.checkAccess(topic, user);
      this.requireEditable(topic);
      this.requireApplicableType(topic, dto.loai);
      if (user.vaiTro !== VaiTro.Admin &&
        (user.vaiTro !== VaiTro.HocVien || !studentEvidence.includes(dto.loai))) {
        throw new ForbiddenException('Minh chứng này do Phòng đào tạo ghi nhận');
      }
      const repo = manager.getRepository(MinhChungBaoVe);
      const current = await repo.findOneBy({ maDt, loai: dto.loai });
      if (user.vaiTro === VaiTro.HocVien && current?.trangThai === TrangThaiMinhChung.DaDuyet) {
        throw new BadRequestException('Minh chứng đã duyệt. Liên hệ Phòng đào tạo nếu cần thay tệp.');
      }
      await this.uploads.requireOwnedFile(dto.fileUrl, user.maNd, manager);
      await repo.save({
        maDt, loai: dto.loai, fileUrl: dto.fileUrl, trangThai: TrangThaiMinhChung.ChoDuyet,
        ghiChu: null, maNguoiDuyet: null, ngayDuyet: null,
      });
    });
    return this.getChecklist(maDt, user);
  }

  async review(maDt: string, dto: DuyetMinhChungBaoVeDto, user: Actor) {
    if (user.vaiTro !== VaiTro.Admin) throw new ForbiddenException('Chỉ Phòng đào tạo được duyệt minh chứng');
    if (dto.trangThai === TrangThaiMinhChung.ChoDuyet || !dto.ghiChu.trim()) {
      throw new BadRequestException('Chọn kết quả và ghi căn cứ xét duyệt');
    }
    await this.dataSource.transaction(async (manager) => {
      const topic = await this.getTopic(maDt, manager, true);
      this.requireEditable(topic);
      this.requireApplicableType(topic, dto.loai);
      const repo = manager.getRepository(MinhChungBaoVe);
      const current = await repo.findOneBy({ maDt, loai: dto.loai });
      if (!current) throw new NotFoundException('Tiêu chí chưa có tệp minh chứng');
      if (dto.trangThai === TrangThaiMinhChung.DaDuyet && dto.loai === LoaiMinhChungBaoVe.PhanBien) {
        const evaluated = await repo.existsBy({
          maDt, loai: LoaiMinhChungBaoVe.DanhGiaDonVi, trangThai: TrangThaiMinhChung.DaDuyet,
        });
        if (!evaluated) throw new BadRequestException('Cần ghi nhận đánh giá của đơn vị chuyên môn trước');
      }
      await repo.save({
        ...current, trangThai: dto.trangThai, ghiChu: dto.ghiChu.trim(),
        maNguoiDuyet: user.maNd, ngayDuyet: new Date(),
      });
    });
    return this.getChecklist(maDt, user);
  }

  async confirm(maDt: string, user: Actor) {
    return this.dataSource.transaction(async (manager) => {
      const topic = await this.getTopic(maDt, manager, true);
      this.checkAccess(topic, user);
      if (user.vaiTro === VaiTro.HocVien) throw new ForbiddenException('Bạn không có quyền xác nhận điều kiện bảo vệ');
      this.requireEditable(topic);
      if (topic.trangThai === TrangThaiDeTai.KhongDat) {
        const previous = await manager.findOne(HoiDong, {
          where: { maDt, capDanhGia: CapDanhGia.CapTruong }, order: { lanBaoVe: 'DESC' },
        });
        if (!previous?.kienNghiBaoVeLai || previous.lanBaoVe >= 2) {
          throw new BadRequestException('Hồ sơ chưa được phép đánh giá lại');
        }
      }
      const checklist = await this.build(topic, user, manager);
      const missing = checklist.tieuChi.filter((entry) => !entry.dat).map((entry) => entry.ten);
      if (missing.length) throw new BadRequestException(`Hồ sơ còn thiếu: ${missing.join(', ')}.`);
      await manager.update(DeTai, { maDt }, {
        trangThai: TrangThaiDeTai.DuDKBaoVe, ngayXacNhanBaoVe: new Date(),
      });
      return { maDt: topic.maDt, maHv: topic.maHv, tenDt: topic.tenDt, trangThai: TrangThaiDeTai.DuDKBaoVe };
    });
  }

  private requireEditable(topic: DeTai) {
    if (!isEditable(topic)) {
      throw new BadRequestException('Chỉ cập nhật minh chứng khi học viên đang học và đề tài đang chuẩn bị bảo vệ');
    }
  }

  private requireApplicableType(topic: DeTai, type: LoaiMinhChungBaoVe) {
    if (doctoralEvidence.includes(type) && topic.hocVien.trinhDo !== TrinhDo.TienSi) {
      throw new BadRequestException('Minh chứng này chỉ áp dụng cho hồ sơ tiến sĩ');
    }
  }
}
