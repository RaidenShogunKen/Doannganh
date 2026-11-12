import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { DeTai } from '../../de-tai/entities/de-tai.entity';
import { CapDanhGia, QuyCheBaoVe } from '../../common/enums';
import { ThanhVienHoiDong } from './thanhvien-hoidong.entity';

@Entity('hoi_dong')
@Unique(['maDt', 'capDanhGia', 'lanBaoVe'])
export class HoiDong {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_hd' })
  maHd: string;

  @Column({ name: 'ma_dt', type: 'uuid' })
  maDt: string;

  @Column({
    name: 'cap_danh_gia',
    type: 'enum',
    enum: CapDanhGia,
  })
  capDanhGia: CapDanhGia;

  @Column({ name: 'ngay_bao_ve', type: 'timestamptz', nullable: true })
  ngayBaoVe?: Date;

  @Column({ name: 'dia_diem', length: 150, nullable: true })
  diaDiem?: string;

  @Column({ name: 'ket_qua', length: 50, nullable: true })
  ketQua?: string;

  @Column({ name: 'diem_tb', type: 'numeric', precision: 4, scale: 2, nullable: true })
  diemTb?: number;

  @Column({ name: 'quy_che', type: 'varchar', length: 15, nullable: true })
  quyChe?: QuyCheBaoVe;

  @Column({ name: 'bien_ban_url', length: 255, nullable: true })
  bienBanUrl?: string;

  @Column({ name: 'thanh_vien_co_mat', type: 'uuid', array: true, nullable: true })
  thanhVienCoMat?: string[];

  @Column({ name: 'ngay_chot_ket_qua', type: 'timestamptz', nullable: true })
  ngayChotKetQua?: Date;

  @Column({ name: 'ma_nguoi_chot', type: 'uuid', nullable: true })
  maNguoiChot?: string;

  @Column({ name: 'lan_bao_ve', type: 'int', default: 1 })
  lanBaoVe: number;

  @Column({ name: 'kien_nghi_bao_ve_lai', type: 'boolean', default: false })
  kienNghiBaoVeLai: boolean;

  @ManyToOne(() => DeTai, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_dt' })
  deTai: DeTai;

  @OneToMany(() => ThanhVienHoiDong, (tv) => tv.hoiDong, { cascade: true })
  thanhVien: ThanhVienHoiDong[];
}
