import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialAndDonHocVuSchema1710000000000 implements MigrationInterface {
  name = 'InitialAndDonHocVuSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
          CREATE EXTENSION IF NOT EXISTS vector;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE vai_tro_enum AS ENUM ('HocVien', 'GiangVien', 'Admin');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE trinh_do_enum AS ENUM ('ThacSi', 'TienSi');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE trang_thai_hv_enum AS ENUM ('DangHoc', 'BaoLuu', 'TotNghiep', 'ThoiHoc');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE trang_thai_dt_enum AS ENUM ('ChoDuyet', 'DaDuyet', 'DangThucHien', 'TuChoi', 'DuDKBaoVe', 'DuDieuKienBaoVe', 'DaBaoVe');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE phan_loai_bb_enum AS ENUM ('ISI', 'Scopus', 'HDGSNN', 'TrongNuoc');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE cap_danh_gia_enum AS ENUM ('CoSo', 'CapTruong');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE chuc_danh_hd_enum AS ENUM ('ChuTich', 'PhanBien1', 'PhanBien2', 'ThuKy', 'UyVien');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE loai_hp_enum AS ENUM ('BatBuoc', 'TuChon');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE trang_thai_dk_enum AS ENUM ('DaDangKy', 'DaHoanThanh', 'Huy');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE loai_van_ban_enum AS ENUM ('ThongTu', 'Luat', 'QuyChe_NoiBo', 'QuyetDinh');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE pham_vi_ad_enum AS ENUM ('ThacSi', 'TienSi', 'Chung');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE nguoi_gui_enum AS ENUM ('User', 'AI');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE loai_don_hoc_vu_enum AS ENUM ('BaoLuu', 'GiaHan', 'QuayLaiHoc');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE trang_thai_don_enum AS ENUM ('ChoDuyetGvhd', 'ChoDuyetAdmin', 'DaDuyet', 'TuChoi');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS nguoi_dung (
        ma_nd UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ho_ten VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        mat_khau_hash VARCHAR(255) NOT NULL,
        vai_tro vai_tro_enum NOT NULL,
        sdt VARCHAR(15),
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now(),
        ngay_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chuyen_nganh (
        ma_cn SERIAL PRIMARY KEY,
        ten_cn VARCHAR(150) NOT NULL,
        trinh_do_dao_tao trinh_do_enum NOT NULL,
        so_tin_chi_ct INT DEFAULT 90,
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS hoc_vien (
        ma_hv UUID PRIMARY KEY REFERENCES nguoi_dung(ma_nd) ON DELETE CASCADE,
        mshv VARCHAR(20) NOT NULL UNIQUE,
        ma_chuyen_nganh INT REFERENCES chuyen_nganh(ma_cn),
        trinh_do trinh_do_enum NOT NULL,
        khoa_hoc VARCHAR(10),
        ngay_nhap_hoc DATE NOT NULL DEFAULT CURRENT_DATE,
        trang_thai trang_thai_hv_enum NOT NULL DEFAULT 'DangHoc',
        tong_so_thang_bao_luu INT NOT NULL DEFAULT 0,
        ngay_bat_dau_bao_luu DATE,
        ngay_ket_thuc_bao_luu DATE,
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now(),
        ngay_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS giang_vien (
        ma_gv UUID PRIMARY KEY REFERENCES nguoi_dung(ma_nd) ON DELETE CASCADE,
        hoc_ham VARCHAR(30),
        hoc_vi VARCHAR(30),
        chuyen_mon VARCHAR(150),
        so_ncs_dang_hd NUMERIC(4,1) NOT NULL DEFAULT 0.0,
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now(),
        ngay_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mon_hoc (
        ma_mh SERIAL PRIMARY KEY,
        ten_mh VARCHAR(150) NOT NULL,
        so_tin_chi INT NOT NULL,
        ma_cn INT REFERENCES chuyen_nganh(ma_cn),
        loai_hp loai_hp_enum NOT NULL DEFAULT 'BatBuoc',
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS dangky_monhoc (
        ma_hv UUID REFERENCES hoc_vien(ma_hv) ON DELETE CASCADE,
        ma_mh INT REFERENCES mon_hoc(ma_mh) ON DELETE CASCADE,
        hoc_ky_nam_hoc VARCHAR(20) NOT NULL,
        diem NUMERIC(4,2),
        trang_thai trang_thai_dk_enum NOT NULL DEFAULT 'DaDangKy',
        ngay_dang_ky TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (ma_hv, ma_mh, hoc_ky_nam_hoc)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS de_tai (
        ma_dt UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ten_dt VARCHAR(300) NOT NULL,
        ma_hv UUID NOT NULL REFERENCES hoc_vien(ma_hv),
        ma_gvhd UUID NOT NULL REFERENCES giang_vien(ma_gv),
        ma_gvhd2 UUID REFERENCES giang_vien(ma_gv),
        trang_thai trang_thai_dt_enum NOT NULL DEFAULT 'ChoDuyet',
        ngay_dang_ky DATE NOT NULL DEFAULT CURRENT_DATE,
        ngay_du_kien_bao_ve DATE,
        tong_so_thang_gia_han INT NOT NULL DEFAULT 0,
        ngay_gia_han_cuoi DATE,
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now(),
        ngay_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chk_gvhd_khac_gvhd2 CHECK (ma_gvhd2 IS NULL OR ma_gvhd2 <> ma_gvhd)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS don_hoc_vu (
        ma_don UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ma_hv UUID NOT NULL REFERENCES hoc_vien(ma_hv) ON DELETE CASCADE,
        ma_dt UUID REFERENCES de_tai(ma_dt) ON DELETE SET NULL,
        loai_don loai_don_hoc_vu_enum NOT NULL,
        so_thang INT NOT NULL DEFAULT 6,
        ly_do TEXT NOT NULL,
        y_kien_gvhd TEXT,
        trang_thai trang_thai_don_enum NOT NULL DEFAULT 'ChoDuyetGvhd',
        ngay_nop DATE NOT NULL DEFAULT CURRENT_DATE,
        ngay_duyet DATE,
        nguoi_duyet VARCHAR(100),
        quyet_dinh_so VARCHAR(100),
        file_dinh_kem_url VARCHAR(255),
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now(),
        ngay_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tien_do (
        ma_td UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ma_dt UUID NOT NULL REFERENCES de_tai(ma_dt) ON DELETE CASCADE,
        lan_bao_cao INT NOT NULL,
        noi_dung TEXT,
        nhan_xet_gvhd TEXT,
        diem_so NUMERIC(4,2),
        danh_gia_kq VARCHAR(30),
        file_bao_cao_url VARCHAR(255),
        ngay_bao_cao DATE NOT NULL DEFAULT CURRENT_DATE,
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (ma_dt, lan_bao_cao)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS bai_bao_khoa_hoc (
        ma_bb UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ma_hv UUID NOT NULL REFERENCES hoc_vien(ma_hv) ON DELETE CASCADE,
        tieu_de VARCHAR(300) NOT NULL,
        ten_tapchi_hoithao VARCHAR(200),
        phan_loai phan_loai_bb_enum,
        doi VARCHAR(100),
        issn VARCHAR(50),
        vai_tro_tac_gia VARCHAR(50),
        ngay_cong_bo DATE,
        file_minh_chung VARCHAR(255),
        link_bai_bao VARCHAR(255),
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS hoi_dong (
        ma_hd UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ma_dt UUID NOT NULL UNIQUE REFERENCES de_tai(ma_dt) ON DELETE CASCADE,
        cap_danh_gia cap_danh_gia_enum NOT NULL,
        ngay_bao_ve TIMESTAMPTZ NOT NULL,
        dia_diem VARCHAR(150),
        ket_qua VARCHAR(50) DEFAULT 'ChuaBaoVe',
        diem_tb NUMERIC(4,2),
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now(),
        ngay_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS thanhvien_hoidong (
        ma_hd UUID REFERENCES hoi_dong(ma_hd) ON DELETE CASCADE,
        ma_gv UUID REFERENCES giang_vien(ma_gv),
        chuc_danh chuc_danh_hd_enum NOT NULL,
        co_quan_ct VARCHAR(150) DEFAULT 'TrongCoSoDaoTao',
        diem_tieu_chi_1 NUMERIC(3,1),
        diem_tieu_chi_2 NUMERIC(3,1),
        diem_tieu_chi_3 NUMERIC(3,1),
        diem_tieu_chi_4 NUMERIC(3,1),
        tong_diem NUMERIC(4,2),
        nhan_xet TEXT,
        PRIMARY KEY (ma_hd, ma_gv)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tailieu_quyche (
        ma_tl UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ten_van_ban VARCHAR(300) NOT NULL,
        so_hieu_van_ban VARCHAR(50),
        loai_van_ban loai_van_ban_enum NOT NULL,
        co_quan_ban_hanh VARCHAR(150),
        ngay_ban_hanh DATE,
        ngay_hieu_luc DATE,
        pham_vi_ap_dung pham_vi_ad_enum NOT NULL DEFAULT 'Chung',
        duong_dan_file VARCHAR(255),
        trang_thai_hieu_luc BOOLEAN NOT NULL DEFAULT true,
        ngay_tao TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      DO $$
      DECLARE
        has_vector BOOLEAN;
      BEGIN
        SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector') INTO has_vector;
        IF has_vector THEN
          CREATE TABLE IF NOT EXISTS tailieu_chunk_vector (
            ma_chunk UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ma_tl UUID REFERENCES tailieu_quyche(ma_tl) ON DELETE CASCADE,
            dieu_khoan VARCHAR(50) NOT NULL,
            tieu_de VARCHAR(200) NOT NULL,
            noi_dung TEXT NOT NULL,
            tu_khoa TEXT[] NOT NULL,
            embedding vector(384)
          );
        ELSE
          CREATE TABLE IF NOT EXISTS tailieu_chunk_vector (
            ma_chunk UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ma_tl UUID REFERENCES tailieu_quyche(ma_tl) ON DELETE CASCADE,
            dieu_khoan VARCHAR(50) NOT NULL,
            tieu_de VARCHAR(200) NOT NULL,
            noi_dung TEXT NOT NULL,
            tu_khoa TEXT[] NOT NULL,
            embedding TEXT
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS hoithoai_ai (
        ma_ht UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ma_nd UUID NOT NULL REFERENCES nguoi_dung(ma_nd) ON DELETE CASCADE,
        thoi_gian_bat_dau TIMESTAMPTZ NOT NULL DEFAULT now(),
        chu_de VARCHAR(200)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tinnhan_ai (
        ma_tn UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ma_ht UUID NOT NULL REFERENCES hoithoai_ai(ma_ht) ON DELETE CASCADE,
        nguoi_gui nguoi_gui_enum NOT NULL,
        noi_dung TEXT NOT NULL,
        thoi_gian TIMESTAMPTZ NOT NULL DEFAULT now(),
        ma_tl_thamchieu UUID REFERENCES tailieu_quyche(ma_tl)
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_hocvien_chuyennganh ON hoc_vien(ma_chuyen_nganh);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_detai_hocvien ON de_tai(ma_hv);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_detai_gvhd ON de_tai(ma_gvhd);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_detai_trangthai ON de_tai(trang_thai);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_tiendo_detai ON tien_do(ma_dt);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_baibao_hocvien ON bai_bao_khoa_hoc(ma_hv);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_monhoc_chuyennganh ON mon_hoc(ma_cn);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_hoithoai_nguoidung ON hoithoai_ai(ma_nd);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_tinnhan_hoithoai ON tinnhan_ai(ma_ht);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_tailieu_hieuluc ON tailieu_quyche(trang_thai_hieu_luc) WHERE trang_thai_hieu_luc = true;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_donhocvu_hocvien ON don_hoc_vu(ma_hv);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_donhocvu_trangthai ON don_hoc_vu(trang_thai);`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_dem_ncs_dang_huongdan() RETURNS TRIGGER AS $$
      DECLARE
          target_gv_ids UUID[];
      BEGIN
          target_gv_ids := ARRAY[
              COALESCE(NEW.ma_gvhd, '00000000-0000-0000-0000-000000000000'::uuid),
              COALESCE(NEW.ma_gvhd2, '00000000-0000-0000-0000-000000000000'::uuid),
              COALESCE(OLD.ma_gvhd, '00000000-0000-0000-0000-000000000000'::uuid),
              COALESCE(OLD.ma_gvhd2, '00000000-0000-0000-0000-000000000000'::uuid)
          ];

          UPDATE giang_vien gv SET so_ncs_dang_hd = (
              COALESCE((
                  SELECT SUM(
                      CASE
                          WHEN dt.ma_gvhd = gv.ma_gv THEN 1.0
                          WHEN dt.ma_gvhd2 = gv.ma_gv THEN 0.5
                          ELSE 0.0
                      END
                  )
                  FROM de_tai dt
                  JOIN hoc_vien hv ON hv.ma_hv = dt.ma_hv
                  WHERE (dt.ma_gvhd = gv.ma_gv OR dt.ma_gvhd2 = gv.ma_gv)
                    AND hv.trinh_do = 'TienSi'
                    AND dt.trang_thai IN ('DaDuyet', 'DangThucHien', 'DuDKBaoVe', 'DuDieuKienBaoVe')
              ), 0.0)
          )
          WHERE gv.ma_gv = ANY(target_gv_ids);
          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_dem_ncs ON de_tai;
      CREATE TRIGGER trg_dem_ncs
      AFTER INSERT OR UPDATE OR DELETE ON de_tai
      FOR EACH ROW EXECUTE FUNCTION fn_dem_ncs_dang_huongdan();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_dem_ncs ON de_tai;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS fn_dem_ncs_dang_huongdan();`);
    await queryRunner.query(`DROP TABLE IF EXISTS don_hoc_vu;`);
    await queryRunner.query(`DROP TABLE IF EXISTS tinnhan_ai;`);
    await queryRunner.query(`DROP TABLE IF EXISTS hoithoai_ai;`);
    await queryRunner.query(`DROP TABLE IF EXISTS tailieu_chunk_vector;`);
    await queryRunner.query(`DROP TABLE IF EXISTS tailieu_quyche;`);
    await queryRunner.query(`DROP TABLE IF EXISTS thanhvien_hoidong;`);
    await queryRunner.query(`DROP TABLE IF EXISTS hoi_dong;`);
    await queryRunner.query(`DROP TABLE IF EXISTS bai_bao_khoa_hoc;`);
    await queryRunner.query(`DROP TABLE IF EXISTS tien_do;`);
    await queryRunner.query(`DROP TABLE IF EXISTS de_tai;`);
    await queryRunner.query(`DROP TABLE IF EXISTS dangky_monhoc;`);
    await queryRunner.query(`DROP TABLE IF EXISTS mon_hoc;`);
    await queryRunner.query(`DROP TABLE IF EXISTS giang_vien;`);
    await queryRunner.query(`DROP TABLE IF EXISTS hoc_vien;`);
    await queryRunner.query(`DROP TABLE IF EXISTS chuyen_nganh;`);
    await queryRunner.query(`DROP TABLE IF EXISTS nguoi_dung;`);
  }
}
