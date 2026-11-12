import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  SlaWarningItem,
  PublicationTrendItem,
  MajorDistributionItem,
  SupervisorWorkloadItem,
} from '../../lib/api';
import { exportSlaReportExcel } from '../../lib/exportService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
);

export function SlaWarningChart({ warnings }: { warnings: SlaWarningItem[] }) {
  const anToan = warnings.filter((w) => w.mucDoCanhBao === 'AnToan').length;
  const canDayNhanh = warnings.filter((w) => w.mucDoCanhBao === 'CanDayNhanh').length;
  const baoDongDo = warnings.filter((w) => w.mucDoCanhBao === 'BaoDongDo').length;
  const total = warnings.length || 1;

  const pctAnToan = Math.round((anToan / total) * 100);
  const pctCanDayNhanh = Math.round((canDayNhanh / total) * 100);
  const pctBaoDongDo = Math.round((baoDongDo / total) * 100);

  return (
    <article className="card flex flex-col justify-between">
      <header className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
            ⏱️ Cảnh Báo Nguy Cơ Quá Hạn (SLA 72 Tháng)
          </h3>
          <p className="text-xs text-slate-500">Giám sát thời gian đào tạo Tiến sĩ theo Thông tư 18/2021</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
          Max: 72 tháng
        </span>
      </header>

      {}
      <div className="my-5 space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Phân khúc thời gian đào tạo:</span>
          <span>{warnings.length} Nghiên cứu sinh</span>
        </div>

        <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200">
          <div
            style={{ width: `${pctAnToan}%` }}
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-700 hover:opacity-90"
            title={`An toàn: ${anToan} NCS (${pctAnToan}%)`}
          />
          <div
            style={{ width: `${pctCanDayNhanh}%` }}
            className="h-full bg-amber-400 transition-all duration-700 hover:opacity-90"
            title={`Cần đẩy nhanh: ${canDayNhanh} NCS (${pctCanDayNhanh}%)`}
          />
          <div
            style={{ width: `${pctBaoDongDo}%` }}
            className="h-full bg-rose-500 rounded-r-full transition-all duration-700 hover:opacity-90"
            title={`Báo động đỏ: ${baoDongDo} NCS (${pctBaoDongDo}%)`}
          />
        </div>
      </div>

      {}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-2.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mb-1" />
          <p className="font-bold text-emerald-900">{anToan} NCS</p>
          <p className="text-[10px] text-emerald-700 font-medium">&lt; 36 tháng</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">An toàn</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-2.5">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mb-1" />
          <p className="font-bold text-amber-900">{canDayNhanh} NCS</p>
          <p className="text-[10px] text-amber-700 font-medium">36 - 60 tháng</p>
          <p className="text-[10px] text-amber-600 font-bold mt-0.5">Cần đẩy nhanh</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-2.5">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500 mb-1" />
          <p className="font-bold text-rose-900">{baoDongDo} NCS</p>
          <p className="text-[10px] text-rose-700 font-medium">&gt; 60 tháng</p>
          <p className="text-[10px] text-rose-600 font-bold mt-0.5">Báo động đỏ</p>
        </div>
      </div>
    </article>
  );
}

export function PublicationTrendChart({ trends }: { trends: PublicationTrendItem[] }) {
  const chartData = {
    labels: trends.map((t) => `Năm ${t.nam}`),
    datasets: [
      {
        label: 'Bài báo ISI / Scopus (Điều 12 TT 18)',
        data: trends.map((t) => t.isiScopus),
        backgroundColor: '#2563eb',
        borderRadius: 8,
      },
      {
        label: 'Tạp chí HĐGSNN (>= 0.75 điểm)',
        data: trends.map((t) => t.hdgsnn),
        backgroundColor: '#6366f1',
        borderRadius: 8,
      },
      {
        label: 'Hội thảo Quốc tế uy tín',
        data: trends.map((t) => t.hoiThaoQt),
        backgroundColor: '#10b981',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: { size: 11, family: 'Inter, sans-serif' },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <article className="card flex flex-col justify-between">
      <header className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
            📈 Xu Hướng Công Bố Bài Báo Khoa Học (Chart.js)
          </h3>
          <p className="text-xs text-slate-500">Phân bố sản lượng công bố ISI / Scopus và tạp chí tính điểm HĐGSNN</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
          +34.8% YoY
        </span>
      </header>

      <div className="h-64 w-full my-3">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </article>
  );
}

export function MajorDistributionChart({ distributions }: { distributions: MajorDistributionItem[] }) {
  const chartData = {
    labels: distributions.map((d) => d.tenCn),
    datasets: [
      {
        data: distributions.map((d) => d.soLuongDeTai),
        backgroundColor: [
          '#2563eb',
          '#6366f1',
          '#0ea5e9',
          '#10b981',
          '#f59e0b',
          '#ec4899',
          '#8b5cf6',
          '#14b8a6',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          font: { size: 11 },
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const val = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = Math.round((val / total) * 100);
            return ` ${context.label}: ${val} đề tài (${pct}%)`;
          },
        },
      },
    },
    cutout: '65%',
  };

  return (
    <article className="card flex flex-col justify-between">
      <header className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
            🧭 Phân Bố Đề Tài Theo Chuyên Ngành (Chart.js)
          </h3>
          <p className="text-xs text-slate-500">Tỷ trọng đề tài Nghiên cứu sinh và Học viên thạc sĩ toàn trường</p>
        </div>
      </header>

      <div className="h-64 w-full my-3 flex items-center justify-center">
        <Doughnut data={chartData} options={chartOptions} />
      </div>
    </article>
  );
}

export function SupervisorWorkloadGauge({ workloads }: { workloads: SupervisorWorkloadItem[] }) {
  return (
    <article className="card flex flex-col justify-between">
      <header className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
            👨‍🏫 Định Mức Hướng Dẫn Giảng Viên (Điều 13 TT 18)
          </h3>
          <p className="text-xs text-slate-500">Giám sát tải hướng dẫn: GS ≤ 7 NCS, PGS ≤ 5 NCS, TS ≤ 3 NCS</p>
        </div>
      </header>

      <div className="my-4 space-y-3">
        {workloads.map((w, idx) => {
          const pct = Math.round((w.trungBinhDangHuongDan / w.dinhMucToiDa) * 100);
          return (
            <div key={idx} className="space-y-1.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{w.hocHamVi} ({w.soLuongGv} Giảng viên)</span>
                <span className="font-bold text-slate-600">
                  TB {w.trungBinhDangHuongDan} / Max {w.dinhMucToiDa} NCS ({pct}%)
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  style={{ width: `${Math.min(pct, 100)}%` }}
                  className={`h-full rounded-full transition-all duration-700 ${
                    pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function AcademicRiskTable({ warnings }: { warnings: SlaWarningItem[] }) {
  const [filter, setFilter] = useState<'All' | 'BaoDongDo' | 'CanDayNhanh' | 'AnToan'>('All');

  const filtered = warnings.filter((w) => filter === 'All' || w.mucDoCanhBao === filter);

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2">
            🚨 Danh Sách Nghiên Cứu Sinh Cần Theo Dõi Tiến Độ
          </h3>
          <p className="text-xs text-slate-500">Hệ thống phân loại rủi ro học vụ theo Thông tư 18/2021</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilter('All')}
            className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
              filter === 'All' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Tất cả ({warnings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('BaoDongDo')}
            className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
              filter === 'BaoDongDo' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'
            }`}
          >
            Báo động đỏ
          </button>
          <button
            type="button"
            onClick={() => setFilter('CanDayNhanh')}
            className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
              filter === 'CanDayNhanh' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
            }`}
          >
            Cần đẩy nhanh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
              <th className="p-3 font-bold">Nghiên cứu sinh</th>
              <th className="p-3 font-bold">Đề tài Luận án</th>
              <th className="p-3 font-bold">Thời gian Đào tạo</th>
              <th className="p-3 font-bold">Bài báo ISI/Scopus</th>
              <th className="p-3 font-bold">GVHD</th>
              <th className="p-3 font-bold">Mức cảnh báo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-3 font-semibold text-slate-900">
                  <p>{w.hoTen}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{w.mshv} · {w.chuyenNganh}</p>
                </td>
                <td className="p-3 text-slate-700 max-w-xs line-clamp-2">{w.tenDt}</td>
                <td className="p-3 font-mono font-bold text-slate-700">{w.soThangDaDaoTao} tháng</td>
                <td className="p-3">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    w.soBaiBaoIsiScopus >= 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {w.soBaiBaoIsiScopus} bài báo
                  </span>
                </td>
                <td className="p-3 text-slate-600">{w.gvhd}</td>
                <td className="p-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    w.mucDoCanhBao === 'BaoDongDo'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : w.mucDoCanhBao === 'CanDayNhanh'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {w.mucDoCanhBao === 'BaoDongDo' ? 'Báo động đỏ (>60T)' : w.mucDoCanhBao === 'CanDayNhanh' ? 'Cần đẩy nhanh' : 'An toàn'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ReportExportModal({
  isOpen,
  onClose,
  warnings,
}: {
  isOpen: boolean;
  onClose: () => void;
  warnings: SlaWarningItem[];
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <article className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        <header className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
              Xuất Báo Cáo Tiến Độ Đào Tạo
            </span>
            <h3 className="font-sans text-lg font-bold text-slate-900 mt-1">
              Báo Cáo Phân Tích Tiến Độ &amp; Cảnh Báo SLA Đào Tạo
            </h3>
            <p className="text-xs text-slate-500">Khóa 2022 – 2026 · Chuẩn đào tạo Sau đại học</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </header>

        <div className="my-5 space-y-4 text-xs font-sans">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-slate-900">Đơn vị: Phòng Đào tạo Sau Đại học</p>
              <p className="text-slate-500">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-700">Tỷ lệ đúng hạn: 92.4%</p>
              <p className="text-slate-500">Tổng dữ liệu: {warnings.length} Nghiên cứu sinh</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase">Tùy chọn định dạng tệp xuất dữ liệu:</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  exportSlaReportExcel(warnings);
                  onClose();
                }}
                className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/60 transition-all text-left space-y-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">📊</span>
                  <span className="rounded-md bg-emerald-200 text-emerald-900 px-2 py-0.5 text-[10px] font-bold">.XLSX</span>
                </div>
                <p className="font-bold text-slate-900 text-xs">Xuất Sổ Bảng Tính Excel</p>
                <p className="text-[11px] text-slate-500">Đầy đủ cột MSHV, Đề tài, Số tháng, Phân loại cảnh báo TT 18.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                  onClose();
                }}
                className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 transition-all text-left space-y-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">📄</span>
                  <span className="rounded-md bg-blue-200 text-blue-900 px-2 py-0.5 text-[10px] font-bold">.PDF</span>
                </div>
                <p className="font-bold text-slate-900 text-xs">In / Xuất Báo Cáo PDF</p>
                <p className="text-[11px] text-slate-500">Định dạng A4 chuẩn văn bản hành chính Bộ GD&amp;ĐT.</p>
              </button>
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4 font-bold cursor-pointer"
          >
            Đóng
          </button>
        </footer>
      </article>
    </div>
  );
}
