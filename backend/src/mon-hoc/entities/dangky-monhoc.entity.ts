import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { HocVien } from '../../users/entities/hoc-vien.entity';
import { MonHoc } from './mon-hoc.entity';
import { TrangThaiDangKy } from '../../common/enums';

@Entity('dangky_monhoc')
export class DangKyMonHoc {
  @PrimaryColumn('uuid', { name: 'ma_hv' })
  maHv: string;

  @PrimaryColumn({ name: 'ma_mh', type: 'int' })
  maMh: number;

  @PrimaryColumn({ name: 'hoc_ky_nam_hoc', length: 20 })
  hocKyNamHoc: string;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  diem?: number;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: TrangThaiDangKy,
    default: TrangThaiDangKy.DaDangKy,
  })
  trangThai: TrangThaiDangKy;

  @ManyToOne(() => HocVien, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_hv' })
  hocVien: HocVien;

  @ManyToOne(() => MonHoc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_mh' })
  monHoc: MonHoc;
}
