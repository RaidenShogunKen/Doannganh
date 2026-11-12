import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HocVien } from '../../users/entities/hoc-vien.entity';
import { PhanLoaiBaiBao } from '../../common/enums';

@Entity('bai_bao_khoa_hoc')
export class BaiBaoKhoaHoc {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_bb' })
  maBb: string;

  @Column({ name: 'ma_hv', type: 'uuid' })
  maHv: string;

  @Column({ name: 'tieu_de', length: 300 })
  tieuDe: string;

  @Column({ name: 'ten_tapchi_hoithao', length: 200, nullable: true })
  tenTapChiHoiThao?: string;

  @Column({
    name: 'phan_loai',
    type: 'enum',
    enum: PhanLoaiBaiBao,
    nullable: true,
  })
  phanLoai?: PhanLoaiBaiBao;

  @Column({ name: 'doi', length: 100, nullable: true })
  doi?: string;

  @Column({ name: 'issn', length: 50, nullable: true })
  issn?: string;

  @Column({ name: 'vai_tro_tac_gia', length: 50, nullable: true })
  vaiTroTacGia?: string;

  @Column({ name: 'ngay_cong_bo', type: 'date', nullable: true })
  ngayCongBo?: string;

  @Column({ name: 'file_minh_chung', length: 255, nullable: true })
  fileMinhChung?: string;

  @Column({ name: 'link_bai_bao', length: 255, nullable: true })
  linkBaiBao?: string;

  @ManyToOne(() => HocVien, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_hv' })
  hocVien: HocVien;
}
