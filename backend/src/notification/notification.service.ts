import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThongBao } from './entities/thong-bao.entity';
import { LoaiThongBao } from '../common/enums';
import { Subject } from 'rxjs';

export interface CreateThongBaoDto {
  maNdNhan: string;
  loaiTb: LoaiThongBao;
  tieuDe: string;
  noiDung: string;
  duongDan?: string;
  maLienQuan?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private readonly sseStreams = new Map<string, Set<Subject<MessageEvent>>>();

  constructor(
    @InjectRepository(ThongBao)
    private readonly thongBaoRepo: Repository<ThongBao>,
  ) {}

  registerSseStream(maNd: string): Subject<MessageEvent> {
    const streams = this.sseStreams.get(maNd) ?? new Set<Subject<MessageEvent>>();
    const subject = new Subject<MessageEvent>();
    streams.add(subject);
    this.sseStreams.set(maNd, streams);
    return subject;
  }

  unregisterSseStream(maNd: string, subject: Subject<MessageEvent>): void {
    const streams = this.sseStreams.get(maNd);
    streams?.delete(subject);
    subject.complete();
    if (!streams?.size) this.sseStreams.delete(maNd);
  }

  async create(dto: CreateThongBaoDto): Promise<ThongBao> {
    try {
      const tb = this.thongBaoRepo.create({
        maNdNhan: dto.maNdNhan,
        loaiTb: dto.loaiTb,
        tieuDe: dto.tieuDe,
        noiDung: dto.noiDung,
        duongDan: dto.duongDan,
        maLienQuan: dto.maLienQuan,
        daDoc: false,
      });
      const saved = await this.thongBaoRepo.save(tb);

      for (const stream of this.sseStreams.get(dto.maNdNhan) ?? []) {
        stream.next({
          data: JSON.stringify({
            maTb: saved.maTb,
            loaiTb: saved.loaiTb,
            tieuDe: saved.tieuDe,
            noiDung: saved.noiDung,
            duongDan: saved.duongDan,
            thoiGian: saved.thoiGian,
          }),
        } as MessageEvent);
      }

      return saved;
    } catch (err: any) {
      this.logger.error(`Lỗi tạo thông báo: ${err.message}`);
      throw err;
    }
  }

  async broadcast(recipients: string[], dto: Omit<CreateThongBaoDto, 'maNdNhan'>): Promise<void> {
    await Promise.allSettled(
      recipients.map((maNd) => this.create({ ...dto, maNdNhan: maNd })),
    );
  }

  async getByUser(maNd: string, limit = 30): Promise<ThongBao[]> {
    return this.thongBaoRepo.find({
      where: { maNdNhan: maNd },
      order: { thoiGian: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(maNd: string): Promise<number> {
    return this.thongBaoRepo.count({ where: { maNdNhan: maNd, daDoc: false } });
  }

  async markAsRead(maTb: string, maNd: string): Promise<void> {
    await this.thongBaoRepo.update({ maTb, maNdNhan: maNd }, { daDoc: true });
  }

  async markAllAsRead(maNd: string): Promise<void> {
    await this.thongBaoRepo.update({ maNdNhan: maNd, daDoc: false }, { daDoc: true });
  }

  async deleteOne(maTb: string, maNd: string): Promise<void> {
    await this.thongBaoRepo.delete({ maTb, maNdNhan: maNd });
  }

  async notifyDeTaiStatusChange(
    maNdNhan: string,
    tenDt: string,
    trangThaiMoi: string,
    maDt: string,
  ): Promise<void> {
    const statusMap: Record<string, { tieuDe: string; noiDung: string }> = {
      DaDuyet: {
        tieuDe: '✅ Đề tài đã được phê duyệt',
        noiDung: `Đề tài "${tenDt}" đã được Phòng Đào tạo phê duyệt. Bạn có thể bắt đầu thực hiện nghiên cứu.`,
      },
      TuChoi: {
        tieuDe: '❌ Đề tài bị từ chối',
        noiDung: `Đề tài "${tenDt}" đã bị từ chối. Vui lòng liên hệ GVHD để điều chỉnh và nộp lại.`,
      },
      DuDKBaoVe: {
        tieuDe: '🎓 Đủ điều kiện bảo vệ',
        noiDung: `Đề tài "${tenDt}" đã được xác nhận đủ điều kiện bảo vệ. Chờ thành lập Hội đồng.`,
      },
      DaBaoVe: {
        tieuDe: '🏆 Bảo vệ luận án thành công',
        noiDung: `Chúc mừng! Đề tài "${tenDt}" đã hoàn thành bảo vệ trước Hội đồng.`,
      },
    };

    const template = statusMap[trangThaiMoi];
    if (!template) return;

    await this.create({
      maNdNhan,
      loaiTb: LoaiThongBao.DeTai,
      tieuDe: template.tieuDe,
      noiDung: template.noiDung,
      duongDan: `/de-tai/${maDt}`,
      maLienQuan: maDt,
    });
  }

  async notifyDonHocVuResult(
    maNdNhan: string,
    loaiDon: string,
    trangThai: 'DaDuyet' | 'TuChoi',
    maDon: string,
  ): Promise<void> {
    const isDuyet = trangThai === 'DaDuyet';
    await this.create({
      maNdNhan,
      loaiTb: LoaiThongBao.DonHocVu,
      tieuDe: isDuyet ? `✅ Đơn ${loaiDon} đã được duyệt` : `❌ Đơn ${loaiDon} bị từ chối`,
      noiDung: isDuyet
        ? `Đơn xin ${loaiDon} của bạn đã được Phòng Đào tạo phê duyệt.`
        : `Đơn xin ${loaiDon} của bạn bị từ chối. Vui lòng liên hệ Phòng Đào tạo để biết lý do.`,
      duongDan: `/don-hoc-vu/${maDon}`,
      maLienQuan: maDon,
    });
  }

  async notifyTuyenSinhResult(
    maNdNhan: string,
    trangThai: 'DaDuyet' | 'TuChoi' | 'DaNhapHoc',
    maDon: string,
  ): Promise<void> {
    const map: Record<string, { tieuDe: string; noiDung: string }> = {
      DaDuyet: {
        tieuDe: '✅ Hồ sơ tuyển sinh được duyệt',
        noiDung: 'Hồ sơ dự tuyển của bạn đã được phê duyệt. Vui lòng hoàn tất thủ tục nhập học.',
      },
      TuChoi: {
        tieuDe: '❌ Hồ sơ tuyển sinh không đạt',
        noiDung: 'Hồ sơ dự tuyển của bạn chưa đáp ứng yêu cầu. Vui lòng liên hệ Phòng Đào tạo.',
      },
      DaNhapHoc: {
        tieuDe: '🎉 Hoàn tất nhập học',
        noiDung: 'Chúc mừng bạn đã chính thức nhập học! Tài khoản học vụ đã được kích hoạt.',
      },
    };
    const template = map[trangThai];
    if (!template) return;
    await this.create({
      maNdNhan,
      loaiTb: LoaiThongBao.TuyenSinh,
      tieuDe: template.tieuDe,
      noiDung: template.noiDung,
      maLienQuan: maDon,
    });
  }
}
