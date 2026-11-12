import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CapDanhGia, ChucDanhHoiDong, PhieuHoiDong, QuyCheBaoVe, TrangThaiDeTai, TrangThaiHocVien, TrinhDo, VaiTro } from '../common/enums';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { HoiDongService } from './hoi-dong.service';
import { HoiDong } from './entities/hoi-dong.entity';
import { ThanhVienHoiDong } from './entities/thanhvien-hoidong.entity';

describe('Hội đồng đánh giá', () => {
  const admin = { maNd: 'admin', vaiTro: VaiTro.Admin };
  const maHd = 'hd';
  const topic = { maDt: 'dt', maHv: 'hv', maGvhd: 'gvhd', hocVien: { trinhDo: TrinhDo.TienSi, trangThai: TrangThaiHocVien.DangHoc } };
  const roles = [ChucDanhHoiDong.ChuTich, ChucDanhHoiDong.ThuKy, ChucDanhHoiDong.PhanBien1, ChucDanhHoiDong.PhanBien2, ChucDanhHoiDong.UyVien];
  const members = roles.map((chucDanh, index) => ({
    maGv: 'gv-' + index, chucDanh, tongDiem: index === 0 ? 0 : 9, phieu: PhieuHoiDong.TanThanh,
  }));
  const council = { maHd, maDt: topic.maDt, deTai: topic, capDanhGia: CapDanhGia.CapTruong,
    quyChe: QuyCheBaoVe.ChuyenTiep2021, ngayBaoVe: new Date(2026, 0, 1), lanBaoVe: 1, thanhVien: members };
  const boardRepo = { findOne: jest.fn() };
  const qb = { innerJoinAndSelect: () => qb, where: () => qb, setLock: () => qb, getOne: jest.fn() };
  const manager = {
    getRepository: () => ({ createQueryBuilder: () => qb }),
    update: jest.fn(),
    findBy: jest.fn(),
    findOneBy: jest.fn(),
  };
  const db = { transaction: (work: (m: typeof manager) => unknown) => work(manager) };
  const uploads = { requireOwnedFile: jest.fn() };
  const service = new HoiDongService(boardRepo as any, db as any, {} as any, uploads as any);
  const minutes = { thanhVienCoMat: members.map(({ maGv }) => maGv), bienBanUrl: '/api/v1/upload/files/minutes.pdf' };

  beforeEach(() => {
    jest.clearAllMocks();
    qb.getOne.mockResolvedValue(council);
    boardRepo.findOne.mockResolvedValue({ ...council });
    manager.findBy.mockResolvedValue(members);
    manager.findOneBy.mockResolvedValue(null);
  });

  it('chặn giảng viên ngoài hội đồng và ngoài phạm vi hướng dẫn', async () => {
    await expect(service.findById(maHd, { maNd: 'unrelated', vaiTro: VaiTro.GiangVien })).rejects.toThrow(ForbiddenException);
  });

  it('chặn chốt kết quả khi có người chưa nộp phiếu', async () => {
    manager.findBy.mockResolvedValue([{ ...members[0], phieu: null }, ...members.slice(1)]);
    await expect(service.ghiNhanKetQua(maHd, minutes, admin)).rejects.toThrow(BadRequestException);
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('dùng phiếu thay điểm trung bình đối với Tiến sĩ và tính cả điểm 0', async () => {
    manager.findBy.mockResolvedValue(members.map((member, index) => ({
      ...member, phieu: index < 2 ? PhieuHoiDong.KhongTanThanh : PhieuHoiDong.TanThanh,
    })));
    await service.ghiNhanKetQua(maHd, minutes, admin);
    expect(manager.update).toHaveBeenCalledWith(HoiDong, maHd, expect.objectContaining({
      ketQua: 'Không thông qua', diemTb: 7.2,
    }));
    expect(manager.update).toHaveBeenCalledWith(DeTai, topic.maDt, { trangThai: TrangThaiDeTai.KhongDat });
  });

  it('chặn ghi lại kết quả đã chốt', async () => {
    qb.getOne.mockResolvedValue({ ...council, ketQua: 'Thông qua' });
    await expect(service.ghiNhanKetQua(maHd, minutes, admin)).rejects.toThrow(ConflictException);
  });

  it('không tiết lộ phiếu của thành viên khác', async () => {
    const member = { maNd: members[0].maGv, vaiTro: VaiTro.GiangVien };
    const result = await service.findById(maHd, member);
    expect(result.thanhVien[0].phieu).toBe(PhieuHoiDong.TanThanh);
    expect(result.thanhVien[1].phieu).toBeUndefined();
  });

  it('không chấp nhận điểm nộp từ người ngoài hội đồng', async () => {
    await expect(service.chamDiem(maHd, { maNd: 'other', vaiTro: VaiTro.GiangVien }, {
      diemTieuChi1: 2, diemTieuChi2: 3, diemTieuChi3: 3, diemTieuChi4: 2,
    })).rejects.toThrow(ForbiddenException);
  });
});
