import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { GiangVien } from '../../users/entities/giang-vien.entity';
import { MonHoc } from './mon-hoc.entity';

@Entity('phan_cong_giang_day')
export class PhanCongGiangDay {
  @PrimaryColumn({ name: 'ma_mh', type: 'int' })
  maMh: number;

  @PrimaryColumn('uuid', { name: 'ma_gv' })
  maGv: string;

  @PrimaryColumn({ name: 'hoc_ky_nam_hoc', length: 20 })
  hocKyNamHoc: string;

  @ManyToOne(() => MonHoc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_mh' })
  monHoc: MonHoc;

  @ManyToOne(() => GiangVien, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_gv' })
  giangVien: GiangVien;
}
