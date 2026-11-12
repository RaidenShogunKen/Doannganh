import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChuyenNganh } from '../../users/entities/chuyen-nganh.entity';
import { LoaiHocPhan } from '../../common/enums';

@Entity('mon_hoc')
export class MonHoc {
  @PrimaryGeneratedColumn({ name: 'ma_mh' })
  maMh: number;

  @Column({ name: 'ten_mh', length: 150 })
  tenMh: string;

  @Column({ name: 'so_tin_chi', type: 'int' })
  soTinChi: number;

  @Column({ name: 'ma_cn', type: 'int', nullable: true })
  maCn?: number;

  @Column({
    name: 'loai_hp',
    type: 'enum',
    enum: LoaiHocPhan,
    default: LoaiHocPhan.BatBuoc,
  })
  loaiHp: LoaiHocPhan;

  @ManyToOne(() => ChuyenNganh, { nullable: true })
  @JoinColumn({ name: 'ma_cn' })
  chuyenNganh?: ChuyenNganh;
}
