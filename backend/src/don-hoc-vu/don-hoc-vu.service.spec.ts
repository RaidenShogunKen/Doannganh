import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { DonHocVuService } from './don-hoc-vu.service';
import { DonHocVu } from './entities/don-hoc-vu.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { UploadService } from '../upload/upload.service';
import { LoaiDonHocVu, TrangThaiDeTai, TrangThaiDonHocVu, TrangThaiHocVien, VaiTro } from '../common/enums';

describe('DonHocVuService - State Machine & Quy Chế TT 18/2021', () => {
  let service: DonHocVuService;
  let donRepo: jest.Mocked<Repository<DonHocVu>>;
  let hvRepo: jest.Mocked<Repository<HocVien>>;
  let dtRepo: jest.Mocked<Repository<DeTai>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonHocVuService,
        { provide: UploadService, useValue: { requireOwnedFile: jest.fn() } },
        {
          provide: getRepositoryToken(DonHocVu),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((don) => Promise.resolve({ maDon: 'don-1', ...don })),
            findOne: jest.fn(),
            existsBy: jest.fn().mockResolvedValue(false),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(HocVien),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DeTai),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
            transaction: (run) => run({
              findOne: (entity, options) => (entity === HocVien ? hvRepo : dtRepo).findOne(options),
              getRepository: () => donRepo,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DonHocVuService>(DonHocVuService);
    donRepo = module.get(getRepositoryToken(DonHocVu));
    hvRepo = module.get(getRepositoryToken(HocVien));
    dtRepo = module.get(getRepositoryToken(DeTai));
    dataSource = module.get(DataSource);
  });

  describe('Nộp đơn bảo lưu với hạn mức 12 tháng của hệ thống', () => {
    it('phải chặn nộp đơn bảo lưu nếu tổng thời gian bảo lưu vượt quá 12 tháng', async () => {
      hvRepo.findOne.mockResolvedValueOnce({
        maHv: 'hv-1',
        tongSoThangBaoLuu: 8,
        trangThai: TrangThaiHocVien.DangHoc,
      } as any);

      await expect(
        service.create('hv-1', {
          loaiDon: LoaiDonHocVu.BaoLuu,
          soThang: 6,
          lyDo: 'Lý do sức khỏe',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('phải tạo đơn bảo lưu thành công nếu tổng thời gian bảo lưu <= 12 tháng', async () => {
      hvRepo.findOne.mockResolvedValueOnce({
        maHv: 'hv-1',
        tongSoThangBaoLuu: 6,
        trangThai: TrangThaiHocVien.DangHoc,
      } as any);
      dtRepo.findOne.mockResolvedValueOnce({ maDt: 'dt-1' } as any);

      const result = await service.create('hv-1', {
        loaiDon: LoaiDonHocVu.BaoLuu,
        soThang: 6,
        lyDo: 'Thực tập nghiên cứu nước ngoài',
      });

      expect(result).toBeDefined();
      expect(result.loaiDon).toBe(LoaiDonHocVu.BaoLuu);
      expect(result.trangThai).toBe(TrangThaiDonHocVu.ChoDuyetGvhd);
    });
  });

  describe('Nộp đơn Gia hạn & Quy định Điều 3 TT 18/2021 (Tối đa 72 tháng)', () => {
    it('phải chặn gia hạn nếu tổng thời gian đào tạo + gia hạn vượt quá 72 tháng (6 năm)', async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 5);

      hvRepo.findOne.mockResolvedValueOnce({
        maHv: 'hv-2',
        ngayNhapHoc: oldDate.toISOString().split('T')[0],
        trangThai: TrangThaiHocVien.DangHoc,
        trinhDo: 'TienSi',
      } as any);

      dtRepo.findOne.mockResolvedValueOnce({
        maDt: 'dt-2',
        trangThai: TrangThaiDeTai.DaDuyet,
        tongSoThangGiaHan: 8,
      } as any);

      await expect(
        service.create('hv-2', {
          loaiDon: LoaiDonHocVu.GiaHan,
          soThang: 13,
          lyDo: 'Cần thêm thời gian hoàn thiện bài báo ISI',
        }),
      ).rejects.toThrow('vượt mốc đào tạo 72 tháng');
    });
  });

  describe('Phê duyệt đơn Bảo lưu & Chuyển đổi State Machine', () => {
    it('Admin duyệt bảo lưu cập nhật thời gian nghỉ theo quyết định', async () => {
      const mockDon: any = {
        maDon: 'don-1',
        maHv: 'hv-1',
        maDt: 'dt-1',
        loaiDon: LoaiDonHocVu.BaoLuu,
        soThang: 6,
        trangThai: TrangThaiDonHocVu.ChoDuyetAdmin,
      };

      const mockHv: any = {
        maHv: 'hv-1',
        trangThai: TrangThaiHocVien.DangHoc,
        tongSoThangBaoLuu: 0,
      };

      const mockDt: any = {
        maDt: 'dt-1',
        ngayDuKienBaoVe: '2026-12-30',
        hanNopLuanAn: '2026-10-31',
      };

      mockQueryRunner.manager.findOne.mockImplementation((entity, opts: any) => {
        if (entity === DonHocVu) return Promise.resolve(mockDon);
        if (entity === HocVien) return Promise.resolve(mockHv);
        if (entity === DeTai) return Promise.resolve(mockDt);
        return Promise.resolve(null);
      });

      jest.spyOn(service, 'findById').mockResolvedValueOnce({
        ...mockDon,
        trangThai: TrangThaiDonHocVu.DaDuyet,
      } as any);

      const result = await service.adminDuyet(
        'don-1',
        { maNd: 'admin-1', hoTen: 'Admin Trưởng Phòng', vaiTro: VaiTro.Admin },
        { quyetDinhSo: 'QĐ-SĐH-2026/01' },
      );

      expect(mockHv.trangThai).toBe(TrangThaiHocVien.BaoLuu);
      expect(mockHv.tongSoThangBaoLuu).toBe(6);
      expect(mockHv.ngayKetThucBaoLuu).toBeDefined();
      expect(mockDt.hanNopLuanAn).toBe('2026-10-31');
      expect(mockDt.ngayDuKienBaoVe).toBe('2026-12-30');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('từ chối phê duyệt gia hạn khi hạn mới đã vượt mốc tại thời điểm duyệt', async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 5);
      const existingDeadline = new Date();
      existingDeadline.setMonth(existingDeadline.getMonth() + 11);
      const don = {
        maDon: 'don-2', maHv: 'hv-2', maDt: 'dt-2', loaiDon: LoaiDonHocVu.GiaHan,
        soThang: 3, trangThai: TrangThaiDonHocVu.ChoDuyetAdmin,
      };
      mockQueryRunner.manager.findOne.mockImplementation((entity) => {
        if (entity === DonHocVu) return Promise.resolve(don);
        if (entity === HocVien) return Promise.resolve({
          trangThai: TrangThaiHocVien.DangHoc, trinhDo: 'TienSi', ngayNhapHoc: oldDate.toISOString().slice(0, 10),
        });
        return Promise.resolve({ trangThai: TrangThaiDeTai.DaDuyet, hanNopLuanAn: existingDeadline.toISOString().slice(0, 10) });
      });
      await expect(service.adminDuyet('don-2', { maNd: 'admin', vaiTro: VaiTro.Admin },
        { quyetDinhSo: 'KT-02' })).rejects.toThrow('vượt mốc đào tạo 72 tháng');
      expect(mockQueryRunner.manager.save).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
