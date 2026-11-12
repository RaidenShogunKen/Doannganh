import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TrangThaiDeTai, TrangThaiHocVien, TrinhDo, VaiTro } from '../common/enums';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { DeTaiService } from './de-tai.service';
import { DeTai } from './entities/de-tai.entity';

describe('DeTaiService', () => {
  const admin = { maNd: 'admin', vaiTro: VaiTro.Admin };
  const manager = { findOne: jest.fn(), existsBy: jest.fn(), create: jest.fn((_type, row) => row), save: jest.fn((_type, row) => row) };
  const notifications = { notifyDeTaiStatusChange: jest.fn() };
  const repo = { findOne: jest.fn() };
  const readiness = { confirm: jest.fn() };
  const uploads = { requireOwnedFile: jest.fn() };
  const db = { transaction: (work: (m: typeof manager) => unknown) => work(manager) };
  const service = new DeTaiService(repo as any, db as unknown as DataSource, notifications as any, readiness as any, uploads as any);

  beforeEach(() => jest.resetAllMocks());

  it.each([
    ['Giáo sư', 'Tiến sĩ', 7],
    ['Phó Giáo sư', 'Tiến sĩ', 5],
    ['', 'Tiến sĩ khoa học', 5],
    ['', 'Tiến sĩ', 3],
  ])('tính định mức hướng dẫn %s %s', (hocHam, hocVi, quota) => {
    expect(service.getGiangVienMaxNcs({ hocHam, hocVi } as GiangVien)).toBe(quota);
  });

  it('chặn đăng ký với hai người hướng dẫn trùng nhau', async () => {
    await expect(service.create('student', { tenDt: 'Đề tài', maGvhd: 'gv', maGvhd2: 'gv' })).rejects.toThrow(BadRequestException);
  });

  it('tính 0,5 cho từng người đồng hướng dẫn và lưu đề cương', async () => {
    manager.findOne.mockResolvedValueOnce({ trinhDo: TrinhDo.TienSi, trangThai: TrangThaiHocVien.DangHoc })
      .mockResolvedValue({ hocVi: 'Tiến sĩ', soNcsDangHd: 2.5 });
    manager.existsBy.mockResolvedValue(false);
    manager.create.mockImplementation((_type, row) => row);
    manager.save.mockImplementation((_type, row) => row);
    const topic = await service.create('student', { tenDt: 'Đề tài', tenDtEn: 'Thesis', maGvhd: 'gv-1', maGvhd2: 'gv-2' });
    expect(topic).toMatchObject({ tenDtEn: 'Thesis', trangThai: TrangThaiDeTai.ChoDuyet });
  });

  it('chặn hướng dẫn độc lập khi số chỗ trống dưới 1', async () => {
    manager.findOne.mockResolvedValueOnce({ trinhDo: TrinhDo.TienSi, trangThai: TrangThaiHocVien.DangHoc })
      .mockResolvedValue({ hocVi: 'Tiến sĩ', soNcsDangHd: 2.5 });
    manager.existsBy.mockResolvedValue(false);
    await expect(service.create('student', { tenDt: 'Đề tài', maGvhd: 'gv-1' })).rejects.toThrow(/giới hạn tối đa/);
  });

  it.each([TrangThaiDeTai.DuDKBaoVe, TrangThaiDeTai.DaBaoVe])('chặn cập nhật tắt sang %s', async (trangThai) => {
    await expect(service.updateTrangThai('dt', { trangThai }, admin)).rejects.toThrow(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('từ chối giảng viên ngoài phạm vi hướng dẫn', async () => {
    repo.findOne.mockResolvedValue({ maGvhd: 'another' } as DeTai);
    await expect(service.findById('dt', { maNd: 'teacher', vaiTro: VaiTro.GiangVien })).rejects.toThrow(ForbiddenException);
  });
});
