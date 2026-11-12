import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { LoaiVanBan, PhamViApDung } from '../../common/enums';

@Entity('tailieu_quyche')
export class TailieuQuyche {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_tl' })
  maTl: string;

  @Column({ name: 'ten_van_ban', length: 300 })
  tenVanBan: string;

  @Column({ name: 'so_hieu_van_ban', length: 50, nullable: true })
  soHieuVanBan?: string;

  @Column({
    name: 'loai_van_ban',
    type: 'enum',
    enum: LoaiVanBan,
  })
  loaiVanBan: LoaiVanBan;

  @Column({ name: 'co_quan_ban_hanh', length: 150, nullable: true })
  coQuanBanHanh?: string;

  @Column({ name: 'ngay_ban_hanh', type: 'date', nullable: true })
  ngayBanHanh?: string;

  @Column({ name: 'ngay_hieu_luc', type: 'date', nullable: true })
  ngayHieuLuc?: string;

  @Column({
    name: 'pham_vi_ap_dung',
    type: 'enum',
    enum: PhamViApDung,
    default: PhamViApDung.Chung,
  })
  phamViApDung: PhamViApDung;

  @Column({ name: 'duong_dan_file', length: 255, nullable: true })
  duongDanFile?: string;

  @Column({ name: 'trang_thai_hieu_luc', type: 'boolean', default: true })
  trangThaiHieuLuc: boolean;
}
