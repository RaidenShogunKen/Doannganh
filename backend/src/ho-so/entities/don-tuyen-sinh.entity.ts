import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NguoiDung } from '../../users/entities/nguoi-dung.entity';
import { TrangThaiDonTuyenSinh, TrinhDo } from '../../common/enums';

@Entity('don_tuyen_sinh')
export class DonTuyenSinh {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_don' })
  maDon: string;

  @Column({ name: 'ma_nd', type: 'uuid', nullable: true })
  maNd?: string;

  @Column({ name: 'ho_ten', length: 150 })
  hoTen: string;

  @Column({ name: 'email', length: 150 })
  email: string;

  @Column({ name: 'so_dien_thoai', length: 20, nullable: true })
  soDienThoai?: string;

  @Column({ name: 'ngay_sinh', type: 'date', nullable: true })
  ngaySinh?: string;

  @Column({
    name: 'trinh_do_dang_ky',
    type: 'enum',
    enum: TrinhDo,
    default: TrinhDo.ThacSi,
  })
  trinhDoDangKy: TrinhDo;

  @Column({ name: 'chuyen_nganh_dang_ky', length: 200, nullable: true })
  chuyenNganhDangKy?: string;

  @Column({ name: 'bang_tot_nghiep_url', length: 500, nullable: true })
  bangTotNghiepUrl?: string;

  @Column({ name: 'bang_tieng_anh_url', length: 500, nullable: true })
  bangTiengAnhUrl?: string;

  @Column({ name: 'ly_lich_khoa_hoc_url', length: 500, nullable: true })
  lyLichKhoaHocUrl?: string;

  @Column({ name: 'ghi_chu_them', type: 'text', nullable: true })
  ghiChuThem?: string;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: TrangThaiDonTuyenSinh,
    default: TrangThaiDonTuyenSinh.ChoDuyet,
  })
  trangThai: TrangThaiDonTuyenSinh;

  @Column({ name: 'ghi_chu_admin', type: 'text', nullable: true })
  ghiChuAdmin?: string;

  @Column({ name: 'file_quyet_dinh_url', length: 500, nullable: true })
  fileQuyetDinhUrl?: string;

  @Column({ name: 'hash_quyet_dinh', length: 64, nullable: true })
  hashQuyetDinh?: string;

  @Column({ name: 'ngay_ky_duyet', type: 'timestamptz', nullable: true })
  ngayKyDuyet?: Date;

  @Column({ name: 'ma_admin_ky', type: 'uuid', nullable: true })
  maAdminKy?: string;

  @CreateDateColumn({ name: 'ngay_nop' })
  ngayNop: Date;

  @UpdateDateColumn({ name: 'ngay_cap_nhat' })
  ngayCapNhat: Date;

  @ManyToOne(() => NguoiDung, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ma_nd' })
  nguoiDung?: NguoiDung;

  @ManyToOne(() => NguoiDung, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ma_admin_ky' })
  adminKy?: NguoiDung;
}
