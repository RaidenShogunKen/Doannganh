import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HoithoaiAi } from './hoithoai-ai.entity';
import { TailieuQuyche } from './tailieu-quyche.entity';
import { NguoiGui } from '../../common/enums';

@Entity('tinnhan_ai')
export class TinnhanAi {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_tn' })
  maTn: string;

  @Column({ name: 'ma_ht', type: 'uuid' })
  maHt: string;

  @Column({
    name: 'nguoi_gui',
    type: 'enum',
    enum: NguoiGui,
  })
  nguoiGui: NguoiGui;

  @Column({ name: 'noi_dung', type: 'text' })
  noiDung: string;

  @CreateDateColumn({ name: 'thoi_gian', type: 'timestamptz' })
  thoiGian: Date;

  @Column({ name: 'ma_tl_thamchieu', type: 'uuid', nullable: true })
  maTlThamchieu?: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  citations: object[];

  @ManyToOne(() => HoithoaiAi, (ht) => ht.tinNhan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ma_ht' })
  hoithoai: HoithoaiAi;

  @ManyToOne(() => TailieuQuyche, { nullable: true })
  @JoinColumn({ name: 'ma_tl_thamchieu' })
  taiLieuThamChieu?: TailieuQuyche;
}
