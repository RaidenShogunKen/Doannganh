import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TailieuQuyche } from './tailieu-quyche.entity';

@Entity('tailieu_chunk_vector')
export class TailieuChunkVector {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_chunk' })
  maChunk: string;

  @Column({ name: 'ma_tl', type: 'uuid' })
  maTl: string;

  @Column({ name: 'dieu_khoan', length: 50 })
  dieuKhoan: string;

  @Column({ name: 'tieu_de', length: 200 })
  tieuDe: string;

  @Column({ name: 'noi_dung', type: 'text' })
  noiDung: string;

  @Column({ name: 'tu_khoa', type: 'text', array: true, default: '{}' })
  tuKhoa: string[];

  @Column({ name: 'embedding', type: 'text', nullable: true })
  embedding?: string;

  @ManyToOne(() => TailieuQuyche, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_tl' })
  tailieuQuyche: TailieuQuyche;
}
