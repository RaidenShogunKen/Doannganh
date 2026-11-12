import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TienDoService } from './tien-do.service';
import { TienDo } from './entities/tien-do.entity';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { TrangThaiDeTai, TrangThaiHocVien, VaiTro } from '../common/enums';
import { UploadService } from '../upload/upload.service';

describe('TienDoService — Báo cáo tiến độ định kỳ 6 tháng (Điều 10 TT 18)', () => {
  let service: TienDoService;
  let tdRepo: jest.Mocked<Repository<TienDo>>;
  let dtRepo: jest.Mocked<Repository<DeTai>>;
  const learner = jest.fn();

  const deTaiDangThucHien = {
    maDt: 'dt-1',
    maHv: 'hv-1',
    maGvhd: 'gv-1',
    maGvhd2: 'gv-2',
    trangThai: TrangThaiDeTai.DangThucHien,
  } as DeTai;

  const qbMax = (max: any) => {
    const qb: any = {};
    ['select', 'where'].forEach((m) => (qb[m] = jest.fn().mockReturnValue(qb)));
    qb.getRawOne = jest.fn().mockResolvedValue({ max });
    return qb;
  };

  beforeEach(async () => {
    learner.mockResolvedValue({ trangThai: TrangThaiHocVien.DangHoc });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TienDoService,
        {
          provide: getRepositoryToken(TienDo),
          useValue: {
            create: jest.fn((d) => d),
            save: jest.fn((d) => Promise.resolve({ maTd: 'td-1', ...d })),
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            update: jest.fn(),
            findOneByOrFail: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        { provide: getRepositoryToken(DeTai), useValue: { findOne: jest.fn() } },
        { provide: UploadService, useValue: { requireOwnedFile: jest.fn() } },
        { provide: DataSource, useValue: {
          transaction: (run) => run({
            findOne: (_entity, options) => dtRepo.findOne(options),
            findOneBy: learner,
            getRepository: () => tdRepo,
          }),
        } },
      ],
    }).compile();

    service = module.get(TienDoService);
    tdRepo = module.get(getRepositoryToken(TienDo));
    dtRepo = module.get(getRepositoryToken(DeTai));
  });

  describe('create', () => {
    it('chỉ chủ sở hữu đề tài được nộp báo cáo tiến độ', async () => {
      dtRepo.findOne.mockResolvedValue(deTaiDangThucHien);

      await expect(
        service.create('hv-khac', { maDt: 'dt-1', noiDung: 'Báo cáo' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('không cho nộp khi đề tài chưa được duyệt', async () => {
      dtRepo.findOne.mockResolvedValue({ ...deTaiDangThucHien, trangThai: TrangThaiDeTai.ChoDuyet } as DeTai);

      await expect(
        service.create('hv-1', { maDt: 'dt-1', noiDung: 'Báo cáo' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('không cho nộp báo cáo khi học viên đang bảo lưu', async () => {
      dtRepo.findOne.mockResolvedValue(deTaiDangThucHien);
      learner.mockResolvedValueOnce({ trangThai: TrangThaiHocVien.BaoLuu });
      await expect(service.create('hv-1', { maDt: 'dt-1', noiDung: 'Báo cáo' })).rejects.toThrow(BadRequestException);
    });

    it('tự đánh số lần báo cáo tiếp theo bằng MAX(lan_bao_cao) + 1', async () => {
      dtRepo.findOne.mockResolvedValue(deTaiDangThucHien);
      (tdRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMax('2'));

      const kq = await service.create('hv-1', { maDt: 'dt-1', noiDung: 'Kỳ 3' } as any);

      expect(kq.lanBaoCao).toBe(3);
    });

    it('báo cáo đầu tiên của đề tài được đánh số 1', async () => {
      dtRepo.findOne.mockResolvedValue(deTaiDangThucHien);
      (tdRepo.createQueryBuilder as jest.Mock).mockReturnValue(qbMax(null));

      const kq = await service.create('hv-1', { maDt: 'dt-1', noiDung: 'Kỳ 1' } as any);

      expect(kq.lanBaoCao).toBe(1);
    });

    it('báo lỗi khi đề tài không tồn tại', async () => {
      dtRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('hv-1', { maDt: 'khong-co', noiDung: 'x' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('nhanXet', () => {
    it('giảng viên ngoài nhóm hướng dẫn không được nhận xét', async () => {
      tdRepo.findOne.mockResolvedValue({ maTd: 'td-1', maDt: 'dt-1' } as TienDo);
      dtRepo.findOne.mockResolvedValue(deTaiDangThucHien);

      await expect(
        service.nhanXet('td-1', { nhanXetGvhd: 'Tốt', diemSo: 9 } as any, {
          vaiTro: VaiTro.GiangVien,
          maNd: 'gv-la',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('đồng hướng dẫn (GVHD 2) được phép nhận xét và cho điểm', async () => {
      tdRepo.findOne.mockResolvedValue({ maTd: 'td-1', maDt: 'dt-1' } as TienDo);
      dtRepo.findOne.mockResolvedValue(deTaiDangThucHien);
      tdRepo.findOneByOrFail.mockResolvedValue({ maTd: 'td-1', diemSo: 8.5, nhanXetGvhd: 'Đạt' } as TienDo);

      const kq = await service.nhanXet('td-1', { nhanXetGvhd: 'Đạt', diemSo: 8.5, danhGiaKq: 'Dat' } as any, {
        vaiTro: VaiTro.GiangVien,
        maNd: 'gv-2',
      });

      expect(kq.diemSo).toBe(8.5);
      expect(kq.nhanXetGvhd).toBe('Đạt');
      expect(tdRepo.update).toHaveBeenCalledWith({ maTd: 'td-1' }, { diemSo: 8.5, nhanXetGvhd: 'Đạt', danhGiaKq: 'Dat' });
    });

    it('khóa điểm tiến độ khi đã xác nhận điều kiện bảo vệ', async () => {
      tdRepo.findOne.mockResolvedValue({ maTd: 'td-1', maDt: 'dt-1' } as TienDo);
      dtRepo.findOne.mockResolvedValue({ ...deTaiDangThucHien, trangThai: TrangThaiDeTai.DuDKBaoVe });
      await expect(service.nhanXet('td-1', { nhanXetGvhd: 'Đổi điểm', diemSo: 4 },
        { vaiTro: VaiTro.Admin, maNd: 'admin' })).rejects.toThrow(BadRequestException);
      expect(tdRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('listByDeTai', () => {
    it('học viên không được xem tiến độ đề tài của người khác', async () => {
      dtRepo.findOne.mockResolvedValue(deTaiDangThucHien);

      await expect(
        service.listByDeTai('dt-1', { vaiTro: VaiTro.HocVien, maNd: 'hv-khac' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('quản trị viên xem được tiến độ của mọi đề tài', async () => {
      dtRepo.findOne.mockResolvedValue(deTaiDangThucHien);

      await expect(
        service.listByDeTai('dt-1', { vaiTro: VaiTro.Admin, maNd: 'admin-1' }),
      ).resolves.toEqual([]);
    });
  });
});
