import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { NguoiDung } from './entities/nguoi-dung.entity';
import { HocVien } from './entities/hoc-vien.entity';
import { GiangVien } from './entities/giang-vien.entity';
import { NhatKyThaoTac } from './entities/nhat-ky-thao-tac.entity';
import {
  KetQuaThaoTac,
  TrangThaiDeTai,
  TrangThaiHocVien,
  TrangThaiTaiKhoan,
  TrinhDo,
  VaiTro,
} from '../common/enums';
import { CreateUserDto, UpdateUserDto } from './dto';

export interface ExtendedUserView {
  maNd: string;
  hoTen: string;
  email: string;
  vaiTro: VaiTro;
  trangThai: TrangThaiTaiKhoan;
  soDienThoai?: string;
  ngayTao: string;
  mshv?: string;
  trinhDo?: TrinhDo;
  chuyenNganh?: string;
  khoaHoc?: string;
  gvhd?: string;
  hocHam?: string;
  hocVi?: string;
  khoa?: string;
  ncsDangHuongDan?: number;
  hanMucToiDa?: number;
}

export interface AuditActor {
  maNd: string;
  hoTen: string;
  vaiTro: VaiTro | string;
  ip?: string;
}

const VAI_TRO_LABEL: Record<string, string> = {
  HocVien: 'Học viên / NCS',
  GiangVien: 'Giảng viên hướng dẫn',
  Admin: 'Quản trị viên Đào tạo SĐH',
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(NguoiDung)
    private readonly nguoiDungRepo: Repository<NguoiDung>,
    @InjectRepository(HocVien)
    private readonly hocVienRepo: Repository<HocVien>,
    @InjectRepository(GiangVien)
    private readonly giangVienRepo: Repository<GiangVien>,
    @InjectRepository(NhatKyThaoTac)
    private readonly nhatKyRepo: Repository<NhatKyThaoTac>,
    private readonly dataSource: DataSource,
  ) {}

  async findByEmail(email: string, includePassword = false): Promise<NguoiDung | null> {
    const query = this.nguoiDungRepo.createQueryBuilder('nguoiDung').setFindOptions({
      where: { email },
      relations: ['hocVien', 'giangVien'],
    });
    if (includePassword) query.addSelect('nguoiDung.matKhauHash');
    return query.getOne();
  }

  async findById(maNd: string): Promise<NguoiDung | null> {
    return this.nguoiDungRepo.findOne({
      where: { maNd },
      relations: ['hocVien', 'giangVien', 'hocVien.chuyenNganh'],
    });
  }

  async findAll(): Promise<Omit<NguoiDung, 'matKhauHash'>[]> {
    const users = await this.nguoiDungRepo.find({
      relations: ['hocVien', 'giangVien', 'hocVien.chuyenNganh'],
      order: { ngayTao: 'DESC' },
    });
    return users.map(({ matKhauHash, ...rest }) => rest as any);
  }

  async create(data: Partial<NguoiDung>): Promise<NguoiDung> {
    const user = this.nguoiDungRepo.create(data);
    return this.nguoiDungRepo.save(user);
  }

  static tinhHanMucHuongDan(hocHam?: string, hocVi?: string): number {
    const ham = (hocHam || '').trim().toLowerCase();
    const vi = (hocVi || '').trim().toLowerCase();
    if (ham.includes('phó giáo sư') || /^pgs\b/.test(ham) || ham.includes('associate professor')) return 5;
    if (ham.includes('giáo sư') || /^gs\b/.test(ham) || ham === 'professor') return 7;
    if (vi.includes('tiến sĩ khoa học') || /^tskh\b/.test(vi)) return 5;
    return 3;
  }

  async findAllExtended(): Promise<ExtendedUserView[]> {
    const users = await this.nguoiDungRepo.find({
      relations: ['hocVien', 'hocVien.chuyenNganh', 'giangVien'],
      order: { ngayTao: 'DESC' },
    });

    const loadRows = await this.dataSource
      .createQueryBuilder()
      .select('dt.ma_gvhd', 'maGv')
      .addSelect('COUNT(*)', 'soNcs')
      .from('de_tai', 'dt')
      .where('dt.trang_thai IN (:...tt)', {
        tt: [TrangThaiDeTai.DaDuyet, TrangThaiDeTai.DangThucHien, TrangThaiDeTai.DuDieuKienBaoVe],
      })
      .groupBy('dt.ma_gvhd')
      .getRawMany<{ maGv: string; soNcs: string }>();
    const loadMap = new Map(loadRows.map((r) => [r.maGv, Number(r.soNcs)]));

    const gvhdRows = await this.dataSource
      .createQueryBuilder()
      .select('dt.ma_hv', 'maHv')
      .addSelect('nd.ho_ten', 'hoTenGvhd')
      .from('de_tai', 'dt')
      .innerJoin('nguoi_dung', 'nd', 'nd.ma_nd = dt.ma_gvhd')
      .where('dt.trang_thai != :huy', { huy: TrangThaiDeTai.TuChoi })
      .getRawMany<{ maHv: string; hoTenGvhd: string }>();
    const gvhdMap = new Map(gvhdRows.map((r) => [r.maHv, r.hoTenGvhd]));

    return users.map((u) => {
      const hv = u.hocVien;
      const gv = u.giangVien;
      return {
        maNd: u.maNd,
        hoTen: u.hoTen,
        email: u.email,
        vaiTro: u.vaiTro,
        trangThai:
          hv?.trangThai === TrangThaiHocVien.TotNghiep
            ? TrangThaiTaiKhoan.Graduated
            : u.trangThai || TrangThaiTaiKhoan.Active,
        soDienThoai: u.sdt,
        ngayTao: (u.ngayTao instanceof Date ? u.ngayTao.toISOString() : String(u.ngayTao)).slice(0, 10),
        mshv: hv?.mshv,
        trinhDo: hv?.trinhDo,
        chuyenNganh: hv?.chuyenNganh?.tenCn,
        khoaHoc: hv?.khoaHoc,
        gvhd: hv ? gvhdMap.get(hv.maHv) : undefined,
        hocHam: gv?.hocHam,
        hocVi: gv?.hocVi,
        khoa: gv?.chuyenMon,
        ncsDangHuongDan: gv ? loadMap.get(gv.maGv) || 0 : undefined,
        hanMucToiDa: gv ? UsersService.tinhHanMucHuongDan(gv.hocHam, gv.hocVi) : undefined,
      };
    });
  }

  async findGiangVienForSelect(): Promise<
    {
      maGv: string;
      hoTen: string;
      hocHam?: string;
      hocVi?: string;
      chuyenMon?: string;
      soNcsDangHd: number;
      hanMucToiDa: number;
      conTrong: number;
    }[]
  > {
    const rows = await this.giangVienRepo.find({ relations: ['nguoiDung'] });

    const loadRows = await this.dataSource
      .createQueryBuilder()
      .select('dt.ma_gvhd', 'maGv')
      .addSelect('COUNT(*)', 'soNcs')
      .from('de_tai', 'dt')
      .where('dt.trang_thai IN (:...tt)', {
        tt: [TrangThaiDeTai.DaDuyet, TrangThaiDeTai.DangThucHien, TrangThaiDeTai.DuDieuKienBaoVe],
      })
      .groupBy('dt.ma_gvhd')
      .getRawMany<{ maGv: string; soNcs: string }>();
    const loadMap = new Map(loadRows.map((r) => [r.maGv, Number(r.soNcs)]));

    return rows
      .map((gv) => {
        const hanMuc = UsersService.tinhHanMucHuongDan(gv.hocHam, gv.hocVi);
        const dangHd = loadMap.get(gv.maGv) || 0;
        return {
          maGv: gv.maGv,
          hoTen: gv.nguoiDung?.hoTen || 'Giảng viên',
          hocHam: gv.hocHam,
          hocVi: gv.hocVi,
          chuyenMon: gv.chuyenMon,
          soNcsDangHd: dangHd,
          hanMucToiDa: hanMuc,
          conTrong: Math.max(0, hanMuc - dangHd),
        };
      })
      .sort((a, b) => a.hoTen.localeCompare(b.hoTen, 'vi'));
  }

  async createUser(dto: CreateUserDto, actor?: AuditActor): Promise<ExtendedUserView & { matKhauKhoiTao?: string }> {
    const existed = await this.nguoiDungRepo.findOne({ where: { email: dto.email } });
    if (existed) {
      throw new ConflictException(`Email ${dto.email} đã được sử dụng bởi một tài khoản khác`);
    }
    if (dto.vaiTro === VaiTro.HocVien && !dto.mshv) {
      throw new BadRequestException('Tài khoản học viên/NCS bắt buộc phải có Mã số học viên (MSHV)');
    }

    const matKhauKhoiTao = dto.matKhau ? undefined : randomBytes(18).toString('base64url');
    const matKhauHash = await bcrypt.hash(dto.matKhau || matKhauKhoiTao!, 10);

    const saved = await this.dataSource.transaction(async (manager) => {
      const nd = manager.create(NguoiDung, {
        hoTen: dto.hoTen,
        email: dto.email,
        matKhauHash,
        vaiTro: dto.vaiTro,
        sdt: dto.sdt,
        trangThai: TrangThaiTaiKhoan.Active,
      });
      const nguoiDung = await manager.save(NguoiDung, nd);

      if (dto.vaiTro === VaiTro.HocVien) {
        await manager.save(
          manager.create(HocVien, {
            maHv: nguoiDung.maNd,
            mshv: dto.mshv!,
            trinhDo: dto.trinhDo || TrinhDo.TienSi,
            maChuyenNganh: dto.maChuyenNganh,
            khoaHoc: dto.khoaHoc,
            trangThai: TrangThaiHocVien.DangHoc,
            ngayNhapHoc: new Date().toISOString().slice(0, 10),
          }),
        );
      } else if (dto.vaiTro === VaiTro.GiangVien) {
        await manager.save(
          manager.create(GiangVien, {
            maGv: nguoiDung.maNd,
            hocHam: dto.hocHam,
            hocVi: dto.hocVi,
            chuyenMon: dto.chuyenMon,
            soNcsDangHd: 0,
          }),
        );
      }
      return nguoiDung;
    });

    await this.ghiNhatKy(
      actor,
      `Thêm tài khoản mới: ${dto.hoTen} (${dto.email}) — Vai trò: ${VAI_TRO_LABEL[dto.vaiTro] || dto.vaiTro}`,
      KetQuaThaoTac.Success,
    );

    return {
      maNd: saved.maNd,
      hoTen: saved.hoTen,
      email: saved.email,
      vaiTro: saved.vaiTro,
      matKhauKhoiTao,
      trangThai: TrangThaiTaiKhoan.Active,
      soDienThoai: saved.sdt,
      ngayTao: new Date().toISOString().slice(0, 10),
      mshv: dto.mshv,
      trinhDo: dto.trinhDo,
      khoaHoc: dto.khoaHoc,
      hocHam: dto.hocHam,
      hocVi: dto.hocVi,
      khoa: dto.chuyenMon,
      ncsDangHuongDan: dto.vaiTro === VaiTro.GiangVien ? 0 : undefined,
      hanMucToiDa:
        dto.vaiTro === VaiTro.GiangVien
          ? UsersService.tinhHanMucHuongDan(dto.hocHam, dto.hocVi)
          : undefined,
    };
  }

  async importUsers(
    danhSach: CreateUserDto[],
    actor?: AuditActor,
  ): Promise<{ thanhCong: number; thatBai: number; loi: { dong: number; email: string; lyDo: string }[] }> {
    const loi: { dong: number; email: string; lyDo: string }[] = [];
    let thanhCong = 0;

    for (let i = 0; i < danhSach.length; i++) {
      try {
        await this.createUser(danhSach[i]);
        thanhCong++;
      } catch (err: any) {
        loi.push({ dong: i + 1, email: danhSach[i]?.email || '', lyDo: err?.message || 'Lỗi không xác định' });
      }
    }

    await this.ghiNhatKy(
      actor,
      `Nhập khẩu danh sách tài khoản từ tệp CSV/Excel: ${thanhCong}/${danhSach.length} dòng thành công`,
      loi.length ? KetQuaThaoTac.Warning : KetQuaThaoTac.Success,
    );

    return { thanhCong, thatBai: loi.length, loi };
  }

  async update(maNd: string, data: UpdateUserDto, actor?: AuditActor): Promise<ExtendedUserView> {
    const user = await this.nguoiDungRepo.findOne({
      where: { maNd },
      relations: ['hocVien', 'giangVien'],
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (data.email && data.email !== user.email) {
      const trung = await this.nguoiDungRepo.findOne({ where: { email: data.email } });
      if (trung) throw new ConflictException(`Email ${data.email} đã được sử dụng`);
      user.email = data.email;
    }
    if (data.hoTen) user.hoTen = data.hoTen;
    if (data.sdt !== undefined) user.sdt = data.sdt;
    if (data.vaiTro) user.vaiTro = data.vaiTro;
    if (data.trangThai) user.trangThai = data.trangThai;
    await this.nguoiDungRepo.save(user);

    if (user.hocVien) {
      const hv = user.hocVien;
      if (data.mshv) hv.mshv = data.mshv;
      if (data.trinhDo) hv.trinhDo = data.trinhDo;
      if (data.maChuyenNganh !== undefined) hv.maChuyenNganh = data.maChuyenNganh;
      if (data.khoaHoc !== undefined) hv.khoaHoc = data.khoaHoc;
      await this.hocVienRepo.save(hv);
    }
    if (user.giangVien) {
      const gv = user.giangVien;
      if (data.hocHam !== undefined) gv.hocHam = data.hocHam;
      if (data.hocVi !== undefined) gv.hocVi = data.hocVi;
      if (data.chuyenMon !== undefined) gv.chuyenMon = data.chuyenMon;
      await this.giangVienRepo.save(gv);
    }

    await this.ghiNhatKy(
      actor,
      `Cập nhật thông tin hành chính của tài khoản: ${user.hoTen} (${user.email})`,
      KetQuaThaoTac.Success,
    );

    return this.findOneExtended(maNd);
  }

  async toggleTrangThai(maNd: string, actor?: AuditActor): Promise<ExtendedUserView> {
    const user = await this.nguoiDungRepo.findOne({ where: { maNd } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    if (actor && actor.maNd === maNd) {
      throw new BadRequestException('Không thể tự khóa tài khoản quản trị đang đăng nhập');
    }

    const next =
      user.trangThai === TrangThaiTaiKhoan.Locked ? TrangThaiTaiKhoan.Active : TrangThaiTaiKhoan.Locked;
    user.trangThai = next;
    await this.nguoiDungRepo.save(user);

    await this.ghiNhatKy(
      actor,
      `${next === TrangThaiTaiKhoan.Locked ? 'Khóa' : 'Mở khóa'} tài khoản: ${user.hoTen} (${user.email})`,
      next === TrangThaiTaiKhoan.Locked ? KetQuaThaoTac.Warning : KetQuaThaoTac.Success,
    );

    return this.findOneExtended(maNd);
  }

  async resetPassword(
    maNd: string,
    newPassword = randomBytes(18).toString('base64url'),
    actor?: AuditActor,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.nguoiDungRepo.findOne({ where: { maNd } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const salt = await bcrypt.genSalt(10);
    user.matKhauHash = await bcrypt.hash(newPassword, salt);
    await this.nguoiDungRepo.save(user);

    await this.ghiNhatKy(
      actor,
      `Cấp lại mật khẩu cho tài khoản: ${user.hoTen} (${user.email})`,
      KetQuaThaoTac.Warning,
    );

    return {
      success: true,
      message: `Mật khẩu mới của ${user.hoTen}: ${newPassword}`,
    };
  }

  async findOneExtended(maNd: string): Promise<ExtendedUserView> {
    const all = await this.findAllExtended();
    const found = all.find((u) => u.maNd === maNd);
    if (!found) throw new NotFoundException('Không tìm thấy người dùng');
    return found;
  }

  async ghiNhatKy(
    actor: AuditActor | undefined,
    hanhDong: string,
    ketQua: KetQuaThaoTac = KetQuaThaoTac.Success,
  ): Promise<void> {
    try {
      await this.nhatKyRepo.save(
        this.nhatKyRepo.create({
          maNd: actor?.maNd,
          hoTen: actor?.hoTen || 'Hệ thống tự động',
          vaiTro: VAI_TRO_LABEL[actor?.vaiTro as string] || String(actor?.vaiTro || 'System Bot'),
          hanhDong,
          diaChiIp: actor?.ip || '127.0.0.1',
          ketQua,
        }),
      );
    } catch (err: any) {
      this.logger.warn(`Không ghi được nhật ký thao tác: ${err.message}`);
    }
  }

  async getNhatKy(limit = 100): Promise<NhatKyThaoTac[]> {
    return this.nhatKyRepo.find({
      order: { thoiGian: 'DESC' },
      take: Math.min(limit, 500),
    });
  }

  async getThongKe(): Promise<{
    tongSo: number;
    soNcs: number;
    soHocVienThacSi: number;
    soGiangVien: number;
    soQuanTri: number;
    soTaiKhoanBiKhoa: number;
  }> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('nd.vai_tro', 'vaiTro')
      .addSelect('nd.trang_thai', 'trangThai')
      .addSelect('hv.trinh_do', 'trinhDo')
      .addSelect('COUNT(*)', 'soLuong')
      .from('nguoi_dung', 'nd')
      .leftJoin('hoc_vien', 'hv', 'hv.ma_hv = nd.ma_nd')
      .groupBy('nd.vai_tro')
      .addGroupBy('nd.trang_thai')
      .addGroupBy('hv.trinh_do')
      .getRawMany<{ vaiTro: string; trangThai: string; trinhDo: string; soLuong: string }>();

    const tk = { tongSo: 0, soNcs: 0, soHocVienThacSi: 0, soGiangVien: 0, soQuanTri: 0, soTaiKhoanBiKhoa: 0 };
    for (const r of rows) {
      const n = Number(r.soLuong);
      tk.tongSo += n;
      if (r.trangThai === TrangThaiTaiKhoan.Locked) tk.soTaiKhoanBiKhoa += n;
      if (r.vaiTro === VaiTro.GiangVien) tk.soGiangVien += n;
      else if (r.vaiTro === VaiTro.Admin) tk.soQuanTri += n;
      else if (r.vaiTro === VaiTro.HocVien) {
        if (r.trinhDo === TrinhDo.TienSi) tk.soNcs += n;
        else tk.soHocVienThacSi += n;
      }
    }
    return tk;
  }
}
