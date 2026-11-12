import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { NguoiDung } from './nguoi-dung.entity';

@Entity('giang_vien')
export class GiangVien {
  @PrimaryColumn('uuid', { name: 'ma_gv' })
  maGv: string;

  @Column({ name: 'hoc_ham', length: 30, nullable: true })
  hocHam?: string;

  @Column({ name: 'hoc_vi', length: 30, nullable: true })
  hocVi?: string;

  @Column({ name: 'chuyen_mon', length: 150, nullable: true })
  chuyenMon?: string;

  @Column({ name: 'so_ncs_dang_hd', type: 'int', default: 0 })
  soNcsDangHd: number;

  @OneToOne(() => NguoiDung, (nd) => nd.giangVien, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_gv' })
  nguoiDung: NguoiDung;
}
