import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MonHocService } from './mon-hoc.service';
import { MonHoc } from './entities/mon-hoc.entity';
import { DangKyMonHoc } from './entities/dangky-monhoc.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { NguoiDung } from '../users/entities/nguoi-dung.entity';
import { NotificationService } from '../notification/notification.service';
import { TrangThaiDangKy, TrangThaiHocVien, TrinhDo, VaiTro } from '../common/enums';

describe('MonHocService — Đăng ký học phần, hạn mức tín chỉ & GPA (TT 23/2021)', () => {
  let service: MonHocService;
  let mhRepo: jest.Mocked<Repository<MonHoc>>;
  let dkRepo: jest.Mocked<Repository<DangKyMonHoc>>;
  let hvRepo: jest.Mocked<Repository<HocVien>>;
  let notification: { create: jest.Mock; broadcast: jest.Mock };

  const admin = { maNd: 'admin', vaiTro: VaiTro.Admin };

  const hocVienDangHoc = {
    maHv: 'hv-1',
    mshv: 'NCS2026001',
    trinhDo: TrinhDo.TienSi,
    trangThai: TrangThaiHocVien.DangHoc,
  } as HocVien;

  beforeEach(async () => {
    notification = { create: jest.fn(), broadcast: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonHocService,
        {
          provide: getRepositoryToken(MonHoc),
          useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(DangKyMonHoc),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((dk) => Promise.resolve({ maDk: 'dk-1', ...dk })),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        { provide: getRepositoryToken(HocVien), useValue: { findOne: jest.fn(), find: jest.fn() } },
        { provide: getRepositoryToken(NguoiDung), useValue: { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() } },
        { provide: NotificationService, useValue: notification },
        { provide: DataSource, useValue: { getRepository: () => ({ existsBy: async () => false }) } },
      ],
    }).compile();

    service = module.get(MonHocService);
    mhRepo = module.get(getRepositoryToken(MonHoc));
    dkRepo = module.get(getRepositoryToken(DangKyMonHoc));
    hvRepo = module.get(getRepositoryToken(HocVien));
  });

  describe('dangKyHocPhan', () => {
    it('từ chối đăng ký khi học viên đang bảo lưu (Điều 10 TT 18)', async () => {
      hvRepo.findOne.mockResolvedValue({ ...hocVienDangHoc, trangThai: TrangThaiHocVien.BaoLuu } as HocVien);

      await expect(
        service.dangKyHocPhan('hv-1', { maMh: 1, hocKyNamHoc: 'HK1-2026' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối khi học viên chưa hoàn thiện hồ sơ học vụ', async () => {
      hvRepo.findOne.mockResolvedValue(null);

      await expect(
        service.dangKyHocPhan('hv-999', { maMh: 1, hocKyNamHoc: 'HK1-2026' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('từ chối đăng ký trùng học phần trong cùng học kỳ', async () => {
      hvRepo.findOne.mockResolvedValue(hocVienDangHoc);
      mhRepo.findOne.mockResolvedValue({ maMh: 1, tenMh: 'Triết học', soTinChi: 3 } as MonHoc);
      dkRepo.findOne.mockResolvedValue({ maMh: 1, trangThai: TrangThaiDangKy.DaDangKy } as DangKyMonHoc);

      await expect(
        service.dangKyHocPhan('hv-1', { maMh: 1, hocKyNamHoc: 'HK1-2026' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('chặn vượt hạn mức 12 tín chỉ mỗi học kỳ', async () => {
      hvRepo.findOne.mockResolvedValue(hocVienDangHoc);
      mhRepo.findOne.mockResolvedValue({ maMh: 5, tenMh: 'Học phần mới', soTinChi: 4 } as MonHoc);
      dkRepo.findOne.mockResolvedValue(null);
      dkRepo.find.mockResolvedValue([
        { maMh: 1, trangThai: TrangThaiDangKy.DaDangKy, monHoc: { soTinChi: 5 } },
        { maMh: 2, trangThai: TrangThaiDangKy.DaDangKy, monHoc: { soTinChi: 4 } },
      ] as any);

      await expect(
        service.dangKyHocPhan('hv-1', { maMh: 5, hocKyNamHoc: 'HK1-2026' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('đăng ký thành công và phát thông báo tới Phòng Đào tạo', async () => {
      hvRepo.findOne.mockResolvedValue(hocVienDangHoc);
      mhRepo.findOne.mockResolvedValue({ maMh: 5, tenMh: 'Phương pháp NCKH', soTinChi: 3 } as MonHoc);
      dkRepo.findOne.mockResolvedValue(null);
      dkRepo.find.mockResolvedValue([]);

      const kq = await service.dangKyHocPhan('hv-1', { maMh: 5, hocKyNamHoc: 'HK1-2026' } as any);

      expect(kq.trangThai).toBe(TrangThaiDangKy.DaDangKy);
      expect(dkRepo.save).toHaveBeenCalled();
      expect(notification.broadcast).toHaveBeenCalled();
    });
  });

  describe('capNhatDiem', () => {
    it('từ chối điểm ngoài thang 0.0 – 10.0', async () => {
      dkRepo.findOne.mockResolvedValue({ maHv: 'hv-1', maMh: 1 } as DangKyMonHoc);

      await expect(
        service.capNhatDiem({ maHv: 'hv-1', maMh: 1, hocKyNamHoc: 'HK1-2026', diem: 12 } as any, admin),
      ).rejects.toThrow(BadRequestException);
    });

    it('điểm >= 5.0 chuyển trạng thái sang DaHoanThanh và thông báo cho học viên', async () => {
      dkRepo.findOne.mockResolvedValue({ maHv: 'hv-1', maMh: 1 } as DangKyMonHoc);
      mhRepo.findOne.mockResolvedValue({ maMh: 1, tenMh: 'Triết học' } as MonHoc);

      const kq = await service.capNhatDiem({
        maHv: 'hv-1',
        maMh: 1,
        hocKyNamHoc: 'HK1-2026',
        diem: 8.75,
      } as any, admin);

      expect(kq.diem).toBe(8.75);
      expect(kq.trangThai).toBe(TrangThaiDangKy.DaHoanThanh);
      expect(notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ maNdNhan: 'hv-1' }),
      );
    });

    it('điểm dưới 5.0 giữ nguyên trạng thái DaDangKy (chưa đạt)', async () => {
      dkRepo.findOne.mockResolvedValue({ maHv: 'hv-1', maMh: 1 } as DangKyMonHoc);
      mhRepo.findOne.mockResolvedValue({ maMh: 1, tenMh: 'Triết học' } as MonHoc);

      const kq = await service.capNhatDiem({
        maHv: 'hv-1',
        maMh: 1,
        hocKyNamHoc: 'HK1-2026',
        diem: 4.5,
      } as any, admin);

      expect(kq.trangThai).toBe(TrangThaiDangKy.DaDangKy);
    });
  });

  describe('huyDangKy', () => {
    it('không cho hủy học phần đã có điểm', async () => {
      dkRepo.findOne.mockResolvedValue({ maHv: 'hv-1', maMh: 1, diem: 8 } as DangKyMonHoc);

      await expect(service.huyDangKy('hv-1', 1, 'HK1-2026')).rejects.toThrow(BadRequestException);
    });
  });

  describe('tinhGpaHocVien', () => {
    it('tính GPA thang 10 và thang 4 có trọng số theo tín chỉ', async () => {
      hvRepo.findOne.mockResolvedValue({
        ...hocVienDangHoc,
        nguoiDung: { hoTen: 'Nguyễn Văn A' },
      } as any);
      dkRepo.find.mockResolvedValue([
        { maMh: 1, trangThai: TrangThaiDangKy.DaHoanThanh, diem: 9.0, monHoc: { tenMh: 'A', soTinChi: 3 } },
        { maMh: 2, trangThai: TrangThaiDangKy.DaHoanThanh, diem: 7.0, monHoc: { tenMh: 'B', soTinChi: 2 } },
      ] as any);

      const kq = await service.tinhGpaHocVien('hv-1');

      expect(kq.gpa10).toBeCloseTo(8.2, 1);
      expect(kq.gpa4).toBeCloseTo(3.6, 1);
      expect(kq.tongTinChiTichLuy).toBe(5);
    });

    it('trả về GPA 0 khi học viên chưa có học phần hoàn thành', async () => {
      hvRepo.findOne.mockResolvedValue({ ...hocVienDangHoc, nguoiDung: { hoTen: 'A' } } as any);
      dkRepo.find.mockResolvedValue([]);

      const kq = await service.tinhGpaHocVien('hv-1');

      expect(kq.gpa10).toBe(0);
      expect(kq.xepLoai).toBe('Chưa có điểm');
    });
  });
});
