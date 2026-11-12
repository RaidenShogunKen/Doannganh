import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { HocVien } from '../../users/entities/hoc-vien.entity';
import { GiangVien } from '../../users/entities/giang-vien.entity';
import { TrangThaiDeTai } from '../../common/enums';
import { TienDo } from '../../tien-do/entities/tien-do.entity';

@Entity('de_tai')
export class DeTai {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_dt' })
  maDt: string;

  @Column({ name: 'ten_dt', length: 300 })
  tenDt: string;

  @Column({ name: 'ten_dt_en', length: 300, nullable: true })
  tenDtEn?: string;

  @Column({ name: 'thuyet_minh', type: 'text', nullable: true })
  thuyetMinh?: string;

  @Column({ name: 'file_de_cuong', length: 255, nullable: true })
  fileDeCuong?: string;

  @Column({ name: 'ngay_xac_nhan_bao_ve', type: 'timestamptz', nullable: true })
  ngayXacNhanBaoVe?: Date;

  @Column({ name: 'ma_hv', type: 'uuid' })
  maHv: string;

  @Column({ name: 'ma_gvhd', type: 'uuid' })
  maGvhd: string;

  @Column({ name: 'ma_gvhd2', type: 'uuid', nullable: true })
  maGvhd2?: string;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: TrangThaiDeTai,
    default: TrangThaiDeTai.ChoDuyet,
  })
  trangThai: TrangThaiDeTai;

  @Column({ name: 'ngay_dang_ky', type: 'date', default: () => 'CURRENT_DATE' })
  ngayDangKy: string;

  @Column({ name: 'ngay_du_kien_bao_ve', type: 'date', nullable: true })
  ngayDuKienBaoVe?: string;

  @Column({ name: 'han_nop_luan_an', type: 'date', nullable: true })
  hanNopLuanAn?: string;

  @Column({ name: 'tong_so_thang_gia_han', type: 'int', default: 0 })
  tongSoThangGiaHan: number;

  @Column({ name: 'ngay_gia_han_cuoi', type: 'date', nullable: true })
  ngayGiaHanCuoi?: string;

  @ManyToOne(() => HocVien)
  @JoinColumn({ name: 'ma_hv' })
  hocVien: HocVien;

  @ManyToOne(() => GiangVien)
  @JoinColumn({ name: 'ma_gvhd' })
  giangVienHuongDan: GiangVien;

  @ManyToOne(() => GiangVien, { nullable: true })
  @JoinColumn({ name: 'ma_gvhd2' })
  giangVienHuongDan2?: GiangVien;

  @OneToMany(() => TienDo, (td) => td.deTai)
  tienDo?: TienDo[];
}
