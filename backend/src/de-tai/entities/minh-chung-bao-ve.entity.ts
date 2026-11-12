import { Column, Entity, PrimaryColumn } from 'typeorm';
import { LoaiMinhChungBaoVe, TrangThaiMinhChung } from '../../common/enums';

@Entity('minh_chung_bao_ve')
export class MinhChungBaoVe {
  @PrimaryColumn('uuid', { name: 'ma_dt' })
  maDt: string;

  @PrimaryColumn({ type: 'varchar', length: 20 })
  loai: LoaiMinhChungBaoVe;

  @Column({ name: 'file_url', length: 500 })
  fileUrl: string;

  @Column({ name: 'trang_thai', type: 'varchar', length: 12, default: TrangThaiMinhChung.ChoDuyet })
  trangThai: TrangThaiMinhChung;

  @Column({ name: 'ghi_chu', type: 'varchar', length: 1000, nullable: true })
  ghiChu: string | null;

  @Column({ name: 'ma_nguoi_duyet', type: 'uuid', nullable: true })
  maNguoiDuyet: string | null;

  @Column({ name: 'ngay_duyet', type: 'timestamptz', nullable: true })
  ngayDuyet: Date | null;
}
