import { MigrationInterface, QueryRunner } from 'typeorm';

export class ThesisSubmissionDeadline1750000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE de_tai ADD COLUMN IF NOT EXISTS han_nop_luan_an date');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE de_tai DROP COLUMN IF EXISTS han_nop_luan_an');
  }
}
