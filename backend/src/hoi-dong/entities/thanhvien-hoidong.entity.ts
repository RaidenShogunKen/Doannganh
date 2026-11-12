import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { HoiDong } from './hoi-dong.entity';
import { GiangVien } from '../../users/entities/giang-vien.entity';
import { ChucDanhHoiDong, PhieuHoiDong } from '../../common/enums';

@Entity('thanhvien_hoidong')
export class ThanhVienHoiDong {
  @PrimaryColumn('uuid', { name: 'ma_hd' })
  maHd: string;

  @PrimaryColumn('uuid', { name: 'ma_gv' })
  maGv: string;

  @Column({
    name: 'chuc_danh',
    type: 'enum',
    enum: ChucDanhHoiDong,
  })
  chucDanh: ChucDanhHoiDong;

  @Column({ name: 'co_quan_ct', length: 150, default: 'TrongCoSoDaoTao' })
  coQuanCt: string;

  @Column({ name: 'diem_tieu_chi_1', type: 'numeric', precision: 3, scale: 1, nullable: true })
  diemTieuChi1?: number;

  @Column({ name: 'diem_tieu_chi_2', type: 'numeric', precision: 3, scale: 1, nullable: true })
  diemTieuChi2?: number;

  @Column({ name: 'diem_tieu_chi_3', type: 'numeric', precision: 3, scale: 1, nullable: true })
  diemTieuChi3?: number;

  @Column({ name: 'diem_tieu_chi_4', type: 'numeric', precision: 3, scale: 1, nullable: true })
  diemTieuChi4?: number;

  @Column({ name: 'tong_diem', type: 'numeric', precision: 4, scale: 2, nullable: true })
  tongDiem?: number;

  @Column({ name: 'nhan_xet', type: 'text', nullable: true })
  nhanXet?: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phieu?: PhieuHoiDong;

  @ManyToOne(() => HoiDong, (hd) => hd.thanhVien, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_hd' })
  hoiDong: HoiDong;

  @ManyToOne(() => GiangVien)
  @JoinColumn({ name: 'ma_gv' })
  giangVien: GiangVien;
}
