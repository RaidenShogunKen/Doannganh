import { CourseAssignments } from '../components/CourseAssignments';
import { useEffect, useState, FormEvent } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import {
  monHocApi,
  chuyenNganhApi,
  MonHoc,
  DangKyMonHoc,
  ChuyenNganh,
  CourseSummary,
} from '../lib/api';
import { AcademicStore, ACADEMIC_STATE_EVENT } from '../lib/academicStore';

export function HocPhanPage() {
  const { user } = useAuth();
  const [monHocList, setMonHocList] = useState<MonHoc[]>([]);
  const [summary, setSummary] = useState<CourseSummary>();
  const [dangKyList, setDangKyList] = useState<DangKyMonHoc[]>([]);
  const [chuyenNganhList, setChuyenNganhList] = useState<ChuyenNganh[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-courses' | 'register' | 'manage' | 'grading'>('my-courses');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showRegFormModal, setShowRegFormModal] = useState(false);
  const [showRegPrintModal, setShowRegPrintModal] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<MonHoc | null>(null);

  const [selectedHocKy, setSelectedHocKy] = useState(() => academicTerms()[0].id);
  const [submittingMh, setSubmittingMh] = useState<number | null>(null);

  const [tenMh, setTenMh] = useState('');
  const [soTinChi, setSoTinChi] = useState(3);
  const [maCn, setMaCn] = useState<number | ''>('');
  const [loaiHp, setLoaiHp] = useState<'BatBuoc' | 'TuChon'>('BatBuoc');

  const isHocVien = user?.vaiTro === 'HocVien';
  const isAdmin = user?.vaiTro === 'Admin';
  const isGiangVien = user?.vaiTro === 'GiangVien';

  const loadData = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const [mhRes, cnRes] = await Promise.all([monHocApi.list(), chuyenNganhApi.list()]);
      setMonHocList(mhRes.data || []);
      setChuyenNganhList(cnRes.data || []);

      if (user?.maNd && user.vaiTro === 'HocVien') {
        const [dkRes, summaryRes] = await Promise.all([
          monHocApi.listDangKy(user.maNd),
          user.hocVien ? monHocApi.gpa(user.maNd) : null,
        ]);
        setDangKyList(dkRes.data || []);
        setSummary(summaryRes?.data);
      } else {
        setDangKyList([]);
      }
    } catch (err: any) {
      setMonHocList([]);
      setDangKyList([]);
      setMsg({
        type: 'error',
        text:
          err?.response?.data?.message ||
          'Không kết nối được máy chủ học vụ. Vui lòng kiểm tra kết nối và tải lại trang.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (user?.vaiTro === 'HocVien') {
      if (activeTab === 'manage' || activeTab === 'grading') {
        setActiveTab('my-courses');
      }
    } else if (user?.vaiTro === 'GiangVien' || user?.vaiTro === 'Admin') {
      if (activeTab === 'my-courses' || activeTab === 'register') {
        setActiveTab('manage');
      }
    }
  }, [user]);

  const handleDangKy = async (maMh: number) => {
    setSubmittingMh(maMh);
    setMsg(null);
    const targetMh = monHocList.find((m) => m.maMh === maMh);

    try {
      await monHocApi.dangKy({ maMh, hocKyNamHoc: selectedHocKy });
      setMsg({ type: 'success', text: `Đăng ký học phần "${targetMh?.tenMh || ''}" thành công!` });
      await loadData();
      AcademicStore.notifyStateChange('course_reg');
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Đăng ký học phần không thành công. Vui lòng thử lại.',
      });
    } finally {
      setSubmittingMh(null);
    }
  };

  const handleHuyDangKy = async (maMh: number, hocKy: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký học phần này?')) return;
    setMsg(null);
    try {
      await monHocApi.huyDangKy(maMh, hocKy);
      setMsg({ type: 'success', text: 'Đã hủy đăng ký học phần' });
      await loadData();
      AcademicStore.notifyStateChange('course_cancel');
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Không hủy được đăng ký học phần. Vui lòng thử lại.',
      });
    }
  };

  const handleCreateMonHoc = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await monHocApi.create({
        tenMh,
        soTinChi: Number(soTinChi),
        maCn: maCn ? Number(maCn) : undefined,
        loaiHp,
      });
      setMsg({ type: 'success', text: 'Tạo môn học mới thành công!' });
      setTenMh('');
      setSoTinChi(3);
      setMaCn('');
      await loadData();
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Không tạo được học phần. Vui lòng kiểm tra lại thông tin.',
      });
    }
  };

  const tongTinChiTichLuy = summary?.tongTinChiTichLuy ?? 0;
  const diemTbTichLuy = summary?.tongMonHoanThanh ? summary.gpa10.toFixed(2) : 'Chưa có';
  const majorName = chuyenNganhList.find((major) => major.maCn === user?.hocVien?.maChuyenNganh)?.tenCn;
  const termEnrollments = dangKyList.filter((row) => row.hocKyNamHoc === selectedHocKy && row.trangThai !== 'Huy');
  const enrolledTerms = [...new Set(dangKyList.map((row) => row.hocKyNamHoc))];

  return (
    <AppShell
      title="Quản lý Học phần & Đăng ký Môn học"
      subtitle="Kế hoạch đào tạo, tích lũy tín chỉ và bảng điểm học vụ"
    >
      {}
      {msg && (
        <div
          role="alert"
          aria-live="polite"
          className={`mb-6 flex items-center justify-between rounded-2xl p-4 text-sm font-medium shadow-sm transition-all ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{msg.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{msg.text}</span>
          </div>
          <button
            onClick={() => setMsg(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {}
      {isHocVien && (
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <article className="card">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Môn đã đăng ký</p>
            <p className="mt-2 font-sans text-3xl font-extrabold text-slate-900">{dangKyList.length}</p>
            <p className="mt-1 text-xs text-slate-500">Tổng tất cả học kỳ</p>
          </article>

          <article className="card">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tín chỉ tích lũy</p>
            <p className="mt-2 font-sans text-3xl font-extrabold text-blue-600">{tongTinChiTichLuy} tín chỉ</p>
            <p className="mt-1 text-xs text-slate-500">Môn đạt điểm ≥ 5.0</p>
          </article>

          <article className="card">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Điểm TB tích lũy (GPA)</p>
            <p className="mt-2 font-sans text-3xl font-extrabold text-emerald-600">{diemTbTichLuy}</p>
            <p className="mt-1 text-xs text-slate-500">Thang điểm 10</p>
          </article>
        </div>
      )}

      {}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {isHocVien && (
          <>
            <button
              onClick={() => setActiveTab('my-courses')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'my-courses'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              📚 Học phần của tôi & Bảng điểm ({dangKyList.length})
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              ✍️ Đăng ký môn học mới
            </button>
          </>
        )}

        {(isAdmin || isGiangVien) && (
          <>
            <button
              onClick={() => setActiveTab('manage')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'manage'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              📋 Danh mục môn học ({monHocList.length})
            </button>
            <button
              onClick={() => setActiveTab('grading')}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                activeTab === 'grading'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              🎯 Nhập & Cập nhật điểm học phần
            </button>
          </>
        )}
      </div>

      {}
      {isHocVien && activeTab === 'my-courses' && (
        <section aria-label="Danh sách học phần đã đăng ký" className="card">
          <header className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-sans text-base font-bold text-slate-900">Bảng điểm &amp; Học phần đã đăng ký</h2>
              <p className="text-xs text-slate-500">Chi tiết kết quả học tập các môn học trong chương trình</p>
            </div>
            {dangKyList.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegPrintModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                >
                  <span>📄</span>
                  <span>In Phiếu Đăng Ký Học Phần</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTranscriptModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                >
                  <span>🖨️</span>
                  <span>In Bảng Điểm Tích Lũy</span>
                </button>
              </div>
            )}
          </header>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Đang tải dữ liệu...</p>
          ) : dangKyList.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-600">Bạn chưa đăng ký môn học nào</p>
              <p className="mt-1 text-xs text-slate-400">Hãy chuyển sang tab "Đăng ký môn học mới" để chọn môn</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-3 px-4 font-bold">Học kỳ</th>
                    <th className="py-3 px-4 font-bold">Mã HP</th>
                    <th className="py-3 px-4 font-bold">Tên môn học</th>
                    <th className="py-3 px-4 font-bold">Số tín chỉ</th>
                    <th className="py-3 px-4 font-bold">Loại HP</th>
                    <th className="py-3 px-4 font-bold">Điểm số</th>
                    <th className="py-3 px-4 font-bold">Trạng thái</th>
                    <th className="py-3 px-4 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dangKyList.map((dk) => (
                    <tr key={`${dk.maMh}-${dk.hocKyNamHoc}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-700">{dk.hocKyNamHoc}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">MH-{dk.maMh}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{dk.monHoc?.tenMh}</td>
                      <td className="py-3 px-4 text-slate-600">{dk.monHoc?.soTinChi} TC</td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            dk.monHoc?.loaiHp === 'BatBuoc'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {dk.monHoc?.loaiHp === 'BatBuoc' ? 'Bắt buộc' : 'Tự chọn'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-sm">
                        {dk.diem !== null && dk.diem !== undefined ? (
                          <span className={Number(dk.diem) >= 5.0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {dk.diem}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Chưa có</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            dk.trangThai === 'DaHoanThanh'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {dk.trangThai === 'DaHoanThanh' ? 'Đã hoàn thành' : 'Đang học'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {dk.diem === null || dk.diem === undefined ? (
                          <button
                            onClick={() => handleHuyDangKy(dk.maMh, dk.hocKyNamHoc)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-all"
                          >
                            Hủy đăng ký
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Đã khóa</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>
      )}

      {}
      {isHocVien && activeTab === 'register' && (
        <section aria-label="Đăng ký học phần mới" className="space-y-6">
          <div className="card bg-slate-900 text-white flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-base font-bold text-white">Chọn Học kỳ Đăng ký</h2>
              <p className="text-xs text-slate-300">Vui lòng chọn học kỳ phù hợp trước khi đăng ký học phần</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="selectHocKy" className="text-xs font-bold text-slate-300">Học kỳ:</label>
              <select
                id="selectHocKy"
                value={selectedHocKy}
                onChange={(e) => setSelectedHocKy(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {academicTerms().map((term) => <option key={term.id} value={term.id}>{term.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {monHocList.filter((mh) => mh.maCn == null || mh.maCn === user?.hocVien?.maChuyenNganh).map((mh) => {
              const isRegistered = dangKyList.some(
                (dk) => dk.maMh === mh.maMh && dk.hocKyNamHoc === selectedHocKy && dk.trangThai !== 'Huy',
              );
              return (
                <article key={mh.maMh} className="card flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-400">MH-{mh.maMh}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          mh.loaiHp === 'BatBuoc'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {mh.loaiHp === 'BatBuoc' ? 'Bắt buộc' : 'Tự chọn'}
                      </span>
                    </div>
                    <h3 className="mt-2 font-sans text-sm font-bold text-slate-900">{mh.tenMh}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Chuyên ngành: <strong className="text-slate-700">{mh.chuyenNganh?.tenCn || 'Chung'}</strong>
                    </p>
                    <p className="text-xs text-slate-500">
                      Khối lượng: <strong className="text-indigo-600">{mh.soTinChi} tín chỉ</strong>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {isRegistered ? (
                      <button
                        disabled
                        className="w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
                      >
                        ✓ Đã đăng ký kỳ này
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedCourseForModal(mh);
                          setShowRegFormModal(true);
                        }}
                        disabled={submittingMh === mh.maMh}
                        className="btn-primary w-full justify-center text-xs py-2 cursor-pointer font-bold"
                      >
                        {submittingMh === mh.maMh ? 'Đang xử lý...' : 'Lập Phiếu Đăng Ký Môn Này →'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {}
      {(isAdmin || isGiangVien) && activeTab === 'manage' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {}
          <section aria-label="Danh mục môn học" className="card lg:col-span-2">
            <header className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-sans text-base font-bold text-slate-900">Danh mục Môn học Chương trình</h2>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {monHocList.length} môn học
              </span>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-3 px-4 font-bold">Mã</th>
                    <th className="py-3 px-4 font-bold">Tên môn học</th>
                    <th className="py-3 px-4 font-bold">Số TC</th>
                    <th className="py-3 px-4 font-bold">Chuyên ngành</th>
                    <th className="py-3 px-4 font-bold">Loại HP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monHocList.map((mh) => (
                    <tr key={mh.maMh} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">MH-{mh.maMh}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{mh.tenMh}</td>
                      <td className="py-3 px-4 font-medium text-indigo-600">{mh.soTinChi} TC</td>
                      <td className="py-3 px-4 text-slate-600">{mh.chuyenNganh?.tenCn || 'Dùng chung'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            mh.loaiHp === 'BatBuoc'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {mh.loaiHp === 'BatBuoc' ? 'Bắt buộc' : 'Tự chọn'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {}
          {isAdmin && (
            <aside aria-label="Thêm môn học mới" className="card h-fit">
              <h2 className="font-sans text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                ➕ Thêm Môn học Mới
              </h2>

              <form onSubmit={handleCreateMonHoc} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên môn học *</label>
                  <input
                    type="text"
                    required
                    value={tenMh}
                    onChange={(e) => setTenMh(e.target.value)}
                    placeholder="VD: Học sâu & Thị giác máy tính"
                    className="input-field w-full text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số tín chỉ *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={15}
                    value={soTinChi}
                    onChange={(e) => setSoTinChi(Number(e.target.value))}
                    className="input-field w-full text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chuyên ngành</label>
                  <select
                    value={maCn}
                    onChange={(e) => setMaCn(e.target.value ? Number(e.target.value) : '')}
                    className="input-field w-full text-xs"
                  >
                    <option value="">-- Dùng chung toàn khóa --</option>
                    {chuyenNganhList.map((cn) => (
                      <option key={cn.maCn} value={cn.maCn}>
                        {cn.tenCn} ({cn.trinhDoDaoTao})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại học phần *</label>
                  <select
                    value={loaiHp}
                    onChange={(e) => setLoaiHp(e.target.value as any)}
                    className="input-field w-full text-xs"
                  >
                    <option value="BatBuoc">Bắt buộc</option>
                    <option value="TuChon">Tự chọn</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary w-full justify-center py-2.5 text-xs font-bold mt-2">
                  Lưu môn học mới
                </button>
              </form>
            </aside>
          )}
        </div>
      )}

      {}
      {(isAdmin || isGiangVien) && activeTab === 'grading' && (
        <CourseAssignments courses={monHocList} majors={chuyenNganhList} admin={isAdmin} />
      )}

      {showTranscriptModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <article className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <header className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                  Phòng Đào tạo Sau Đại học
                </span>
                <h3 className="font-sans text-lg font-bold text-slate-900 mt-1">
                  Bản Kết Quả Học Tập &amp; Điểm Tích Lũy Toàn Khóa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTranscriptModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </header>

            {}
            <div className="print-document my-6 space-y-4 text-xs text-slate-800 leading-relaxed font-sans" id="printable-transcript">
              <div className="flex justify-between items-center text-center border-b border-slate-200 pb-3">
                <div className="text-left">
                  <p className="font-bold uppercase text-[11px] text-slate-700">QUẢN LÝ ĐÀO TẠO SAU ĐẠI HỌC</p>
                  <p className="font-semibold text-[10px] text-slate-500">PHÒNG ĐÀO TẠO SAU ĐẠI HỌC</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[11px] text-slate-700">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="italic text-[10px] text-slate-500">Độc lập - Tự do - Hạnh phúc</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold text-slate-600">Họ và tên học viên: </span>
                  <strong className="text-slate-900">{user?.hoTen || 'Chưa có dữ liệu'}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Mã số học viên: </span>
                  <strong className="font-mono text-slate-900">{user?.hocVien?.mshv || 'Chưa cấp MSHV'}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Trình độ đào tạo: </span>
                  <strong className="text-blue-600">{user?.hocVien?.trinhDo === 'TienSi' ? 'Tiến sĩ' : user?.hocVien?.trinhDo === 'ThacSi' ? 'Thạc sĩ' : 'Chưa có dữ liệu'}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Chuyên ngành: </span>
                  <strong className="text-slate-900">{majorName || 'Chưa có dữ liệu'}</strong>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 mt-4">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
                    <th className="py-2.5 px-3 border-r border-slate-200">TT</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Học kỳ</th>
                    <th className="py-2.5 px-3 border-r border-slate-200">Tên Học Phần</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">Số TC</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">Điểm (10)</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">Điểm Chữ</th>
                    <th className="py-2.5 px-3 text-center">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dangKyList.map((dk, idx) => {
                    const grade = getLetterGrade(dk.diem);
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 border-r border-slate-200 font-mono text-center">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-200">{dk.hocKyNamHoc}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-semibold">{dk.monHoc?.tenMh}</td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-bold">{dk.monHoc?.soTinChi}</td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-bold">
                          {dk.diem !== undefined && dk.diem !== null ? dk.diem : '-'}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-blue-600">{grade.letter}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={grade.scale4 >= 2.0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            {grade.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="rounded-xl bg-blue-50/60 p-4 border border-blue-200 flex flex-wrap justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-slate-700">
                    Tổng số tín chỉ tích lũy: <strong className="text-blue-700 font-bold">{tongTinChiTichLuy} tín chỉ</strong>
                  </p>
                  <p className="font-semibold text-slate-700">
                    Điểm trung bình chung tích lũy (GPA 10): <strong className="text-emerald-700 font-bold">{diemTbTichLuy}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-700">
                    Xếp loại học lực tích lũy: <strong className="text-emerald-700 font-bold">{summary?.xepLoai || 'Chưa có điểm'}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">Bản tham khảo kết quả trên hệ thống</p>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="font-semibold">NGƯỜI LẬP BẢNG ĐIỂM</p>
                  <p className="italic text-[10px] text-slate-400 mt-12">(Ký và ghi rõ họ tên)</p>
                </div>
                <div>
                  <p className="font-semibold">TRƯỞNG PHÒNG ĐÀO TẠO SAU ĐẠI HỌC</p>
                  <p className="italic text-[10px] text-slate-400 mt-12">(Ký tên và đóng dấu)</p>
                </div>
              </div>
            </div>

            <footer className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowTranscriptModal(false)}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>🖨️</span>
                <span>In bản tham khảo kết quả học tập</span>
              </button>
            </footer>
          </article>
        </div>
      )}

      {}
      {showRegFormModal && selectedCourseForModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <article className="card max-w-xl w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <header className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                  Quy trình Đăng ký Học phần Sau Đại học
                </span>
                <h3 className="font-sans text-lg font-bold text-slate-900 mt-1">
                  Phiếu Xác Nhận Đăng Ký Học Phần
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRegFormModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="my-5 space-y-4 text-xs font-sans">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-semibold">Tên Học Phần:</span>
                  <strong className="text-blue-900 font-bold">{selectedCourseForModal.tenMh}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-semibold">Mã Học Phần / Khối lượng:</span>
                  <span className="font-mono">MH-{selectedCourseForModal.maMh} ({selectedCourseForModal.soTinChi} Tín chỉ)</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500 font-semibold">Học kỳ đăng ký:</span>
                  <strong className="text-slate-800">{selectedHocKy}</strong>
                </div>
              </div>

              <footer className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRegFormModal(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowRegFormModal(false);
                    await handleDangKy(selectedCourseForModal.maMh);
                  }}
                  className="btn-primary text-xs py-2 px-6 cursor-pointer shadow-md font-bold"
                >
                  Xác Nhận &amp; Nộp Phiếu Đăng Ký
                </button>
              </footer>
            </div>
          </article>
        </div>
      )}

      {}
      {showRegPrintModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <article className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <header className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                  Bản tham khảo
                </span>
                <h3 className="font-sans text-lg font-bold text-slate-900 mt-1">
                  Phiếu Đăng Ký Học Phần Đào Tạo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRegPrintModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </header>

            <label className="mt-4 block text-sm font-semibold text-slate-700">Chọn học kỳ để in
              <select className="input-field mt-1" value={selectedHocKy} onChange={(event) => setSelectedHocKy(event.target.value)}>
                {[...new Set([selectedHocKy, ...enrolledTerms])].map((term) => <option key={term}>{term}</option>)}
              </select>
            </label>
            <div className="print-document my-6 space-y-4 text-xs text-slate-800 leading-relaxed font-sans" id="printable-reg-form">
              <div className="flex justify-between items-center text-center border-b border-slate-200 pb-3">
                <div className="text-left">
                  <p className="font-bold uppercase text-[11px] text-slate-700">QUẢN LÝ ĐÀO TẠO SAU ĐẠI HỌC</p>
                  <p className="font-semibold text-[10px] text-slate-500">PHÒNG ĐÀO TẠO</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[11px] text-slate-700">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="italic text-[10px] text-slate-500">Độc lập - Tự do - Hạnh phúc</p>
                </div>
              </div>

              <div className="text-center py-2">
                <h4 className="font-bold uppercase text-sm text-slate-900">PHIẾU ĐĂNG KÝ HỌC PHẦN</h4>
                <p className="italic text-slate-600">{selectedHocKy}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-1.5">
                <p><strong>Họ và tên NCS:</strong> {user?.hoTen || 'Chưa có dữ liệu'} · <strong>MSHV:</strong> {user?.hocVien?.mshv || 'Chưa cấp MSHV'}</p>
                <p><strong>Chuyên ngành:</strong> {majorName || 'Chưa có dữ liệu'} · <strong>Khóa:</strong> {user?.hocVien?.khoaHoc || 'Chưa có dữ liệu'}</p>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 mt-3">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">
                    <th className="py-2 px-3 border-r border-slate-200">TT</th>
                    <th className="py-2 px-3 border-r border-slate-200">Mã HP</th>
                    <th className="py-2 px-3 border-r border-slate-200">Tên Môn Học Đăng Ký</th>
                    <th className="py-2 px-3 text-center border-r border-slate-200">Số TC</th>
                    <th className="py-2 px-3 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {!termEnrollments.length && <tr><td className="p-3 text-slate-600" colSpan={5}>Chưa có học phần đăng ký trong kỳ này.</td></tr>}
                  {termEnrollments.map((dk, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-mono">MH-{dk.maMh}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-medium">{dk.monHoc?.tenMh}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold">{dk.monHoc?.soTinChi}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-emerald-700 font-semibold">{dk.trangThai === 'DaHoanThanh' ? 'Đã hoàn thành' : 'Đã đăng ký'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-6 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="font-semibold">NGHIÊN CỨU SINH</p>
                  <p className="italic text-[10px] text-slate-400 mt-12">(Ký và ghi rõ họ tên)</p>
                </div>
                <div>
                  <p className="font-semibold">TRƯỞNG KHOA / CỐ VẤN HỌC TẬP</p>
                  <p className="italic text-[10px] text-slate-400 mt-12">(Ký tên và phê duyệt)</p>
                </div>
              </div>
            </div>

            <footer className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowRegPrintModal(false)}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 cursor-pointer shadow-md font-bold"
              >
                <span>🖨️</span>
                <span>In thông tin đăng ký</span>
              </button>
            </footer>
          </article>
        </div>
      )}
    </AppShell>
  );
}

function getLetterGrade(diem?: number) {
  if (diem === undefined || diem === null) return { letter: '-', scale4: 0, text: 'Đang học' };
  if (diem >= 9.0) return { letter: 'A', scale4: 4.0, text: 'Giỏi / Xuất sắc' };
  if (diem >= 8.0) return { letter: 'B+', scale4: 3.5, text: 'Khá giỏi' };
  if (diem >= 7.0) return { letter: 'B', scale4: 3.0, text: 'Khá' };
  if (diem >= 6.0) return { letter: 'C+', scale4: 2.5, text: 'Trung bình khá' };
  if (diem >= 5.0) return { letter: 'C', scale4: 2.0, text: 'Trung bình' };
  if (diem >= 4.0) return { letter: 'D+', scale4: 1.5, text: 'Không đạt' };
  if (diem >= 3.5) return { letter: 'D', scale4: 1.0, text: 'Không đạt' };
  return { letter: 'F', scale4: 0.0, text: 'Không đạt' };
}

function academicTerms() {
  const date = new Date();
  const year = date.getFullYear() - (date.getMonth() < 8 ? 1 : 0);
  const current = date.getMonth() >= 8 || date.getMonth() === 0 ? 1 : date.getMonth() < 6 ? 2 : 3;
  return [current, ...[1, 2, 3].filter((term) => term !== current)].map((term) => ({
    id: `HK${term}_${year}-${year + 1}`, label: `Học kỳ ${term} (${year}–${year + 1})`,
  }));
}
