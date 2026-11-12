import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { BaiBaoKhoaHoc } from '../bai-bao/entities/bai-bao-khoa-hoc.entity';
import { ChuyenNganh } from '../users/entities/chuyen-nganh.entity';
import { TienDo } from '../tien-do/entities/tien-do.entity';
import { HoiDong } from '../hoi-dong/entities/hoi-dong.entity';
import { CapDanhGia, TrangThaiHocVien } from '../common/enums';

export interface SlaWarningItem {
  id: string;
  mshv: string;
  hoTen: string;
  tenDt: string;
  chuyenNganh: string;
  soThangDaDaoTao: number;
  mucDoCanhBao: 'AnToan' | 'CanDayNhanh' | 'BaoDongDo';
  soBaiBaoIsiScopus: number;
  lanBaoCaoGanNhat: number;
  gvhd: string;
}

export interface OverviewStats {
  tongHocVien: number;
  tongNcsTienSi: number;
  tongThacSi: number;
  tongDeTai: number;
  deTaiChoDuyet: number;
  deTaiDangLam: number;
  deTaiDuDKBaoVe: number;
  deTaiDaBaoVe: number;
  tongBaiBaoIsiScopus: number;
  tongBaiBaoHdgsnn: number;
  tyLeDaBaoVe: number;
}

export interface PredictiveRiskItem {
  maHv: string;
  mshv: string;
  hoTen: string;
  tenDt: string;
  chuyenNganh: string;
  soThangThucTe: number;
  soThangBaoLuu: number;
  soThangConLaiToiDa: number;
  soBaiBaoIsiScopus: number;
  soBaoCaoTienDo: number;
  diemTbTienDo: number | null;
  diemRuiRo: number;
  mucDoRuiRo: 'AnToan' | 'NguyCoTrungBinh' | 'NguyCoCao';
  khuyenNghiHocVu: string;
}

export interface ProgressDefenseCorrelationData {
  heSoTuongQuan: number | null;
  doTinCay: string | null;
  phuongTrinhHoiQuy: string | null;
  heSoGoc: number | null;
  heSoChan: number | null;
  tongSoDeTaiMau: number;
  chuDuMau?: boolean;
  soMauHienCo?: number;
  soMauCanThiet?: number;
  thongBao?: string;
  duLieuDiem: Array<{
    maDt: string;
    tenDt: string;
    hoTen: string;
    chuyenNganh: string;
    diemTbTienDo: number;
    diemBaoVeHoiDong: number;
    duBaoDiemBaoVe: number | null;
  }>;
}

export interface PublicationProductivityStats {
  nangSuatBinhQuanMoiNcs: number;
  tyLeIsiScopus: number;
  tyLeTacGiaChinh: number;
  phanBoTheoChuyenNganh: Array<{
    chuyenNganh: string;
    soBaiBao: number;
    soIsiScopus: number;
    nangSuatNcs: number;
  }>;
  topGiangVienCongBo: Array<{
    maGv: string;
    hoTen: string;
    hocHamHocVi: string;
    soBaiBaoDongTacGia: number;
    soNcsDangHuongDan: number;
  }>;
  coDuLieuDongTacGia: boolean;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(DeTai)
    private readonly deTaiRepo: Repository<DeTai>,
    @InjectRepository(HocVien)
    private readonly hocVienRepo: Repository<HocVien>,
    @InjectRepository(GiangVien)
    private readonly giangVienRepo: Repository<GiangVien>,
    @InjectRepository(BaiBaoKhoaHoc)
    private readonly baiBaoRepo: Repository<BaiBaoKhoaHoc>,
    @InjectRepository(ChuyenNganh)
    private readonly chuyenNganhRepo: Repository<ChuyenNganh>,
    @InjectRepository(TienDo)
    private readonly tienDoRepo: Repository<TienDo>,
    @InjectRepository(HoiDong)
    private readonly hoiDongRepo: Repository<HoiDong>,
  ) {}

  async getOverview(): Promise<OverviewStats> {
    try {
      const [
        tongHocVien,
        tongNcsTienSi,
        tongThacSi,
        tongDeTai,
        deTaiChoDuyet,
        deTaiDangLam,
        deTaiDuDKBaoVe,
        deTaiDaBaoVe,
        tongBaiBaoIsiScopus,
        tongBaiBaoHdgsnn,
      ] = await Promise.all([
        this.hocVienRepo.count(),
        this.hocVienRepo.count({ where: { trinhDo: 'TienSi' as any } }),
        this.hocVienRepo.count({ where: { trinhDo: 'ThacSi' as any } }),
        this.deTaiRepo.count(),
        this.deTaiRepo.count({ where: { trangThai: 'ChoDuyet' as any } }),
        this.deTaiRepo
          .createQueryBuilder('dt')
          .where("dt.trangThai IN ('DaDuyet', 'DangThucHien')")
          .getCount(),
        this.deTaiRepo
          .createQueryBuilder('dt')
          .where("dt.trangThai IN ('DuDKBaoVe', 'DuDieuKienBaoVe')")
          .getCount(),
        this.deTaiRepo.count({ where: { trangThai: 'DaBaoVe' as any } }),
        this.baiBaoRepo
          .createQueryBuilder('bb')
          .where("bb.phanLoai IN ('ISI', 'Scopus')")
          .getCount(),
        this.baiBaoRepo.count({ where: { phanLoai: 'HDGSNN' as any } }),
      ]);

      return {
        tongHocVien,
        tongNcsTienSi,
        tongThacSi,
        tongDeTai,
        deTaiChoDuyet,
        deTaiDangLam,
        deTaiDuDKBaoVe,
        deTaiDaBaoVe,
        tongBaiBaoIsiScopus,
        tongBaiBaoHdgsnn,
        tyLeDaBaoVe: tongDeTai ? Number(((deTaiDaBaoVe / tongDeTai) * 100).toFixed(1)) : 0,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi khi truy vấn getOverview từ database: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Không thể lấy dữ liệu thống kê tổng quan từ cơ sở dữ liệu');
    }
  }

  async getSlaWarnings(maGv?: string): Promise<SlaWarningItem[]> {
    try {
      const topics = this.deTaiRepo
        .createQueryBuilder('dt')
        .innerJoinAndSelect('dt.hocVien', 'hv')
        .innerJoinAndSelect('hv.nguoiDung', 'ndHv')
        .leftJoinAndSelect('hv.chuyenNganh', 'cn')
        .innerJoinAndSelect('dt.giangVienHuongDan', 'gv')
        .innerJoinAndSelect('gv.nguoiDung', 'ndGv')
        .where("hv.trinhDo = 'TienSi'")
        .andWhere('hv.trangThai = :active', { active: TrangThaiHocVien.DangHoc })
        .andWhere("dt.trangThai NOT IN ('DaBaoVe', 'TuChoi')")
        .orderBy('hv.ngayNhapHoc', 'ASC');
      if (maGv) topics.andWhere('(dt.maGvhd = :maGv OR dt.maGvhd2 = :maGv)', { maGv });
      const deTais = await topics.getMany();

      if (!deTais || deTais.length === 0) {
        return [];
      }

      const warnings: SlaWarningItem[] = [];
      const now = new Date();

      for (const dt of deTais) {
        const hv = dt.hocVien;
        const nhapHoc = hv.ngayNhapHoc ? new Date(hv.ngayNhapHoc) : new Date(dt.ngayDangKy);
        const rawMonths = Math.max(
          1,
          Math.floor((now.getTime() - nhapHoc.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)),
        );

        const tongBaoLuu = Number(hv.tongSoThangBaoLuu) || 0;
        const effectiveMonths = Math.max(1, rawMonths - tongBaoLuu);

        let mucDoCanhBao: 'AnToan' | 'CanDayNhanh' | 'BaoDongDo' = 'AnToan';
        if (effectiveMonths >= 54) {
          mucDoCanhBao = 'BaoDongDo';
        } else if (effectiveMonths >= 36) {
          mucDoCanhBao = 'CanDayNhanh';
        }

        const soBaiBao = await this.baiBaoRepo
          .createQueryBuilder('bb')
          .where('bb.maHv = :maHv', { maHv: hv.maHv })
          .andWhere("bb.phanLoai IN ('ISI', 'Scopus')")
          .getCount();

        const latestReport = await this.tienDoRepo
          .createQueryBuilder('td')
          .where('td.maDt = :maDt', { maDt: dt.maDt })
          .orderBy('td.lanBaoCao', 'DESC')
          .getOne();

        warnings.push({
          id: dt.maDt,
          mshv: hv.mshv || 'NCS-ChuaCapMS',
          hoTen: hv.nguoiDung?.hoTen || 'Nghiên cứu sinh',
          tenDt: dt.tenDt,
          chuyenNganh: hv.chuyenNganh?.tenCn || 'Chưa phân chuyên ngành',
          soThangDaDaoTao: effectiveMonths,
          mucDoCanhBao,
          soBaiBaoIsiScopus: soBaiBao,
          lanBaoCaoGanNhat: latestReport?.lanBaoCao || 0,
          gvhd: `${dt.giangVienHuongDan?.hocHam || ''} ${dt.giangVienHuongDan?.hocVi || ''} ${dt.giangVienHuongDan?.nguoiDung?.hoTen || ''}`.trim(),
        });
      }

      return warnings;
    } catch (err: any) {
      this.logger.error(`Lỗi khi truy vấn getSlaWarnings từ database: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Không thể tính toán danh sách cảnh báo SLA đào tạo từ cơ sở dữ liệu');
    }
  }

  async getPredictiveRiskAnalysis(): Promise<PredictiveRiskItem[]> {
    try {
      const deTais = await this.deTaiRepo
        .createQueryBuilder('dt')
        .innerJoinAndSelect('dt.hocVien', 'hv')
        .innerJoinAndSelect('hv.nguoiDung', 'ndHv')
        .leftJoinAndSelect('hv.chuyenNganh', 'cn')
        .where("hv.trinhDo = 'TienSi'")
        .andWhere('hv.trangThai = :active', { active: TrangThaiHocVien.DangHoc })
        .andWhere("dt.trangThai NOT IN ('DaBaoVe', 'TuChoi')")
        .getMany();

      const now = new Date();
      const results: PredictiveRiskItem[] = [];

      const maHvList = deTais.map((dt) => dt.maHv);
      const maDtList = deTais.map((dt) => dt.maDt);

      const baiBaoMap = new Map<string, { soIsiScopus: number; tongSoBai: number }>();
      if (maHvList.length > 0) {
        const baiBaoRows = await this.baiBaoRepo
          .createQueryBuilder('bb')
          .select('bb.ma_hv', 'maHv')
          .addSelect(
            "COUNT(*) FILTER (WHERE bb.phan_loai IN ('ISI', 'Scopus'))",
            'soIsiScopus',
          )
          .addSelect('COUNT(*)', 'tongSoBai')
          .where('bb.ma_hv IN (:...ids)', { ids: maHvList })
          .groupBy('bb.ma_hv')
          .getRawMany<{ maHv: string; soIsiScopus: string; tongSoBai: string }>();
        baiBaoRows.forEach((r) =>
          baiBaoMap.set(r.maHv, {
            soIsiScopus: Number(r.soIsiScopus) || 0,
            tongSoBai: Number(r.tongSoBai) || 0,
          }),
        );
      }

      const tienDoMap = new Map<string, { soBaoCao: number; diemTb: number | null }>();
      if (maDtList.length > 0) {
        const tienDoRows = await this.tienDoRepo
          .createQueryBuilder('td')
          .select('td.ma_dt', 'maDt')
          .addSelect('COUNT(*)', 'soBaoCao')
          .addSelect('AVG(td.diem_so)', 'diemTb')
          .where('td.ma_dt IN (:...ids)', { ids: maDtList })
          .groupBy('td.ma_dt')
          .getRawMany<{ maDt: string; soBaoCao: string; diemTb: string | null }>();
        tienDoRows.forEach((r) =>
          tienDoMap.set(r.maDt, {
            soBaoCao: Number(r.soBaoCao) || 0,
            diemTb: r.diemTb == null ? null : Number(r.diemTb),
          }),
        );
      }

      for (const dt of deTais) {
        const hv = dt.hocVien;
        const nhapHoc = hv.ngayNhapHoc ? new Date(hv.ngayNhapHoc) : new Date(dt.ngayDangKy);
        const rawMonths = Math.max(
          1,
          Math.floor((now.getTime() - nhapHoc.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)),
        );
        const tongBaoLuu = Number(hv.tongSoThangBaoLuu) || 0;
        const effectiveMonths = Math.max(1, rawMonths - tongBaoLuu);
        const remainingMonths = Math.max(0, 72 - effectiveMonths);

        let timeRisk = (effectiveMonths / 72) * 40;
        if (effectiveMonths > 72) timeRisk = 40;

        const baiBaoAgg = baiBaoMap.get(hv.maHv);
        const isiScopusCount = baiBaoAgg?.soIsiScopus || 0;
        let paperRisk = 35;
        if (isiScopusCount >= 2) paperRisk = 0;
        else if (isiScopusCount === 1) paperRisk = 15;
        else if ((baiBaoAgg?.tongSoBai || 0) >= 2) paperRisk = 20;

        const tienDoAgg = tienDoMap.get(dt.maDt);
        const expectedReports = Math.min(10, Math.floor(effectiveMonths / 6));
        const actualReports = tienDoAgg?.soBaoCao || 0;
        const avgScore = tienDoAgg?.diemTb ?? null;

        let reportRisk = 0;
        if (actualReports < expectedReports) {
          reportRisk += ((expectedReports - actualReports) / Math.max(1, expectedReports)) * 20;
        }
        if (avgScore != null && avgScore < 7.5) {
          reportRisk += 5;
        }

        const totalRisk = Math.min(100, Math.round(timeRisk + paperRisk + reportRisk));

        let mucDoRuiRo: 'AnToan' | 'NguyCoTrungBinh' | 'NguyCoCao' = 'AnToan';
        let khuyenNghiHocVu = 'Tiến độ học thuật ổn định, duy trì kế hoạch nghiên cứu.';

        if (totalRisk >= 65) {
          mucDoRuiRo = 'NguyCoCao';
          khuyenNghiHocVu = 'CẢNH BÁO ĐỎ: Đối chiếu thời hạn hồ sơ, tiến độ và minh chứng công bố với người hướng dẫn.';
        } else if (totalRisk >= 40) {
          mucDoRuiRo = 'NguyCoTrungBinh';
          khuyenNghiHocVu = 'CẦN ĐẨY NHANH: Kiểm tra các kỳ báo cáo và tiêu chí công bố của chương trình.';
        }

        results.push({
          maHv: hv.maHv,
          mshv: hv.mshv || 'NCS',
          hoTen: hv.nguoiDung?.hoTen || 'Nghiên cứu sinh',
          tenDt: dt.tenDt,
          chuyenNganh: hv.chuyenNganh?.tenCn || 'Chuyên ngành Sau Đại học',
          soThangThucTe: effectiveMonths,
          soThangBaoLuu: tongBaoLuu,
          soThangConLaiToiDa: remainingMonths,
          soBaiBaoIsiScopus: isiScopusCount,
          soBaoCaoTienDo: actualReports,
          diemTbTienDo: avgScore == null ? null : Number(avgScore.toFixed(1)),
          diemRuiRo: totalRisk,
          mucDoRuiRo,
          khuyenNghiHocVu,
        });
      }

      results.sort((a, b) => b.diemRuiRo - a.diemRuiRo);
      return results;
    } catch (err: any) {
      this.logger.error(`Lỗi khi phân tích dự báo nguy cơ quá hạn: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Không thể thực hiện mô hình dự báo rủi ro học vụ');
    }
  }

  async getProgressDefenseCorrelation(): Promise<ProgressDefenseCorrelationData> {
    try {
      const rows = await this.hoiDongRepo
        .createQueryBuilder('hd')
        .innerJoin('hd.deTai', 'dt')
        .innerJoin('dt.hocVien', 'hv')
        .innerJoin('hv.nguoiDung', 'nd')
        .leftJoin('hv.chuyenNganh', 'cn')
        .select('hd.maDt', 'maDt')
        .addSelect('dt.tenDt', 'tenDt')
        .addSelect('nd.hoTen', 'hoTen')
        .addSelect('cn.tenCn', 'chuyenNganh')
        .addSelect('hd.diemTb', 'diemBaoVe')
        .addSelect((query) => query.select('AVG(td.diemSo)').from(TienDo, 'td')
          .where('td.maDt = hd.maDt')
          .andWhere("td.ngayBaoCao <= (hd.ngayBaoVe AT TIME ZONE 'Asia/Ho_Chi_Minh')::date"),
        'diemTienDo')
        .where('hd.capDanhGia = :cap', { cap: CapDanhGia.CapTruong })
        .andWhere("NULLIF(BTRIM(hd.ketQua), '') IS NOT NULL")
        .andWhere("hd.ketQua <> 'ChuaBaoVe'")
        .andWhere('hd.ngayBaoVe <= CURRENT_TIMESTAMP')
        .distinctOn(['hd.maDt'])
        .orderBy('hd.maDt', 'ASC')
        .addOrderBy('hd.lanBaoVe', 'DESC')
        .getRawMany<{
          maDt: string; tenDt: string; hoTen: string; chuyenNganh: string | null;
          diemTienDo: string | null; diemBaoVe: string | null;
        }>();
      const pairs = rows
        .filter((row) => row.diemTienDo != null && row.diemBaoVe != null)
        .map((row) => ({ ...row, x: Number(row.diemTienDo), y: Number(row.diemBaoVe) }));

      const MIN_SAMPLE_SIZE = 3;
      if (pairs.length < MIN_SAMPLE_SIZE) {
        return {
          heSoTuongQuan: null,
          doTinCay: null,
          phuongTrinhHoiQuy: null,
          heSoGoc: null,
          heSoChan: null,
          tongSoDeTaiMau: pairs.length,
          chuDuMau: true,
          soMauHienCo: pairs.length,
          soMauCanThiet: MIN_SAMPLE_SIZE,
          thongBao: `Chưa đủ dữ liệu để tính tương quan thống kê. Cần ít nhất ${MIN_SAMPLE_SIZE} đề tài đã hoàn thành bảo vệ Hội đồng và có điểm tiến độ. Hiện có: ${pairs.length} mẫu.`,
          duLieuDiem: [],
        };
      }

      const n = pairs.length;
      const sumX = pairs.reduce((s, p) => s + p.x, 0);
      const sumY = pairs.reduce((s, p) => s + p.y, 0);
      const meanX = sumX / n;
      const meanY = sumY / n;

      let num = 0;
      let denX = 0;
      let denY = 0;

      for (const p of pairs) {
        const dx = p.x - meanX;
        const dy = p.y - meanY;
        num += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }

      const r = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : null;
      const slope = r == null ? null : num / denX;
      const intercept = slope == null ? null : meanY - slope * meanX;

      const duLieuDiem = pairs.map((p) => ({
        maDt: p.maDt,
        tenDt: p.tenDt,
        hoTen: p.hoTen,
        chuyenNganh: p.chuyenNganh || 'Chưa phân chuyên ngành',
        diemTbTienDo: Number(p.x.toFixed(2)),
        diemBaoVeHoiDong: p.y,
        duBaoDiemBaoVe: slope == null || intercept == null ? null : Number((slope * p.x + intercept).toFixed(2)),
      }));

      const magnitude = Math.abs(r ?? 0);
      const strength = magnitude >= 0.7 ? 'mạnh' : magnitude >= 0.4 ? 'vừa' : 'yếu';
      const doTinCay = r == null
        ? 'Một dãy điểm không có biến thiên nên chưa xác định được hệ số tương quan.'
        : magnitude < 0.001 ? 'Hệ số tương quan tuyến tính gần 0 trên tập mẫu.'
          : `Tương quan ${r < 0 ? 'nghịch' : 'thuận'} ${strength} trên tập mẫu.`;

      return {
        heSoTuongQuan: r == null ? null : Number(r.toFixed(3)),
        doTinCay,
        phuongTrinhHoiQuy: slope == null || intercept == null ? null : `y = ${slope.toFixed(2)}x ${intercept < 0 ? '−' : '+'} ${Math.abs(intercept).toFixed(2)}`,
        heSoGoc: slope == null ? null : Number(slope.toFixed(3)),
        heSoChan: intercept == null ? null : Number(intercept.toFixed(3)),
        tongSoDeTaiMau: n,
        duLieuDiem,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi khi tính toán tương quan tiến độ - bảo vệ: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Không thể tính toán tương quan thống kê học vụ');
    }
  }

  async getPublicationProductivity(): Promise<PublicationProductivityStats> {
    try {
      const [papers, allHvs, allCns] = await Promise.all([
        this.baiBaoRepo.find(),
        this.hocVienRepo.find({ where: { trinhDo: 'TienSi' as any } }),
        this.chuyenNganhRepo.find(),
      ]);

      const ncsIds = new Set(allHvs.map((hv) => hv.maHv));
      const allPapers = papers.filter((paper) => ncsIds.has(paper.maHv));
      const totalPapers = allPapers.length;
      const nangSuatBinhQuanMoiNcs = ncsIds.size ? Number((totalPapers / ncsIds.size).toFixed(2)) : 0;

      const isiScopusCount = allPapers.filter((p) => p.phanLoai === 'ISI' || p.phanLoai === 'Scopus').length;
      const tyLeIsiScopus = totalPapers > 0 ? Number(((isiScopusCount / totalPapers) * 100).toFixed(1)) : 0;

      const mainAuthorCount = allPapers.filter((paper) =>
        /tác giả chính|thứ nhất|đứng tên đầu|tác giả liên hệ|first author|corresponding author/i.test(paper.vaiTroTacGia || ''),
      ).length;
      const tyLeTacGiaChinh = totalPapers > 0 ? Number(((mainAuthorCount / totalPapers) * 100).toFixed(1)) : 0;

      const phanBoTheoChuyenNganh = allCns.map((cn) => {
        const ncsInCn = allHvs.filter((h) => h.maChuyenNganh === cn.maCn);
        const learnersInMajor = new Set(ncsInCn.map((h) => h.maHv));
        const papersInCn = allPapers.filter((p) => learnersInMajor.has(p.maHv));
        const isiInCn = papersInCn.filter((p) => p.phanLoai === 'ISI' || p.phanLoai === 'Scopus').length;

        return {
          chuyenNganh: cn.tenCn,
          soBaiBao: papersInCn.length,
          soIsiScopus: isiInCn,
          nangSuatNcs: ncsInCn.length > 0 ? Number((papersInCn.length / ncsInCn.length).toFixed(1)) : 0,
        };
      }).sort((a, b) => b.soBaiBao - a.soBaiBao || a.chuyenNganh.localeCompare(b.chuyenNganh, 'vi'));

      return {
        nangSuatBinhQuanMoiNcs,
        tyLeIsiScopus,
        tyLeTacGiaChinh,
        phanBoTheoChuyenNganh,
        topGiangVienCongBo: [],
        coDuLieuDongTacGia: false,
      };
    } catch (err: any) {
      this.logger.error(`Lỗi khi tính toán năng suất công bố khoa học: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Không thể tính toán phân tích năng suất công bố');
    }
  }

  async getPublicationTrends() {
    try {
      const raw = await this.baiBaoRepo
        .createQueryBuilder('bb')
        .select("TO_CHAR(bb.ngayCongBo, 'YYYY')", 'nam')
        .addSelect("COUNT(CASE WHEN bb.phanLoai IN ('ISI', 'Scopus') THEN 1 END)", 'isiScopus')
        .addSelect("COUNT(CASE WHEN bb.phanLoai = 'HDGSNN' THEN 1 END)", 'hdgsnn')
        .addSelect("COUNT(CASE WHEN bb.phanLoai = 'TrongNuoc' THEN 1 END)", 'trongNuoc')
        .addSelect("COUNT(bb.maBb)", 'tongCong')
        .where("bb.ngayCongBo <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date")
        .groupBy("TO_CHAR(bb.ngayCongBo, 'YYYY')")
        .orderBy('nam', 'ASC')
        .getRawMany();

      return raw.map((r) => ({
        nam: r.nam || new Date().getFullYear().toString(),
        isiScopus: parseInt(r.isiScopus, 10) || 0,
        hdgsnn: parseInt(r.hdgsnn, 10) || 0,
        trongNuoc: parseInt(r.trongNuoc, 10) || 0,
        tongCong: parseInt(r.tongCong, 10) || 0,
      }));
    } catch (err: any) {
      this.logger.error(`Lỗi khi truy vấn getPublicationTrends từ database: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Không thể lấy thống kê xu hướng xuất bản từ cơ sở dữ liệu');
    }
  }

  async getMajorsDistribution() {
    try {
      const raw = await this.chuyenNganhRepo
        .createQueryBuilder('cn')
        .leftJoin('hoc_vien', 'hv', 'hv.ma_chuyen_nganh = cn.ma_cn')
        .leftJoin('de_tai', 'dt', 'dt.ma_hv = hv.ma_hv')
        .select('cn.ten_cn', 'tenCn')
        .addSelect('COUNT(dt.ma_dt)', 'soLuongDeTai')
        .groupBy('cn.ma_cn')
        .addGroupBy('cn.ten_cn')
        .orderBy('COUNT(dt.ma_dt)', 'DESC')
        .getRawMany();

      const total = raw.reduce((sum, r) => sum + (parseInt(r.soLuongDeTai, 10) || 0), 0);

      if (!raw || raw.length === 0) {
        return [];
      }

      return raw.map((r) => {
        const count = parseInt(r.soLuongDeTai, 10) || 0;
        return {
          tenCn: r.tenCn,
          soLuongDeTai: count,
          tyLe: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
        };
      });
    } catch (err: any) {
      this.logger.error(`Lỗi khi truy vấn getMajorsDistribution từ database: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Không thể lấy phân bổ chuyên ngành từ cơ sở dữ liệu');
    }
  }

  async getSupervisorWorkload() {
    try {
      const gvs = await this.giangVienRepo.find();
      if (!gvs || gvs.length === 0) {
        return [];
      }

      const gsList = gvs.filter(
        (g) =>
          (g.hocHam?.toLowerCase().includes('giáo sư') && !g.hocHam?.toLowerCase().includes('phó')) ||
          g.hocHam?.toLowerCase() === 'gs',
      );
      const pgsList = gvs.filter(
        (g) => g.hocHam?.toLowerCase().includes('phó giáo sư') || g.hocHam?.toLowerCase() === 'pgs',
      );
      const tsList = gvs.filter((g) => !gsList.includes(g) && !pgsList.includes(g));

      const calcAvg = (list: GiangVien[]) =>
        list.length > 0
          ? Number(
              (
                list.reduce((sum, g) => sum + (parseFloat(String(g.soNcsDangHd)) || 0), 0) /
                list.length
              ).toFixed(1),
            )
          : 0;

      const calcStatus = (avg: number, max: number) => {
        if (avg >= max) return 'QuaTai';
        if (avg >= max * 0.8) return 'CanhBao';
        return 'AnToan';
      };

      const avgGs = calcAvg(gsList);
      const avgPgs = calcAvg(pgsList);
      const avgTs = calcAvg(tsList);

      return [
        {
          hocHamVi: 'Giáo sư (GS)',
          dinhMucToiDa: 7,
          trungBinhDangHuongDan: avgGs,
          soLuongGv: gsList.length,
          trangThai: calcStatus(avgGs, 7),
        },
        {
          hocHamVi: 'Phó Giáo sư (PGS)',
          dinhMucToiDa: 5,
          trungBinhDangHuongDan: avgPgs,
          soLuongGv: pgsList.length,
          trangThai: calcStatus(avgPgs, 5),
        },
        {
          hocHamVi: 'Tiến sĩ (TS)',
          dinhMucToiDa: 3,
          trungBinhDangHuongDan: avgTs,
          soLuongGv: tsList.length,
          trangThai: calcStatus(avgTs, 3),
        },
      ];
    } catch (err: any) {
      this.logger.error(`Lỗi khi truy vấn getSupervisorWorkload từ database: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Không thể lấy thống kê định mức giảng viên từ cơ sở dữ liệu');
    }
  }

  async exportDashboardReport(): Promise<{
    exportedAt: string;
    overview: OverviewStats;
    slaWarnings: SlaWarningItem[];
    predictiveRisk: PredictiveRiskItem[];
    supervisorWorkload: Awaited<ReturnType<typeof this.getSupervisorWorkload>>;
    publicationTrends: Awaited<ReturnType<typeof this.getPublicationTrends>>;
    publicationProductivity: PublicationProductivityStats;
  }> {
    const [overview, slaWarnings, predictiveRisk, supervisorWorkload, publicationTrends, publicationProductivity] =
      await Promise.all([
        this.getOverview(),
        this.getSlaWarnings(),
        this.getPredictiveRiskAnalysis(),
        this.getSupervisorWorkload(),
        this.getPublicationTrends(),
        this.getPublicationProductivity(),
      ]);

    return {
      exportedAt: new Date().toISOString(),
      overview,
      slaWarnings,
      predictiveRisk,
      supervisorWorkload,
      publicationTrends,
      publicationProductivity,
    };
  }
}
