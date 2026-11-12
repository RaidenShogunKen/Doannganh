import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { NguoiDung } from '../../users/entities/nguoi-dung.entity';
import { TinnhanAi } from './tinnhan-ai.entity';

@Entity('hoithoai_ai')
export class HoithoaiAi {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_ht' })
  maHt: string;

  @Column({ name: 'ma_nd', type: 'uuid' })
  maNd: string;

  @CreateDateColumn({ name: 'thoi_gian_bat_dau', type: 'timestamptz' })
  thoiGianBatDau: Date;

  @Column({ name: 'chu_de', length: 200, nullable: true })
  chuDe?: string;

  @ManyToOne(() => NguoiDung, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_nd' })
  nguoiDung: NguoiDung;

  @OneToMany(() => TinnhanAi, (tn) => tn.hoithoai, { cascade: true })
  tinNhan: TinnhanAi[];
}
