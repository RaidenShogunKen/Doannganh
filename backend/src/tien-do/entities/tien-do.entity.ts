import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { DeTai } from '../../de-tai/entities/de-tai.entity';

@Entity('tien_do')
@Unique(['maDt', 'lanBaoCao'])
export class TienDo {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_td' })
  maTd: string;

  @Column({ name: 'ma_dt', type: 'uuid' })
  maDt: string;

  @Column({ name: 'lan_bao_cao', type: 'int' })
  lanBaoCao: number;

  @Column({ name: 'noi_dung', type: 'text', nullable: true })
  noiDung?: string;

  @Column({ name: 'nhan_xet_gvhd', type: 'text', nullable: true })
  nhanXetGvhd?: string;

  @Column({ name: 'diem_so', type: 'numeric', precision: 4, scale: 2, nullable: true })
  diemSo?: number;

  @Column({ name: 'danh_gia_kq', length: 30, nullable: true })
  danhGiaKq?: string;

  @Column({ name: 'file_bao_cao_url', length: 255, nullable: true })
  fileBaoCaoUrl?: string;

  @Column({ name: 'ngay_bao_cao', type: 'date', default: () => 'CURRENT_DATE' })
  ngayBaoCao: string;

  @ManyToOne(() => DeTai, (dt) => dt.tienDo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_dt' })
  deTai: DeTai;
}
