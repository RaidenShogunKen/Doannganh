    -- =====================================================================
    -- schema.sql
    -- Hệ thống quản lý đào tạo sau đại học tích hợp AI Tutor & RAG Engine
    -- Chuẩn hóa Cơ sở Dữ liệu & Tuân thủ Thông tư 18/2021 & 23/2021/TT-BGDĐT
    -- Target: PostgreSQL 14+ (Hỗ trợ pgcrypto & pgvector)
    -- =====================================================================

    CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- cho gen_random_uuid()
    CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector cho AI Tutor & Semantic Retrieval

    -- ---------------------------------------------------------------------
    -- ENUM TYPES
    -- ---------------------------------------------------------------------
    CREATE TYPE vai_tro_enum        AS ENUM ('HocVien', 'GiangVien', 'Admin');
    CREATE TYPE trinh_do_enum       AS ENUM ('ThacSi', 'TienSi');
    CREATE TYPE trang_thai_hv_enum  AS ENUM ('DangHoc', 'BaoLuu', 'TotNghiep', 'ThoiHoc');
    CREATE TYPE trang_thai_dt_enum  AS ENUM ('ChoDuyet', 'DaDuyet', 'DangThucHien', 'TuChoi', 'DuDKBaoVe', 'DuDieuKienBaoVe', 'DangBaoVe', 'DaBaoVe', 'KhongDat');
    CREATE TYPE phan_loai_bb_enum   AS ENUM ('ISI', 'Scopus', 'HDGSNN', 'TrongNuoc');
    CREATE TYPE cap_danh_gia_enum   AS ENUM ('CoSo', 'CapTruong');
    CREATE TYPE chuc_danh_hd_enum   AS ENUM ('ChuTich', 'PhanBien1', 'PhanBien2', 'ThuKy', 'UyVien');
    CREATE TYPE loai_hp_enum        AS ENUM ('BatBuoc', 'TuChon');
    CREATE TYPE trang_thai_dk_enum  AS ENUM ('DaDangKy', 'DaHoanThanh', 'Huy');
    CREATE TYPE loai_van_ban_enum   AS ENUM ('ThongTu', 'Luat', 'QuyChe_NoiBo', 'QuyetDinh');
    CREATE TYPE pham_vi_ad_enum     AS ENUM ('ThacSi', 'TienSi', 'Chung');
    CREATE TYPE nguoi_gui_enum      AS ENUM ('User', 'AI');
    CREATE TYPE loai_don_hoc_vu_enum AS ENUM ('BaoLuu', 'GiaHan', 'QuayLaiHoc');
    CREATE TYPE trang_thai_don_enum AS ENUM ('ChoDuyetGvhd', 'ChoDuyetAdmin', 'DaDuyet', 'TuChoi');
    CREATE TYPE trang_thai_tk_enum   AS ENUM ('Active', 'Locked', 'Graduated');
    CREATE TYPE ket_qua_thao_tac_enum AS ENUM ('Success', 'Warning', 'Info');
    CREATE TYPE loai_thong_bao_enum  AS ENUM ('DeTai', 'DonHocVu', 'TuyenSinh', 'HoiDong', 'BaiBao', 'HeThong');

    -- ---------------------------------------------------------------------
    -- NHÓM 1: NGƯỜI DÙNG & VAI TRÒ
    -- ---------------------------------------------------------------------
    CREATE TABLE nguoi_dung (
        ma_nd           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ho_ten          VARCHAR(100) NOT NULL,
        email           VARCHAR(100) NOT NULL UNIQUE,
        mat_khau_hash   VARCHAR(255) NOT NULL,
        vai_tro         vai_tro_enum NOT NULL,
        sdt             VARCHAR(15),
        trang_thai      trang_thai_tk_enum NOT NULL DEFAULT 'Active',
        ngay_tao        TIMESTAMPTZ NOT NULL DEFAULT now(),
        ngay_cap_nhat   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE chuyen_nganh (
        ma_cn               SERIAL PRIMARY KEY,
        ten_cn               VARCHAR(150) NOT NULL,
        trinh_do_dao_tao     trinh_do_enum NOT NULL,
        so_tin_chi_ct        INT DEFAULT 90,
        ngay_tao            TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE hoc_vien (
        ma_hv                 UUID PRIMARY KEY REFERENCES nguoi_dung(ma_nd) ON DELETE CASCADE,
        mshv                  VARCHAR(20) NOT NULL UNIQUE,
        ma_chuyen_nganh       INT REFERENCES chuyen_nganh(ma_cn),
        trinh_do              trinh_do_enum NOT NULL,
        khoa_hoc              VARCHAR(10),
        ngay_nhap_hoc         DATE NOT NULL DEFAULT CURRENT_DATE,
        trang_thai            trang_thai_hv_enum NOT NULL DEFAULT 'DangHoc',
        tong_so_thang_bao_luu INT NOT NULL DEFAULT 0,
        ngay_bat_dau_bao_luu  DATE,
        ngay_ket_thuc_bao_luu DATE,
        -- Thông tin nhân thân & hồ sơ khoa học (persist thay vì lưu localStorage)
        ngay_sinh             DATE,
        gioi_tinh             VARCHAR(10),
        so_cccd               VARCHAR(30),
        dia_chi               VARCHAR(300),
        bang_cap_dau_vao      VARCHAR(200),
        hinh_thuc_dao_tao     VARCHAR(100),
        co_quan_cong_tac      VARCHAR(200),
        ngoai_ngu             VARCHAR(200),
        huong_nghien_cuu      TEXT,
        ngay_tao              TIMESTAMPTZ NOT NULL DEFAULT now(),
        ngay_cap_nhat         TIMESTAMPTZ NOT NULL DEFAULT now()
    );

CREATE TABLE giang_vien (
    ma_gv           UUID PRIMARY KEY REFERENCES nguoi_dung(ma_nd) ON DELETE CASCADE,
    hoc_ham         VARCHAR(30), -- 'Giáo sư', 'Phó Giáo sư'
    hoc_vi          VARCHAR(30), -- 'Tiến sĩ', 'Tiến sĩ khoa học'
    chuyen_mon      VARCHAR(150),
    so_ncs_dang_hd  NUMERIC(4,1) NOT NULL DEFAULT 0.0,    -- đếm tự động theo TT 18/2021 (GVHD1 = 1.0 slot, GVHD2 = 0.5 slot; GS <= 7, PGS <= 5, TS <= 3)
    ngay_tao        TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngay_cap_nhat   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- NHÓM 2: ĐÀO TẠO & HỌC VỤ
-- ---------------------------------------------------------------------
CREATE TABLE mon_hoc (
    ma_mh       SERIAL PRIMARY KEY,
    ten_mh      VARCHAR(150) NOT NULL,
    so_tin_chi  INT NOT NULL,
    ma_cn       INT REFERENCES chuyen_nganh(ma_cn),
    loai_hp     loai_hp_enum NOT NULL DEFAULT 'BatBuoc',
    ngay_tao    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dangky_monhoc (
    ma_hv           UUID REFERENCES hoc_vien(ma_hv) ON DELETE CASCADE,
    ma_mh           INT  REFERENCES mon_hoc(ma_mh) ON DELETE CASCADE,
    hoc_ky_nam_hoc  VARCHAR(20) NOT NULL,
    diem            NUMERIC(4,2),
    trang_thai      trang_thai_dk_enum NOT NULL DEFAULT 'DaDangKy',
    ngay_dang_ky    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (ma_hv, ma_mh, hoc_ky_nam_hoc)
);

-- ---------------------------------------------------------------------
-- NHÓM 3: LUẬN VĂN / LUẬN ÁN & BẢO VỆ
-- ---------------------------------------------------------------------
CREATE TABLE de_tai (
    ma_dt                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_dt               VARCHAR(300) NOT NULL,
    ma_hv                UUID NOT NULL REFERENCES hoc_vien(ma_hv),
    ma_gvhd              UUID NOT NULL REFERENCES giang_vien(ma_gv),
    ma_gvhd2             UUID REFERENCES giang_vien(ma_gv),
    trang_thai           trang_thai_dt_enum NOT NULL DEFAULT 'ChoDuyet',
    ngay_dang_ky         DATE NOT NULL DEFAULT CURRENT_DATE,
    ngay_du_kien_bao_ve  DATE,
    tong_so_thang_gia_han INT NOT NULL DEFAULT 0,
    ngay_gia_han_cuoi    DATE,
    ngay_tao             TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngay_cap_nhat        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_gvhd_khac_gvhd2 CHECK (ma_gvhd2 IS NULL OR ma_gvhd2 <> ma_gvhd)
);

CREATE TABLE don_hoc_vu (
    ma_don            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_hv             UUID NOT NULL REFERENCES hoc_vien(ma_hv) ON DELETE CASCADE,
    ma_dt             UUID REFERENCES de_tai(ma_dt) ON DELETE SET NULL,
    loai_don          loai_don_hoc_vu_enum NOT NULL,
    so_thang          INT NOT NULL DEFAULT 6,
    ly_do             TEXT NOT NULL,
    y_kien_gvhd       TEXT,
    trang_thai        trang_thai_don_enum NOT NULL DEFAULT 'ChoDuyetGvhd',
    ngay_nop          DATE NOT NULL DEFAULT CURRENT_DATE,
    ngay_duyet        DATE,
    nguoi_duyet       VARCHAR(100),
    quyet_dinh_so     VARCHAR(100),
    file_dinh_kem_url VARCHAR(255),
    ngay_tao          TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngay_cap_nhat     TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE tien_do (
    ma_td           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_dt           UUID NOT NULL REFERENCES de_tai(ma_dt) ON DELETE CASCADE,
    lan_bao_cao     INT NOT NULL,
    noi_dung        TEXT,
    nhan_xet_gvhd   TEXT,
    diem_so         NUMERIC(4,2),
    danh_gia_kq     VARCHAR(30),
    file_bao_cao_url VARCHAR(255),
    ngay_bao_cao    DATE NOT NULL DEFAULT CURRENT_DATE,
    ngay_tao        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ma_dt, lan_bao_cao)
);

CREATE TABLE bai_bao_khoa_hoc (
    ma_bb                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_hv                UUID NOT NULL REFERENCES hoc_vien(ma_hv) ON DELETE CASCADE,
    tieu_de              VARCHAR(300) NOT NULL,
    ten_tapchi_hoithao   VARCHAR(200),
    phan_loai            phan_loai_bb_enum,
    doi                  VARCHAR(100),
    issn                 VARCHAR(50),
    vai_tro_tac_gia      VARCHAR(50),
    ngay_cong_bo         DATE,
    file_minh_chung      VARCHAR(255),
    link_bai_bao         VARCHAR(255),
    ngay_tao             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hoi_dong (
    ma_hd           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_dt           UUID NOT NULL REFERENCES de_tai(ma_dt) ON DELETE CASCADE,
    cap_danh_gia    cap_danh_gia_enum NOT NULL,
    ngay_bao_ve     TIMESTAMPTZ NOT NULL,
    dia_diem        VARCHAR(150),
    ket_qua         VARCHAR(50) DEFAULT 'ChuaBaoVe',
    diem_tb         NUMERIC(4,2),
    ngay_tao        TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngay_cap_nhat   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ma_dt, cap_danh_gia)
);

CREATE TABLE thanhvien_hoidong (
    ma_hd       UUID REFERENCES hoi_dong(ma_hd) ON DELETE CASCADE,
    ma_gv       UUID REFERENCES giang_vien(ma_gv),
    chuc_danh   chuc_danh_hd_enum NOT NULL,
    co_quan_ct  VARCHAR(150) DEFAULT 'TrongCoSoDaoTao',
    diem_tieu_chi_1 NUMERIC(3,1),
    diem_tieu_chi_2 NUMERIC(3,1),
    diem_tieu_chi_3 NUMERIC(3,1),
    diem_tieu_chi_4 NUMERIC(3,1),
    tong_diem       NUMERIC(4,2),
    nhan_xet        TEXT,
    PRIMARY KEY (ma_hd, ma_gv)
);

-- ---------------------------------------------------------------------
-- NHÓM 4: AI TUTOR & KHO TRI THỨC VECTƠ
-- ---------------------------------------------------------------------
CREATE TABLE tailieu_quyche (
    ma_tl               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_van_ban         VARCHAR(300) NOT NULL,
    so_hieu_van_ban     VARCHAR(50),
    loai_van_ban        loai_van_ban_enum NOT NULL,
    co_quan_ban_hanh    VARCHAR(150),
    ngay_ban_hanh       DATE,
    ngay_hieu_luc       DATE,
    pham_vi_ap_dung     pham_vi_ad_enum NOT NULL DEFAULT 'Chung',
    duong_dan_file      VARCHAR(255),
    trang_thai_hieu_luc BOOLEAN NOT NULL DEFAULT true,
    ngay_tao            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng đoạn quy chế phục vụ RAG Semantic Vector Search
CREATE TABLE tailieu_chunk_vector (
    ma_chunk            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_tl               UUID REFERENCES tailieu_quyche(ma_tl) ON DELETE CASCADE,
    dieu_khoan          VARCHAR(50) NOT NULL,
    tieu_de             VARCHAR(200) NOT NULL,
    noi_dung            TEXT NOT NULL,
    tu_khoa             TEXT[] NOT NULL,
    embedding           vector(384) -- Vector embedding 384 chiều (All-MiniLM / BGE-M3)
);

CREATE TABLE hoithoai_ai (
    ma_ht               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_nd               UUID NOT NULL REFERENCES nguoi_dung(ma_nd) ON DELETE CASCADE,
    thoi_gian_bat_dau   TIMESTAMPTZ NOT NULL DEFAULT now(),
    chu_de              VARCHAR(200)
);

CREATE TABLE tinnhan_ai (
    ma_tn           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_ht           UUID NOT NULL REFERENCES hoithoai_ai(ma_ht) ON DELETE CASCADE,
    nguoi_gui       nguoi_gui_enum NOT NULL,
    noi_dung        TEXT NOT NULL,
    thoi_gian       TIMESTAMPTZ NOT NULL DEFAULT now(),
    ma_tl_thamchieu UUID REFERENCES tailieu_quyche(ma_tl)
);

-- ---------------------------------------------------------------------
-- INDEXES & TỐI ƯU TRUY VẤN
-- ---------------------------------------------------------------------
CREATE INDEX idx_hocvien_chuyennganh   ON hoc_vien(ma_chuyen_nganh);
CREATE INDEX idx_detai_hocvien         ON de_tai(ma_hv);
CREATE INDEX idx_detai_gvhd            ON de_tai(ma_gvhd);
CREATE INDEX idx_detai_trangthai       ON de_tai(trang_thai);
CREATE INDEX idx_tiendo_detai          ON tien_do(ma_dt);
CREATE INDEX idx_baibao_hocvien        ON bai_bao_khoa_hoc(ma_hv);
CREATE INDEX idx_monhoc_chuyennganh    ON mon_hoc(ma_cn);
CREATE INDEX idx_hoithoai_nguoidung    ON hoithoai_ai(ma_nd);
CREATE INDEX idx_tinnhan_hoithoai      ON tinnhan_ai(ma_ht);
CREATE INDEX idx_tailieu_hieuluc       ON tailieu_quyche(trang_thai_hieu_luc) WHERE trang_thai_hieu_luc = true;
CREATE INDEX idx_donhocvu_hocvien      ON don_hoc_vu(ma_hv);
CREATE INDEX idx_donhocvu_trangthai    ON don_hoc_vu(trang_thai);

-- ---------------------------------------------------------------------
-- TRIGGER: Tự động cập nhật số NCS đang hướng dẫn theo TT 18/2021
-- (GVHD chính tính 1.0 định mức, Đồng GVHD tính 0.5 định mức theo Điều 13)
-- ---------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_dem_ncs ON de_tai;
CREATE TRIGGER trg_dem_ncs
AFTER INSERT OR UPDATE OR DELETE ON de_tai
FOR EACH ROW EXECUTE FUNCTION fn_dem_ncs_dang_huongdan();



-- =========================================================================
-- NHÓM 8: NHẬT KÝ THAO TÁC, THÔNG BÁO HỌC VỤ & KHO TRI THỨC RAG BỔ SUNG
-- =========================================================================

-- Audit Trail: truy vết mọi thao tác quản trị phục vụ kiểm định chất lượng GDĐH
CREATE TABLE IF NOT EXISTS nhat_ky_thao_tac (
    ma_log      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_nd       UUID REFERENCES nguoi_dung(ma_nd) ON DELETE SET NULL,
    ho_ten      VARCHAR(150) NOT NULL,
    vai_tro     VARCHAR(60)  NOT NULL,
    hanh_dong   TEXT         NOT NULL,
    dia_chi_ip  VARCHAR(100),
    ket_qua     ket_qua_thao_tac_enum NOT NULL DEFAULT 'Success',
    thoi_gian   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nhat_ky_thoi_gian ON nhat_ky_thao_tac (thoi_gian DESC);

-- Thông báo học vụ phân quyền (đẩy realtime qua SSE)
CREATE TABLE IF NOT EXISTS thong_bao (
    ma_tb        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_nd_nhan   UUID NOT NULL REFERENCES nguoi_dung(ma_nd) ON DELETE CASCADE,
    loai_tb      loai_thong_bao_enum NOT NULL DEFAULT 'HeThong',
    tieu_de      VARCHAR(200) NOT NULL,
    noi_dung     TEXT NOT NULL,
    duong_dan    VARCHAR(300),
    ma_lien_quan VARCHAR(100),
    da_doc       BOOLEAN NOT NULL DEFAULT FALSE,
    thoi_gian    TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_thong_bao_nguoi_nhan ON thong_bao (ma_nd_nhan, da_doc, thoi_gian DESC);

-- Kho tri thức RAG do Quản trị viên bổ sung tại runtime
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
    ngay_tao      TIMESTAMP NOT NULL DEFAULT now(),
    ngay_cap_nhat TIMESTAMP NOT NULL DEFAULT now()
);
