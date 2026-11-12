import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { AcademicRiskTable, MajorDistributionChart, PublicationTrendChart, SlaWarningChart, SupervisorWorkloadGauge } from '../components/analytics/AnalyticsCharts';
import { SkeletonCard } from '../components/ui/Skeleton';
import { thesisStatusLabels } from '../components/StatusBadge';
import { ACADEMIC_STATE_EVENT } from '../lib/academicStore';
import { analyticsApi, deTaiApi, hoiDongApi, hoSoApi, tienDoApi, baiBaoApi, DeTai, CurrentUser } from '../lib/api';
import { exportSlaReportExcel } from '../lib/exportService';

function useDashboardData<T>(loadData: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let currentRequest = 0;
    const refresh = async () => {
      const request = ++currentRequest;
      setLoading(true);
      setError(false);
      try {
        const result = await loadData();
        if (request === currentRequest) setData(result);
      } catch {
        if (request === currentRequest) setError(true);
      } finally {
        if (request === currentRequest) setLoading(false);
      }
    };
    void refresh();
    window.addEventListener(ACADEMIC_STATE_EVENT, refresh);
    return () => {
      currentRequest++;
      window.removeEventListener(ACADEMIC_STATE_EVENT, refresh);
    };
  }, [loadData]);

  return { data, loading, error };
}

function DataStatus({ loading, error }: { loading: boolean; error: boolean }) {
  if (error) return <p className="card text-sm text-rose-800" role="alert">Không tải được dữ liệu học vụ. Hãy tải lại trang để thử lại.</p>;
  if (loading) return <div role="status" aria-label="Đang tải dữ liệu học vụ"><SkeletonCard /></div>;
  return null;
}

function Metric({ title, value, to }: { title: string; value: string | number; to?: string }) {
  const content = <><h3 className="text-sm font-semibold text-slate-700">{title}</h3><p className="mt-2 text-xl font-bold text-slate-900">{value}</p></>;
  return to ? <Link to={to} className="card block hover:border-blue-400">{content}</Link> : <article className="card">{content}</article>;
}

function ThesisList({ theses }: { theses: DeTai[] }) {
  return <section className="card space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-bold text-slate-900">Đề tài nghiên cứu</h2>
      <Link className="text-sm font-semibold text-blue-700 hover:underline" to="/de-tai">Xem danh sách đề tài</Link>
    </div>
    {theses.length ? <ul className="divide-y divide-slate-200">
      {theses.slice(0, 8).map((thesis) => <li key={thesis.maDt} className="py-3">
        <Link className="font-semibold text-blue-700 hover:underline" to={'/de-tai/' + thesis.maDt}>{thesis.tenDt}</Link>
        <p className="mt-1 text-sm text-slate-600">{[thesis.hocVien?.nguoiDung?.hoTen, thesisStatusLabels[thesis.trangThai] || thesis.trangThai].filter(Boolean).join(' · ')}</p>
      </li>)}
    </ul> : <p className="text-sm text-slate-600">Chưa có đề tài.</p>}
  </section>;
}

async function loadLearnerDashboard() {
  const [profile, theses, councils] = await Promise.all([
    hoSoApi.hoSoHocVienCuaToi().then((res) => res.data).catch((error) => {
      if (error?.response?.status === 404) return null;
      throw error;
    }),
    deTaiApi.list().then((res) => res.data),
    hoiDongApi.list().then((res) => res.data),
  ]);
  const thesis = theses[0];
  const [reports, articles] = await Promise.all([
    thesis ? tienDoApi.listByDeTai(thesis.maDt).then((res) => res.data) : [],
    profile ? baiBaoApi.listByHocVien(profile.maHv).then((res) => res.data) : [],
  ]);
  return { profile, theses, councils, reports, articles };
}

function LearnerDashboard({ user }: { user: CurrentUser }) {
  const { data, loading, error } = useDashboardData(loadLearnerDashboard);
  return <div className="space-y-5">
    <DataStatus loading={loading} error={error} />
    {data && <>
      <section className="card space-y-2">
        <h2 className="text-lg font-bold text-slate-900">{user.hoTen}</h2>
        {data.profile
          ? <p className="text-sm text-slate-600">{[data.profile.mshv, data.profile.trinhDo === 'TienSi' ? 'Tiến sĩ' : 'Thạc sĩ', data.profile.chuyenNganh?.tenCn, data.profile.khoaHoc].filter(Boolean).join(' · ')}</p>
          : <p className="text-sm text-slate-600">Hồ sơ đào tạo đang chờ Phòng đào tạo cập nhật.</p>}
        <Link to="/ho-so" className="text-sm font-semibold text-blue-700 hover:underline">Hồ sơ và đơn học vụ</Link>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Học phần" value="Xem bảng điểm" to="/hoc-phan" />
        <Metric title="Báo cáo của đề tài gần nhất" value={data.reports.length} to={data.theses[0] ? '/de-tai/' + data.theses[0].maDt : '/de-tai'} />
        <Metric title="Bài báo đã khai báo" value={data.articles.length} />
        <Metric title="Lịch bảo vệ đã xếp" value={data.councils.filter((item) => !item.ketQua).length} to="/hoi-dong" />
      </div>
      <ThesisList theses={data.theses} />
    </>}
  </div>;
}

async function loadLecturerDashboard() {
  const [theses, councils] = await Promise.all([deTaiApi.list(), hoiDongApi.list()]);
  return { theses: theses.data, councils: councils.data };
}

function LecturerDashboard({ user }: { user: CurrentUser }) {
  const { data, loading, error } = useDashboardData(loadLecturerDashboard);
  return <div className="space-y-5">
    <DataStatus loading={loading} error={error} />
    {data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Đề tài được hướng dẫn" value={data.theses.length} to="/de-tai" />
        <Metric title="Đề tài chờ duyệt" value={data.theses.filter((item) => item.trangThai === 'ChoDuyet').length} to="/de-tai" />
        <Metric title="Hội đồng được phân công" value={data.councils.filter((item) => !item.ketQua && item.thanhVien?.some((member) => member.maGv === user.maNd)).length} to="/hoi-dong" />
        <Metric title="Học phần được phân công" value="Nhập điểm" to="/hoc-phan" />
      </div>
      <ThesisList theses={data.theses} />
    </>}
  </div>;
}

async function loadAdminDashboard() {
  const [overview, warnings, trends, majors, workloads] = await Promise.all([
    analyticsApi.getOverview(), analyticsApi.getSlaWarnings(), analyticsApi.getPublicationTrends(),
    analyticsApi.getMajorsDistribution(), analyticsApi.getSupervisorWorkload(),
  ]);
  return { overview: overview.data, warnings: warnings.data, trends: trends.data, majors: majors.data, workloads: workloads.data };
}

function AdminDashboard() {
  const { data, loading, error } = useDashboardData(loadAdminDashboard);
  const [major, setMajor] = useState('');
  if (!data) return <DataStatus loading={loading} error={error} />;
  const { overview, warnings, trends, majors, workloads } = data;
  const warningMajors = [...new Set(warnings.map((warning) => warning.chuyenNganh))].sort((a, b) => a.localeCompare(b, 'vi'));
  const filteredWarnings = major ? warnings.filter((warning) => warning.chuyenNganh === major) : warnings;

  return <div className="space-y-5">
    <DataStatus loading={false} error={error} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Học viên" value={overview.tongHocVien} to="/nguoi-dung" />
      <Metric title="Đề tài đang thực hiện" value={overview.deTaiDangLam} to="/de-tai" />
      <Metric title="Đề tài đã bảo vệ" value={overview.deTaiDaBaoVe} to="/hoi-dong" />
      <Metric title="Bài báo ISI / Scopus" value={overview.tongBaiBaoIsiScopus} to="/analytics-dashboard" />
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <PublicationTrendChart trends={trends} />
      <MajorDistributionChart distributions={majors} />
      <SupervisorWorkloadGauge workloads={workloads} />
      <SlaWarningChart warnings={filteredWarnings} />
    </div>
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm font-medium text-slate-800">Chuyên ngành theo dõi
          <select className="input-field mt-1 block" value={major} onChange={(event) => setMajor(event.target.value)}>
            <option value="">Tất cả chuyên ngành</option>
            {warningMajors.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <button className="btn-secondary" disabled={!filteredWarnings.length} onClick={() => exportSlaReportExcel(filteredWarnings)}>Xuất Excel</button>
      </div>
      <AcademicRiskTable warnings={filteredWarnings} />
    </section>
  </div>;
}

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <AppShell title="Tổng quan học vụ">
    {user.vaiTro === 'HocVien' && <LearnerDashboard key={user.maNd} user={user} />}
    {user.vaiTro === 'GiangVien' && <LecturerDashboard key={user.maNd} user={user} />}
    {user.vaiTro === 'Admin' && <AdminDashboard />}
  </AppShell>;
}
