import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { NguoiDung } from './nguoi-dung.entity';
import { ChuyenNganh } from './chuyen-nganh.entity';
import { TrinhDo, TrangThaiHocVien } from '../../common/enums';

@Entity('hoc_vien')
export class HocVien {
  @PrimaryColumn('uuid', { name: 'ma_hv' })
  maHv: string;

  @Column({ unique: true, length: 20 })
  mshv: string;

  @Column({ name: 'ma_chuyen_nganh', type: 'int', nullable: true })
  maChuyenNganh?: number;

  @Column({
    name: 'trinh_do',
    type: 'enum',
    enum: TrinhDo,
  })
  trinhDo: TrinhDo;

  @Column({ name: 'khoa_hoc', length: 50, nullable: true })
  khoaHoc?: string;

  @Column({ name: 'ngay_nhap_hoc', type: 'date', nullable: true })
  ngayNhapHoc?: string;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: TrangThaiHocVien,
    default: TrangThaiHocVien.DangHoc,
  })
  trangThai: TrangThaiHocVien;

  @Column({ name: 'so_quyet_dinh_tot_nghiep', length: 100, nullable: true })
  soQuyetDinhTotNghiep?: string;

  @Column({ name: 'ngay_quyet_dinh_tot_nghiep', type: 'date', nullable: true })
  ngayQuyetDinhTotNghiep?: string;

  @Column({ name: 'file_quyet_dinh_tot_nghiep', length: 255, nullable: true, select: false })
  fileQuyetDinhTotNghiep?: string;

  @Column({ name: 'ma_nguoi_ghi_nhan_tot_nghiep', type: 'uuid', nullable: true, select: false })
  maNguoiGhiNhanTotNghiep?: string;

  @Column({ name: 'tong_so_thang_bao_luu', type: 'int', default: 0 })
  tongSoThangBaoLuu: number;

  @Column({ name: 'ngay_bat_dau_bao_luu', type: 'date', nullable: true })
  ngayBatDauBaoLuu?: string;

  @Column({ name: 'ngay_ket_thuc_bao_luu', type: 'date', nullable: true })
  ngayKetThucBaoLuu?: string;

  @Column({ name: 'ngay_sinh', type: 'date', nullable: true })
  ngaySinh?: string;

  @Column({ name: 'gioi_tinh', length: 10, nullable: true })
  gioiTinh?: string;

  @Column({ name: 'so_cccd', length: 30, nullable: true, select: false })
  soCccd?: string;

  @Column({ name: 'dia_chi', length: 300, nullable: true, select: false })
  diaChi?: string;

  @Column({ name: 'bang_cap_dau_vao', length: 200, nullable: true })
  bangCapDauVao?: string;

  @Column({ name: 'hinh_thuc_dao_tao', length: 100, nullable: true })
  hinhThucDaoTao?: string;

  @Column({ name: 'co_quan_cong_tac', length: 200, nullable: true })
  coQuanCongTac?: string;

  @Column({ name: 'ngoai_ngu', length: 200, nullable: true })
  ngoaiNgu?: string;

  @Column({ name: 'huong_nghien_cuu', type: 'text', nullable: true })
  huongNghienCuu?: string;

  @Column({ name: 'anh_dai_dien_url', length: 255, nullable: true })
  anhDaiDienUrl?: string;

  @OneToOne(() => NguoiDung, (nd) => nd.hocVien, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_hv' })
  nguoiDung: NguoiDung;

  @ManyToOne(() => ChuyenNganh, { nullable: true })
  @JoinColumn({ name: 'ma_chuyen_nganh' })
  chuyenNganh?: ChuyenNganh;
}
