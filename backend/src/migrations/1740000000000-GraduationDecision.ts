import { MigrationInterface, QueryRunner } from 'typeorm';

export class GraduationDecision1740000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE hoc_vien
        ADD COLUMN IF NOT EXISTS so_quyet_dinh_tot_nghiep varchar(100),
        ADD COLUMN IF NOT EXISTS ngay_quyet_dinh_tot_nghiep date,
        ADD COLUMN IF NOT EXISTS file_quyet_dinh_tot_nghiep varchar(255),
        ADD COLUMN IF NOT EXISTS ma_nguoi_ghi_nhan_tot_nghiep uuid REFERENCES nguoi_dung(ma_nd) ON DELETE SET NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE hoc_vien
        DROP COLUMN IF EXISTS ma_nguoi_ghi_nhan_tot_nghiep,
        DROP COLUMN IF EXISTS file_quyet_dinh_tot_nghiep,
        DROP COLUMN IF EXISTS ngay_quyet_dinh_tot_nghiep,
        DROP COLUMN IF EXISTS so_quyet_dinh_tot_nghiep
    `);
  }
}
