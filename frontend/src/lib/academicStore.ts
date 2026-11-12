import {
  DeTai,
  HoiDong,
  TienDo,
  DonHocVu,
  ThongBao,
  deTaiApi,
  hoiDongApi,
  tienDoApi,
  donHocVuApi,
  notificationApi,
} from './api';

export const ACADEMIC_STATE_EVENT = 'qldt_academic_state_change';

export type AcademicTopic =
  | 'detai'
  | 'hoidong'
  | 'progress_report'
  | 'council_score'
  | 'don_hoc_vu'
  | 'notification'
  | 'course_reg'
  | 'course_cancel'
  | 'grade_update';

export interface ProgressReportItem {
  id: string;
  lanBaoCao: number;
  kyBaoCao: string;
  ngayNop: string;
  noiDungTomTat: string;
  fileBaoCaoUrl?: string;
  trangThai: 'ChoDanhGia' | 'Dat' | 'XuatSac' | 'CanBoSung';
  danhGiaGvhd?: string;
  diemSo?: number;
}

export interface CouncilScoring {
  maHd: string;
  tieuChi1: number;
  tieuChi2: number;
  tieuChi3: number;
  tieuChi4: number;
  tongDiem: number;
  quyetNghi: 'TanThanh' | 'KhongTanThanh';
  nhanXetChiTiet: string;
}

interface AcademicCache {
  deTai: DeTai[];
  hoiDong: HoiDong[];
  donHocVu: DonHocVu[];
  thongBao: ThongBao[];
  tienDoTheoDeTai: Map<string, ProgressReportItem[]>;
}

const cache: AcademicCache = {
  deTai: [],
  hoiDong: [],
  donHocVu: [],
  thongBao: [],
  tienDoTheoDeTai: new Map(),
};

function mapTienDo(td: TienDo): ProgressReportItem {
  const trangThai: ProgressReportItem['trangThai'] = td.diemSo != null
    ? Number(td.diemSo) >= 9
      ? 'XuatSac'
      : Number(td.diemSo) >= 5
        ? 'Dat'
        : 'CanBoSung'
    : 'ChoDanhGia';

  return {
    id: td.maTd,
    lanBaoCao: td.lanBaoCao,
    kyBaoCao: `Kỳ báo cáo lần ${td.lanBaoCao} (định kỳ 6 tháng)`,
    ngayNop: td.ngayBaoCao,
    noiDungTomTat: td.noiDung || '',
    fileBaoCaoUrl: td.fileBaoCaoUrl,
    trangThai,
    danhGiaGvhd: td.nhanXetGvhd,
    diemSo: td.diemSo !== undefined && td.diemSo !== null ? Number(td.diemSo) : undefined,
  };
}

export const AcademicStore = {
  notifyStateChange: (topic: AcademicTopic | string, data?: any) => {
    window.dispatchEvent(
      new CustomEvent(ACADEMIC_STATE_EVENT, {
        detail: { topic, data, timestamp: Date.now() },
      }),
    );
  },

  syncWithBackend: async (): Promise<void> => {
    const [dtRes, hdRes] = await Promise.allSettled([deTaiApi.getAll(), hoiDongApi.getAll()]);

    if (dtRes.status === 'fulfilled' && Array.isArray(dtRes.value.data)) {
      cache.deTai = dtRes.value.data;
      AcademicStore.notifyStateChange('detai', cache.deTai);
    }
    if (hdRes.status === 'fulfilled' && Array.isArray(hdRes.value.data)) {
      cache.hoiDong = hdRes.value.data;
      AcademicStore.notifyStateChange('hoidong', cache.hoiDong);
    }
  },

  getDeTaiList: (): DeTai[] => cache.deTai,

  saveDeTaiList: (list: DeTai[]) => {
    cache.deTai = Array.isArray(list) ? list : [];
  },

  fetchDeTaiList: async (): Promise<DeTai[]> => {
    const res = await deTaiApi.getAll();
    cache.deTai = res.data || [];
    return cache.deTai;
  },

  addDeTai: async (payload: {
    tenDt: string;
    maGvhd: string;
    maGvhd2?: string;
    ngayDuKienBaoVe?: string;
  }): Promise<DeTai[]> => {
    await deTaiApi.create(payload);
    const list = await AcademicStore.fetchDeTaiList();
    AcademicStore.notifyStateChange('detai', list);
    return list;
  },

  approveDeTai: async (maDt: string): Promise<DeTai[]> => {
    await deTaiApi.updateTrangThai(maDt, 'DaDuyet');
    const list = await AcademicStore.fetchDeTaiList();
    AcademicStore.notifyStateChange('detai', list);
    return list;
  },

  rejectDeTai: async (maDt: string): Promise<DeTai[]> => {
    await deTaiApi.updateTrangThai(maDt, 'TuChoi');
    const list = await AcademicStore.fetchDeTaiList();
    AcademicStore.notifyStateChange('detai', list);
    return list;
  },

  getProgressReports: (maDt: string): ProgressReportItem[] => cache.tienDoTheoDeTai.get(maDt) || [],

  fetchProgressReports: async (maDt: string): Promise<ProgressReportItem[]> => {
    const res = await tienDoApi.listByDeTai(maDt);
    const list = (res.data || []).map(mapTienDo).sort((a, b) => b.lanBaoCao - a.lanBaoCao);
    cache.tienDoTheoDeTai.set(maDt, list);
    return list;
  },

  addProgressReport: async (
    maDt: string,
    report: { noiDung: string; fileBaoCaoUrl?: string },
  ): Promise<ProgressReportItem[]> => {
    await tienDoApi.create({ maDt, noiDung: report.noiDung, fileBaoCaoUrl: report.fileBaoCaoUrl });
    const list = await AcademicStore.fetchProgressReports(maDt);
    AcademicStore.notifyStateChange('progress_report', { maDt, list });
    return list;
  },

  gradeProgressReport: async (
    maDt: string,
    maTd: string,
    nhanXetGvhd: string,
    diemSo: number,
    danhGiaKq: 'XuatSac' | 'Dat' | 'CanBoSung',
  ): Promise<ProgressReportItem[]> => {
    await tienDoApi.nhanXet(maTd, nhanXetGvhd, diemSo, danhGiaKq);
    const list = await AcademicStore.fetchProgressReports(maDt);
    AcademicStore.notifyStateChange('progress_report', { maDt, list });
    return list;
  },

  getHoiDongList: (): HoiDong[] => cache.hoiDong,

  saveHoiDongList: (list: HoiDong[]) => {
    cache.hoiDong = Array.isArray(list) ? list : [];
  },

  fetchHoiDongList: async (): Promise<HoiDong[]> => {
    const res = await hoiDongApi.getAll();
    cache.hoiDong = res.data || [];
    return cache.hoiDong;
  },

  addHoiDong: async (payload: Parameters<typeof hoiDongApi.create>[0]): Promise<HoiDong[]> => {
    await hoiDongApi.create(payload);
    const list = await AcademicStore.fetchHoiDongList();
    AcademicStore.notifyStateChange('hoidong', list);
    return list;
  },

  submitCouncilScore: async (scoring: CouncilScoring): Promise<HoiDong[]> => {
    await hoiDongApi.chamDiem(scoring.maHd, {
      diemTieuChi1: scoring.tieuChi1,
      diemTieuChi2: scoring.tieuChi2,
      diemTieuChi3: scoring.tieuChi3,
      diemTieuChi4: scoring.tieuChi4,
      nhanXet: scoring.nhanXetChiTiet,
      quyetNghi: scoring.quyetNghi,
    });
    const list = await AcademicStore.fetchHoiDongList();
    AcademicStore.notifyStateChange('council_score', scoring);
    AcademicStore.notifyStateChange('hoidong', list);
    return list;
  },

  getDonHocVuList: (): DonHocVu[] => cache.donHocVu,

  fetchDonHocVuList: async (): Promise<DonHocVu[]> => {
    const res = await donHocVuApi.list();
    cache.donHocVu = res.data || [];
    return cache.donHocVu;
  },

  addDonHocVu: async (don: {
    maDt?: string;
    loaiDon: 'BaoLuu' | 'GiaHan' | 'QuayLaiHoc';
    soThang: number;
    lyDo: string;
    fileDinhKemUrl?: string;
  }): Promise<DonHocVu[]> => {
    await donHocVuApi.create(don);
    const list = await AcademicStore.fetchDonHocVuList();
    AcademicStore.notifyStateChange('don_hoc_vu', list);
    return list;
  },

  getNotifications: (): ThongBao[] => cache.thongBao,

  fetchNotifications: async (limit = 30): Promise<ThongBao[]> => {
    const res = await notificationApi.list(limit);
    cache.thongBao = res.data || [];
    return cache.thongBao;
  },

  markNotificationRead: async (maTb: string): Promise<ThongBao[]> => {
    await notificationApi.markRead(maTb);
    cache.thongBao = cache.thongBao.map((n) => (n.maTb === maTb ? { ...n, daDoc: true } : n));
    AcademicStore.notifyStateChange('notification', cache.thongBao);
    return cache.thongBao;
  },

  markAllNotificationsRead: async (): Promise<ThongBao[]> => {
    await notificationApi.markAllRead();
    cache.thongBao = cache.thongBao.map((n) => ({ ...n, daDoc: true }));
    AcademicStore.notifyStateChange('notification', cache.thongBao);
    return cache.thongBao;
  },

  clear: () => {
    cache.deTai = [];
    cache.hoiDong = [];
    cache.donHocVu = [];
    cache.thongBao = [];
    cache.tienDoTheoDeTai.clear();
  },
};
