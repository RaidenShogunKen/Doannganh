-- Dữ liệu hư cấu cho CSDL demo riêng, nạp sau khi chạy migration.
-- Danh tính mới tạo cho bài demo. Không chứa số điện thoại, CCCD hoặc địa chỉ cá nhân.
DO $seed$
BEGIN
  IF EXISTS (SELECT 1 FROM nguoi_dung WHERE email NOT LIKE '%@example.test') THEN
    RAISE EXCEPTION 'Seed chỉ dành cho cơ sở dữ liệu demo riêng';
  END IF;
END
$seed$;

INSERT INTO nguoi_dung (ma_nd, ho_ten, email, mat_khau_hash, vai_tro) VALUES
  ('0ad6f6cc-c904-4e7f-bda0-905e830989b1', 'Quản trị viên mẫu 01', 'admin@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'Admin'),
  ('6d7713bc-7ea6-417e-95d7-f2640746e6c5', 'Giảng viên mẫu 01', 'giangvien01@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'GiangVien'),
  ('e1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c', 'Giảng viên mẫu 02', 'giangvien02@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'GiangVien'),
  ('f2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d', 'Giảng viên mẫu 03', 'giangvien03@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'GiangVien'),
  ('d3c4b5a6-7f8e-9a0b-1c2d-3e4f5a6b7c8d', 'Giảng viên mẫu 04', 'giangvien04@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'GiangVien'),
  ('a4b5c6d7-8e9f-0a1b-2c3d-4e5f6a7b8c9d', 'Giảng viên mẫu 05', 'giangvien05@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'GiangVien'),
  ('b5c6d7e8-9f0a-1b2c-3d4e-5f6a7b8c9d0e', 'Giảng viên mẫu 06', 'giangvien06@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'GiangVien'),
  ('c6d7e8f9-0a1b-2c3d-4e5f-6a7b8c9d0e1f', 'Giảng viên mẫu 07', 'giangvien07@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'GiangVien'),
  ('d7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a', 'Giảng viên mẫu 08', 'giangvien08@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'GiangVien'),
  ('c0d512ec-86b1-4acb-81c9-c3fce887cf08', 'Học viên mẫu 01', 'hocvien01@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'HocVien'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Học viên mẫu 02', 'hocvien02@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'HocVien'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Học viên mẫu 03', 'hocvien03@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'HocVien'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Học viên mẫu 04', 'hocvien04@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'HocVien'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Học viên mẫu 05', 'hocvien05@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'HocVien'),
  ('e5f6a7b8-c90d-1e2f-3a4b-5c6d7e8f9a0b', 'Học viên mẫu 06', 'hocvien06@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'HocVien'),
  ('f1000000-0000-4000-8000-000000000001', 'Học viên mẫu 07', 'hocvien07@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'HocVien'),
  ('f1000000-0000-4000-8000-000000000002', 'Học viên mẫu 08', 'hocvien08@example.test', '$2a$10$EwPTirI.CghzKNyjxRpJfeBtWC.2EeoG6Uj19zCeCDQQ.Dx1TKRc2', 'HocVien')
ON CONFLICT DO NOTHING;

-- 2. CHUYÊN NGÀNH ĐÀO TẠO ĐA LĨNH VỰC (8 Chuyên ngành tiêu biểu)
INSERT INTO chuyen_nganh (ma_cn, ten_cn, trinh_do_dao_tao, so_tin_chi_ct) VALUES
  (1, 'Khoa học Máy tính & Trí tuệ Nhân tạo', 'TienSi', 90),
  (2, 'Quản trị Kinh doanh & Kinh tế số', 'TienSi', 90),
  (3, 'Tài chính - Ngân hàng & Công nghệ Tài chính (Fintech)', 'ThacSi', 60),
  (4, 'Luật Kinh tế & Quản trị Pháp lý Doanh nghiệp', 'ThacSi', 60),
  (5, 'Kỹ thuật Xây dựng & Công trình Thông minh', 'TienSi', 90),
  (6, 'Y tế Công cộng & Quản lý Y tế', 'TienSi', 90),
  (7, 'Ngôn ngữ học Ứng dụng & Phương pháp Giảng dạy (TESOL)', 'ThacSi', 60),
  (8, 'Công nghệ Sinh học & Y sinh Học', 'TienSi', 90)
ON CONFLICT (ma_cn) DO UPDATE SET
  ten_cn = EXCLUDED.ten_cn,
  trinh_do_dao_tao = EXCLUDED.trinh_do_dao_tao,
  so_tin_chi_ct = EXCLUDED.so_tin_chi_ct;

-- 3. HỒ SƠ GIẢNG VIÊN HƯỚNG DẪN ĐA NGÀNH
INSERT INTO giang_vien (ma_gv, hoc_ham, hoc_vi, chuyen_mon, so_ncs_dang_hd) VALUES
  ('6d7713bc-7ea6-417e-95d7-f2640746e6c5', 'Giáo sư', 'Tiến sĩ khoa học', 'Trí tuệ Nhân tạo & Xử lý Ngôn ngữ Tự nhiên', 2),
  ('e1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c', 'Phó Giáo sư', 'Tiến sĩ', 'Quản trị Chiến lược & Kinh tế số', 2),
  ('f2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d', 'Giáo sư', 'Tiến sĩ', 'Tài chính Doanh nghiệp & Kinh tế lượng', 1),
  ('d3c4b5a6-7f8e-9a0b-1c2d-3e4f5a6b7c8d', 'Phó Giáo sư', 'Tiến sĩ', 'Luật Thương mại Quốc tế & Sở hữu Trí tuệ', 1),
  ('a4b5c6d7-8e9f-0a1b-2c3d-4e5f6a7b8c9d', 'Tiến sĩ', 'Tiến sĩ', 'Kỹ thuật Kết cấu & Vật liệu Xây dựng Bền vững', 1),
  ('b5c6d7e8-9f0a-1b2c-3d4e-5f6a7b8c9d0e', 'Giáo sư', 'Tiến sĩ', 'Dịch tễ học & Y tế Công cộng', 1),
  ('c6d7e8f9-0a1b-2c3d-4e5f-6a7b8c9d0e1f', 'Phó Giáo sư', 'Tiến sĩ', 'Ngôn ngữ học Đối chiếu & Khảo thí Tiếng Anh', 1),
  ('d7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a', 'Tiến sĩ', 'Tiến sĩ', 'Công nghệ Gen Y sinh & Liệu pháp Tế bào', 1)
ON CONFLICT (ma_gv) DO UPDATE SET
  hoc_ham = EXCLUDED.hoc_ham,
  hoc_vi = EXCLUDED.hoc_vi,
  chuyen_mon = EXCLUDED.chuyen_mon;

-- 4. Hồ sơ học viên hư cấu
INSERT INTO hoc_vien (ma_hv, mshv, ma_chuyen_nganh, trinh_do, khoa_hoc, ngay_nhap_hoc, trang_thai) VALUES
  ('c0d512ec-86b1-4acb-81c9-c3fce887cf08', 'DEMO-NCS-01', 1, 'TienSi', 'DEMO-K2024', '2024-09-15', 'DangHoc'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'DEMO-NCS-02', 2, 'TienSi', 'DEMO-K2024', '2024-09-15', 'DangHoc'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'DEMO-HV-03', 3, 'ThacSi', 'DEMO-K2025', '2025-03-01', 'DangHoc'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'DEMO-HV-04', 4, 'ThacSi', 'DEMO-K2025', '2025-03-01', 'DangHoc'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'DEMO-NCS-05', 5, 'TienSi', 'DEMO-K2023', '2023-10-10', 'DangHoc'),
  ('e5f6a7b8-c90d-1e2f-3a4b-5c6d7e8f9a0b', 'DEMO-NCS-06', 6, 'TienSi', 'DEMO-K2024', '2024-09-15', 'DangHoc'),
  ('f1000000-0000-4000-8000-000000000001', 'DEMO-HV-07', 3, 'ThacSi', 'DEMO-K23', '2023-09-01', 'DangHoc'),
  ('f1000000-0000-4000-8000-000000000002', 'DEMO-HV-08', 4, 'ThacSi', 'DEMO-K23', '2023-09-01', 'DangHoc')
ON CONFLICT DO NOTHING;

-- 5. MÔN HỌC & CHUYÊN ĐỀ TIẾN SĨ ĐA NGÀNH
INSERT INTO mon_hoc (ma_mh, ten_mh, so_tin_chi, ma_cn, loai_hp) VALUES
  -- Môn chung & Khoa học máy tính
  (1, 'Phương pháp Nghiên cứu Khoa học Sau Đại học', 3, 1, 'BatBuoc'),
  (2, 'Học sâu Nâng cao & Ứng dụng', 3, 1, 'BatBuoc'),
  (3, 'Xử lý Ngôn ngữ Tự nhiên & LLM Agents', 3, 1, 'TuChon'),
  (4, 'Chuyên đề Tiến sĩ 1 (CNTT): Kiến trúc RAG và Vector Database', 3, 1, 'BatBuoc'),
  (5, 'Chuyên đề Tiến sĩ 2 (CNTT): Độ tin cậy & Liêm chính Học thuật AI', 3, 1, 'BatBuoc'),

  -- Quản trị kinh doanh
  (6, 'Kinh tế lượng Nâng cao & Phân tích Dữ liệu Kinh doanh', 3, 2, 'BatBuoc'),
  (7, 'Quản trị Chiến lược Doanh nghiệp trong Kỷ nguyên số', 3, 2, 'BatBuoc'),
  (8, 'Chuyên đề Tiến sĩ (QTKD): Đổi mới Sáng tạo & Hành vi Tiêu dùng Số', 3, 2, 'BatBuoc'),

  -- Tài chính - Ngân hàng
  (9, 'Mô hình Định giá Tài sản & Quản trị Rủi ro Tài chính', 3, 3, 'BatBuoc'),
  (10, 'Công nghệ Tài chính (Fintech) & Ngân hàng Số', 3, 3, 'TuChon'),

  -- Luật Kinh tế
  (11, 'Pháp luật Cạnh tranh & Chống Độc quyền Quốc tế', 3, 4, 'BatBuoc'),
  (12, 'Pháp chế Doanh nghiệp & Quản trị Pháp lý Rủi ro ESG', 3, 4, 'BatBuoc'),

  -- Kỹ thuật Xây dựng
  (13, 'Mô hình hóa Kết cấu Công trình & Địa kỹ thuật Nâng cao', 3, 5, 'BatBuoc'),
  (14, 'Vật liệu Xây dựng Xanh & Công trình Bền vững', 3, 5, 'BatBuoc'),

  -- Y tế Công cộng
  (15, 'Dịch tễ học Nâng cao & Thống kê Sinh học', 3, 6, 'BatBuoc'),
  (16, 'Quản lý Chính sách Y tế & Kinh tế Y tế', 3, 6, 'BatBuoc')
ON CONFLICT (ma_mh) DO NOTHING;

-- 6. ĐĂNG KÝ MÔN HỌC & ĐIỂM SỐ MẪU
INSERT INTO dangky_monhoc (ma_hv, ma_mh, hoc_ky_nam_hoc, diem, trang_thai) VALUES
  ('c0d512ec-86b1-4acb-81c9-c3fce887cf08', 1, 'HK1_2024-2025', 9.0, 'DaHoanThanh'),
  ('c0d512ec-86b1-4acb-81c9-c3fce887cf08', 2, 'HK1_2024-2025', 9.2, 'DaHoanThanh'),
  ('c0d512ec-86b1-4acb-81c9-c3fce887cf08', 3, 'HK2_2024-2025', 9.5, 'DaHoanThanh'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 1, 'HK1_2024-2025', 8.8, 'DaHoanThanh'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 6, 'HK1_2024-2025', 9.0, 'DaHoanThanh'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 7, 'HK2_2024-2025', 9.3, 'DaHoanThanh')
ON CONFLICT DO NOTHING;

-- 7. ĐỀ TÀI LUẬN ÁN TIẾN SĨ / LUẬN VĂN THẠC SĨ ĐA NGÀNH
INSERT INTO de_tai (ma_dt, ten_dt, ma_hv, ma_gvhd, ma_gvhd2, trang_thai, ngay_dang_ky, ngay_du_kien_bao_ve) VALUES
  -- 1. CNTT / AI
  ('11111111-2222-3333-4444-555555555555',
   'Nghiên cứu kiến trúc RAG và Vector Search thế hệ mới tối ưu hóa xử lý văn bản quy chuẩn giáo dục đại học',
   'c0d512ec-86b1-4acb-81c9-c3fce887cf08',
   '6d7713bc-7ea6-417e-95d7-f2640746e6c5',
   'e1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
   'DangThucHien',
   '2024-09-15',
   '2026-11-20'),

  -- 2. Quản trị kinh doanh
  ('22222222-3333-4444-5555-666666666666',
   'Tác động của chuyển đổi số và năng lực động đến hiệu quả kinh doanh của các doanh nghiệp bán lẻ tại Việt Nam',
   'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
   'e1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
   'f2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
   'DangThucHien',
   '2024-09-15',
   '2027-06-30'),

  -- 3. Tài chính - Ngân hàng
  ('33333333-4444-5555-6666-777777777777',
   'Ứng dụng học máy trong phát hiện gian lận giao dịch thẻ ngân hàng và bảo vệ người tiêu dùng số',
   'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
   'f2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
   NULL,
   'ChoDuyet',
   '2025-03-10',
   '2026-12-15'),

  -- 4. Kỹ thuật Xây dựng
  ('44444444-5555-6666-7777-888888888888',
   'Nghiên cứu ứng xử động lực học và độ bền mỏi của cầu dây văng dưới tác động của tải trọng gió bão và động đất',
   'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
   'a4b5c6d7-8e9f-0a1b-2c3d-4e5f6a7b8c9d',
   NULL,
   'DaBaoVe',
   '2023-10-10',
   '2026-09-25'),

  -- 5. Y tế Công cộng
  ('55555555-6666-7777-8888-999999999999',
   'Đánh giá hiệu quả mô hình can thiệp sức khỏe tâm thần học đường dựa trên công nghệ số tại các đô thị lớn',
   'e5f6a7b8-c90d-1e2f-3a4b-5c6d7e8f9a0b',
   'b5c6d7e8-9f0a-1b2c-3d4e-5f6a7b8c9d0e',
   NULL,
   'DangThucHien',
   '2024-09-15',
   '2027-08-30')
ON CONFLICT (ma_dt) DO NOTHING;

-- 8. TIẾN ĐỘ BÁO CÁO 6 THÁNG ĐỊNH KỲ
INSERT INTO tien_do (ma_dt, lan_bao_cao, noi_dung, nhan_xet_gvhd, diem_so, danh_gia_kq, ngay_bao_cao) VALUES
  ('11111111-2222-3333-4444-555555555555', 1,
   'Hoàn thành tổng quan tài liệu khoa học về RAG Pipeline, phân tích 85 bài báo quốc tế liên quan và thiết kế kiến trúc hệ thống cơ sở tri thức Thông tư 18/2021.',
   'NCS bám sát kế hoạch nghiên cứu, kết quả tổng quan sâu sắc. Đồng ý nghiệm thu tiến độ đợt 1.',
   9.0, 'DatYeuCau', '2025-06-28'),
  ('11111111-2222-3333-4444-555555555555', 2,
   'Triển khai thuật toán Vector Search kết hợp Hybrid Dense-Sparse retrieval; hoàn thiện bản thảo bài báo gửi tạp chí IEEE/Scopus Q1.',
   'Tiến độ xuất sắc, kết quả thực nghiệm vượt mốc baseline 14.2%. Tiếp tục chuẩn bị hồ sơ chuyên môn.',
   9.5, 'XuatSac', '2025-12-25'),
  ('22222222-3333-4444-5555-666666666666', 1,
   'Khảo sát thực nghiệm 320 doanh nghiệp bán lẻ và ước lượng mô hình SEM (Structural Equation Modeling) về chuyển đổi số.',
   'Bộ dữ liệu mẫu đạt chuẩn, phương pháp xử lý số liệu chuẩn xác. Đạt yêu cầu.',
   9.0, 'DatYeuCau', '2025-06-30')
ON CONFLICT (ma_dt, lan_bao_cao) DO NOTHING;

-- 9. Công bố hư cấu, dùng để trình diễn thống kê.
INSERT INTO bai_bao_khoa_hoc (ma_bb, ma_hv, tieu_de, ten_tapchi_hoithao, phan_loai, vai_tro_tac_gia, ngay_cong_bo) VALUES
  ('77777777-1111-2222-3333-444444444444', 'c0d512ec-86b1-4acb-81c9-c3fce887cf08', 'Bài mẫu 01 về truy hồi tài liệu', 'Tạp chí mô phỏng A', 'Scopus', 'Tác giả thứ nhất', '2026-02-15'),
  ('88888888-2222-3333-4444-555555555555', 'c0d512ec-86b1-4acb-81c9-c3fce887cf08', 'Bài mẫu 02 về tìm kiếm học vụ', 'Tạp chí mô phỏng B', 'ISI', 'Tác giả liên hệ', '2025-11-10'),
  ('99999999-3333-4444-5555-666666666666', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Bài mẫu 03 về chuyển đổi số', 'Tạp chí mô phỏng C', 'ISI', 'Tác giả thứ nhất', '2025-12-05')
ON CONFLICT DO NOTHING;

-- 11. Hội đồng tiến sĩ mẫu đã hoàn thành
INSERT INTO hoi_dong (ma_hd, ma_dt, cap_danh_gia, ngay_bao_ve, dia_diem, ket_qua, diem_tb) VALUES
  ('aaaa1111-bbbb-2222-cccc-333344445555',
   '44444444-5555-6666-7777-888888888888',
   'CapTruong',
   '2026-06-25 08:30:00+07',
   'Phòng hội thảo mẫu A',
   'Đạt yêu cầu cấp bằng',
   9.45)
ON CONFLICT (ma_hd) DO NOTHING;

-- 12. THÀNH VIÊN HỘI ĐỒNG (7 Chuyên gia: 4 GS/PGS >= 50%, 2 chuyên gia ngoài trường, 2 phản biện)
INSERT INTO thanhvien_hoidong (ma_hd, ma_gv, chuc_danh, co_quan_ct, diem_tieu_chi_1, diem_tieu_chi_2, diem_tieu_chi_3, diem_tieu_chi_4, tong_diem, nhan_xet) VALUES
  ('aaaa1111-bbbb-2222-cccc-333344445555', '6d7713bc-7ea6-417e-95d7-f2640746e6c5', 'ChuTich', 'TrongCoSoDaoTao', 2.0, 2.9, 2.9, 1.9, 9.7, 'Luận án đạt chất lượng rất xuất sắc, phương pháp luận vững chắc.'),
  ('aaaa1111-bbbb-2222-cccc-333344445555', 'e1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c', 'PhanBien1', 'TrongCoSoDaoTao', 1.9, 2.8, 2.8, 1.8, 9.3, 'Bản thảo luận án công phu, có đóng góp mới rõ ràng.'),
  ('aaaa1111-bbbb-2222-cccc-333344445555', 'f2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d', 'PhanBien2', 'Cơ sở đào tạo mẫu B', 2.0, 2.9, 2.8, 1.8, 9.5, 'Công trình nghiên cứu có giá trị thực tiễn cao, phản biện đồng ý thông qua.'),
  ('aaaa1111-bbbb-2222-cccc-333344445555', 'd3c4b5a6-7f8e-9a0b-1c2d-3e4f5a6b7c8d', 'ThuKy', 'TrongCoSoDaoTao', 1.9, 2.8, 2.9, 1.9, 9.5, 'Hồ sơ đầy đủ, trả lời câu hỏi tự tin và thuyết phục.'),
  ('aaaa1111-bbbb-2222-cccc-333344445555', 'b5c6d7e8-9f0a-1b2c-3d4e-5f6a7b8c9d0e', 'UyVien', 'Viện nghiên cứu mẫu C', 2.0, 2.8, 2.8, 1.8, 9.4, 'Đóng góp mới được kiểm chứng qua các bài báo quốc tế.'),
  ('aaaa1111-bbbb-2222-cccc-333344445555', 'c6d7e8f9-0a1b-2c3d-4e5f-6a7b8c9d0e1f', 'UyVien', 'TrongCoSoDaoTao', 1.9, 2.8, 2.9, 1.9, 9.5, 'Đồng ý cấp bằng Tiến sĩ cho NCS.'),
  ('aaaa1111-bbbb-2222-cccc-333344445555', 'd7e8f9a0-1b2c-3d4e-5f6a-7b8c9d0e1f2a', 'UyVien', 'TrongCoSoDaoTao', 1.8, 2.7, 2.8, 1.8, 9.1, 'Thuyết trình mạch lạc, kết cấu luận án chuẩn mực.')
ON CONFLICT (ma_hd, ma_gv) DO NOTHING;

-- Hồ sơ lịch sử hư cấu để trình diễn tương quan điểm
INSERT INTO de_tai (ma_dt, ten_dt, ma_hv, ma_gvhd, trang_thai, ngay_dang_ky) VALUES
  ('f2000000-0000-4000-8000-000000000001', 'Mô phỏng phân loại rủi ro tín dụng trên dữ liệu tổng hợp', 'f1000000-0000-4000-8000-000000000001', '6d7713bc-7ea6-417e-95d7-f2640746e6c5', 'DaBaoVe', '2024-03-15'),
  ('f2000000-0000-4000-8000-000000000002', 'Mô phỏng đánh giá quy trình xử lý tranh chấp hợp đồng', 'f1000000-0000-4000-8000-000000000002', '6d7713bc-7ea6-417e-95d7-f2640746e6c5', 'DaBaoVe', '2024-03-15')
ON CONFLICT DO NOTHING;

INSERT INTO hoi_dong (ma_hd, ma_dt, cap_danh_gia, ngay_bao_ve, dia_diem, ket_qua, diem_tb) VALUES
  ('f3000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'CapTruong', '2025-06-20 08:00:00+07', 'Phòng hội đồng mẫu', 'Thông qua', 8.2),
  ('f3000000-0000-4000-8000-000000000002', 'f2000000-0000-4000-8000-000000000002', 'CapTruong', '2025-06-20 08:00:00+07', 'Phòng hội đồng mẫu', 'Thông qua', 7.4)
ON CONFLICT DO NOTHING;

INSERT INTO tien_do (ma_dt, lan_bao_cao, noi_dung, nhan_xet_gvhd, diem_so, danh_gia_kq, ngay_bao_cao) VALUES
  ('44444444-5555-6666-7777-888888888888', 1, 'Báo cáo mô phỏng đánh giá kết cấu.', 'Đã hoàn thành kỳ báo cáo mẫu.', 9.1, 'Dat', '2025-12-18'),
  ('f2000000-0000-4000-8000-000000000001', 1, 'Báo cáo mẫu trên dữ liệu tổng hợp.', 'Đã chấm báo cáo mẫu.', 7.5, 'Dat', '2025-04-10'),
  ('f2000000-0000-4000-8000-000000000002', 1, 'Báo cáo mẫu trên dữ liệu tổng hợp.', 'Đã chấm báo cáo mẫu.', 6.8, 'Dat', '2025-04-10')
ON CONFLICT DO NOTHING;

-- Đồng bộ bộ đếm sau khi nạp mã danh mục cố định.
SELECT setval(pg_get_serial_sequence('chuyen_nganh', 'ma_cn'), (SELECT MAX(ma_cn) FROM chuyen_nganh));
SELECT setval(pg_get_serial_sequence('mon_hoc', 'ma_mh'), (SELECT MAX(ma_mh) FROM mon_hoc));
