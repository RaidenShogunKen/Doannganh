import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { DonTuyenSinh } from './entities/don-tuyen-sinh.entity';
import { HoSoHocVienDto } from './dto/ho-so-hoc-vien.dto';
import { HoSoGiangVienDto } from './dto/ho-so-giang-vien.dto';
import { CapDanhGia, LoaiMinhChungBaoVe, TrangThaiDeTai, TrangThaiDonTuyenSinh, TrangThaiHocVien, TrinhDo, VaiTro } from '../common/enums';
import { NotificationService } from '../notification/notification.service';

import { NguoiDung } from '../users/entities/nguoi-dung.entity';
import { UploadService } from '../upload/upload.service';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { GhiNhanTotNghiepDto, XacNhanNhapHocDto } from './dto/quyet-dinh-hoc-vu.dto';
import { ChuyenNganh } from '../users/entities/chuyen-nganh.entity';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { HoiDong } from '../hoi-dong/entities/hoi-dong.entity';
import { DefenseReadinessService } from '../de-tai/defense-readiness.service';

const localDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' });

export class NopDonTuyenSinhDto {
  @IsString()
  @Length(2, 150)
  hoTen: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  soDienThoai?: string;

  @IsOptional()
  @IsDateString()
  ngaySinh?: string;

  @IsEnum(TrinhDo)
  trinhDoDangKy: TrinhDo;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  chuyenNganhDangKy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bangTotNghiepUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bangTiengAnhUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lyLichKhoaHocUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  ghiChuThem?: string;
}

@Injectable()
export class HoSoService {
  constructor(
    @InjectRepository(HocVien)
    private readonly hocVienRepo: Repository<HocVien>,
    @InjectRepository(GiangVien)
    private readonly giangVienRepo: Repository<GiangVien>,
    @InjectRepository(DonTuyenSinh)
    private readonly donTuyenSinhRepo: Repository<DonTuyenSinh>,
    @InjectRepository(NguoiDung)
    private readonly nguoiDungRepo: Repository<NguoiDung>,
    private readonly notificationService: NotificationService,
    private readonly uploads: UploadService,
    private readonly dataSource: DataSource,
    private readonly readiness: DefenseReadinessService,
  ) {}

  async hoanThienHocVien(userId: string, dto: HoSoHocVienDto, userRole?: string) {
    if (dto.anhDaiDienUrl) await this.uploads.requireOwnedFile(dto.anhDaiDienUrl, userId);
    const existingMshv = await this.hocVienRepo.findOne({ where: { mshv: dto.mshv } });
    if (existingMshv && existingMshv.maHv !== userId) {
      throw new ConflictException('Mã số học viên đã tồn tại trong hệ thống');
    }

    let hv = await this.hocVienRepo.findOne({ where: { maHv: userId } });
    if (!hv) {
      throw new BadRequestException('Phòng đào tạo cần xác lập hồ sơ học viên trước');
    } else {
      if (hv.mshv && userRole !== 'Admin' && dto.mshv && dto.mshv !== hv.mshv) {
        throw new ConflictException(
          'Mã số học viên đã được cấp chính thức, chỉ Quản trị viên mới có quyền thay đổi.',
        );
      }
      if (userRole === 'Admin' || !hv.mshv) {
        hv.mshv = dto.mshv;
        hv.trinhDo = dto.trinhDo;
        hv.ngayNhapHoc = dto.ngayNhapHoc;
        hv.maChuyenNganh = dto.maChuyenNganh;
        if (dto.khoaHoc) hv.khoaHoc = dto.khoaHoc;
      }

      if (dto.ngaySinh !== undefined) hv.ngaySinh = dto.ngaySinh;
      if (dto.gioiTinh !== undefined) hv.gioiTinh = dto.gioiTinh;
      if (dto.soCccd !== undefined) hv.soCccd = dto.soCccd;
      if (dto.diaChi !== undefined) hv.diaChi = dto.diaChi;
      if (dto.bangCapDauVao !== undefined) hv.bangCapDauVao = dto.bangCapDauVao;
      if (dto.hinhThucDaoTao !== undefined) hv.hinhThucDaoTao = dto.hinhThucDaoTao;
      if (dto.coQuanCongTac !== undefined) hv.coQuanCongTac = dto.coQuanCongTac;
      if (dto.ngoaiNgu !== undefined) hv.ngoaiNgu = dto.ngoaiNgu;
      if (dto.huongNghienCuu !== undefined) hv.huongNghienCuu = dto.huongNghienCuu;
      if (dto.anhDaiDienUrl !== undefined) hv.anhDaiDienUrl = dto.anhDaiDienUrl;
    }

    if (dto.soDienThoai !== undefined) {
      await this.nguoiDungRepo.update({ maNd: userId }, { sdt: dto.soDienThoai });
    }

    return this.hocVienRepo.save(hv);
  }

  async hoanThienGiangVien(userId: string, dto: HoSoGiangVienDto, userRole?: string) {
    let gv = await this.giangVienRepo.findOne({ where: { maGv: userId } });
    if (!gv) {
      gv = this.giangVienRepo.create({ maGv: userId, ...dto });
    } else {
      if (gv.hocHam && userRole !== 'Admin' && dto.hocHam && dto.hocHam !== gv.hocHam) {
        throw new ConflictException(
          'Học hàm của Giảng viên đã được xác thực, việc điều chỉnh phải qua Phòng Tổ chức - Cán bộ / Admin.',
        );
      }
      if (userRole === 'Admin' || !gv.hocHam) {
        gv.hocHam = dto.hocHam;
        gv.hocVi = dto.hocVi;
      }
      gv.chuyenMon = dto.chuyenMon;
    }
    return this.giangVienRepo.save(gv);
  }

  async getHoSoHocVien(userId: string) {
    const hv = await this.hocVienRepo.createQueryBuilder('hv')
      .leftJoinAndSelect('hv.nguoiDung', 'nd')
      .leftJoinAndSelect('hv.chuyenNganh', 'cn')
      .addSelect(['hv.soCccd', 'hv.diaChi', 'hv.fileQuyetDinhTotNghiep'])
      .where('hv.maHv = :userId', { userId }).getOne();
    if (!hv) throw new NotFoundException('Chưa có thông tin hồ sơ học viên');
    return hv;
  }

  async getHoSoGiangVien(userId: string) {
    const gv = await this.giangVienRepo.findOne({
      where: { maGv: userId },
      relations: ['nguoiDung'],
    });
    if (!gv) throw new NotFoundException('Chưa có thông tin hồ sơ giảng viên');
    return gv;
  }

  async nopDonTuyenSinh(maNd: string, dto: NopDonTuyenSinhDto): Promise<DonTuyenSinh> {
    const majorName = dto.chuyenNganhDangKy?.trim();
    if (!majorName || !dto.bangTotNghiepUrl?.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('Cần chọn chuyên ngành và đính kèm bằng tốt nghiệp PDF');
    }
    const saved = await this.dataSource.transaction(async (manager) => {
      const account = await manager.findOne(NguoiDung, { where: { maNd }, lock: { mode: 'pessimistic_write' } });
      if (!account || account.vaiTro !== VaiTro.HocVien || account.email.toLowerCase() !== dto.email.toLowerCase()) {
        throw new BadRequestException('Email dự tuyển phải trùng với email tài khoản đang đăng nhập');
      }
      if (await manager.existsBy(HocVien, { maHv: maNd })) {
        throw new ConflictException('Tài khoản đã có hồ sơ học viên');
      }
      if (!await manager.existsBy(ChuyenNganh, { tenCn: majorName, trinhDoDaoTao: dto.trinhDoDangKy })) {
        throw new BadRequestException('Chuyên ngành dự tuyển không thuộc trình độ đã chọn');
      }
      const repo = manager.getRepository(DonTuyenSinh);
      if (await repo.existsBy({ maNd, trangThai: In([
        TrangThaiDonTuyenSinh.ChoDuyet, TrangThaiDonTuyenSinh.DaDuyet, TrangThaiDonTuyenSinh.DaNhapHoc,
      ]) })) throw new ConflictException('Tài khoản đã có hồ sơ tuyển sinh đang xử lý hoặc đã nhập học');

      await Promise.all([
        this.uploads.requireOwnedFile(dto.bangTotNghiepUrl, maNd, manager),
        this.uploads.requireOwnedFile(dto.bangTiengAnhUrl, maNd, manager),
        this.uploads.requireOwnedFile(dto.lyLichKhoaHocUrl, maNd, manager),
      ]);
      return repo.save(repo.create({
        ...dto, maNd, hoTen: account.hoTen, email: account.email, chuyenNganhDangKy: majorName,
        trangThai: TrangThaiDonTuyenSinh.ChoDuyet,
      }));
    });

    if (maNd) {
      try {
        await this.notificationService.create({
          maNdNhan: maNd,
          loaiTb: 'TuyenSinh' as any,
          tieuDe: '📋 Đơn tuyển sinh đã được tiếp nhận',
          noiDung: `Hệ thống đã tiếp nhận đơn dự tuyển ${dto.trinhDoDangKy} chuyên ngành "${dto.chuyenNganhDangKy || 'chưa xác định'}".`,
          maLienQuan: saved.maDon,
        });
      } catch { }
    }

    return saved;
  }

  async getDanhSachDon(
    maNd: string,
    vaiTro: string,
    trangThai?: TrangThaiDonTuyenSinh,
  ): Promise<DonTuyenSinh[]> {
    const where: any = {};
    if (vaiTro !== 'Admin') {
      where.maNd = maNd;
    }
    if (trangThai) {
      where.trangThai = trangThai;
    }
    return this.donTuyenSinhRepo.find({
      where,
      order: { ngayNop: 'DESC' },
    });
  }

  async getDonById(maDon: string, maNd: string, vaiTro: string): Promise<DonTuyenSinh> {
    const don = await this.donTuyenSinhRepo.findOne({ where: { maDon } });
    if (!don) throw new NotFoundException('Không tìm thấy đơn tuyển sinh');
    if (vaiTro !== 'Admin' && don.maNd !== maNd) {
      throw new ForbiddenException('Bạn không có quyền xem đơn này');
    }
    return don;
  }

  async duyetDon(
    maDon: string,
    adminId: string,
    fileQuyetDinhUrl?: string,
    ghiChuAdmin?: string,
  ): Promise<DonTuyenSinh> {
    if (typeof fileQuyetDinhUrl !== 'string' || !fileQuyetDinhUrl.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('Cần đính kèm tệp PDF của quyết định trúng tuyển');
    }
    const don = await this.donTuyenSinhRepo.findOne({ where: { maDon } });
    if (!don) throw new NotFoundException('Không tìm thấy đơn tuyển sinh');

    if (don.trangThai !== TrangThaiDonTuyenSinh.ChoDuyet) {
      throw new BadRequestException(
        `Đơn đang ở trạng thái "${don.trangThai}", không thể duyệt lại.`,
      );
    }

    don.trangThai = TrangThaiDonTuyenSinh.DaDuyet;
    don.ghiChuAdmin = ghiChuAdmin;
    don.maAdminKy = adminId;
    don.ngayKyDuyet = new Date();

    if (fileQuyetDinhUrl) {
      await this.uploads.requireOwnedFile(fileQuyetDinhUrl, adminId);
      don.fileQuyetDinhUrl = fileQuyetDinhUrl;
      don.hashQuyetDinh = await this.uploads.sha256(fileQuyetDinhUrl);
    }

    const result = await this.donTuyenSinhRepo.update({ maDon, trangThai: TrangThaiDonTuyenSinh.ChoDuyet }, {
      trangThai: don.trangThai, ghiChuAdmin: don.ghiChuAdmin, maAdminKy: adminId, ngayKyDuyet: don.ngayKyDuyet,
      fileQuyetDinhUrl: don.fileQuyetDinhUrl, hashQuyetDinh: don.hashQuyetDinh,
    });
    if (!result.affected) throw new ConflictException('Đơn vừa được xử lý');

    if (don.maNd) {
      try {
        await this.notificationService.notifyTuyenSinhResult(don.maNd, 'DaDuyet', maDon);
      } catch { }
    }

    return don;
  }

  async tuChoiDon(maDon: string, adminId: string, lyDo: string): Promise<DonTuyenSinh> {
    if (typeof lyDo !== 'string' || !lyDo.trim() || lyDo.length > 4000) {
      throw new BadRequestException('Lý do từ chối phải có nội dung và tối đa 4000 ký tự');
    }
    const don = await this.donTuyenSinhRepo.findOne({ where: { maDon } });
    if (!don) throw new NotFoundException('Không tìm thấy đơn tuyển sinh');

    if (don.trangThai !== TrangThaiDonTuyenSinh.ChoDuyet) {
      throw new BadRequestException(
        `Đơn đang ở trạng thái "${don.trangThai}", không thể từ chối.`,
      );
    }

    don.trangThai = TrangThaiDonTuyenSinh.TuChoi;
    don.ghiChuAdmin = lyDo.trim();
    don.maAdminKy = adminId;
    don.ngayKyDuyet = new Date();

    const result = await this.donTuyenSinhRepo.update({ maDon, trangThai: TrangThaiDonTuyenSinh.ChoDuyet }, {
      trangThai: don.trangThai, ghiChuAdmin: don.ghiChuAdmin, maAdminKy: adminId, ngayKyDuyet: don.ngayKyDuyet,
    });
    if (!result.affected) throw new ConflictException('Đơn vừa được xử lý');

    if (don.maNd) {
      try {
        await this.notificationService.notifyTuyenSinhResult(don.maNd, 'TuChoi', maDon);
      } catch { }
    }

    return don;
  }

  async xacNhanNhapHoc(maDon: string, dto: XacNhanNhapHocDto = {}): Promise<DonTuyenSinh> {
    let saved: DonTuyenSinh;
    try {
      saved = await this.dataSource.transaction(async (manager) => {
        const don = await manager.findOne(DonTuyenSinh, { where: { maDon }, lock: { mode: 'pessimistic_write' } });
        if (!don) throw new NotFoundException('Không tìm thấy đơn tuyển sinh');
        if (don.trangThai !== TrangThaiDonTuyenSinh.DaDuyet || !don.maNd) {
          throw new BadRequestException('Cần đơn đã được phê duyệt và có tài khoản dự tuyển');
        }
        const account = await manager.findOne(NguoiDung, { where: { maNd: don.maNd }, lock: { mode: 'pessimistic_write' } });
        if (account?.vaiTro !== VaiTro.HocVien) throw new BadRequestException('Tài khoản dự tuyển không còn hợp lệ');
        const existing = await manager.findOne(HocVien, { where: { maHv: don.maNd }, lock: { mode: 'pessimistic_write' } });
        if (existing && (existing.trinhDo !== don.trinhDoDangKy || existing.trangThai !== TrangThaiHocVien.DangHoc)) {
          throw new ConflictException('Tài khoản đã có hồ sơ học viên khác trình độ hoặc đã ngừng học');
        }
        const mshv = dto.mshv?.trim() || existing?.mshv;
        const maChuyenNganh = dto.maChuyenNganh ?? existing?.maChuyenNganh;
        const khoaHoc = dto.khoaHoc?.trim() || existing?.khoaHoc;
        const ngayNhapHoc = dto.ngayNhapHoc || existing?.ngayNhapHoc;
        if (!mshv || !maChuyenNganh || !khoaHoc || !ngayNhapHoc) {
          throw new BadRequestException('Nhập mã học viên, chuyên ngành, khóa và ngày nhập học');
        }
        if (ngayNhapHoc > localDate.format(new Date())) throw new BadRequestException('Ngày nhập học không được ở tương lai');
        if (existing && (existing.mshv !== mshv ||
          (existing.maChuyenNganh != null && existing.maChuyenNganh !== maChuyenNganh) ||
          (existing.khoaHoc && existing.khoaHoc !== khoaHoc) ||
          (existing.ngayNhapHoc && existing.ngayNhapHoc !== ngayNhapHoc))) {
          throw new ConflictException('Thông tin nhập học khác hồ sơ hiện có');
        }
        const major = await manager.findOneBy(ChuyenNganh, { maCn: maChuyenNganh });
        if (major?.trinhDoDaoTao !== don.trinhDoDangKy) {
          throw new BadRequestException('Chuyên ngành không thuộc trình độ của đơn tuyển sinh');
        }
        if (don.chuyenNganhDangKy && major.tenCn !== don.chuyenNganhDangKy.trim()) {
          throw new BadRequestException('Chuyên ngành nhập học phải khớp hồ sơ trúng tuyển');
        }
        if (existing) {
          await manager.update(HocVien, don.maNd, { maChuyenNganh, khoaHoc, ngayNhapHoc });
        } else {
          await manager.insert(HocVien, {
            maHv: don.maNd, mshv, trinhDo: don.trinhDoDangKy, maChuyenNganh, khoaHoc, ngayNhapHoc,
            ngaySinh: don.ngaySinh, trangThai: TrangThaiHocVien.DangHoc,
          });
        }
        don.trangThai = TrangThaiDonTuyenSinh.DaNhapHoc;
        return manager.save(DonTuyenSinh, don);
      });
    } catch (error) {
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23505') {
        throw new ConflictException('Mã học viên đã được sử dụng');
      }
      throw error;
    }

    if (saved.maNd) {
      try {
        await this.notificationService.notifyTuyenSinhResult(saved.maNd, 'DaNhapHoc', maDon);
      } catch { }
    }
    return saved;
  }

  async ghiNhanTotNghiep(maDt: string, dto: GhiNhanTotNghiepDto, adminId: string) {
    const decision = dto.soQuyetDinh.trim();
    if (!decision || !dto.daDoiChieu || !dto.fileUrl.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('Cần số quyết định, tệp PDF và xác nhận đã đối chiếu hồ sơ');
    }
    if (dto.ngayQuyetDinh > localDate.format(new Date())) throw new BadRequestException('Ngày quyết định không được ở tương lai');
    return this.dataSource.transaction(async (manager) => {
      const owner = await manager.findOneBy(DeTai, { maDt });
      if (!owner) throw new NotFoundException('Không tìm thấy đề tài');
      const learner = await manager.findOne(HocVien, {
        where: { maHv: owner.maHv }, lock: { mode: 'pessimistic_write' },
      });
      const topic = await manager.findOne(DeTai, { where: { maDt }, lock: { mode: 'pessimistic_write' } });
      if (learner?.trangThai !== TrangThaiHocVien.DangHoc || topic?.trangThai !== TrangThaiDeTai.DaBaoVe) {
        throw new BadRequestException('Cần học viên đang học và đề tài đã bảo vệ đạt');
      }
      const council = await manager.findOneBy(HoiDong, {
        maDt, capDanhGia: CapDanhGia.CapTruong, ketQua: In(['Thông qua', 'Đạt yêu cầu cấp bằng']),
      });
      if (!council?.ngayBaoVe || dto.ngayQuyetDinh < localDate.format(council.ngayBaoVe)) {
        throw new BadRequestException('Cần kết quả hội đồng đạt và ngày quyết định từ ngày bảo vệ trở đi');
      }
      learner.chuyenNganh = learner.maChuyenNganh
        ? await manager.findOneBy(ChuyenNganh, { maCn: learner.maChuyenNganh }) : undefined;
      topic.hocVien = learner;
      const checklist = await this.readiness.build(topic, { maNd: adminId, vaiTro: VaiTro.Admin }, manager);
      if (checklist.tieuChi.some((item) => ['HocPhan', LoaiMinhChungBaoVe.NgoaiNgu].includes(item.id) && !item.dat)) {
        throw new BadRequestException('Cần hoàn thành học phần và có minh chứng ngoại ngữ được duyệt');
      }
      await this.uploads.requireOwnedFile(dto.fileUrl, adminId, manager);
      await manager.update(HocVien, learner.maHv, {
        trangThai: TrangThaiHocVien.TotNghiep, soQuyetDinhTotNghiep: decision,
        ngayQuyetDinhTotNghiep: dto.ngayQuyetDinh, fileQuyetDinhTotNghiep: dto.fileUrl,
        maNguoiGhiNhanTotNghiep: adminId,
      });
      return { maHv: learner.maHv, soQuyetDinh: decision, ngayQuyetDinh: dto.ngayQuyetDinh };
    });
  }

  async verifyQuyetDinhHash(don: DonTuyenSinh): Promise<boolean> {
    if (!don.hashQuyetDinh || !don.fileQuyetDinhUrl) return false;
    try {
      return await this.uploads.sha256(don.fileQuyetDinhUrl) === don.hashQuyetDinh;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) return false;
      throw error;
    }
  }
}
