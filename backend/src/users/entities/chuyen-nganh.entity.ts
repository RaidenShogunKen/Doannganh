import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TrinhDo } from '../../common/enums';

@Entity('chuyen_nganh')
export class ChuyenNganh {
  @PrimaryGeneratedColumn({ name: 'ma_cn' })
  maCn: number;

  @Column({ name: 'ten_cn', length: 150 })
  tenCn: string;

  @Column({
    name: 'trinh_do_dao_tao',
    type: 'enum',
    enum: TrinhDo,
  })
  trinhDoDaoTao: TrinhDo;

  @Column({ name: 'so_tin_chi_ct', type: 'int', nullable: true })
  soTinChiCt?: number;

  @Column({ name: 'so_tin_chi_hoc_phan', type: 'int', nullable: true })
  soTinChiHocPhan?: number;
}
