import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/dang-nhap') {
        window.location.href = '/dang-nhap';
      }
    }
    return Promise.reject(err);
  },
);

export type VaiTro = 'HocVien' | 'GiangVien' | 'Admin';

export interface CurrentUser {
  maNd: string;
  hoTen: string;
  email: string;
  vaiTro: VaiTro;
  hocVien?: {
    maHv: string;
    mshv?: string;
    trinhDo?: 'TienSi' | 'ThacSi';
    khoaHoc?: string;
    maChuyenNganh?: number;
    trangThai?: string;
    anhDaiDienUrl?: string;
  };
  giangVien?: {
    maGv: string;
    hocHam?: string;
    hocVi?: string;
    chuyenMon?: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: CurrentUser;
}

export const authApi = {
  login: (email: string, matKhau: string) => api.post<AuthResponse>('/auth/login', { email, matKhau }),
  me: () => api.get<CurrentUser>('/auth/me'),
  register: (data: { hoTen: string; email: string; matKhau: string; vaiTro?: VaiTro }) =>
    api.post<AuthResponse>('/auth/register', data),
};

export interface DeTai {
  maDt: string;
  tenDt: string;
  tenDtEn?: string;
  thuyetMinh?: string;
  fileDeCuong?: string;
  ngayXacNhanBaoVe?: string;
  maGvhd?: string;
  maGvhd2?: string;
  trangThai: string;
  ngayDangKy: string;
  ngayDuKienBaoVe: string | null;
  hanNopLuanAn?: string;
  tongSoThangGiaHan?: number;
  hocVien?: {
    maHv: string;
    trangThai?: string;
    soQuyetDinhTotNghiep?: string;
    ngayQuyetDinhTotNghiep?: string;
    trinhDo?: string;
    chuyenNganh?: ChuyenNganh | { maCn?: number; tenCn?: string };
    nguoiDung?: { hoTen: string; email: string };
  };
  giangVienHuongDan?: { maGv: string; hocHam?: string; hocVi?: string; chuyenMon?: string; nguoiDung?: { hoTen: string } };
  giangVienHuongDan2?: { maGv: string; hocHam?: string; hocVi?: string; chuyenMon?: string; nguoiDung?: { hoTen: string } };
}

export type LoaiMinhChung = 'BanThao' | 'NgoaiNgu' | 'CongBo' | 'DanhGiaDonVi' | 'PhanBien' | 'LiemChinh';
export type TrangThaiMinhChung = 'ChoDuyet' | 'DaDuyet' | 'CanBoSung';
export interface ChecklistBaoVe {
  duDieuKien: boolean;
  coTheXacNhan: boolean;
  tieuChi: {
    id: LoaiMinhChung | 'HocPhan' | 'TienDo';
    ten: string;
    dat: boolean;
    chiTiet: string;
    evidence: { trangThai: TrangThaiMinhChung; fileUrl?: string } | null;
    canSubmit: boolean;
    canReview: boolean;
  }[];
}

export const deTaiApi = {
  list: () => api.get<DeTai[]>('/de-tai'),
  getAll: () => api.get<DeTai[]>('/de-tai'),
  getById: (maDt: string) => api.get<DeTai>(`/de-tai/${maDt}`),
  create: (data: { tenDt: string; tenDtEn?: string; thuyetMinh?: string; fileDeCuong?: string; maGvhd: string; maGvhd2?: string }) =>
    api.post<DeTai>('/de-tai', data),
  updateTrangThai: (maDt: string, trangThai: string) =>
    api.patch<DeTai>(`/de-tai/${maDt}/trang-thai`, { trangThai }),
  capNhatHanNop: (maDt: string, hanNopLuanAn: string) =>
    api.patch(`/de-tai/${maDt}/han-nop-luan-an`, { hanNopLuanAn }),
  xacNhanDuDieuKien: (maDt: string) =>
    api.patch<{ deTai: DeTai; thongBao?: string }>(`/de-tai/${maDt}/xac-nhan-du-dieu-kien`),
  checklist: (maDt: string) => api.get<ChecklistBaoVe>(`/de-tai/${maDt}/dieu-kien-bao-ve`),
  nopMinhChung: (maDt: string, loai: LoaiMinhChung, fileUrl: string) =>
    api.post<ChecklistBaoVe>(`/de-tai/${maDt}/minh-chung-bao-ve`, { loai, fileUrl }),
  duyetMinhChung: (maDt: string, loai: LoaiMinhChung, trangThai: TrangThaiMinhChung, ghiChu: string) =>
    api.patch<ChecklistBaoVe>(`/de-tai/${maDt}/minh-chung-bao-ve`, { loai, trangThai, ghiChu }),
};

export interface ChuyenNganh {
  maCn: number;
  tenCn: string;
  trinhDoDaoTao: string;
  soTinChiCt?: number;
  soTinChiHocPhan?: number | null;
}
export const chuyenNganhApi = {
  list: () => api.get<ChuyenNganh[]>('/chuyen-nganh'),
  create: (data: { tenCn: string; trinhDoDaoTao: string; soTinChiCt?: number }) =>
    api.post<ChuyenNganh>('/chuyen-nganh', data),
  cauHinhHocPhan: (maCn: number, soTinChiHocPhan: number) =>
    api.patch<ChuyenNganh>(`/chuyen-nganh/${maCn}/hoc-phan`, { soTinChiHocPhan }),
};

export interface HoSoHocVienData {
  mshv: string;
  maChuyenNganh: number;
  trinhDo: string;
  khoaHoc?: string;
  ngaySinh?: string;
  gioiTinh?: string;
  soCccd?: string;
  soDienThoai?: string;
  diaChi?: string;
  bangCapDauVao?: string;
  hinhThucDaoTao?: string;
  coQuanCongTac?: string;
  ngoaiNgu?: string;
  huongNghienCuu?: string;
  anhDaiDienUrl?: string;
}

export const hoSoApi = {
  hoanThienHocVien: (data: HoSoHocVienData) =>
    api.put('/ho-so/hoc-vien', data),
  hoanThienGiangVien: (data: { hocHam?: string; hocVi?: string; chuyenMon?: string }) =>
    api.put('/ho-so/giang-vien', data),
  hoSoHocVienCuaToi: () => api.get<{
    maHv: string;
    mshv: string;
    trinhDo: string;
    trangThai?: string;
    soQuyetDinhTotNghiep?: string;
    ngayQuyetDinhTotNghiep?: string;
    fileQuyetDinhTotNghiep?: string;
    khoaHoc?: string;
    maChuyenNganh?: number;
    ngaySinh?: string;
    gioiTinh?: string;
    soCccd?: string;
    diaChi?: string;
    bangCapDauVao?: string;
    hinhThucDaoTao?: string;
    coQuanCongTac?: string;
    ngoaiNgu?: string;
    huongNghienCuu?: string;
    anhDaiDienUrl?: string;
    nguoiDung?: { hoTen: string; email: string; sdt?: string };
    chuyenNganh?: ChuyenNganh;
  }>('/ho-so/hoc-vien/toi'),
  hoSoGiangVienCuaToi: () => api.get<{
    maGv: string;
    hocHam?: string;
    hocVi?: string;
    chuyenMon?: string;
    soNcsDangHd?: number;
    nguoiDung?: { hoTen: string; email: string; sdt?: string };
  }>('/ho-so/giang-vien/toi'),
  ghiNhanTotNghiep: (maDt: string, data: { soQuyetDinh: string; ngayQuyetDinh: string; fileUrl: string; daDoiChieu: boolean }) =>
    api.post(`/ho-so/tot-nghiep/${maDt}`, data),
};

export interface DonTuyenSinh {
  maDon: string;
  hoTen: string;
  email: string;
  trinhDoDangKy: 'ThacSi' | 'TienSi';
  chuyenNganhDangKy?: string;
  bangTotNghiepUrl?: string;
  bangTiengAnhUrl?: string;
  lyLichKhoaHocUrl?: string;
  ghiChuAdmin?: string;
  fileQuyetDinhUrl?: string;
  trangThai: 'ChoDuyet' | 'DaDuyet' | 'TuChoi' | 'DaNhapHoc';
}

export const tuyenSinhApi = {
  list: () => api.get<DonTuyenSinh[]>('/ho-so/don-tuyen-sinh'),
  create: (data: Pick<DonTuyenSinh, 'hoTen' | 'email' | 'trinhDoDangKy' | 'chuyenNganhDangKy' | 'bangTotNghiepUrl' | 'bangTiengAnhUrl' | 'lyLichKhoaHocUrl'>) =>
    api.post<DonTuyenSinh>('/ho-so/don-tuyen-sinh', data),
  duyet: (maDon: string, fileQuyetDinhUrl: string) => api.patch<DonTuyenSinh>(`/ho-so/don-tuyen-sinh/${maDon}/duyet`, { fileQuyetDinhUrl }),
  tuChoi: (maDon: string, lyDo: string) => api.patch<DonTuyenSinh>(`/ho-so/don-tuyen-sinh/${maDon}/tu-choi`, { lyDo }),
  nhapHoc: (maDon: string, data: { mshv: string; maChuyenNganh: number; khoaHoc: string; ngayNhapHoc: string }) =>
    api.patch<DonTuyenSinh>(`/ho-so/don-tuyen-sinh/${maDon}/nhap-hoc`, data),
};

export interface MonHoc {
  maMh: number;
  tenMh: string;
  soTinChi: number;
  maCn?: number;
  loaiHp: 'BatBuoc' | 'TuChon';
  chuyenNganh?: ChuyenNganh;
}

export interface DangKyMonHoc {
  maHv: string;
  maMh: number;
  hocKyNamHoc: string;
  diem?: number;
  trangThai: 'DaDangKy' | 'DaHoanThanh' | 'Huy';
  monHoc?: MonHoc;
}

export interface PhanCongGiangDay {
  maMh: number;
  maGv: string;
  hocKyNamHoc: string;
  hoTen: string;
  monHoc: MonHoc;
}

export interface HocVienChamDiem {
  maHv: string;
  mshv: string;
  hoTen: string;
  diem: string | null;
}

export interface CourseSummary {
  gpa10: number;
  xepLoai: string;
  tongTinChiTichLuy: number;
  tongMonHoanThanh: number;
}

export const monHocApi = {
  list: (maCn?: number) => api.get<MonHoc[]>('/mon-hoc', { params: { maCn } }),
  create: (data: { tenMh: string; soTinChi: number; maCn?: number; loaiHp: 'BatBuoc' | 'TuChon' }) =>
    api.post<MonHoc>('/mon-hoc', data),
  dangKy: (data: { maMh: number; hocKyNamHoc: string }) =>
    api.post<DangKyMonHoc>('/mon-hoc/dang-ky', data),
  listDangKy: (maHv: string) => api.get<DangKyMonHoc[]>(`/mon-hoc/dang-ky/${maHv}`),
  gpa: (maHv: string) => api.get<CourseSummary>(`/mon-hoc/gpa/${maHv}`),
  capNhatDiem: (data: { maHv: string; maMh: number; hocKyNamHoc: string; diem: number }) =>
    api.patch<DangKyMonHoc>('/mon-hoc/diem', data),
  huyDangKy: (maMh: number, hocKy: string) =>
    api.delete(`/mon-hoc/dang-ky/${maMh}/${encodeURIComponent(hocKy)}`),
  danhSachPhanCong: () => api.get<PhanCongGiangDay[]>('/mon-hoc/phan-cong'),
  phanCong: (data: Pick<PhanCongGiangDay, 'maMh' | 'maGv' | 'hocKyNamHoc'>) =>
    api.post('/mon-hoc/phan-cong', data),
  huyPhanCong: (data: Pick<PhanCongGiangDay, 'maMh' | 'maGv' | 'hocKyNamHoc'>) =>
    api.delete('/mon-hoc/phan-cong', { data }),
  danhSachChamDiem: (maMh: number, hocKy: string) =>
    api.get<HocVienChamDiem[]>(`/mon-hoc/${maMh}/${encodeURIComponent(hocKy)}/danh-sach-cham-diem`),
};

export interface TienDo {
  maTd: string;
  lanBaoCao: number;
  noiDung?: string;
  nhanXetGvhd?: string;
  diemSo?: number;
  danhGiaKq?: 'DatYeuCau' | 'XuatSac' | 'CanBoSung' | 'Dat';
  ngayBaoCao: string;
  fileBaoCaoUrl?: string;
}
export const tienDoApi = {
  create: (data: { maDt: string; noiDung: string; fileBaoCaoUrl?: string }) => api.post<TienDo>('/tien-do', data),
  listByDeTai: (maDt: string) => api.get<TienDo[]>(`/de-tai/${maDt}/tien-do`),
  nhanXet: (maTd: string, nhanXetGvhd: string, diemSo?: number, danhGiaKq?: string) =>
    api.patch<TienDo>(`/tien-do/${maTd}/nhan-xet`, { nhanXetGvhd, diemSo, danhGiaKq }),
};

export interface BaiBao {
  maBb: string;
  tieuDe: string;
  tenTapChiHoiThao?: string;
  phanLoai?: string;
  doi?: string;
  issn?: string;
  vaiTroTacGia?: string;
  ngayCongBo?: string;
  fileMinhChung?: string;
  linkBaiBao?: string;
}
export const baiBaoApi = {
  create: (data: {
    tieuDe: string;
    tenTapChiHoiThao?: string;
    phanLoai?: string;
    doi?: string;
    issn?: string;
    vaiTroTacGia?: string;
    ngayCongBo?: string;
    fileMinhChung?: string;
    linkBaiBao?: string;
  }) => api.post<BaiBao>('/bai-bao', data),
  listByHocVien: (maHv: string) => api.get<BaiBao[]>(`/hoc-vien/${maHv}/bai-bao`),
};

export interface HoiDong {
  maHd: string;
  capDanhGia: string;
  ngayBaoVe: string;
  diaDiem?: string;
  ketQua?: string;
  diemTb?: number;
  quyChe?: QuyCheBaoVe;
  bienBanUrl?: string;
  thanhVienCoMat?: string[];
  lanBaoVe?: number;
  kienNghiBaoVeLai?: boolean;
  deTai: DeTai;
  thanhVien?: {
    maGv: string;
    chucDanh: string;
    coQuanCt?: string;
    diemTieuChi1?: number;
    diemTieuChi2?: number;
    diemTieuChi3?: number;
    diemTieuChi4?: number;
    tongDiem?: number;
    nhanXet?: string;
    phieu?: 'TanThanh' | 'KhongTanThanh';
    giangVien?: {
      hocHam?: string;
      hocVi?: string;
      nguoiDung?: { hoTen: string };
    };
  }[];
}
export type QuyCheBaoVe = 'ChuyenTiep2021' | 'ThongTu53';
export const hoiDongApi = {
  list: () => api.get<HoiDong[]>('/hoi-dong'),
  getAll: () => api.get<HoiDong[]>('/hoi-dong'),
  getById: (maHd: string) => api.get<HoiDong>(`/hoi-dong/${maHd}`),
  create: (data: {
    maDt: string;
    capDanhGia: string;
    ngayBaoVe: string;
    diaDiem?: string;
    quyChe: QuyCheBaoVe;
    daKiemTraTieuChuan: boolean;
    thanhVien: { maGv: string; chucDanh: string; coQuanCt?: string }[];
  }) => api.post<HoiDong>('/hoi-dong', data),
  chamDiem: (
    maHd: string,
    data: {
      diemTieuChi1: number;
      diemTieuChi2: number;
      diemTieuChi3: number;
      diemTieuChi4: number;
      nhanXet?: string;
      quyetNghi?: 'TanThanh' | 'KhongTanThanh';
    },
  ) => api.post<HoiDong>(`/hoi-dong/${maHd}/cham-diem`, data),
  ghiNhanKetQua: (maHd: string, data: {
    thanhVienCoMat: string[];
    bienBanUrl: string;
    kienNghiBaoVeLai: boolean;
    quyetNghi?: 'TanThanh' | 'KhongTanThanh';
  }) => api.patch<HoiDong>(`/hoi-dong/${maHd}/ket-qua`, data),
};

export type TrangThaiTaiKhoan = 'Active' | 'Locked' | 'Graduated';

export interface ExtendedUser {
  maNd: string;
  hoTen: string;
  email: string;
  vaiTro: VaiTro;
  trangThai: TrangThaiTaiKhoan;
  soDienThoai?: string;
  ngayTao: string;
  mshv?: string;
  trinhDo?: 'TienSi' | 'ThacSi';
  chuyenNganh?: string;
  khoaHoc?: string;
  gvhd?: string;
  hocHam?: string;
  hocVi?: string;
  khoa?: string;
  ncsDangHuongDan?: number;
  hanMucToiDa?: number;
  avatar?: string;
}

export interface NhatKyThaoTac {
  maLog: string;
  maNd?: string;
  hoTen: string;
  vaiTro: string;
  hanhDong: string;
  diaChiIp?: string;
  ketQua: 'Success' | 'Warning' | 'Info';
  thoiGian: string;
}

export interface ThongKeNhanSu {
  tongSo: number;
  soNcs: number;
  soHocVienThacSi: number;
  soGiangVien: number;
  soQuanTri: number;
  soTaiKhoanBiKhoa: number;
}

export interface CreateUserPayload {
  hoTen: string;
  email: string;
  vaiTro: VaiTro;
  matKhau?: string;
  sdt?: string;
  mshv?: string;
  trinhDo?: 'TienSi' | 'ThacSi';
  maChuyenNganh?: number;
  khoaHoc?: string;
  hocHam?: string;
  hocVi?: string;
  chuyenMon?: string;
}

export interface GiangVienOption {
  maGv: string;
  hoTen: string;
  hocHam?: string;
  hocVi?: string;
  chuyenMon?: string;
  soNcsDangHd: number;
  hanMucToiDa: number;
  conTrong: number;
}

export const userApi = {
  list: () => api.get<ExtendedUser[]>('/users'),
  giangVienList: () => api.get<GiangVienOption[]>('/users/giang-vien'),
  thongKe: () => api.get<ThongKeNhanSu>('/users/thong-ke'),
  nhatKy: (limit = 100) => api.get<NhatKyThaoTac[]>(`/users/nhat-ky?limit=${limit}`),
  create: (data: CreateUserPayload) => api.post<ExtendedUser & { matKhauKhoiTao?: string }>('/users', data),
  import: (danhSach: CreateUserPayload[]) =>
    api.post<{ thanhCong: number; thatBai: number; loi: { dong: number; email: string; lyDo: string }[] }>(
      '/users/import',
      { danhSach },
    ),
  broadcast: (data: { tieuDe: string; noiDung: string; doiTuong: 'ALL' | VaiTro; duongDan?: string }) =>
    api.post<{ success: boolean; soNguoiNhan: number; doiTuong: string }>('/users/broadcast', data),
  update: (id: string, data: Partial<CreateUserPayload> & { trangThai?: TrangThaiTaiKhoan }) =>
    api.patch<ExtendedUser>(`/users/${id}`, data),
  toggleTrangThai: (id: string) => api.patch<ExtendedUser>(`/users/${id}/trang-thai`, {}),
  resetPassword: (id: string, newPassword?: string) =>
    api.post<{ success: boolean; message: string }>(`/users/${id}/reset-password`, { newPassword }),
};

export interface ThongBao {
  maTb: string;
  loaiTb: 'DeTai' | 'DonHocVu' | 'TuyenSinh' | 'HoiDong' | 'BaiBao' | 'HeThong';
  tieuDe: string;
  noiDung: string;
  duongDan?: string;
  maLienQuan?: string;
  daDoc: boolean;
  thoiGian: string;
}

export const notificationApi = {
  list: (limit = 30) => api.get<ThongBao[]>(`/notification?limit=${limit}`),
  unreadCount: () => api.get<{ count: number }>('/notification/unread-count'),
  markRead: (maTb: string) => api.patch<{ success: boolean }>(`/notification/${maTb}/read`, {}),
  markAllRead: () => api.patch<{ success: boolean }>('/notification/read-all', {}),
  remove: (maTb: string) => api.delete<{ success: boolean }>(`/notification/${maTb}`),
};

export interface AiCitation {
  id: string;
  soHieu: string;
  tenVanBan: string;
  coQuan?: string;
  dieuKhoan: string;
  tieuDe: string;
  noiDung: string;
  linkGoc?: string;
}

export interface AiModel {
  id: string;
  name: string;
  provider: string;
  badge: string;
  description: string;
  isFree: boolean;
}

export interface AiChatResponse {
  reply: string;
  modelUsed: string;
  citations: AiCitation[];
  time: string;
  maHt?: string;
}

export interface RegulationChunk extends AiCitation {
  tuKhoa: string[];
}

export interface AiSession {
  maHt: string;
  chuDe?: string;
  thoiGianBatDau: string;
}

export interface AiSessionMessage {
  maTn: string;
  nguoiGui: 'User' | 'AI';
  noiDung: string;
  thoiGian: string;
  citations: AiCitation[];
}

export const aiTutorApi = {
  getDocuments: () => api.get<RegulationChunk[]>('/ai-tutor/quy-che'),
  listSessions: () => api.get<AiSession[]>('/ai-tutor/hoi-thoai'),
  readSession: (id: string) => api.get<AiSessionMessage[]>(`/ai-tutor/hoi-thoai/${id}`),
  deleteSession: (id: string) => api.delete(`/ai-tutor/hoi-thoai/${id}`),
  clearSessions: () => api.delete('/ai-tutor/hoi-thoai'),
  chat: (data: { cauHoi: string; model?: string; maHt?: string }) =>
    api.post<AiChatResponse>('/ai-tutor/chat', data),
  getModels: () => api.get<AiModel[]>('/ai-tutor/models'),
};

export interface KnowledgeBaseChunkSummary {
  id: string;
  soHieu: string;
  tenVanBan: string;
  dieuKhoan: string;
  tieuDe: string;
  tuKhoa: string[];
  noiDungTomTat: string;
}

export interface KnowledgeBaseAdminStats {
  tongChunk: number;
  tongVanBan: number;
  tongTuKhoa: number;
  phanBoVanBan: { soHieu: string; soChunk: number }[];
  chunks: KnowledgeBaseChunkSummary[];
}

export interface KnowledgeBaseChunkDto {
  soHieu: string;
  tenVanBan: string;
  coQuan?: string;
  dieuKhoan: string;
  tieuDe: string;
  noiDung: string;
  tuKhoa?: string[];
  ngayBanHanh?: string;
  danhMuc?: string;
}

export const knowledgeBaseApi = {
  getAdmin: () => api.get<KnowledgeBaseAdminStats>('/ai-tutor/knowledge-base'),
  addChunk: (dto: KnowledgeBaseChunkDto) => api.post<{ success: boolean; message: string; chunk?: any }>('/ai-tutor/knowledge-base', dto),
  toggleChunk: (id: string) => api.patch<{ success: boolean; newStatus: string; message: string }>(`/ai-tutor/knowledge-base/${id}/toggle`),
  deleteChunk: (id: string) => api.delete<{ success: boolean; message: string }>(`/ai-tutor/knowledge-base/${id}`),
};

export interface OverviewStats {
  tongHocVien: number;
  tongNcsTienSi: number;
  tongThacSi: number;
  tongDeTai: number;
  deTaiChoDuyet: number;
  deTaiDangLam: number;
  deTaiDuDKBaoVe: number;
  deTaiDaBaoVe: number;
  tongBaiBaoIsiScopus: number;
  tongBaiBaoHdgsnn: number;
  tyLeDaBaoVe: number;
}

export interface SlaWarningItem {
  id: string;
  mshv: string;
  hoTen: string;
  tenDt: string;
  chuyenNganh: string;
  soThangDaDaoTao: number;
  mucDoCanhBao: 'AnToan' | 'CanDayNhanh' | 'BaoDongDo';
  soBaiBaoIsiScopus: number;
  lanBaoCaoGanNhat: number;
  gvhd: string;
}

export interface PublicationTrendItem {
  nam: string;
  isiScopus: number;
  hdgsnn: number;
  hoiThaoQt: number;
  trongNuoc: number;
  tongCong: number;
}

export interface MajorDistributionItem {
  tenCn: string;
  soLuongDeTai: number;
  tyLe: number;
}

export interface SupervisorWorkloadItem {
  hocHamVi: string;
  dinhMucToiDa: number;
  trungBinhDangHuongDan: number;
  soLuongGv: number;
  trangThai: string;
}

export interface PredictiveRiskItem {
  maHv: string;
  mshv: string;
  hoTen: string;
  tenDt: string;
  chuyenNganh: string;
  soThangThucTe: number;
  soThangBaoLuu: number;
  soThangConLaiToiDa: number;
  soBaiBaoIsiScopus: number;
  soBaoCaoTienDo: number;
  diemTbTienDo: number | null;
  diemRuiRo: number;
  mucDoRuiRo: 'AnToan' | 'NguyCoTrungBinh' | 'NguyCoCao';
  khuyenNghiHocVu: string;
}

export interface ProgressDefenseCorrelationData {
  heSoTuongQuan: number | null;
  doTinCay: string | null;
  phuongTrinhHoiQuy: string | null;
  heSoGoc: number | null;
  heSoChan: number | null;
  tongSoDeTaiMau: number;
  chuDuMau?: boolean;
  soMauHienCo?: number;
  soMauCanThiet?: number;
  thongBao?: string;
  duLieuDiem: Array<{
    maDt: string;
    tenDt: string;
    hoTen: string;
    chuyenNganh: string;
    diemTbTienDo: number;
    diemBaoVeHoiDong: number;
    duBaoDiemBaoVe: number | null;
  }>;
}

export interface PublicationProductivityStats {
  nangSuatBinhQuanMoiNcs: number;
  tyLeIsiScopus: number;
  tyLeTacGiaChinh: number;
  phanBoTheoChuyenNganh: Array<{
    chuyenNganh: string;
    soBaiBao: number;
    soIsiScopus: number;
    nangSuatNcs: number;
  }>;
  coDuLieuDongTacGia: boolean;
  topGiangVienCongBo: Array<{
    maGv: string;
    hoTen: string;
    hocHamHocVi: string;
    soBaiBaoDongTacGia: number;
    soNcsDangHuongDan: number;
  }>;
}

export const analyticsApi = {
  getOverview: () => api.get<OverviewStats>('/analytics/overview'),
  getSlaWarnings: () => api.get<SlaWarningItem[]>('/analytics/sla-warning'),
  getPredictiveRisk: () => api.get<PredictiveRiskItem[]>('/analytics/predictive-risk'),
  getProgressDefenseCorrelation: () =>
    api.get<ProgressDefenseCorrelationData>('/analytics/progress-defense-correlation'),
  getPublicationProductivity: () =>
    api.get<PublicationProductivityStats>('/analytics/publication-productivity'),
  getPublicationTrends: () => api.get<PublicationTrendItem[]>('/analytics/publications'),
  getMajorsDistribution: () => api.get<MajorDistributionItem[]>('/analytics/majors'),
  getSupervisorWorkload: () => api.get<SupervisorWorkloadItem[]>('/analytics/workload'),
};

export interface UploadResponse {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export const uploadApi = {
  read: (fileUrl: string, signal?: AbortSignal) => {
    if (!/^\/api\/v1\/upload\/files\/[\w.-]+$/.test(fileUrl)) {
      return Promise.reject(new Error('Liên kết minh chứng không hợp lệ.'));
    }
    return api.get<Blob>(fileUrl.slice('/api/v1'.length), { responseType: 'blob', signal });
  },
  uploadSingle: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<UploadResponse>('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return api.post<UploadResponse[]>('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export interface PlagiarismSourceMatch {
  name: string;
  sourceType: 'NoiBo' | 'ThuVienQuocGia' | 'IEEE_Scopus' | 'Internet' | 'CrossRef';
  percent: number;
  snippetCount: number;
  matchedTitle?: string;
}

export interface MatchedSnippet {
  id: string;
  text: string;
  sourceName: string;
  startIndex: number;
  endIndex: number;
  similarity: number;
}

export interface PlagiarismScanResult {
  corpusSize: number;
  overallSimilarity: number;
  status: 'Pass' | 'Warning' | 'Fail';
  quyCheCheck: {
    nguongToiDa: number;
    ketLuan: string;
    hopQuy: boolean;
  };
  totalWords: number;
  totalSentences: number;
  matchedSentencesCount: number;
  scanDate: string;
  sources: PlagiarismSourceMatch[];
  matchedSnippets: MatchedSnippet[];
  crossRefVerification?: {
    queriesRun: number;
    matchesFound: number;
    topMatches: { doi: string; title: string; journal?: string; score: number }[];
    apiStatus: 'Live' | 'Error';
  };
}

export const plagiarismApi = {
  check: (data: { text: string; title?: string; queryCrossref?: boolean }) =>
    api.post<PlagiarismScanResult>('/analytics/plagiarism-check', data),
};

export interface DonHocVu {
  maDon: string;
  maHv: string;
  maDt?: string;
  loaiDon: 'BaoLuu' | 'GiaHan' | 'QuayLaiHoc';
  soThang: number;
  lyDo: string;
  yKienGvhd?: string;
  trangThai: 'ChoDuyetGvhd' | 'ChoDuyetAdmin' | 'DaDuyet' | 'TuChoi';
  ngayNop: string;
  ngayDuyet?: string;
  nguoiDuyet?: string;
  quyetDinhSo?: string;
  fileDinhKemUrl?: string;
  hocVien?: DeTai['hocVien'];
  deTai?: DeTai;
}

export const donHocVuApi = {
  create: (data: { maDt?: string; loaiDon: string; soThang: number; lyDo: string; fileDinhKemUrl?: string }) =>
    api.post<DonHocVu>('/don-hoc-vu', data),
  list: () => api.get<DonHocVu[]>('/don-hoc-vu'),
  getById: (id: string) => api.get<DonHocVu>(`/don-hoc-vu/${id}`),
  gvhdDuyet: (id: string, data: { yKienGvhd: string }) =>
    api.patch<DonHocVu>(`/don-hoc-vu/${id}/gvhd-duyet`, data),
  adminDuyet: (id: string, data: { quyetDinhSo?: string; ghiChu?: string }) =>
    api.patch<DonHocVu>(`/don-hoc-vu/${id}/admin-duyet`, data),
  tuChoi: (id: string, data: { lyDoTuChoi: string }) =>
    api.patch<DonHocVu>(`/don-hoc-vu/${id}/tu-choi`, data),
};
