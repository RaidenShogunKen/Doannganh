import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('custom_kb_chunk')
export class CustomKbChunk {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_chunk' })
  maChunk: string;

  @Column({ name: 'chunk_id', length: 200, unique: true })
  chunkId: string;

  @Column({ name: 'so_hieu', length: 100 })
  soHieu: string;

  @Column({ name: 'ten_van_ban', length: 300 })
  tenVanBan: string;

  @Column({ name: 'co_quan', length: 200, default: 'Bộ Giáo dục và Đào tạo' })
  coQuan: string;

  @Column({ name: 'dieu_khoan', length: 100 })
  dieuKhoan: string;

  @Column({ name: 'tieu_de', length: 300 })
  tieuDe: string;

  @Column({ name: 'noi_dung', type: 'text' })
  noiDung: string;

  @Column({ name: 'link_goc', length: 500, nullable: true })
  linkGoc?: string;

  @Column({ name: 'tu_khoa', type: 'text', array: true, default: '{}' })
  tuKhoa: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'ngay_tao' })
  ngayTao: Date;

  @UpdateDateColumn({ name: 'ngay_cap_nhat' })
  ngayCapNhat: Date;
}
