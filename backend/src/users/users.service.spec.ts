import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { NguoiDung } from './entities/nguoi-dung.entity';
import { HocVien } from './entities/hoc-vien.entity';
import { GiangVien } from './entities/giang-vien.entity';
import { NhatKyThaoTac } from './entities/nhat-ky-thao-tac.entity';
import { KetQuaThaoTac, TrangThaiHocVien, TrangThaiTaiKhoan, TrinhDo, VaiTro } from '../common/enums';

describe('UsersService — Quản trị tài khoản, định mức Điều 13 & Nhật ký thao tác', () => {
  let service: UsersService;
  let ndRepo: jest.Mocked<Repository<NguoiDung>>;
  let gvRepo: jest.Mocked<Repository<GiangVien>>;
  let nhatKyRepo: jest.Mocked<Repository<NhatKyThaoTac>>;
  let dataSource: any;

  const admin = { maNd: 'admin-1', hoTen: 'Quản trị viên', vaiTro: VaiTro.Admin, ip: '192.168.1.10' };

  function mockQb(raw: any[]) {
    const qb: any = {};
    ['select', 'addSelect', 'from', 'innerJoin', 'leftJoin', 'where', 'groupBy', 'addGroupBy'].forEach(
      (m) => (qb[m] = jest.fn().mockReturnValue(qb)),
    );
    qb.getRawMany = jest.fn().mockResolvedValue(raw);
    return qb;
  }

  beforeEach(async () => {
    dataSource = {
      createQueryBuilder: jest.fn(() => mockQb([])),
      transaction: jest.fn(async (cb: any) =>
        cb({
          create: (_e: any, d: any) => d,
          save: (a: any, b?: any) => Promise.resolve({ maNd: 'nd-moi', ...(b ?? a) }),
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(NguoiDung),
          useValue: { find: jest.fn().mockResolvedValue([]), findOne: jest.fn(), save: jest.fn((u) => Promise.resolve(u)), create: jest.fn((d) => d) },
        },
        { provide: getRepositoryToken(HocVien), useValue: { save: jest.fn((d) => Promise.resolve(d)) } },
        { provide: getRepositoryToken(GiangVien), useValue: { find: jest.fn().mockResolvedValue([]), save: jest.fn((d) => Promise.resolve(d)) } },
        {
          provide: getRepositoryToken(NhatKyThaoTac),
          useValue: {
            create: jest.fn((d) => d),
            save: jest.fn((d) => Promise.resolve({ maLog: 'log-1', ...d })),
            find: jest.fn().mockResolvedValue([]),
          },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(UsersService);
    ndRepo = module.get(getRepositoryToken(NguoiDung));
    gvRepo = module.get(getRepositoryToken(GiangVien));
    nhatKyRepo = module.get(getRepositoryToken(NhatKyThaoTac));
  });

  describe('Định mức hướng dẫn — Điều 13 Thông tư 18/2021', () => {
    it('Giáo sư được hướng dẫn tối đa 07 NCS', () => {
      expect(UsersService.tinhHanMucHuongDan('Giáo sư', 'Tiến sĩ')).toBe(7);
    });

    it('Phó Giáo sư được hướng dẫn tối đa 05 NCS', () => {
      expect(UsersService.tinhHanMucHuongDan('Phó Giáo sư', 'Tiến sĩ')).toBe(5);
    });

    it('Tiến sĩ không có học hàm chỉ được hướng dẫn 03 NCS', () => {
      expect(UsersService.tinhHanMucHuongDan('', 'Tiến sĩ')).toBe(3);
    });

    it('Tiến sĩ khoa học được nâng lên 05 NCS', () => {
      expect(UsersService.tinhHanMucHuongDan(undefined, 'Tiến sĩ khoa học')).toBe(5);
    });
  });

  describe('createUser', () => {
    it('từ chối email đã tồn tại', async () => {
      ndRepo.findOne.mockResolvedValue({ maNd: 'nd-1', email: 'a@test.vn' } as NguoiDung);

      await expect(
        service.createUser({ hoTen: 'A', email: 'a@test.vn', vaiTro: VaiTro.HocVien, mshv: 'NCS1' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('bắt buộc MSHV khi tạo tài khoản học viên', async () => {
      ndRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createUser({ hoTen: 'A', email: 'moi@test.vn', vaiTro: VaiTro.HocVien } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('băm mật khẩu bằng bcrypt và ghi nhật ký thao tác', async () => {
      ndRepo.findOne.mockResolvedValue(null);
      let hashDaLuu = '';
      dataSource.transaction = jest.fn(async (cb: any) =>
        cb({
          create: (_e: any, d: any) => d,
          save: (a: any, b?: any) => {
            const d = b ?? a;
            if (d?.matKhauHash) hashDaLuu = d.matKhauHash;
            return Promise.resolve({ maNd: 'nd-moi', ...d });
          },
        }),
      );

      const kq = await service.createUser(
        { hoTen: 'NCS Mới', email: 'moi@test.vn', vaiTro: VaiTro.HocVien, mshv: 'NCS2026999', trinhDo: TrinhDo.TienSi } as any,
        admin,
      );

      expect(kq.email).toBe('moi@test.vn');
      expect(hashDaLuu).not.toBe('password123');
      expect(kq.matKhauKhoiTao).toMatch(/^[a-zA-Z0-9_-]{24}$/);
      expect(await bcrypt.compare(kq.matKhauKhoiTao!, hashDaLuu)).toBe(true);
      expect(await bcrypt.compare('password123', hashDaLuu)).toBe(false);
      expect(nhatKyRepo.save).toHaveBeenCalled();
    });
  });

  describe('toggleTrangThai', () => {
    it('khóa tài khoản đang hoạt động và ghi log mức Warning', async () => {
      ndRepo.findOne.mockResolvedValue({
        maNd: 'nd-2',
        hoTen: 'NCS B',
        email: 'b@test.vn',
        trangThai: TrangThaiTaiKhoan.Active,
      } as NguoiDung);
      jest.spyOn(service, 'findOneExtended').mockResolvedValue({ maNd: 'nd-2' } as any);

      await service.toggleTrangThai('nd-2', admin);

      expect(ndRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ trangThai: TrangThaiTaiKhoan.Locked }),
      );
      expect(nhatKyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ketQua: KetQuaThaoTac.Warning }),
      );
    });

    it('mở khóa tài khoản đang bị khóa', async () => {
      ndRepo.findOne.mockResolvedValue({
        maNd: 'nd-3',
        hoTen: 'NCS C',
        email: 'c@test.vn',
        trangThai: TrangThaiTaiKhoan.Locked,
      } as NguoiDung);
      jest.spyOn(service, 'findOneExtended').mockResolvedValue({ maNd: 'nd-3' } as any);

      await service.toggleTrangThai('nd-3', admin);

      expect(ndRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ trangThai: TrangThaiTaiKhoan.Active }),
      );
    });

    it('không cho quản trị viên tự khóa chính mình', async () => {
      ndRepo.findOne.mockResolvedValue({
        maNd: 'admin-1',
        hoTen: 'Quản trị viên',
        email: 'admin@test.vn',
        trangThai: TrangThaiTaiKhoan.Active,
      } as NguoiDung);

      await expect(service.toggleTrangThai('admin-1', admin)).rejects.toThrow(BadRequestException);
    });

    it('báo lỗi khi không tìm thấy tài khoản', async () => {
      ndRepo.findOne.mockResolvedValue(null);
      await expect(service.toggleTrangThai('khong-ton-tai', admin)).rejects.toThrow(NotFoundException);
    });
  });

  describe('importUsers', () => {
    it('bỏ qua dòng lỗi và báo cáo chi tiết từng dòng', async () => {
      jest
        .spyOn(service, 'createUser')
        .mockResolvedValueOnce({ maNd: 'ok-1' } as any)
        .mockRejectedValueOnce(new ConflictException('Email đã tồn tại'))
        .mockResolvedValueOnce({ maNd: 'ok-2' } as any);

      const kq = await service.importUsers(
        [
          { hoTen: 'A', email: 'a@test.vn', vaiTro: VaiTro.GiangVien } as any,
          { hoTen: 'B', email: 'trung@test.vn', vaiTro: VaiTro.GiangVien } as any,
          { hoTen: 'C', email: 'c@test.vn', vaiTro: VaiTro.GiangVien } as any,
        ],
        admin,
      );

      expect(kq.thanhCong).toBe(2);
      expect(kq.thatBai).toBe(1);
      expect(kq.loi[0]).toMatchObject({ dong: 2, email: 'trung@test.vn' });
    });
  });

  describe('findAllExtended', () => {
    it('học viên đã tốt nghiệp hiển thị trạng thái Graduated', async () => {
      (ndRepo.find as jest.Mock).mockResolvedValue([
        {
          maNd: 'hv-1',
          hoTen: 'NCS Tốt nghiệp',
          email: 'tn@test.vn',
          vaiTro: VaiTro.HocVien,
          trangThai: TrangThaiTaiKhoan.Active,
          ngayTao: new Date('2021-10-15'),
          hocVien: { maHv: 'hv-1', mshv: 'NCS2021008', trangThai: TrangThaiHocVien.TotNghiep, trinhDo: TrinhDo.TienSi },
        },
      ]);

      const kq = await service.findAllExtended();

      expect(kq[0].trangThai).toBe(TrangThaiTaiKhoan.Graduated);
      expect(kq[0].ngayTao).toBe('2021-10-15');
    });

    it('gắn tải hướng dẫn và hạn mức cho giảng viên bằng truy vấn GROUP BY (không N+1)', async () => {
      (ndRepo.find as jest.Mock).mockResolvedValue([
        {
          maNd: 'gv-1',
          hoTen: 'Trần Văn B',
          email: 'gv1@test.vn',
          vaiTro: VaiTro.GiangVien,
          trangThai: TrangThaiTaiKhoan.Active,
          ngayTao: new Date('2020-01-10'),
          giangVien: { maGv: 'gv-1', hocHam: 'Giáo sư', hocVi: 'Tiến sĩ khoa học' },
        },
      ]);
      dataSource.createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(mockQb([{ maGv: 'gv-1', soNcs: '4' }]))
        .mockReturnValueOnce(mockQb([]));

      const kq = await service.findAllExtended();

      expect(kq[0].ncsDangHuongDan).toBe(4);
      expect(kq[0].hanMucToiDa).toBe(7);
      expect(dataSource.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });

  describe('ghiNhatKy', () => {
    it('lỗi ghi nhật ký không làm hỏng nghiệp vụ chính', async () => {
      (nhatKyRepo.save as jest.Mock).mockRejectedValue(new Error('CSDL nhật ký lỗi'));

      await expect(service.ghiNhatKy(admin, 'Thao tác thử')).resolves.toBeUndefined();
    });
  });
});
