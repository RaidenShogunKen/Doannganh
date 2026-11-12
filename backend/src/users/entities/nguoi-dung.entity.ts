import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { VaiTro, TrangThaiTaiKhoan } from '../../common/enums';
import { HocVien } from './hoc-vien.entity';
import { GiangVien } from './giang-vien.entity';

@Entity('nguoi_dung')
export class NguoiDung {
  @PrimaryGeneratedColumn('uuid', { name: 'ma_nd' })
  maNd: string;

  @Column({ name: 'ho_ten', length: 100 })
  hoTen: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ name: 'mat_khau_hash', length: 255, select: false })
  matKhauHash: string;

  @Column({
    name: 'vai_tro',
    type: 'enum',
    enum: VaiTro,
  })
  vaiTro: VaiTro;

  @Column({ nullable: true, length: 15 })
  sdt?: string;

  @Column({
    name: 'trang_thai',
    type: 'enum',
    enum: TrangThaiTaiKhoan,
    default: TrangThaiTaiKhoan.Active,
  })
  trangThai: TrangThaiTaiKhoan;

  @CreateDateColumn({ name: 'ngay_tao', type: 'timestamptz' })
  ngayTao: Date;

  @OneToOne(() => HocVien, (hv) => hv.nguoiDung)
  hocVien?: HocVien;

  @OneToOne(() => GiangVien, (gv) => gv.nguoiDung)
  giangVien?: GiangVien;
}
