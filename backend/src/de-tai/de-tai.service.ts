import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { TrangThaiDeTai, TrangThaiHocVien, TrinhDo, VaiTro } from '../common/enums';
import { addCalendarMonths } from '../common/academic-dates';
import { NotificationService } from '../notification/notification.service';
import { UploadService } from '../upload/upload.service';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { UsersService } from '../users/users.service';
import { DefenseReadinessService } from './defense-readiness.service';
import { CreateDeTaiDto, UpdateTrangThaiDeTaiDto } from './dto';
import { DeTai } from './entities/de-tai.entity';

type Actor = { maNd: string; vaiTro: VaiTro };

const activeStatuses = [
  TrangThaiDeTai.ChoDuyet, TrangThaiDeTai.DaDuyet, TrangThaiDeTai.DangThucHien,
  TrangThaiDeTai.DuDKBaoVe, TrangThaiDeTai.DuDieuKienBaoVe, TrangThaiDeTai.DangBaoVe, TrangThaiDeTai.KhongDat,
];
const approvalStatuses = [TrangThaiDeTai.DaDuyet, TrangThaiDeTai.TuChoi];

@Injectable()
export class DeTaiService {
  private readonly logger = new Logger(DeTaiService.name);

  constructor(
    @InjectRepository(DeTai) private readonly deTaiRepo: Repository<DeTai>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationService,
    private readonly readiness: DefenseReadinessService,
    private readonly uploads: UploadService,
  ) {}

  getGiangVienMaxNcs(gv: GiangVien): number {
    return UsersService.tinhHanMucHuongDan(gv.hocHam, gv.hocVi);
  }

  async create(maHv: string, dto: CreateDeTaiDto): Promise<DeTai> {
    if (!dto.tenDt.trim()) throw new BadRequestException('Tên đề tài không được để trống');
    if (dto.maGvhd === dto.maGvhd2) throw new BadRequestException('Chọn hai người hướng dẫn khác nhau');

    return this.dataSource.transaction(async (manager) => {
      const hv = await manager.findOne(HocVien, { where: { maHv }, lock: { mode: 'pessimistic_write' } });
      if (!hv || hv.trangThai !== TrangThaiHocVien.DangHoc) {
        throw new BadRequestException('Cần hồ sơ học viên ở trạng thái đang học để đăng ký đề tài');
      }
      if (await manager.existsBy(DeTai, { maHv, trangThai: In(activeStatuses) })) {
        throw new BadRequestException('Học viên đã có đề tài đang xử lý');
      }
      await this.checkAdvisors(manager, hv.trinhDo, dto.maGvhd, dto.maGvhd2);
      if (dto.fileDeCuong) await this.uploads.requireOwnedFile(dto.fileDeCuong, maHv, manager);
      const topic = manager.create(DeTai, {
        ...dto, maHv, tenDt: dto.tenDt.trim(), tenDtEn: dto.tenDtEn?.trim() || undefined,
        thuyetMinh: dto.thuyetMinh?.trim() || undefined, trangThai: TrangThaiDeTai.ChoDuyet,
      });
      return manager.save(DeTai, topic);
    });
  }

  private async checkAdvisors(manager: EntityManager, level: TrinhDo, maGvhd: string, maGvhd2?: string) {
    const ids = maGvhd2 ? [maGvhd, maGvhd2].sort() : [maGvhd];
    for (const maGv of ids) {
      const gv = await manager.findOne(GiangVien, { where: { maGv }, lock: { mode: 'pessimistic_write' } });
      if (!gv) throw new NotFoundException('Không tìm thấy giảng viên hướng dẫn');
      if (level === TrinhDo.TienSi) {
        const max = this.getGiangVienMaxNcs(gv);
        const current = Number(gv.soNcsDangHd) || 0;
        const added = maGvhd2 ? 0.5 : 1;
        if (current + added > max) {
          throw new BadRequestException(`Người hướng dẫn ${maGv === maGvhd ? 'chính' : 'thứ hai'} đã đạt giới hạn tối đa (${current}/${max} NCS)`);
        }
      }
    }
  }

  async findAll(user: Actor): Promise<DeTai[]> {
    const qb = this.deTaiRepo.createQueryBuilder('dt')
      .leftJoinAndSelect('dt.hocVien', 'hv')
      .leftJoinAndSelect('hv.nguoiDung', 'ndHv')
      .leftJoinAndSelect('hv.chuyenNganh', 'cn')
      .leftJoinAndSelect('dt.giangVienHuongDan', 'gv1')
      .leftJoinAndSelect('gv1.nguoiDung', 'ndGv1')
      .leftJoinAndSelect('dt.giangVienHuongDan2', 'gv2')
      .leftJoinAndSelect('gv2.nguoiDung', 'ndGv2')
      .orderBy('dt.ngayDangKy', 'DESC');

    if (user.vaiTro === VaiTro.HocVien) qb.where('dt.maHv = :maHv', { maHv: user.maNd });
    if (user.vaiTro === VaiTro.GiangVien) {
      qb.where('dt.maGvhd = :maGv OR dt.maGvhd2 = :maGv', { maGv: user.maNd });
    }
    return qb.getMany();
  }

  async capNhatHanNop(maDt: string, deadline: string) {
    return this.dataSource.transaction(async (manager) => {
      const topic = await manager.findOne(DeTai, { where: { maDt }, lock: { mode: 'pessimistic_write' } });
      if (!topic) throw new NotFoundException('Không tìm thấy đề tài');
      if (![TrangThaiDeTai.DaDuyet, TrangThaiDeTai.DangThucHien].includes(topic.trangThai)) {
        throw new BadRequestException('Chỉ cập nhật hạn nộp cho đề tài đã duyệt và đang thực hiện');
      }
      if (topic.hanNopLuanAn && topic.tongSoThangGiaHan > 0) {
        throw new BadRequestException('Hạn nộp đã được điều chỉnh theo đơn gia hạn đã duyệt');
      }
      if (deadline < topic.ngayDangKy) throw new BadRequestException('Hạn nộp không được trước ngày đăng ký đề tài');
      const learner = await manager.findOneBy(HocVien, { maHv: topic.maHv });
      if (learner?.trinhDo === TrinhDo.TienSi) {
        if (!learner.ngayNhapHoc) throw new BadRequestException('Cần cập nhật ngày bắt đầu đào tạo');
        if (deadline > addCalendarMonths(learner.ngayNhapHoc, 72)) {
          throw new BadRequestException('Hạn nộp vượt mốc đào tạo 72 tháng của hệ thống');
        }
      }
      await manager.update(DeTai, maDt, { hanNopLuanAn: deadline });
      return { maDt, hanNopLuanAn: deadline };
    });
  }

  async findById(maDt: string, user: Actor): Promise<DeTai> {
    const dt = await this.deTaiRepo.findOne({
      where: { maDt },
      relations: {
        hocVien: { nguoiDung: true, chuyenNganh: true },
        giangVienHuongDan: { nguoiDung: true },
        giangVienHuongDan2: { nguoiDung: true },
        tienDo: true,
      },
    });
    if (!dt) throw new NotFoundException('Không tìm thấy đề tài');
    if (user.vaiTro === VaiTro.HocVien && dt.maHv !== user.maNd) {
      throw new ForbiddenException('Bạn không có quyền truy cập đề tài này');
    }
    this.checkReviewer(dt, user);
    return dt;
  }

  async updateTrangThai(maDt: string, dto: UpdateTrangThaiDeTaiDto, user: Actor) {
    if (!approvalStatuses.includes(dto.trangThai)) {
      throw new BadRequestException('Thao tác này chỉ dùng để duyệt hoặc từ chối đề tài mới');
    }
    const saved = await this.dataSource.transaction(async (manager) => {
      const dt = await manager.findOne(DeTai, { where: { maDt }, lock: { mode: 'pessimistic_write' } });
      if (!dt) throw new NotFoundException('Không tìm thấy đề tài');
      if (user.vaiTro === VaiTro.HocVien) throw new ForbiddenException('Bạn không có quyền duyệt đề tài');
      this.checkReviewer(dt, user);
      if (dt.trangThai === dto.trangThai) return dt;
      if (dt.trangThai !== TrangThaiDeTai.ChoDuyet) {
        throw new BadRequestException('Đề tài đã được xử lý');
      }
      if (dto.trangThai === TrangThaiDeTai.DaDuyet) {
        const hv = await manager.findOneByOrFail(HocVien, { maHv: dt.maHv });
        await this.checkAdvisors(manager, hv.trinhDo, dt.maGvhd, dt.maGvhd2);
      }
      dt.trangThai = dto.trangThai;
      return manager.save(DeTai, dt);
    });
    await this.notify(saved);
    return saved;
  }

  async xacNhanDuDieuKien(maDt: string, user: Actor) {
    const deTai = await this.readiness.confirm(maDt, user);
    await this.notify(deTai);
    return { deTai, thongBao: 'Đã xác nhận hồ sơ đủ điều kiện lập hội đồng bảo vệ.' };
  }

  private checkReviewer(dt: DeTai, user: Actor) {
    if (user.vaiTro === VaiTro.GiangVien && dt.maGvhd !== user.maNd && dt.maGvhd2 !== user.maNd) {
      throw new ForbiddenException('Bạn không phụ trách đề tài này');
    }
  }

  private async notify(dt: Pick<DeTai, 'maDt' | 'maHv' | 'tenDt' | 'trangThai'>) {
    try {
      await this.notifications.notifyDeTaiStatusChange(dt.maHv, dt.tenDt, dt.trangThai, dt.maDt);
    } catch {
      this.logger.warn(`Không gửi được thông báo trạng thái cho đề tài ${dt.maDt}`);
    }
  }
}
