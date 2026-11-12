import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { DonHocVu } from './entities/don-hoc-vu.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { CreateDonHocVuDto, GvhdDuyetDonDto, AdminDuyetDonDto, TuChoiDonDto } from './dto';
import { LoaiDonHocVu, TrangThaiDonHocVu, TrangThaiDeTai, TrangThaiHocVien, TrinhDo, VaiTro } from '../common/enums';
import { UploadService } from '../upload/upload.service';
import { addCalendarMonths, dateInVietnam } from '../common/academic-dates';

@Injectable()
export class DonHocVuService {
  constructor(
    @InjectRepository(DonHocVu)
    private readonly donHocVuRepo: Repository<DonHocVu>,
    private readonly dataSource: DataSource,
    private readonly uploadService: UploadService,
  ) {}

  private hanGiaHan(hv: HocVien, topic: DeTai | null, months: number, today: string) {
    if (!topic || ![TrangThaiDeTai.DaDuyet, TrangThaiDeTai.DangThucHien,
      TrangThaiDeTai.DuDKBaoVe, TrangThaiDeTai.DuDieuKienBaoVe].includes(topic.trangThai)) {
      throw new BadRequestException('Chỉ gia hạn đề tài đã duyệt và chưa xếp lịch hoặc kết thúc bảo vệ');
    }
    const currentDeadline = topic.hanNopLuanAn;
    const deadline = addCalendarMonths(currentDeadline && currentDeadline > today ? currentDeadline : today, months);
    if (hv.trinhDo === TrinhDo.TienSi) {
      if (!hv.ngayNhapHoc) throw new BadRequestException('Cần cập nhật ngày bắt đầu đào tạo để kiểm tra thời hạn gia hạn');
      const maximum = addCalendarMonths(hv.ngayNhapHoc, 72);
      if (deadline > maximum) throw new BadRequestException(`Hạn mới ${deadline} vượt mốc đào tạo 72 tháng (${maximum})`);
    }
    return deadline;
  }

  private kiemTraDon(hv: HocVien, topic: DeTai | null, kind: LoaiDonHocVu, months: number, today: string) {
    if (kind === LoaiDonHocVu.QuayLaiHoc) {
      if (hv.trangThai !== TrangThaiHocVien.BaoLuu) throw new BadRequestException('Chỉ tiếp nhận quay lại học khi đang bảo lưu');
      return;
    }
    if (hv.trangThai !== TrangThaiHocVien.DangHoc || months < 1) {
      throw new BadRequestException('Cần đang học và có thời gian đề nghị hợp lệ');
    }
    if (kind === LoaiDonHocVu.GiaHan) return this.hanGiaHan(hv, topic, months, today);
    if (topic?.trangThai === TrangThaiDeTai.DangBaoVe) {
      throw new BadRequestException('Đề tài đã có lịch bảo vệ, cần xử lý lịch trước khi bảo lưu');
    }
    const current = Number(hv.tongSoThangBaoLuu) || 0;
    if (current + months > 12) {
      throw new BadRequestException(`Hạn mức bảo lưu đang áp dụng là 12 tháng. Học viên đã bảo lưu ${current} tháng.`);
    }
  }

  async create(maHv: string, dto: CreateDonHocVuDto): Promise<DonHocVu> {
    const reason = dto.lyDo.trim();
    if (!reason) throw new BadRequestException('Vui lòng nhập lý do');
    return this.dataSource.transaction(async (manager) => {
      const hv = await manager.findOne(HocVien, { where: { maHv }, lock: { mode: 'pessimistic_write' } });
      if (!hv) throw new NotFoundException('Không tìm thấy thông tin học viên');

      const topic = await manager.findOne(DeTai, dto.maDt
        ? { where: { maDt: dto.maDt } }
        : { where: { maHv }, order: { ngayDangKy: 'DESC', maDt: 'DESC' } });
      if (dto.maDt && topic?.maHv !== maHv) {
        throw new ForbiddenException('Chỉ được nộp đơn gắn với đề tài của mình');
      }
      await this.uploadService.requireOwnedFile(dto.fileDinhKemUrl, maHv, manager);
      this.kiemTraDon(hv, topic, dto.loaiDon, dto.soThang, dateInVietnam());

      const repo = manager.getRepository(DonHocVu);
      if (await repo.existsBy({
        maHv, loaiDon: dto.loaiDon, trangThai: In([TrangThaiDonHocVu.ChoDuyetGvhd, TrangThaiDonHocVu.ChoDuyetAdmin]),
      })) throw new ConflictException('Đã có đơn cùng loại đang chờ xử lý');

      return repo.save(repo.create({
        maHv, maDt: topic?.maDt, loaiDon: dto.loaiDon,
        soThang: dto.loaiDon === LoaiDonHocVu.QuayLaiHoc ? 0 : dto.soThang, lyDo: reason,
        fileDinhKemUrl: dto.fileDinhKemUrl,
        trangThai: topic ? TrangThaiDonHocVu.ChoDuyetGvhd : TrangThaiDonHocVu.ChoDuyetAdmin,
      }));
    });
  }

  async findAll(user: any): Promise<DonHocVu[]> {
    const qb = this.donHocVuRepo
      .createQueryBuilder('don')
      .leftJoinAndSelect('don.hocVien', 'hv')
      .leftJoinAndSelect('hv.nguoiDung', 'ndHv')
      .leftJoinAndSelect('hv.chuyenNganh', 'cn')
      .leftJoinAndSelect('don.deTai', 'dt')
      .leftJoinAndSelect('dt.giangVienHuongDan', 'gv1')
      .leftJoinAndSelect('gv1.nguoiDung', 'ndGv1')
      .leftJoinAndSelect('dt.giangVienHuongDan2', 'gv2')
      .leftJoinAndSelect('gv2.nguoiDung', 'ndGv2')
      .orderBy('don.ngayNop', 'DESC');

    if (user.vaiTro === VaiTro.HocVien) {
      qb.where('don.maHv = :maHv', { maHv: user.maNd });
    } else if (user.vaiTro === VaiTro.GiangVien) {
      qb.where('dt.maGvhd = :maGv OR dt.maGvhd2 = :maGv', { maGv: user.maNd });
    }

    return qb.getMany();
  }

  async findById(maDon: string, user: any): Promise<DonHocVu> {
    const don = await this.donHocVuRepo.findOne({
      where: { maDon },
      relations: [
        'hocVien',
        'hocVien.nguoiDung',
        'hocVien.chuyenNganh',
        'deTai',
        'deTai.giangVienHuongDan',
        'deTai.giangVienHuongDan.nguoiDung',
      ],
    });

    if (!don) {
      throw new NotFoundException('Không tìm thấy đơn học vụ');
    }

    if ((user.vaiTro === VaiTro.HocVien && don.maHv !== user.maNd)
      || (user.vaiTro === VaiTro.GiangVien && ![don.deTai?.maGvhd, don.deTai?.maGvhd2].includes(user.maNd))) {
      throw new ForbiddenException('Bạn không có quyền truy cập đơn học vụ này');
    }

    return don;
  }

  async gvhdDuyet(maDon: string, user: any, dto: GvhdDuyetDonDto): Promise<DonHocVu> {
    const don = await this.findById(maDon, user);
    if (!dto.yKienGvhd.trim()) throw new BadRequestException('Vui lòng nhập ý kiến của người hướng dẫn');

    if (user.vaiTro !== VaiTro.GiangVien || ![don.deTai?.maGvhd, don.deTai?.maGvhd2].includes(user.maNd)) {
      throw new ForbiddenException('Chỉ GVHD của học viên mới có quyền xác nhận đơn học vụ này');
    }

    if (don.trangThai !== TrangThaiDonHocVu.ChoDuyetGvhd) throw new ConflictException('Đơn không còn chờ người hướng dẫn');
    const result = await this.donHocVuRepo.update({ maDon, trangThai: don.trangThai }, {
      yKienGvhd: dto.yKienGvhd.trim(), trangThai: TrangThaiDonHocVu.ChoDuyetAdmin,
    });
    if (!result.affected) throw new ConflictException('Đơn vừa được xử lý');
    return this.findById(maDon, user);
  }

  async adminDuyet(maDon: string, user: any, dto: AdminDuyetDonDto): Promise<DonHocVu> {
    if (user.vaiTro !== VaiTro.Admin) {
      throw new ForbiddenException('Chỉ Quản trị viên Phòng Đào tạo SĐH mới có thẩm quyền ban hành quyết định');
    }
    const decision = dto.quyetDinhSo?.trim();
    if (!decision) throw new BadRequestException('Vui lòng nhập số quyết định');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const don = await queryRunner.manager.findOne(DonHocVu, {
        where: { maDon },
        lock: { mode: 'pessimistic_write' },
      });

      if (!don) {
        throw new NotFoundException('Không tìm thấy đơn học vụ');
      }
      if (don.trangThai !== TrangThaiDonHocVu.ChoDuyetAdmin) {
        throw new ConflictException('Đơn chưa đến bước Phòng đào tạo phê duyệt hoặc đã được xử lý');
      }

      const today = dateInVietnam();
      const hv = await queryRunner.manager.findOne(HocVien, {
        where: { maHv: don.maHv }, lock: { mode: 'pessimistic_write' },
      });
      if (!hv) throw new NotFoundException('Không tìm thấy thông tin học viên');
      const topic = don.maDt
        ? await queryRunner.manager.findOne(DeTai, {
          where: { maDt: don.maDt }, lock: { mode: 'pessimistic_write' },
        })
        : null;
      const extendedUntil = this.kiemTraDon(hv, topic, don.loaiDon, don.soThang, today);

      if (don.loaiDon === LoaiDonHocVu.BaoLuu) {
        hv.trangThai = TrangThaiHocVien.BaoLuu;
        hv.tongSoThangBaoLuu = (Number(hv.tongSoThangBaoLuu) || 0) + don.soThang;
        hv.ngayBatDauBaoLuu = today;
        hv.ngayKetThucBaoLuu = addCalendarMonths(today, don.soThang);
        await queryRunner.manager.save(HocVien, hv);

      } else if (don.loaiDon === LoaiDonHocVu.QuayLaiHoc) {
        hv.trangThai = TrangThaiHocVien.DangHoc;
        hv.ngayKetThucBaoLuu = today;
        await queryRunner.manager.save(HocVien, hv);
      } else if (topic && extendedUntil) {
        topic.tongSoThangGiaHan = (Number(topic.tongSoThangGiaHan) || 0) + don.soThang;
        topic.ngayGiaHanCuoi = today;
        topic.hanNopLuanAn = extendedUntil;
        await queryRunner.manager.save(DeTai, topic);
      }

      await queryRunner.manager.save(DonHocVu, {
        ...don, trangThai: TrangThaiDonHocVu.DaDuyet, ngayDuyet: today,
        nguoiDuyet: user.hoTen || 'Quản trị viên Hệ thống', quyetDinhSo: decision,
      });

      await queryRunner.commitTransaction();
      return this.findById(maDon, user);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async tuChoi(maDon: string, user: any, dto: TuChoiDonDto): Promise<DonHocVu> {
    const don = await this.findById(maDon, user);
    if (!dto.lyDoTuChoi.trim()) throw new BadRequestException('Vui lòng nhập lý do từ chối');
    const expected = user.vaiTro === VaiTro.GiangVien ? [TrangThaiDonHocVu.ChoDuyetGvhd]
      : [TrangThaiDonHocVu.ChoDuyetGvhd, TrangThaiDonHocVu.ChoDuyetAdmin];
    if (!expected.includes(don.trangThai)) throw new ConflictException('Đơn đã được xử lý');
    const result = await this.donHocVuRepo.update({ maDon, trangThai: don.trangThai }, {
      trangThai: TrangThaiDonHocVu.TuChoi, nguoiDuyet: user.hoTen, yKienGvhd: dto.lyDoTuChoi.trim(),
    });
    if (!result.affected) throw new ConflictException('Đơn vừa được xử lý');
    return this.findById(maDon, user);
  }
}
