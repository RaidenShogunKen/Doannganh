import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NguoiDung } from '../../users/entities/nguoi-dung.entity';
import { LoaiThongBao } from '../../common/enums';

@Entity('thong_bao')
export class ThongBao {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_tb' })
  maTb: string;

  @Column({ name: 'ma_nd_nhan', type: 'uuid' })
  maNdNhan: string;

  @Column({
    name: 'loai_tb',
    type: 'enum',
    enum: LoaiThongBao,
    default: LoaiThongBao.HeThong,
  })
  loaiTb: LoaiThongBao;

  @Column({ name: 'tieu_de', length: 200 })
  tieuDe: string;

  @Column({ name: 'noi_dung', type: 'text' })
  noiDung: string;

  @Column({ name: 'duong_dan', length: 300, nullable: true })
  duongDan?: string;

  @Column({ name: 'ma_lien_quan', length: 100, nullable: true })
  maLienQuan?: string;

  @Column({ name: 'da_doc', type: 'boolean', default: false })
  daDoc: boolean;

  @CreateDateColumn({ name: 'thoi_gian' })
  thoiGian: Date;

  @ManyToOne(() => NguoiDung, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_nd_nhan' })
  nguoiNhan?: NguoiDung;
}
