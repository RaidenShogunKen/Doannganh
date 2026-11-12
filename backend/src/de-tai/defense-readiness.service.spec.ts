import { BadRequestException } from '@nestjs/common';
import { LoaiMinhChungBaoVe, TrangThaiDeTai, TrangThaiHocVien, TrangThaiMinhChung, TrinhDo, VaiTro } from '../common/enums';
import { DangKyMonHoc } from '../mon-hoc/entities/dangky-monhoc.entity';
import { MonHoc } from '../mon-hoc/entities/mon-hoc.entity';
import { TienDo } from '../tien-do/entities/tien-do.entity';
import { DefenseReadinessService } from './defense-readiness.service';
import { DeTai } from './entities/de-tai.entity';
import { MinhChungBaoVe } from './entities/minh-chung-bao-ve.entity';

describe('Xác nhận đủ điều kiện bảo vệ', () => {
  const student = { trinhDo: TrinhDo.TienSi, trangThai: TrangThaiHocVien.DangHoc, maChuyenNganh: 1, chuyenNganh: { soTinChiHocPhan: 3 },
    ngayNhapHoc: new Date().toISOString().slice(0, 10) };
  const topic = { maDt: 'dt', maHv: 'hv', maGvhd: 'gv', trangThai: TrangThaiDeTai.DaDuyet, hocVien: student };
  const allEvidence = Object.values(LoaiMinhChungBaoVe).map((loai) => ({
    loai, trangThai: TrangThaiMinhChung.DaDuyet, fileUrl: '/api/v1/upload/files/file.pdf', ghiChu: 'Kết quả đối chiếu',
  }));
  const evidence = { findBy: jest.fn() };
  const courses = { findBy: jest.fn() };
  const registrations = { find: jest.fn() };
  const manager = {
    update: jest.fn(),
    getRepository: (entity: Function) => {
      if (entity === MinhChungBaoVe) return evidence;
      if (entity === MonHoc) return courses;
      if (entity === DangKyMonHoc) return registrations;
      if (entity === TienDo) return { findBy: async () => [] };
      if (entity === DeTai) {
        const qb = { innerJoinAndSelect: () => qb, leftJoinAndSelect: () => qb, where: () => qb, setLock: () => qb, getOne: async () => topic };
        return { createQueryBuilder: () => qb };
      }
      throw new Error('Repository unexpected');
    },
  };
  const db = { manager, transaction: (work: (m: typeof manager) => unknown) => work(manager) };
  const service = new DefenseReadinessService(db as any, {} as any);
  const admin = { maNd: 'admin', vaiTro: VaiTro.Admin };

  beforeEach(() => {
    jest.clearAllMocks();
    courses.findBy.mockResolvedValue([{ maMh: 1, tenMh: 'Học phần bắt buộc' }]);
    registrations.find.mockResolvedValue([{ maMh: 1, diem: 8, monHoc: { maCn: 1, soTinChi: 3 } }]);
    evidence.findBy.mockResolvedValue(allEvidence);
  });

  it('chặn hồ sơ thiếu minh chứng và tín chỉ', async () => {
    registrations.find.mockResolvedValue([]);
    evidence.findBy.mockResolvedValue(allEvidence.filter((entry) => entry.loai !== LoaiMinhChungBaoVe.PhanBien));
    await expect(service.confirm('dt', admin)).rejects.toThrow(BadRequestException);
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('chỉ chuyển trạng thái khi đạt đầy đủ các tiêu chí', async () => {
    const result = await service.confirm('dt', admin);
    expect(result.trangThai).toBe(TrangThaiDeTai.DuDKBaoVe);
    expect(manager.update).toHaveBeenCalledWith(DeTai, { maDt: 'dt' }, expect.objectContaining({
      ngayXacNhanBaoVe: expect.any(Date),
    }));
  });

  it('ẩn tệp và ghi chú phản biện độc lập với học viên', async () => {
    const result = await service.getChecklist('dt', { maNd: 'hv', vaiTro: VaiTro.HocVien });
    const review = result.tieuChi.find((row) => row.id === LoaiMinhChungBaoVe.PhanBien);
    expect(review).toMatchObject({ dat: true, chiTiet: '', canSubmit: false, canReview: false });
    expect(review?.evidence?.fileUrl).toBeUndefined();
  });
});
