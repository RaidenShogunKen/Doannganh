import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HocVien } from '../../users/entities/hoc-vien.entity';
import { DeTai } from '../../de-tai/entities/de-tai.entity';
import { LoaiDonHocVu, TrangThaiDonHocVu } from '../../common/enums';

@Entity('don_hoc_vu')
export class DonHocVu {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_don' })
  maDon: string;

  @Column({ name: 'ma_hv', type: 'uuid' })
  maHv: string;

  @Column({ name: 'ma_dt', type: 'uuid', nullable: true })
  maDt?: string;

  @Column({
    name: 'loai_don',
    type: 'enum',
    enum: LoaiDonHocVu,
  })
  loaiDon: LoaiDonHocVu;

  @Column({ name: 'so_thang', type: 'int', default: 6 })
  soThang: number;

  @Column({ name: 'ly_do', type: 'text' })
  lyDo: string;

  @Column({ name: 'y_kien_gvhd', type: 'text', nullable: true })
  yKienGvhd?: string;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: TrangThaiDonHocVu,
    default: TrangThaiDonHocVu.ChoDuyetGvhd,
  })
  trangThai: TrangThaiDonHocVu;

  @Column({ name: 'ngay_nop', type: 'date', default: () => 'CURRENT_DATE' })
  ngayNop: string;

  @Column({ name: 'ngay_duyet', type: 'date', nullable: true })
  ngayDuyet?: string;

  @Column({ name: 'nguoi_duyet', length: 100, nullable: true })
  nguoiDuyet?: string;

  @Column({ name: 'quyet_dinh_so', length: 100, nullable: true })
  quyetDinhSo?: string;

  @Column({ name: 'file_dinh_kem_url', length: 255, nullable: true })
  fileDinhKemUrl?: string;

  @CreateDateColumn({ name: 'ngay_tao', type: 'timestamptz' })
  ngayTao: Date;

  @UpdateDateColumn({ name: 'ngay_cap_nhat', type: 'timestamptz' })
  ngayCapNhat: Date;

  @ManyToOne(() => HocVien, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_hv' })
  hocVien: HocVien;

  @ManyToOne(() => DeTai, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ma_dt' })
  deTai?: DeTai;
}
