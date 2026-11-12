import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { NguoiDung } from './nguoi-dung.entity';
import { KetQuaThaoTac } from '../../common/enums';

@Entity('nhat_ky_thao_tac')
export class NhatKyThaoTac {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_log' })
  maLog: string;

  @Column({ name: 'ma_nd', type: 'uuid', nullable: true })
  maNd?: string;

  @Column({ name: 'ho_ten', length: 150 })
  hoTen: string;

  @Column({ name: 'vai_tro', length: 60 })
  vaiTro: string;

  @Column({ name: 'hanh_dong', type: 'text' })
  hanhDong: string;

  @Column({ name: 'dia_chi_ip', length: 100, nullable: true })
  diaChiIp?: string;

  @Column({
    name: 'ket_qua',
    type: 'enum',
    enum: KetQuaThaoTac,
    default: KetQuaThaoTac.Success,
  })
  ketQua: KetQuaThaoTac;

  @Index()
  @CreateDateColumn({ name: 'thoi_gian', type: 'timestamptz' })
  thoiGian: Date;

  @ManyToOne(() => NguoiDung, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ma_nd' })
  nguoiThucHien?: NguoiDung;
}
