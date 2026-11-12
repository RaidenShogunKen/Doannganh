import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLogNotificationAndAccountStatus1720000000000 implements MigrationInterface {
  name = 'AuditLogNotificationAndAccountStatus1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE trang_thai_tk_enum AS ENUM ('Active', 'Locked', 'Graduated');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE ket_qua_thao_tac_enum AS ENUM ('Success', 'Warning', 'Info');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE loai_thong_bao_enum AS ENUM ('DeTai', 'DonHocVu', 'TuyenSinh', 'HoiDong', 'BaiBao', 'HeThong');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE nguoi_dung
      ADD COLUMN IF NOT EXISTS trang_thai trang_thai_tk_enum NOT NULL DEFAULT 'Active';
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS nhat_ky_thao_tac (
        ma_log      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ma_nd       UUID REFERENCES nguoi_dung(ma_nd) ON DELETE SET NULL,
        ho_ten      VARCHAR(150) NOT NULL,
        vai_tro     VARCHAR(60)  NOT NULL,
        hanh_dong   TEXT         NOT NULL,
        dia_chi_ip  VARCHAR(100),
        ket_qua     ket_qua_thao_tac_enum NOT NULL DEFAULT 'Success',
        thoi_gian   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_nhat_ky_thoi_gian ON nhat_ky_thao_tac (thoi_gian DESC);`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS thong_bao (
        ma_tb        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ma_nd_nhan   UUID NOT NULL REFERENCES nguoi_dung(ma_nd) ON DELETE CASCADE,
        loai_tb      loai_thong_bao_enum NOT NULL DEFAULT 'HeThong',
        tieu_de      VARCHAR(200) NOT NULL,
        noi_dung     TEXT NOT NULL,
        duong_dan    VARCHAR(300),
        ma_lien_quan VARCHAR(100),
        da_doc       BOOLEAN NOT NULL DEFAULT FALSE,
        thoi_gian    TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_thong_bao_nguoi_nhan ON thong_bao (ma_nd_nhan, da_doc, thoi_gian DESC);`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS custom_kb_chunk (
        ma_chunk      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chunk_id      VARCHAR(200) UNIQUE NOT NULL,
        so_hieu       VARCHAR(100) NOT NULL,
        ten_van_ban   VARCHAR(300) NOT NULL,
        co_quan       VARCHAR(200) NOT NULL DEFAULT 'Bộ Giáo dục và Đào tạo',
        dieu_khoan    VARCHAR(100) NOT NULL,
        tieu_de       VARCHAR(300) NOT NULL,
        noi_dung      TEXT NOT NULL,
        tu_khoa       TEXT[] NOT NULL DEFAULT '{}',
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        ngay_tao      TIMESTAMP NOT NULL DEFAULT NOW(),
        ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS custom_kb_chunk;`);
    await queryRunner.query(`DROP TABLE IF EXISTS thong_bao;`);
    await queryRunner.query(`DROP TABLE IF EXISTS nhat_ky_thao_tac;`);
    await queryRunner.query(`ALTER TABLE nguoi_dung DROP COLUMN IF EXISTS trang_thai;`);
    await queryRunner.query(`DROP TYPE IF EXISTS loai_thong_bao_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS ket_qua_thao_tac_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS trang_thai_tk_enum;`);
  }
}
