import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { BaiBaoKhoaHoc } from '../bai-bao/entities/bai-bao-khoa-hoc.entity';
import { ChuyenNganh } from '../users/entities/chuyen-nganh.entity';
import { TienDo } from '../tien-do/entities/tien-do.entity';
import { HoiDong } from '../hoi-dong/entities/hoi-dong.entity';
import { TrangThaiDeTai, TrinhDo } from '../common/enums';

function mockQb(result: { many?: any[]; raw?: any[] }) {
  const qb: any = {};
  const chain = [
    'select',
    'addSelect',
    'from',
    'innerJoin',
    'leftJoin',
    'innerJoinAndSelect',
    'leftJoinAndSelect',
    'where',
    'andWhere',
    'groupBy',
    'addGroupBy',
    'addOrderBy',
    'distinctOn',
    'orderBy',
    'take',
  ];
  chain.forEach((m) => (qb[m] = jest.fn().mockReturnValue(qb)));
  qb.getMany = jest.fn().mockResolvedValue(result.many || []);
  qb.getRawMany = jest.fn().mockResolvedValue(result.raw || []);
  qb.getRawOne = jest.fn().mockResolvedValue((result.raw || [])[0] || {});
  qb.getCount = jest.fn().mockResolvedValue((result.many || []).length);
  return qb;
}

function ncs(maHv: string, maDt: string, soThang: number): any {
  const nhapHoc = new Date();
  nhapHoc.setMonth(nhapHoc.getMonth() - soThang);
  return {
    maDt,
    maHv,
    tenDt: `Đề tài ${maDt}`,
    trangThai: TrangThaiDeTai.DangThucHien,
    ngayDangKy: nhapHoc.toISOString().slice(0, 10),
    hocVien: {
      maHv,
      mshv: `NCS${maHv}`,
      trinhDo: TrinhDo.TienSi,
      ngayNhapHoc: nhapHoc.toISOString().slice(0, 10),
      tongSoThangBaoLuu: 0,
      nguoiDung: { hoTen: `NCS ${maHv}` },
      chuyenNganh: { tenCn: 'Khoa học Máy tính' },
    },
  };
}

describe('AnalyticsService — Mô hình dự báo rủi ro quá hạn 72 tháng (Điều 3 TT 18)', () => {
  let service: AnalyticsService;
  let deTaiRepo: any;
  let baiBaoRepo: any;
  let tienDoRepo: any;
  let hoiDongRepo: any;
  let hocVienRepo: any;
  let chuyenNganhRepo: any;

  const taoModule = async () => {
    const repo = () => ({ createQueryBuilder: jest.fn(), find: jest.fn(), count: jest.fn() });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(DeTai), useValue: repo() },
        { provide: getRepositoryToken(HocVien), useValue: repo() },
        { provide: getRepositoryToken(GiangVien), useValue: repo() },
        { provide: getRepositoryToken(BaiBaoKhoaHoc), useValue: repo() },
        { provide: getRepositoryToken(ChuyenNganh), useValue: repo() },
        { provide: getRepositoryToken(TienDo), useValue: repo() },
        { provide: getRepositoryToken(HoiDong), useValue: repo() },
      ],
    }).compile();

    service = module.get(AnalyticsService);
    deTaiRepo = module.get(getRepositoryToken(DeTai));
    baiBaoRepo = module.get(getRepositoryToken(BaiBaoKhoaHoc));
    tienDoRepo = module.get(getRepositoryToken(TienDo));
    hoiDongRepo = module.get(getRepositoryToken(HoiDong));
    hocVienRepo = module.get(getRepositoryToken(HocVien));
    chuyenNganhRepo = module.get(getRepositoryToken(ChuyenNganh));
  };

  beforeEach(taoModule);

  it('NCS mới nhập học, đã có 2 bài ISI/Scopus → mức An toàn', async () => {
    deTaiRepo.createQueryBuilder.mockReturnValue(mockQb({ many: [ncs('hv-1', 'dt-1', 6)] }));
    baiBaoRepo.createQueryBuilder.mockReturnValue(
      mockQb({ raw: [{ maHv: 'hv-1', soIsiScopus: '2', tongSoBai: '2' }] }),
    );
    tienDoRepo.createQueryBuilder.mockReturnValue(
      mockQb({ raw: [{ maDt: 'dt-1', soBaoCao: '1', diemTb: '9.0' }] }),
    );

    const [kq] = await service.getPredictiveRiskAnalysis();

    expect(kq.soBaiBaoIsiScopus).toBe(2);
    expect(kq.mucDoRuiRo).toBe('AnToan');
    expect(kq.diemRuiRo).toBeLessThan(40);
  });

  it('NCS 70/72 tháng, chưa có bài báo, thiếu báo cáo → Nguy cơ cao và còn 2 tháng', async () => {
    deTaiRepo.createQueryBuilder.mockReturnValue(mockQb({ many: [ncs('hv-2', 'dt-2', 70)] }));
    baiBaoRepo.createQueryBuilder.mockReturnValue(mockQb({ raw: [] }));
    tienDoRepo.createQueryBuilder.mockReturnValue(mockQb({ raw: [] }));

    const [kq] = await service.getPredictiveRiskAnalysis();

    expect(kq.mucDoRuiRo).toBe('NguyCoCao');
    expect(kq.diemRuiRo).toBeGreaterThanOrEqual(65);
    expect(kq.soThangConLaiToiDa).toBeLessThanOrEqual(3);
    expect(kq.khuyenNghiHocVu).toContain('CẢNH BÁO ĐỎ');
  });

  it('thời gian bảo lưu được trừ khỏi thời gian đào tạo thực tế (Điều 10 TT 18)', async () => {
    const dt = ncs('hv-3', 'dt-3', 40);
    dt.hocVien.tongSoThangBaoLuu = 12;
    deTaiRepo.createQueryBuilder.mockReturnValue(mockQb({ many: [dt] }));
    baiBaoRepo.createQueryBuilder.mockReturnValue(mockQb({ raw: [] }));
    tienDoRepo.createQueryBuilder.mockReturnValue(mockQb({ raw: [] }));

    const [kq] = await service.getPredictiveRiskAnalysis();

    expect(kq.soThangBaoLuu).toBe(12);
    expect(kq.soThangThucTe).toBeGreaterThanOrEqual(27);
    expect(kq.soThangThucTe).toBeLessThanOrEqual(29);
  });

  it('kết quả được sắp xếp giảm dần theo điểm rủi ro', async () => {
    deTaiRepo.createQueryBuilder.mockReturnValue(
      mockQb({ many: [ncs('hv-a', 'dt-a', 6), ncs('hv-b', 'dt-b', 68), ncs('hv-c', 'dt-c', 30)] }),
    );
    baiBaoRepo.createQueryBuilder.mockReturnValue(
      mockQb({ raw: [{ maHv: 'hv-a', soIsiScopus: '2', tongSoBai: '2' }] }),
    );
    tienDoRepo.createQueryBuilder.mockReturnValue(mockQb({ raw: [] }));

    const kq = await service.getPredictiveRiskAnalysis();

    expect(kq).toHaveLength(3);
    expect(kq[0].diemRuiRo).toBeGreaterThanOrEqual(kq[1].diemRuiRo);
    expect(kq[1].diemRuiRo).toBeGreaterThanOrEqual(kq[2].diemRuiRo);
  });

  it('KHÔNG phát sinh truy vấn theo từng NCS (chống N+1): 50 NCS vẫn chỉ 1 truy vấn bài báo + 1 truy vấn tiến độ', async () => {
    const danhSach = Array.from({ length: 50 }, (_, i) => ncs(`hv-${i}`, `dt-${i}`, 20 + i));
    deTaiRepo.createQueryBuilder.mockReturnValue(mockQb({ many: danhSach }));
    baiBaoRepo.createQueryBuilder.mockReturnValue(mockQb({ raw: [] }));
    tienDoRepo.createQueryBuilder.mockReturnValue(mockQb({ raw: [] }));

    const kq = await service.getPredictiveRiskAnalysis();

    expect(kq).toHaveLength(50);
    expect(baiBaoRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(tienDoRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(baiBaoRepo.find).not.toHaveBeenCalled();
    expect(tienDoRepo.find).not.toHaveBeenCalled();
  });

  it('danh sách rỗng thì không gọi truy vấn tổng hợp nào', async () => {
    deTaiRepo.createQueryBuilder.mockReturnValue(mockQb({ many: [] }));
    baiBaoRepo.createQueryBuilder.mockReturnValue(mockQb({ raw: [] }));
    tienDoRepo.createQueryBuilder.mockReturnValue(mockQb({ raw: [] }));

    const kq = await service.getPredictiveRiskAnalysis();

    expect(kq).toEqual([]);
    expect(baiBaoRepo.createQueryBuilder).not.toHaveBeenCalled();
    expect(tienDoRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('giữ điểm 0 và phân biệt báo cáo chưa chấm khi tính cảnh báo', async () => {
    deTaiRepo.createQueryBuilder.mockReturnValue(mockQb({ many: [ncs('hv-1', 'dt-1', 6), ncs('hv-2', 'dt-2', 6)] }));
    baiBaoRepo.createQueryBuilder.mockReturnValue(mockQb({ raw: [] }));
    const query = mockQb({ raw: [{ maDt: 'dt-1', soBaoCao: '1', diemTb: '0' }, { maDt: 'dt-2', soBaoCao: '1', diemTb: null }] });
    tienDoRepo.createQueryBuilder.mockReturnValue(query);
    const rows = await service.getPredictiveRiskAnalysis();
    expect(query.addSelect).toHaveBeenCalledWith('AVG(td.diem_so)', 'diemTb');
    expect(rows.find((row) => row.maHv === 'hv-1').diemTbTienDo).toBe(0);
    expect(rows.find((row) => row.maHv === 'hv-2').diemTbTienDo).toBeNull();
  });

  it('bỏ cặp thiếu điểm, tính cả 0 và mô tả đúng tương quan nghịch', async () => {
    const point = (maDt: string, diemTienDo: string | null, diemBaoVe: string) => ({
      maDt, tenDt: maDt, hoTen: maDt, chuyenNganh: null, diemTienDo, diemBaoVe,
    });
    const qb = mockQb({ raw: [point('1', '0', '10'), point('2', '5', '5'), point('3', '10', '0'), point('4', null, '8')] });
    hoiDongRepo.createQueryBuilder.mockReturnValue(qb);
    const result = await service.getProgressDefenseCorrelation();
    expect(qb.distinctOn).toHaveBeenCalledWith(['hd.maDt']);
    expect(result.tongSoDeTaiMau).toBe(3);
    expect(result.heSoTuongQuan).toBe(-1);
    expect(result.doTinCay).toContain('nghịch');
  });

  it('chỉ tính năng suất của NCS và để trống thống kê đồng tác giả', async () => {
    hocVienRepo.find.mockResolvedValue([{ maHv: 'ncs' }]);
    chuyenNganhRepo.find.mockResolvedValue([]);
    baiBaoRepo.find.mockResolvedValue([{ maHv: 'ncs', phanLoai: 'ISI' }, { maHv: 'cao-hoc', phanLoai: 'Scopus' }]);
    await expect(service.getPublicationProductivity()).resolves.toMatchObject({
      nangSuatBinhQuanMoiNcs: 1, topGiangVienCongBo: [], coDuLieuDongTacGia: false,
    });
  });
});
