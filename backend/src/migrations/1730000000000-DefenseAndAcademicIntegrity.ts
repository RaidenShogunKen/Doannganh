import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefenseAndAcademicIntegrity1730000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE trang_thai_dt_enum ADD VALUE IF NOT EXISTS 'DangBaoVe';
      ALTER TYPE trang_thai_dt_enum ADD VALUE IF NOT EXISTS 'KhongDat';
      ALTER TABLE tinnhan_ai ADD COLUMN IF NOT EXISTS citations JSONB NOT NULL DEFAULT '[]';
      ALTER TABLE custom_kb_chunk ADD COLUMN IF NOT EXISTS link_goc VARCHAR(500);
      ALTER TABLE chuyen_nganh ADD COLUMN IF NOT EXISTS so_tin_chi_hoc_phan INT
        CHECK (so_tin_chi_hoc_phan >= 0);
      ALTER TABLE hoc_vien
        ADD COLUMN IF NOT EXISTS ngay_sinh DATE,
        ADD COLUMN IF NOT EXISTS gioi_tinh VARCHAR(10),
        ADD COLUMN IF NOT EXISTS so_cccd VARCHAR(30),
        ADD COLUMN IF NOT EXISTS dia_chi VARCHAR(300),
        ADD COLUMN IF NOT EXISTS bang_cap_dau_vao VARCHAR(200),
        ADD COLUMN IF NOT EXISTS hinh_thuc_dao_tao VARCHAR(100),
        ADD COLUMN IF NOT EXISTS co_quan_cong_tac VARCHAR(200),
        ADD COLUMN IF NOT EXISTS ngoai_ngu VARCHAR(200),
        ADD COLUMN IF NOT EXISTS huong_nghien_cuu TEXT,
        ADD COLUMN IF NOT EXISTS anh_dai_dien_url VARCHAR(255);
      ALTER TABLE hoc_vien ALTER COLUMN khoa_hoc TYPE VARCHAR(50);
      ALTER TABLE giang_vien ALTER COLUMN hoc_ham TYPE VARCHAR(50);
      ALTER TABLE giang_vien ALTER COLUMN hoc_vi TYPE VARCHAR(50);
      ALTER TABLE giang_vien ALTER COLUMN chuyen_mon TYPE VARCHAR(200);
      ALTER TABLE de_tai
        ADD COLUMN IF NOT EXISTS ten_dt_en VARCHAR(300),
        ADD COLUMN IF NOT EXISTS thuyet_minh TEXT,
        ADD COLUMN IF NOT EXISTS file_de_cuong VARCHAR(255),
        ADD COLUMN IF NOT EXISTS ngay_xac_nhan_bao_ve TIMESTAMPTZ;
      ALTER TABLE thanhvien_hoidong ADD COLUMN IF NOT EXISTS phieu VARCHAR(15)
        CHECK (phieu IN ('TanThanh', 'KhongTanThanh'));
      ALTER TABLE hoi_dong
        ADD COLUMN IF NOT EXISTS quy_che VARCHAR(15) CHECK (quy_che IN ('ChuyenTiep2021', 'ThongTu53')),
        ADD COLUMN IF NOT EXISTS bien_ban_url VARCHAR(255),
        ADD COLUMN IF NOT EXISTS thanh_vien_co_mat UUID[],
        ADD COLUMN IF NOT EXISTS ngay_chot_ket_qua TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS ma_nguoi_chot UUID REFERENCES nguoi_dung(ma_nd) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS lan_bao_ve INT NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS kien_nghi_bao_ve_lai BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE hoi_dong ALTER COLUMN ket_qua DROP DEFAULT;
      UPDATE hoi_dong SET ket_qua = NULL WHERE ket_qua = 'ChuaBaoVe';
      ALTER TABLE hoi_dong DROP CONSTRAINT IF EXISTS uq_hoidong_detai_cap;
      ALTER TABLE hoi_dong DROP CONSTRAINT IF EXISTS hoi_dong_ma_dt_key;
      ALTER TABLE hoi_dong DROP CONSTRAINT IF EXISTS hoi_dong_ma_dt_cap_danh_gia_key;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_hoidong_detai_cap_lan ON hoi_dong(ma_dt, cap_danh_gia, lan_bao_ve);

      CREATE TABLE IF NOT EXISTS phan_cong_giang_day (
        ma_mh INT NOT NULL REFERENCES mon_hoc(ma_mh) ON DELETE CASCADE,
        ma_gv UUID NOT NULL REFERENCES giang_vien(ma_gv) ON DELETE CASCADE,
        hoc_ky_nam_hoc VARCHAR(20) NOT NULL,
        PRIMARY KEY (ma_mh, ma_gv, hoc_ky_nam_hoc)
      );
      CREATE INDEX IF NOT EXISTS idx_phan_cong_giang_vien ON phan_cong_giang_day(ma_gv, hoc_ky_nam_hoc);

      CREATE TABLE IF NOT EXISTS tep_tin_hoc_vu (
        ten_tep VARCHAR(255) PRIMARY KEY,
        ma_chu_so_huu UUID REFERENCES nguoi_dung(ma_nd) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS minh_chung_bao_ve (
        ma_dt UUID NOT NULL REFERENCES de_tai(ma_dt) ON DELETE CASCADE,
        loai VARCHAR(20) NOT NULL CHECK (loai IN ('BanThao', 'NgoaiNgu', 'CongBo', 'DanhGiaDonVi', 'PhanBien', 'LiemChinh')),
        file_url VARCHAR(500) NOT NULL,
        trang_thai VARCHAR(12) NOT NULL DEFAULT 'ChoDuyet'
          CHECK (trang_thai IN ('ChoDuyet', 'DaDuyet', 'CanBoSung')),
        ghi_chu VARCHAR(1000),
        ma_nguoi_duyet UUID REFERENCES nguoi_dung(ma_nd) ON DELETE SET NULL,
        ngay_duyet TIMESTAMPTZ,
        PRIMARY KEY (ma_dt, loai)
      );

      DO $$ BEGIN
        CREATE TYPE trang_thai_don_tuyen_sinh_enum AS ENUM ('ChoDuyet', 'DaDuyet', 'TuChoi', 'DaNhapHoc');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
      CREATE TABLE IF NOT EXISTS don_tuyen_sinh (
        ma_don UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ma_nd UUID REFERENCES nguoi_dung(ma_nd) ON DELETE SET NULL,
        ho_ten VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        so_dien_thoai VARCHAR(20),
        ngay_sinh DATE,
        trinh_do_dang_ky trinh_do_enum NOT NULL DEFAULT 'ThacSi',
        chuyen_nganh_dang_ky VARCHAR(200),
        bang_tot_nghiep_url VARCHAR(500),
        bang_tieng_anh_url VARCHAR(500),
        ly_lich_khoa_hoc_url VARCHAR(500),
        ghi_chu_them TEXT,
        trang_thai trang_thai_don_tuyen_sinh_enum NOT NULL DEFAULT 'ChoDuyet',
        ghi_chu_admin TEXT,
        file_quyet_dinh_url VARCHAR(500),
        hash_quyet_dinh VARCHAR(64),
        ngay_ky_duyet TIMESTAMPTZ,
        ma_admin_ky UUID REFERENCES nguoi_dung(ma_nd) ON DELETE SET NULL,
        ngay_nop TIMESTAMP NOT NULL DEFAULT NOW(),
        ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_don_tuyen_sinh_nguoi_nop ON don_tuyen_sinh(ma_nd);

      CREATE OR REPLACE FUNCTION fn_dem_ncs_dang_huongdan() RETURNS TRIGGER AS $$
      BEGIN
        UPDATE giang_vien gv SET so_ncs_dang_hd = COALESCE((
          SELECT SUM(CASE WHEN dt.ma_gvhd2 IS NULL THEN 1.0 ELSE 0.5 END)
          FROM de_tai dt JOIN hoc_vien hv ON hv.ma_hv = dt.ma_hv
          WHERE gv.ma_gv IN (dt.ma_gvhd, dt.ma_gvhd2) AND hv.trinh_do = 'TienSi'
            AND dt.trang_thai::text IN ('DaDuyet', 'DangThucHien', 'DuDKBaoVe', 'DuDieuKienBaoVe', 'DangBaoVe', 'KhongDat')
        ), 0)
        WHERE gv.ma_gv IN (NEW.ma_gvhd, NEW.ma_gvhd2, OLD.ma_gvhd, OLD.ma_gvhd2);
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
      UPDATE giang_vien gv SET so_ncs_dang_hd = COALESCE((
        SELECT SUM(CASE WHEN dt.ma_gvhd2 IS NULL THEN 1.0 ELSE 0.5 END)
        FROM de_tai dt JOIN hoc_vien hv ON hv.ma_hv = dt.ma_hv
        WHERE gv.ma_gv IN (dt.ma_gvhd, dt.ma_gvhd2) AND hv.trinh_do = 'TienSi'
          AND dt.trang_thai::text IN ('DaDuyet', 'DangThucHien', 'DuDKBaoVe', 'DuDieuKienBaoVe', 'DangBaoVe', 'KhongDat')
      ), 0);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS don_tuyen_sinh;
      DROP TYPE IF EXISTS trang_thai_don_tuyen_sinh_enum;
      DROP TABLE IF EXISTS minh_chung_bao_ve;
      DROP TABLE IF EXISTS tep_tin_hoc_vu;
      DROP TABLE IF EXISTS phan_cong_giang_day;
      ALTER TABLE thanhvien_hoidong DROP COLUMN IF EXISTS phieu;
      ALTER TABLE tinnhan_ai DROP COLUMN IF EXISTS citations;
      ALTER TABLE custom_kb_chunk DROP COLUMN IF EXISTS link_goc;
      DROP INDEX IF EXISTS idx_hoidong_detai_cap_lan;
      ALTER TABLE hoi_dong DROP COLUMN IF EXISTS quy_che, DROP COLUMN IF EXISTS bien_ban_url,
        DROP COLUMN IF EXISTS thanh_vien_co_mat, DROP COLUMN IF EXISTS ngay_chot_ket_qua,
        DROP COLUMN IF EXISTS ma_nguoi_chot, DROP COLUMN IF EXISTS lan_bao_ve,
        DROP COLUMN IF EXISTS kien_nghi_bao_ve_lai;
      ALTER TABLE chuyen_nganh DROP COLUMN IF EXISTS so_tin_chi_hoc_phan;
      ALTER TABLE de_tai DROP COLUMN IF EXISTS ngay_xac_nhan_bao_ve,
        DROP COLUMN IF EXISTS file_de_cuong, DROP COLUMN IF EXISTS thuyet_minh, DROP COLUMN IF EXISTS ten_dt_en;
    `);
  }
}
