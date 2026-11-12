import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { NguoiDung } from '../users/entities/nguoi-dung.entity';
import { NotificationService } from '../notification/notification.service';
import { LoaiThongBao, TrangThaiDeTai, VaiTro } from '../common/enums';
import { MonHoc } from './entities/mon-hoc.entity';
import { DangKyMonHoc } from './entities/dangky-monhoc.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { CreateMonHocDto, DangKyMonHocDto, CapNhatDiemDto, PhanCongGiangDayDto } from './dto';
import { TrangThaiDangKy, TrangThaiHocVien } from '../common/enums';
import { PhanCongGiangDay } from './entities/phan-cong-giang-day.entity';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { DeTai } from '../de-tai/entities/de-tai.entity';

type CourseActor = { maNd: string; vaiTro: VaiTro };

@Injectable()
export class MonHocService {
  private readonly logger = new Logger(MonHocService.name);
  constructor(
    @InjectRepository(MonHoc)
    private readonly monHocRepo: Repository<MonHoc>,
    @InjectRepository(DangKyMonHoc)
    private readonly dangKyRepo: Repository<DangKyMonHoc>,
    @InjectRepository(HocVien)
    private readonly hocVienRepo: Repository<HocVien>,
    @InjectRepository(NguoiDung)
    private readonly nguoiDungRepo: Repository<NguoiDung>,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  async kiemTraQuyenXemBangDiem(maHv: string, user: CourseActor) {
    if (user.vaiTro !== VaiTro.GiangVien) return;
    const isSupervisor = await this.dataSource.getRepository(DeTai).exists({
      where: [{ maHv, maGvhd: user.maNd }, { maHv, maGvhd2: user.maNd }],
    });
    if (!isSupervisor) throw new ForbiddenException('Bạn chỉ được xem bảng điểm của học viên mình hướng dẫn');
  }

  async phanCongGiangDay(dto: PhanCongGiangDayDto) {
    if (!await this.monHocRepo.existsBy({ maMh: dto.maMh })) {
      throw new NotFoundException('Không tìm thấy học phần');
    }
    if (!await this.dataSource.getRepository(GiangVien).existsBy({ maGv: dto.maGv })) {
      throw new NotFoundException('Không tìm thấy giảng viên');
    }
    await this.dataSource.getRepository(PhanCongGiangDay)
      .createQueryBuilder().insert().values(dto).orIgnore().execute();
  }

  async huyPhanCongGiangDay(dto: PhanCongGiangDayDto) {
    await this.dataSource.getRepository(PhanCongGiangDay).delete({
      maMh: dto.maMh, maGv: dto.maGv, hocKyNamHoc: dto.hocKyNamHoc,
    });
  }

  async danhSachPhanCong(user: CourseActor) {
    const query = this.dataSource.getRepository(PhanCongGiangDay).createQueryBuilder('pc')
      .innerJoinAndSelect('pc.monHoc', 'mh')
      .innerJoin('pc.giangVien', 'gv')
      .innerJoin('gv.nguoiDung', 'nd')
      .addSelect('nd.hoTen', 'hoTen')
      .orderBy('pc.hocKyNamHoc', 'DESC')
      .addOrderBy('mh.tenMh', 'ASC');
    if (user.vaiTro === VaiTro.GiangVien) query.where('pc.maGv = :maGv', { maGv: user.maNd });
    const { raw, entities } = await query.getRawAndEntities();
    return entities.map((row, index) => ({ ...row, hoTen: raw[index].hoTen as string }));
  }

  async danhSachChamDiem(maMh: number, hocKyNamHoc: string, user: CourseActor) {
    await this.kiemTraPhanCong(maMh, hocKyNamHoc, user);
    return this.dangKyRepo.createQueryBuilder('dk')
      .innerJoin('dk.hocVien', 'hv')
      .innerJoin('hv.nguoiDung', 'nd')
      .select('dk.maHv', 'maHv')
      .addSelect('hv.mshv', 'mshv')
      .addSelect('nd.hoTen', 'hoTen')
      .addSelect('dk.diem', 'diem')
      .where('dk.maMh = :maMh AND dk.hocKyNamHoc = :hocKyNamHoc', { maMh, hocKyNamHoc })
      .andWhere('dk.trangThai <> :huy', { huy: TrangThaiDangKy.Huy })
      .orderBy('nd.hoTen', 'ASC')
      .getRawMany<{ maHv: string; mshv: string; hoTen: string; diem: string | null }>();
  }

  private async kiemTraPhanCong(maMh: number, hocKyNamHoc: string, user: CourseActor) {
    if (user.vaiTro === VaiTro.Admin) return;
    if (user.vaiTro !== VaiTro.GiangVien || !await this.dataSource.getRepository(PhanCongGiangDay)
      .existsBy({ maGv: user.maNd, maMh, hocKyNamHoc })) {
      throw new ForbiddenException('Bạn chưa được phân công học phần này trong học kỳ đã chọn');
    }
  }

  async findAllMonHoc(maCn?: number): Promise<MonHoc[]> {
    if (maCn) {
      return this.monHocRepo.find({
        where: { maCn },
        relations: ['chuyenNganh'],
        order: { tenMh: 'ASC' },
      });
    }
    return this.monHocRepo.find({
      relations: ['chuyenNganh'],
      order: { tenMh: 'ASC' },
    });
  }

  async createMonHoc(dto: CreateMonHocDto): Promise<MonHoc> {
    const mh = this.monHocRepo.create(dto);
    return this.monHocRepo.save(mh);
  }

  async dangKyHocPhan(maHv: string, dto: DangKyMonHocDto): Promise<DangKyMonHoc> {
    const hv = await this.hocVienRepo.findOne({ where: { maHv } });
    if (!hv) {
      throw new NotFoundException('Học viên chưa hoàn thiện hồ sơ học vụ');
    }

    if (hv.trangThai !== TrangThaiHocVien.DangHoc) {
      throw new BadRequestException(
        `Học viên đang ở trạng thái "${hv.trangThai}", không được phép đăng ký học phần`,
      );
    }

    const mh = await this.monHocRepo.findOne({ where: { maMh: dto.maMh } });
    if (!mh) {
      throw new NotFoundException('Môn học không tồn tại');
    }

    if (mh.maCn != null && mh.maCn !== hv.maChuyenNganh) {
      throw new BadRequestException('Học phần không thuộc chương trình của học viên');
    }

    const existing = await this.dangKyRepo.findOne({
      where: {
        maHv,
        maMh: dto.maMh,
        hocKyNamHoc: dto.hocKyNamHoc,
      },
    });

    if (existing && existing.trangThai !== TrangThaiDangKy.Huy) {
      throw new ConflictException('Học viên đã đăng ký môn học này trong học kỳ');
    }

    const currentDks = await this.dangKyRepo.find({
      where: { maHv, hocKyNamHoc: dto.hocKyNamHoc },
      relations: ['monHoc'],
    });

    const activeDks = currentDks.filter((d) => d.trangThai !== TrangThaiDangKy.Huy && d.maMh !== dto.maMh);
    const currentCredits = activeDks.reduce((sum, d) => sum + (d.monHoc?.soTinChi || 0), 0);

    if (currentCredits + mh.soTinChi > 12) {
      throw new BadRequestException(
        `Vượt quá giới hạn tín chỉ học kỳ: Tổng số tín chỉ sau khi đăng ký là ${currentCredits + mh.soTinChi}/12 tín chỉ.`,
      );
    }

    if (existing) {
      existing.trangThai = TrangThaiDangKy.DaDangKy;
      existing.diem = undefined;
      return this.dangKyRepo.save(existing);
    }

    const dk = this.dangKyRepo.create({
      maHv,
      maMh: dto.maMh,
      hocKyNamHoc: dto.hocKyNamHoc,
      trangThai: TrangThaiDangKy.DaDangKy,
    });

    const saved = await this.dangKyRepo.save(dk);

    await this.thongBaoChoQuanTri(
      '📚 Phiếu đăng ký học phần mới',
      `Học viên ${await this.tenHocVien(maHv)} vừa đăng ký học phần "${mh.tenMh}" (${mh.soTinChi} TC) — học kỳ ${dto.hocKyNamHoc}.`,
      '/hoc-phan',
    );

    return saved;
  }

  private async tenHocVien(maHv: string): Promise<string> {
    const nd = await this.nguoiDungRepo.findOne({ where: { maNd: maHv } });
    return nd?.hoTen || 'Học viên';
  }

  private async thongBaoChoQuanTri(tieuDe: string, noiDung: string, duongDan?: string): Promise<void> {
    const admins = await this.nguoiDungRepo.find({
      where: { vaiTro: VaiTro.Admin },
      select: ['maNd'],
    });
    await this.notificationService.broadcast(
      admins.map((a) => a.maNd),
      { loaiTb: LoaiThongBao.HeThong, tieuDe, noiDung, duongDan },
    );
  }

  async listDangKyByHocVien(maHv: string): Promise<DangKyMonHoc[]> {
    return this.dangKyRepo.find({
      where: { maHv },
      relations: ['monHoc', 'monHoc.chuyenNganh'],
      order: { hocKyNamHoc: 'DESC' },
    });
  }

  async capNhatDiem(dto: CapNhatDiemDto, user: CourseActor): Promise<DangKyMonHoc> {
    await this.kiemTraPhanCong(dto.maMh, dto.hocKyNamHoc, user);
    const dk = await this.dangKyRepo.findOne({
      where: {
        maHv: dto.maHv,
        maMh: dto.maMh,
        hocKyNamHoc: dto.hocKyNamHoc,
      },
    });

    if (!dk) {
      throw new NotFoundException('Không tìm thấy thông tin đăng ký học phần này');
    }
    if (dk.trangThai === TrangThaiDangKy.Huy) {
      throw new BadRequestException('Đăng ký đã hủy. Không thể nhập điểm.');
    }

    const diem = Number(dto.diem);
    if (isNaN(diem) || diem < 0.0 || diem > 10.0) {
      throw new BadRequestException('Điểm học phần phải nằm trong thang điểm từ 0.0 đến 10.0');
    }

    dk.diem = Number(diem.toFixed(2));
    dk.trangThai = diem >= 5.0 ? TrangThaiDangKy.DaHoanThanh : TrangThaiDangKy.DaDangKy;

    const result = await this.dangKyRepo.update({
      maHv: dto.maHv, maMh: dto.maMh, hocKyNamHoc: dto.hocKyNamHoc, trangThai: Not(TrangThaiDangKy.Huy),
    }, { diem: dk.diem, trangThai: dk.trangThai });
    if (!result.affected) throw new ConflictException('Đăng ký vừa thay đổi. Vui lòng tải lại.');

    const mh = await this.monHocRepo.findOne({ where: { maMh: dto.maMh } });
    await this.notificationService.create({
      maNdNhan: dto.maHv,
      loaiTb: LoaiThongBao.HeThong,
      tieuDe: '🎓 Công bố điểm học phần',
      noiDung: `Điểm học phần "${mh?.tenMh || 'Học phần'}" (${dto.hocKyNamHoc}) đã được công bố: ${dk.diem}/10.0. Điểm đã được cập nhật vào bảng điểm tích lũy.`,
      duongDan: '/hoc-phan',
    });

    return dk;
  }

  async huyDangKy(maHv: string, maMh: number, hocKyNamHoc: string): Promise<void> {
    const dk = await this.dangKyRepo.findOne({
      where: { maHv, maMh, hocKyNamHoc },
    });
    if (!dk) {
      throw new NotFoundException('Không tìm thấy bản ghi đăng ký');
    }

    if (dk.diem !== null && dk.diem !== undefined) {
      throw new BadRequestException('Không thể hủy môn học đã được giảng viên ghi nhận điểm số');
    }

    const result = await this.dangKyRepo.update(
      { maHv, maMh, hocKyNamHoc, diem: IsNull() },
      { trangThai: TrangThaiDangKy.Huy },
    );
    if (!result.affected) throw new ConflictException('Đăng ký vừa thay đổi. Vui lòng tải lại.');
  }

  async tinhGpaHocVien(maHv: string) {
    const hv = await this.hocVienRepo.findOne({
      where: { maHv },
      relations: ['nguoiDung', 'chuyenNganh'],
    });
    if (!hv) throw new NotFoundException('Không tìm thấy học viên');

    const allDks = await this.dangKyRepo.find({
      where: { maHv },
      relations: ['monHoc'],
    });

    // Use the best graded attempt for GPA. Earn credits once per passed course.
    const bestAttempts = new Map<number, DangKyMonHoc>();
    for (const dk of allDks) {
      if (dk.trangThai === TrangThaiDangKy.Huy || dk.diem == null) continue;
      const previous = bestAttempts.get(dk.maMh);
      if (!previous || Number(dk.diem) > Number(previous.diem)) bestAttempts.set(dk.maMh, dk);
    }
    const completed = [...bestAttempts.values()];

    if (completed.length === 0) {
      return {
        maHv,
        hoTen: hv.nguoiDung?.hoTen || 'Học viên',
        gpa10: 0,
        gpa4: 0,
        xepLoai: 'Chưa có điểm',
        tongTinChiTichLuy: 0,
        tongMonHoanThanh: 0,
        chiTiet: [],
      };
    }

    let tongTichSo10 = 0;
    let tongTichSo4 = 0;
    let tongTinChi = 0;
    let tinChiDat = 0;

    const diem10ToGpa4 = (d: number): number => {
      if (d >= 9.0) return 4.0;
      if (d >= 8.0) return 3.5;
      if (d >= 7.0) return 3.0;
      if (d >= 6.0) return 2.5;
      if (d >= 5.0) return 2.0;
      if (d >= 4.0) return 1.5;
      if (d >= 3.5) return 1.0;
      return 0;
    };

    const chiTiet = completed.map((dk) => {
      const tc = dk.monHoc?.soTinChi || 1;
      const d10 = Number(dk.diem);
      const d4 = diem10ToGpa4(d10);
      tongTichSo10 += d10 * tc;
      tongTichSo4 += d4 * tc;
      tongTinChi += tc;
      if (d10 >= 5) tinChiDat += tc;
      return {
        tenMh: dk.monHoc?.tenMh || 'Môn học',
        soTinChi: tc,
        diem10: d10,
        diem4: d4,
        diemChu: d10 >= 9 ? 'A' : d10 >= 8 ? 'B+' : d10 >= 7 ? 'B' : d10 >= 6 ? 'C+' : d10 >= 5 ? 'C' : 'F',
        trangThai: d10 >= 5.0 ? 'Đạt' : 'Không đạt',
        hocKyNamHoc: dk.hocKyNamHoc,
      };
    });

    const gpa10 = tongTinChi > 0 ? Number((tongTichSo10 / tongTinChi).toFixed(2)) : 0;
    const gpa4 = tongTinChi > 0 ? Number((tongTichSo4 / tongTinChi).toFixed(2)) : 0;

    let xepLoai: string;
    if (gpa4 >= 3.6) xepLoai = 'Xuất sắc';
    else if (gpa4 >= 3.2) xepLoai = 'Giỏi';
    else if (gpa4 >= 2.5) xepLoai = 'Khá';
    else if (gpa4 >= 2.0) xepLoai = 'Trung bình';
    else xepLoai = 'Trung bình yếu';

    return {
      maHv,
      hoTen: hv.nguoiDung?.hoTen || 'Học viên',
      trinhDo: hv.trinhDo,
      chuyenNganh: hv.chuyenNganh?.tenCn,
      gpa10,
      gpa4,
      xepLoai,
      tongTinChiTichLuy: tinChiDat,
      tongMonHoanThanh: completed.length,
      chiTiet,
    };
  }

  async kiemTraDieuKienTotNghiep(maHv: string) {
    const hv = await this.hocVienRepo.findOne({ where: { maHv }, relations: { chuyenNganh: true } });
    if (!hv) throw new NotFoundException('Không tìm thấy học viên');
    const gpa = await this.tinhGpaHocVien(maHv);
    const defended = await this.dataSource.getRepository(DeTai).existsBy({ maHv, trangThai: TrangThaiDeTai.DaBaoVe });
    const confirmed = hv.trangThai === TrangThaiHocVien.TotNghiep;
    const targetCredits = hv.chuyenNganh?.soTinChiHocPhan;
    const dieuKienList = [
      { tieu_chi: 'Tín chỉ học phần đạt', dat: targetCredits != null && gpa.tongTinChiTichLuy >= targetCredits,
        chi_tiet: targetCredits == null ? 'Chưa cấu hình tín chỉ học phần' : `${gpa.tongTinChiTichLuy}/${targetCredits} tín chỉ` },
      { tieu_chi: 'Kết quả bảo vệ', dat: defended, chi_tiet: defended ? 'Đã bảo vệ đạt' : 'Chưa ghi nhận bảo vệ đạt' },
      { tieu_chi: 'Công nhận tốt nghiệp', dat: confirmed, chi_tiet: confirmed ? 'Đã ghi nhận công nhận tốt nghiệp' : 'Chờ cơ sở đào tạo xét duyệt' },
    ];
    return {
      maHv, hoTen: gpa.hoTen, trinhDo: hv.trinhDo, tatCaDat: dieuKienList.every((item) => item.dat),
      ketLuan: confirmed ? 'Đã ghi nhận công nhận tốt nghiệp' : 'Chờ xác nhận tốt nghiệp của cơ sở đào tạo',
      gpa: { gpa10: gpa.gpa10, gpa4: gpa.gpa4, xepLoai: gpa.xepLoai }, dieuKienList,
      canhBao: dieuKienList.filter((item) => !item.dat).map((item) => item.chi_tiet),
    };
  }
}
