import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  analyticsApi,
  knowledgeBaseApi,
  OverviewStats,
  SlaWarningItem,
  PredictiveRiskItem,
  ProgressDefenseCorrelationData,
  PublicationProductivityStats,
  PublicationTrendItem,
  MajorDistributionItem,
  SupervisorWorkloadItem,
  KnowledgeBaseAdminStats,
  KnowledgeBaseChunkDto,
} from '../lib/api';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler, ScatterController,
} from 'chart.js';
import { Bar, Doughnut, Line, Scatter } from 'react-chartjs-2';
import { SkeletonCard } from '../components/ui/Skeleton';

function linearForecast(xVals: number[], yVals: number[], futureXs: number[]): number[] {
  const n = xVals.length;
  if (n < 2) return futureXs.map(() => yVals[yVals.length - 1] ?? 0);
  const sumX = xVals.reduce((s, v) => s + v, 0);
  const sumY = yVals.reduce((s, v) => s + v, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0; let den = 0;
  for (let i = 0; i < n; i++) { num += (xVals[i] - meanX) * (yVals[i] - meanY); den += (xVals[i] - meanX) ** 2; }
  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;
  return futureXs.map((x) => Math.max(0, Math.round((slope * x + intercept) * 10) / 10));
}

function exportToExcel(
  overview: OverviewStats | null,
  slaWarnings: SlaWarningItem[],
  riskItems: PredictiveRiskItem[],
  trends: PublicationTrendItem[],
) {
  const wb = XLSX.utils.book_new();

  if (overview) {
    const overviewRows = [
      ['Chỉ số', 'Giá trị'],
      ['Tổng học viên', overview.tongHocVien],
      ['NCS Tiến sĩ', overview.tongNcsTienSi],
      ['Học viên Thạc sĩ', overview.tongThacSi],
      ['Tổng đề tài', overview.tongDeTai],
      ['Đề tài chờ duyệt', overview.deTaiChoDuyet],
      ['Đề tài đang thực hiện', overview.deTaiDangLam],
      ['Đề tài đủ ĐK bảo vệ', overview.deTaiDuDKBaoVe],
      ['Đề tài đã bảo vệ', overview.deTaiDaBaoVe],
      ['Bài báo ISI/Scopus', overview.tongBaiBaoIsiScopus],
      ['Bài báo HĐGSNN', overview.tongBaiBaoHdgsnn],
      ['Tỷ lệ đề tài đã bảo vệ (%)', overview.tyLeDaBaoVe],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(overviewRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');
  }

  if (slaWarnings.length > 0) {
    const slaRows = [
      ['Họ tên', 'MSHV', 'Đề tài', 'Chuyên ngành', 'Tháng đào tạo', 'Bài báo ISI', 'BC gần nhất', 'Mức cảnh báo'],
      ...slaWarnings.map((w) => [w.hoTen, w.mshv, w.tenDt, w.chuyenNganh, w.soThangDaDaoTao, w.soBaiBaoIsiScopus, `Lần ${w.lanBaoCaoGanNhat}`, w.mucDoCanhBao]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(slaRows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Cảnh báo SLA 72T');
  }

  if (riskItems.length > 0) {
    const riskRows = [
      ['Họ tên', 'MSHV', 'Đề tài', 'Chuyên ngành', 'Tháng thực tế', 'Tháng bảo lưu', 'Còn lại', 'Bài báo ISI', 'BC tiến độ', 'Điểm TB', 'Risk Score', 'Mức độ rủi ro', 'Khuyến nghị'],
      ...riskItems.map((r) => [r.hoTen, r.mshv, r.tenDt, r.chuyenNganh, r.soThangThucTe, r.soThangBaoLuu, r.soThangConLaiToiDa, r.soBaiBaoIsiScopus, r.soBaoCaoTienDo, r.diemTbTienDo ?? 'Chưa có điểm', r.diemRuiRo, r.mucDoRuiRo, r.khuyenNghiHocVu]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(riskRows);
    XLSX.utils.book_append_sheet(wb, ws3, 'Cảnh báo học vụ');
  }

  if (trends.length > 0) {
    const trendsRows = [
      ['Năm', 'ISI / Scopus', 'HĐGSNN', 'Trong nước', 'Tổng cộng'],
      ...trends.map((t) => [t.nam, t.isiScopus, t.hdgsnn, t.trongNuoc, t.tongCong]),
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(trendsRows);
    XLSX.utils.book_append_sheet(wb, ws4, 'Xu hướng bài báo');
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `BaoCao_HocVu_SaDH_${dateStr}.xlsx`);
}

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler, ScatterController,
);

export function AnalyticsDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'kb'>('analytics');

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [slaWarnings, setSlaWarnings] = useState<SlaWarningItem[]>([]);
  const [riskItems, setRiskItems] = useState<PredictiveRiskItem[]>([]);
  const [correlation, setCorrelation] = useState<ProgressDefenseCorrelationData | null>(null);
  const [productivity, setProductivity] = useState<PublicationProductivityStats | null>(null);
  const [trends, setTrends] = useState<PublicationTrendItem[]>([]);
  const [majors, setMajors] = useState<MajorDistributionItem[]>([]);
  const [workloads, setWorkloads] = useState<SupervisorWorkloadItem[]>([]);
  const [kbStats, setKbStats] = useState<KnowledgeBaseAdminStats | null>(null);
  const [kbLoading, setKbLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      analyticsApi.getOverview(),
      analyticsApi.getSlaWarnings(),
      analyticsApi.getPredictiveRisk(),
      analyticsApi.getProgressDefenseCorrelation(),
      analyticsApi.getPublicationProductivity(),
      analyticsApi.getPublicationTrends(),
      analyticsApi.getMajorsDistribution(),
      analyticsApi.getSupervisorWorkload(),
    ]);
    if (results[0].status === 'fulfilled') setOverview(results[0].value.data);
    if (results[1].status === 'fulfilled') setSlaWarnings(results[1].value.data);
    if (results[2].status === 'fulfilled') setRiskItems(results[2].value.data);
    if (results[3].status === 'fulfilled') setCorrelation(results[3].value.data);
    if (results[4].status === 'fulfilled') setProductivity(results[4].value.data);
    if (results[5].status === 'fulfilled') setTrends(results[5].value.data);
    if (results[6].status === 'fulfilled') setMajors(results[6].value.data);
    if (results[7].status === 'fulfilled') setWorkloads(results[7].value.data);
    setLoading(false);
  }, []);

  const fetchKb = useCallback(async () => {
    if (user?.vaiTro !== 'Admin') return;
    setKbLoading(true);
    try {
      const res = await knowledgeBaseApi.getAdmin();
      setKbStats(res.data);
    } catch {
      showToast('Không thể tải Knowledge Base', 'error');
    } finally {
      setKbLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (activeTab === 'kb') fetchKb();
  }, [activeTab, fetchKb]);

  if (user?.vaiTro !== 'Admin') {
    return (
      <AppShell title="Phân Tích Học Vụ" subtitle="Chỉ dành cho Quản trị viên">
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
          <span className="text-5xl">🔒</span>
          <p className="font-semibold">Bạn không có quyền truy cập trang này.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="📊 Trung Tâm Phân Tích Dữ Liệu Học Vụ"
      subtitle="Thống kê đào tạo, cảnh báo học vụ và kho quy chế"
    >
      {}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {[
          { key: 'analytics', label: '📈 Phân Tích & Biểu Đồ' },
          { key: 'kb', label: '🧠 Quản Trị Knowledge Base AI' },
        ].map((tab) => (
          <button
            key={tab.key}
            id={`analytics-tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key as 'analytics' | 'kb')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && (
        <AnalyticsTab
          loading={loading}
          overview={overview}
          slaWarnings={slaWarnings}
          riskItems={riskItems}
          correlation={correlation}
          productivity={productivity}
          trends={trends}
          majors={majors}
          workloads={workloads}
          onExportExcel={() => exportToExcel(overview, slaWarnings, riskItems, trends)}
        />
      )}

      {activeTab === 'kb' && (
        <KnowledgeBaseTab
          kbStats={kbStats}
          kbLoading={kbLoading}
          onRefresh={fetchKb}
          showToast={showToast}
        />
      )}
    </AppShell>
  );
}

function AnalyticsTab({
  loading, overview, slaWarnings, riskItems, correlation, productivity, trends, majors, workloads, onExportExcel,
}: {
  loading: boolean;
  overview: OverviewStats | null;
  slaWarnings: SlaWarningItem[];
  riskItems: PredictiveRiskItem[];
  correlation: ProgressDefenseCorrelationData | null;
  productivity: PublicationProductivityStats | null;
  trends: PublicationTrendItem[];
  majors: MajorDistributionItem[];
  workloads: SupervisorWorkloadItem[];
  onExportExcel: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0,1,2,3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-base">Báo Cáo Phân Tích Học Vụ Sau Đại Học</h2>
          <p className="text-xs text-slate-500 mt-0.5">Thống kê thời gian thực từ cơ sở dữ liệu · Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button
          id="btn-export-excel"
          onClick={onExportExcel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <span>📥</span> Xuất Excel (.xlsx)
        </button>
      </div>

      {overview && <OverviewCards overview={overview} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PublicationTrendChart trends={trends} />
        <MajorDoughnutChart majors={majors} />
      </div>
      {}
      <YoYGrowthPanel trends={trends} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkloadBarChart workloads={workloads} />
        <CorrelationScatterChart correlation={correlation} />
      </div>
      <PredictiveRiskTable riskItems={riskItems} />
      <SlaWarningTable warnings={slaWarnings} />
      {productivity && <ProductivityPanel productivity={productivity} />}
    </div>
  );
}

function OverviewCards({ overview }: { overview: OverviewStats }) {
  const cards = [
    { label: 'Tổng Học viên', value: overview.tongHocVien, sub: `${overview.tongNcsTienSi} NCS · ${overview.tongThacSi} ThS`, color: 'blue', icon: '🎓' },
    { label: 'Đề tài Đang Thực hiện', value: overview.deTaiDangLam, sub: `${overview.deTaiChoDuyet} chờ duyệt · ${overview.deTaiDuDKBaoVe} đủ ĐK`, color: 'indigo', icon: '📑' },
    { label: 'Bài báo ISI/Scopus', value: overview.tongBaiBaoIsiScopus, sub: `${overview.tongBaiBaoHdgsnn} bài HĐGSNN`, color: 'emerald', icon: '📰' },
    { label: 'Đề tài đã bảo vệ', value: `${overview.tyLeDaBaoVe}%`, sub: `${overview.deTaiDaBaoVe} đề tài đã bảo vệ`, color: 'amber', icon: '✅' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <article key={c.label} className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{c.icon}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">{c.label}</span>
          </div>
          <p className={`font-sans text-3xl font-extrabold text-${c.color}-600`}>{c.value}</p>
          <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
        </article>
      ))}
    </div>
  );
}

function PublicationTrendChart({ trends }: { trends: PublicationTrendItem[] }) {
  if (!trends.length) return <EmptyChart title="Xu Hướng Công Bố Bài Báo" />;

  const currentYear = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
  const completedYears = trends.filter((item) => Number(item.nam) < currentYear);
  const years = completedYears.map((item) => Number(item.nam));
  const isiData = trends.map((t) => t.isiScopus);
  const hdgsnnData = trends.map((t) => t.hdgsnn);

  const [thirdYear, secondYear, lastYear] = years.slice(-3);
  const canForecast = lastYear === currentYear - 1 && secondYear === currentYear - 2 && thirdYear === currentYear - 3;
  const futureYears = canForecast ? [currentYear + 1, currentYear + 2] : [];
  const isiForecasted = linearForecast(years, completedYears.map((item) => item.isiScopus), futureYears);
  const hdgsnnForecasted = linearForecast(years, completedYears.map((item) => item.hdgsnn), futureYears);

  const allLabels = [...trends.map((t) => Number(t.nam) === currentYear ? `${t.nam} (đến nay)` : t.nam), ...futureYears.map((y) => `${y} (ước tính)`)];

  const isiActual = [...isiData, ...futureYears.map(() => null)];
  const hdgsnnActual = [...hdgsnnData, ...futureYears.map(() => null)];

  const isiForecast = [...trends.map(() => null), ...isiForecasted];
  const hdgsnnForecast = [...trends.map(() => null), ...hdgsnnForecasted];

  const data = {
    labels: allLabels,
    datasets: [
      { label: 'ISI / Scopus (thực tế)', data: isiActual, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', tension: 0.4, fill: true, pointRadius: 5, spanGaps: false },
      { label: 'HĐGSNN (thực tế)', data: hdgsnnActual, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.08)', tension: 0.4, fill: true, pointRadius: 5, spanGaps: false },
      ...(canForecast ? [
        { label: 'ISI / Scopus (ước tính)', data: isiForecast, borderColor: '#2563eb', borderDash: [6, 4], pointRadius: 5 },
        { label: 'HĐGSNN (ước tính)', data: hdgsnnForecast, borderColor: '#059669', borderDash: [6, 4], pointRadius: 5 },
      ] : []),
    ],
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-slate-900 text-sm">📈 Xu Hướng Công Bố Bài Báo theo Năm</h3>
      </div>
      <p className="text-xs text-slate-600 mb-4">{canForecast
        ? 'Đường nét đứt là ước tính tuyến tính từ các năm đã kết thúc.'
        : 'Cần dữ liệu của ba năm trọn vẹn gần nhất để hiển thị ước tính.'}</p>
      <Line data={data} options={{
        responsive: true,
        plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 } } } },
        scales: { y: { beginAtZero: true } },
      }} />
    </div>
  );
}

function YoYGrowthPanel({ trends }: { trends: PublicationTrendItem[] }) {
  const currentYear = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
  const completed = trends.filter((item) => Number(item.nam) < currentYear);
  const [prev, latest] = completed.slice(-2);
  if (!latest || !prev || Number(latest.nam) !== Number(prev.nam) + 1) return null;

  const calcGrowth = (curr: number, old: number) => {
    if (old === 0) return null;
    return Math.round(((curr - old) / old) * 1000) / 10;
  };

  const metrics = [
    { label: 'ISI / Scopus', curr: latest.isiScopus, prev: prev.isiScopus, icon: '📰' },
    { label: 'HĐGSNN', curr: latest.hdgsnn, prev: prev.hdgsnn, icon: '📄' },
    { label: 'Trong nước', curr: latest.trongNuoc, prev: prev.trongNuoc, icon: '📋' },
    { label: 'Tổng cộng', curr: latest.tongCong, prev: prev.tongCong, icon: '📊' },
  ];

  return (
    <section className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">📅</span>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Tăng Trưởng Liên Năm (YoY) — {prev.nam} → {latest.nam}</h3>
          <p className="text-xs text-slate-500">So sánh số lượng bài báo khoa học công bố giữa hai năm gần nhất</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const growth = calcGrowth(m.curr, m.prev);
          const isPositive = growth != null && growth > 0;
          const isZero = growth === 0;
          return (
            <div key={m.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-lg mb-1">{m.icon}</p>
              <p className="text-xs font-semibold text-slate-600 mb-2">{m.label}</p>
              <p className="text-2xl font-extrabold text-slate-800">{m.curr}</p>
              <div className={`inline-flex items-center gap-1 mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                growth == null || isZero ? 'bg-slate-100 text-slate-600'
                : isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                <span>{growth == null || isZero ? '—' : isPositive ? '▲' : '▼'}</span>
                <span>{growth == null ? 'Năm gốc có 0 bài' : isZero ? 'Không đổi' : `${Math.abs(growth)}%`}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">vs {m.prev} năm {prev.nam}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MajorDoughnutChart({ majors }: { majors: MajorDistributionItem[] }) {
  const withTopics = majors.filter((major) => major.soLuongDeTai > 0);
  if (!withTopics.length) return <EmptyChart title="Phân bố chuyên ngành" />;
  const colors = ['#2563eb','#059669','#d97706','#7c3aed','#db2777','#0891b2','#65a30d'];
  const segmentColors = withTopics.map((_, index) => colors[index % colors.length]);
  const data = {
    labels: withTopics.map((m) => m.tenCn),
    datasets: [{ data: withTopics.map((m) => m.soLuongDeTai), backgroundColor: segmentColors, borderWidth: 2, borderColor: '#fff' }],
  };
  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-900 text-sm mb-4">🥧 Phân Bố Đề Tài theo Chuyên Ngành</h3>
      <div className="max-w-[13rem] mx-auto">
        <Doughnut data={data} options={{ plugins: { legend: { display: false } } }} />
      </div>
      <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
        {withTopics.map((major, index) => <li key={major.tenCn} className="flex items-start gap-2">
          <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segmentColors[index] }} />
          <span className="min-w-0 flex-1 break-words">{major.tenCn}</span>
          <span className="shrink-0 tabular-nums">{major.soLuongDeTai}</span>
        </li>)}
      </ul>
    </div>
  );
}

function WorkloadBarChart({ workloads }: { workloads: SupervisorWorkloadItem[] }) {
  if (!workloads.length) return <EmptyChart title="Tải Hướng Dẫn Giảng Viên" />;
  const data = {
    labels: workloads.map((w) => w.hocHamVi),
    datasets: [
      { label: 'TB đang hướng dẫn', data: workloads.map((w) => w.trungBinhDangHuongDan), backgroundColor: workloads.map((w) => w.trangThai === 'QuaTai' ? '#dc2626' : w.trangThai === 'CanhBao' ? '#d97706' : '#059669'), borderRadius: 8 },
      { label: 'Định mức tối đa', data: workloads.map((w) => w.dinhMucToiDa), backgroundColor: 'rgba(100,116,139,0.2)', borderColor: '#64748b', borderWidth: 1, borderRadius: 8 },
    ],
  };
  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-900 text-sm mb-1">📊 Tải Hướng Dẫn theo Chức Danh</h3>
      <p className="text-xs text-slate-500 mb-4">GS ≤ 7 · PGS ≤ 5 · TS ≤ 3 nghiên cứu sinh</p>
      <Bar data={data} options={{ responsive: true, plugins: { legend: { position: 'bottom' as const } }, scales: { y: { beginAtZero: true } } }} />
    </div>
  );
}

function CorrelationScatterChart({ correlation }: { correlation: ProgressDefenseCorrelationData | null }) {
  if (!correlation) return <EmptyChart title="Phân Tích Tương Quan Tiến Độ — Bảo Vệ" />;

  if (correlation.chuDuMau) {
    return <section className="card space-y-2">
      <h3 className="text-sm font-bold text-slate-900">Tương quan điểm tiến độ và điểm bảo vệ</h3>
      <p className="text-sm text-slate-600">Hiện có {correlation.soMauHienCo ?? 0} mẫu. Cần tối thiểu {correlation.soMauCanThiet} đề tài có đủ hai loại điểm.</p>
    </section>;
  }

  const scatterData = {
    datasets: [{
      label: 'Đề tài đã bảo vệ',
      data: correlation.duLieuDiem.map((d) => ({ x: d.diemTbTienDo, y: d.diemBaoVeHoiDong })),
      backgroundColor: 'rgba(37,99,235,0.7)',
      pointRadius: 7,
    }],
  };

  return (
    <div className="card p-5">
      <h3 className="font-bold text-slate-900 text-sm mb-1">🔬 Tương Quan Tiến Độ ↔ Điểm Bảo Vệ (Pearson r)</h3>
      <div className="flex gap-3 mb-3 flex-wrap">
        {correlation.heSoTuongQuan != null && <span className="text-xs rounded-full bg-blue-100 text-blue-700 px-2.5 py-1 font-bold">r = {correlation.heSoTuongQuan.toFixed(3)}</span>}
        {correlation.phuongTrinhHoiQuy && <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 font-mono">{correlation.phuongTrinhHoiQuy}</span>}
        <span className="text-xs text-slate-500 self-center">{correlation.tongSoDeTaiMau} mẫu thực tế</span>
      </div>
      <Scatter data={scatterData} options={{
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Điểm TB Tiến Độ' }, min: 0, max: 10 },
          y: { title: { display: true, text: 'Điểm Bảo Vệ HĐ' }, min: 0, max: 10 },
        },
      }} />
      <p className="text-xs text-slate-500 mt-2 italic">{correlation.doTinCay}</p>
    </div>
  );
}

function PredictiveRiskTable({ riskItems }: { riskItems: PredictiveRiskItem[] }) {
  if (!riskItems.length) return null;
  const colorMap: Record<PredictiveRiskItem['mucDoRuiRo'], { bar: string; badge: string }> = {
    AnToan: { bar: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-800' },
    NguyCoTrungBinh: { bar: 'bg-amber-600', badge: 'bg-amber-100 text-amber-800' },
    NguyCoCao: { bar: 'bg-rose-600', badge: 'bg-rose-100 text-rose-800' },
  };
  const labelMap: Record<string, string> = { AnToan: '🟢 An Toàn', NguyCoTrungBinh: '🟡 Nguy Cơ TB', NguyCoCao: '🔴 Nguy Cơ Cao' };
  return (
    <section className="card overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-sm">Điểm cảnh báo học vụ (0–100)</h3>
        <p className="text-xs text-slate-600 mt-0.5">Điểm tham khảo dựa trên thời gian, công bố đã khai báo và báo cáo tiến độ.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
            <tr>{['Nghiên cứu sinh', 'Tháng/72', 'Bài ISI / Scopus', 'Điểm tiến độ', 'Điểm cảnh báo', 'Mức độ', 'Khuyến nghị'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {riskItems.map((item) => {
              const color = colorMap[item.mucDoRuiRo];
              return (
                <tr key={item.maHv} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.hoTen}<br /><span className="text-slate-400 font-mono">{item.mshv}</span></td>
                  <td className="px-4 py-3">
                    <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden mb-0.5">
                      <div className={`h-full ${color.bar} rounded-full`} style={{ width: `${Math.min(100, (item.soThangThucTe / 72) * 100)}%` }} />
                    </div>
                    <span className="font-mono">{item.soThangThucTe}/72</span>
                  </td>
                  <td className="px-4 py-3 font-bold">{item.soBaiBaoIsiScopus}</td>
                  <td className="px-4 py-3">{item.diemTbTienDo ?? 'Chưa có điểm'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className={`h-full ${color.bar} rounded-full`} style={{ width: `${item.diemRuiRo}%` }} />
                      </div>
                      <span className="font-bold tabular-nums text-slate-800">{item.diemRuiRo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${color.badge}`}>
                      {labelMap[item.mucDoRuiRo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[200px]">{item.khuyenNghiHocVu}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SlaWarningTable({ warnings }: { warnings: SlaWarningItem[] }) {
  if (!warnings.length) return null;
  return (
    <section className="card overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">⏱️ Cảnh Báo Nguy Cơ Quá Hạn SLA 72 Tháng</h3>
          <p className="text-xs text-slate-600 mt-0.5">Mốc 72 tháng dùng để tham chiếu khi theo dõi hồ sơ tiến sĩ.</p>
        </div>
        <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-bold">{warnings.length} NCS</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider">
            <tr>{['NCS', 'Đề tài', 'Tháng ĐT', 'Bài báo ISI', 'Báo cáo gần nhất', 'Mức cảnh báo'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {warnings.map((w) => {
              const cw = w.mucDoCanhBao === 'BaoDongDo'
                ? { bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', label: '🔴 Báo Động Đỏ' }
                : w.mucDoCanhBao === 'CanDayNhanh'
                ? { bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', label: '🟡 Cần Đẩy Nhanh' }
                : { bg: '', badge: 'bg-emerald-100 text-emerald-700', label: '🟢 An Toàn' };
              return (
                <tr key={w.id} className={`${cw.bg} hover:opacity-90 transition-colors`}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{w.hoTen}<br /><span className="font-mono text-slate-400">{w.mshv}</span></td>
                  <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate" title={w.tenDt}>{w.tenDt}</td>
                  <td className="px-4 py-3 font-bold">{w.soThangDaDaoTao}<span className="text-slate-400 font-normal">/72</span></td>
                  <td className="px-4 py-3 font-bold">{w.soBaiBaoIsiScopus}</td>
                  <td className="px-4 py-3">Lần {w.lanBaoCaoGanNhat}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${cw.badge}`}>{cw.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProductivityPanel({ productivity }: { productivity: PublicationProductivityStats }) {
  return (
    <section className="card p-5">
      <h3 className="font-bold text-slate-900 text-sm mb-4">Công bố do nghiên cứu sinh khai báo</h3>
      <div className="grid gap-4 mb-6 sm:grid-cols-3">
        <div className="text-center p-4 rounded-2xl bg-blue-50 border border-blue-100">
          <p className="text-3xl font-extrabold text-blue-700">{productivity.nangSuatBinhQuanMoiNcs}</p>
          <p className="text-xs text-slate-600 mt-1">Bài/NCS TB</p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <p className="text-3xl font-extrabold text-emerald-700">{productivity.tyLeIsiScopus}%</p>
          <p className="text-xs text-slate-600 mt-1">Tỷ lệ ISI/Scopus</p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-amber-50 border border-amber-100">
          <p className="text-3xl font-extrabold text-amber-700">{productivity.tyLeTacGiaChinh}%</p>
          <p className="text-xs text-slate-600 mt-1">Tỷ lệ Tác giả chính</p>
        </div>
      </div>
      {productivity.phanBoTheoChuyenNganh.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Phân bổ theo Chuyên ngành</p>
          <div className="space-y-2">
            {productivity.phanBoTheoChuyenNganh.slice(0, 5).map((cn) => (
              <div key={cn.chuyenNganh} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-44 shrink-0 truncate">{cn.chuyenNganh}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, cn.soBaiBao * 10)}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700 w-10 text-right">{cn.soBaiBao}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyChart({ title }: { title: string }) {
  return (
    <div className="card p-5 flex flex-col items-center justify-center gap-3 h-64 text-slate-400">
      <span className="text-4xl">📭</span>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs">Chưa có dữ liệu từ hệ thống</p>
    </div>
  );
}

function KnowledgeBaseTab({
  kbStats, kbLoading, onRefresh, showToast,
}: {
  kbStats: KnowledgeBaseAdminStats | null;
  kbLoading: boolean;
  onRefresh: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<KnowledgeBaseChunkDto>({
    soHieu: '', tenVanBan: '', coQuan: 'Bộ Giáo dục và Đào tạo',
    dieuKhoan: '', tieuDe: '', noiDung: '', tuKhoa: [], ngayBanHanh: '', danhMuc: 'Tiến sĩ (TT 18)',
  });
  const [tuKhoaInput, setTuKhoaInput] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.soHieu || !form.tenVanBan || !form.dieuKhoan || !form.tieuDe || !form.noiDung) {
      showToast('Vui lòng điền đầy đủ các trường bắt buộc (*).', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const tuKhoa = tuKhoaInput.split(',').map((k) => k.trim()).filter(Boolean);
      const res = await knowledgeBaseApi.addChunk({ ...form, tuKhoa });
      if (res.data.success) {
        showToast(res.data.message, 'success');
        setShowAddForm(false);
        setForm({ soHieu: '', tenVanBan: '', coQuan: 'Bộ Giáo dục và Đào tạo', dieuKhoan: '', tieuDe: '', noiDung: '', tuKhoa: [], ngayBanHanh: '', danhMuc: 'Tiến sĩ (TT 18)' });
        setTuKhoaInput('');
        onRefresh();
      } else {
        showToast(res.data.message, 'error');
      }
    } catch {
      showToast('Lỗi khi thêm chunk. Vui lòng thử lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, tieuDe: string) => {
    try {
      const res = await knowledgeBaseApi.toggleChunk(id);
      showToast(res.data.message, 'success');
      onRefresh();
    } catch {
      showToast(`Không thể toggle chunk "${tieuDe}"`, 'error');
    }
  };

  const handleDelete = async (id: string, tieuDe: string) => {
    if (!window.confirm(`Xóa chunk "${tieuDe}" khỏi Knowledge Base?`)) return;
    try {
      const res = await knowledgeBaseApi.deleteChunk(id);
      if (res.data.success) { showToast(res.data.message, 'success'); onRefresh(); }
      else showToast(res.data.message, 'error');
    } catch {
      showToast('Lỗi khi xóa chunk.', 'error');
    }
  };

  const filtered = kbStats?.chunks.filter((c) =>
    !searchQuery || c.tieuDe.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.soHieu.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dieuKhoan.toLowerCase().includes(searchQuery.toLowerCase()),
  ) ?? [];

  if (kbLoading) return (
    <div className="space-y-4">{[0,1,2].map((i) => <SkeletonCard key={i} />)}</div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {kbStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatMini label="Tổng Chunks" value={kbStats.tongChunk} color="blue" icon="📦" />
          <StatMini label="Văn bản Pháp lý" value={kbStats.tongVanBan} color="indigo" icon="📜" />
          <StatMini label="Từ khóa RAG" value={kbStats.tongTuKhoa} color="emerald" icon="🔑" />
          <div className="card p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phân bổ văn bản</p>
            <div className="space-y-1">
              {kbStats.phanBoVanBan.map((pb) => (
                <div key={pb.soHieu} className="flex justify-between text-xs">
                  <span className="text-slate-600 truncate max-w-[120px]">{pb.soHieu}</span>
                  <span className="font-bold text-blue-600">{pb.soChunk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button id="kb-add-chunk-btn" onClick={() => setShowAddForm(!showAddForm)} className="btn-primary text-xs px-4 py-2">
          {showAddForm ? '✕ Đóng Form' : '＋ Thêm Chunk Quy Chế Mới'}
        </button>
        <button id="kb-refresh-btn" onClick={onRefresh} className="btn-secondary text-xs px-4 py-2">🔄 Làm mới</button>
        <input id="kb-search" type="search" placeholder="Tìm tiêu đề, điều khoản, số hiệu..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="card p-6 space-y-4 border-2 border-blue-200 bg-blue-50/30">
          <h3 className="font-bold text-blue-900 text-sm">➕ Thêm Chunk Quy Chế Mới vào Knowledge Base</h3>
          <p className="text-xs text-slate-500">Chunk sẽ được đưa vào RAG Engine ngay lập tức mà không cần khởi động lại server.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="kb-soHieu" label="Số hiệu văn bản *" value={form.soHieu} onChange={(v) => setForm({...form, soHieu: v})} placeholder="VD: 18/2021/TT-BGDĐT" />
            <FormField id="kb-tenVanBan" label="Tên văn bản *" value={form.tenVanBan} onChange={(v) => setForm({...form, tenVanBan: v})} placeholder="VD: Quy chế tuyển sinh tiến sĩ" />
            <FormField id="kb-coQuan" label="Cơ quan ban hành" value={form.coQuan || ''} onChange={(v) => setForm({...form, coQuan: v})} placeholder="VD: Bộ Giáo dục và Đào tạo" />
            <FormField id="kb-dieuKhoan" label="Điều khoản *" value={form.dieuKhoan} onChange={(v) => setForm({...form, dieuKhoan: v})} placeholder="VD: Điều 15" />
            <FormField id="kb-ngayBanHanh" label="Ngày ban hành" value={form.ngayBanHanh || ''} onChange={(v) => setForm({...form, ngayBanHanh: v})} placeholder="VD: 28/06/2021" />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="kb-danhMuc">Danh mục</label>
              <select id="kb-danhMuc" value={form.danhMuc} onChange={(e) => setForm({...form, danhMuc: e.target.value})}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option>Tiến sĩ (TT 18)</option><option>Thạc sĩ (TT 23)</option>
                <option>Công văn Bộ GD&ĐT</option><option>Quy định Nội bộ</option>
              </select>
            </div>
          </div>
          <FormField id="kb-tieuDe" label="Tiêu đề điều khoản *" value={form.tieuDe} onChange={(v) => setForm({...form, tieuDe: v})} placeholder="VD: Tiêu chuẩn thành lập Hội đồng đánh giá luận án" />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="kb-noiDung">Nội dung điều khoản *</label>
            <textarea id="kb-noiDung" rows={5} value={form.noiDung} onChange={(e) => setForm({...form, noiDung: e.target.value})}
              placeholder="Dán nội dung điều khoản quy chế vào đây..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
          </div>
          <FormField id="kb-tuKhoa" label="Từ khóa RAG (phân cách bởi dấu phẩy)" value={tuKhoaInput} onChange={setTuKhoaInput} placeholder="VD: hội đồng, thành lập, phản biện, cơ cấu" />
          <div className="flex gap-3">
            <button id="kb-submit-btn" type="submit" disabled={submitting} className="btn-primary text-xs px-5 py-2 disabled:opacity-50">
              {submitting ? '⏳ Đang thêm...' : '✅ Thêm vào Knowledge Base'}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary text-xs px-4 py-2">Hủy</button>
          </div>
        </form>
      )}

      <section className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">📚 Danh Sách Chunks trong Knowledge Base</h3>
          <span className="text-xs text-slate-500">{filtered.length}/{kbStats?.chunks.length ?? 0} chunks</span>
        </div>
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && <div className="py-10 text-center text-slate-400 text-sm">Không tìm thấy chunk nào.</div>}
          {filtered.map((chunk) => {
            const isDisabled = chunk.id.startsWith('_disabled_');
            const isCustom = chunk.id.includes('custom-');
            return (
              <div key={chunk.id} className={`p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start ${isDisabled ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{chunk.soHieu}</span>
                    <span className="text-[11px] text-slate-500">{chunk.dieuKhoan}</span>
                    {isCustom && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">CUSTOM</span>}
                    {isDisabled && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">ẨN</span>}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{chunk.tieuDe}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{chunk.noiDungTomTat}</p>
                  {chunk.tuKhoa.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {chunk.tuKhoa.slice(0, 5).map((kw) => <span key={kw} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{kw}</span>)}
                      {chunk.tuKhoa.length > 5 && <span className="text-[10px] text-slate-400">+{chunk.tuKhoa.length - 5}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button id={`kb-toggle-${chunk.id}`} onClick={() => handleToggle(chunk.id, chunk.tieuDe)}
                    title={isDisabled ? 'Kích hoạt lại' : 'Ẩn khỏi RAG'}
                    className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 text-sm">
                    {isDisabled ? '👁️' : '🙈'}
                  </button>
                  {isCustom && (
                    <button id={`kb-delete-${chunk.id}`} onClick={() => handleDelete(chunk.id, chunk.tieuDe)}
                      title="Xóa chunk custom"
                      className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-slate-400 hover:text-red-600 text-sm">
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatMini({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <article className="card p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`font-sans text-3xl font-extrabold text-${color}-600`}>{value}</p>
    </article>
  );
}

function FormField({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor={id}>{label}</label>
      <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
    </div>
  );
}
