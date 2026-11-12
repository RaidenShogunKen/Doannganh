import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { FileUploadZone } from '../components/ui/FileUploadZone';
import { AcademicStore, ACADEMIC_STATE_EVENT } from '../lib/academicStore';
import { deTaiApi, DeTai, userApi, GiangVienOption } from '../lib/api';
import { exportDeTaiToExcel } from '../lib/exportService';

export function DeTaiPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<DeTai[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<string>('ALL');
  const [selectedTopicDecision, setSelectedTopicDecision] = useState<DeTai | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await deTaiApi.getAll();
      if (res.data) {
        setItems(res.data);
        AcademicStore.saveDeTaiList(res.data);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const handleSync = () => {
      refresh();
    };
    window.addEventListener(ACADEMIC_STATE_EVENT, handleSync);
    return () => window.removeEventListener(ACADEMIC_STATE_EVENT, handleSync);
  }, []);

  async function duyet(maDt: string, trangThai: string) {
    try {
      await deTaiApi.updateTrangThai(maDt, trangThai);
      alert(`Đã cập nhật trạng thái đề tài thành công sang [${trangThai === 'DaDuyet' || trangThai === 'DangThucHien' ? 'Đã duyệt' : 'Từ chối'}]. Dữ liệu đã được lưu trực tiếp vào CSDL.`);
      await refresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái đề tài';
      alert(`Không thể duyệt đề tài: ${msg}`);
    }
  }

  const title =
    user?.vaiTro === 'HocVien'
      ? 'Đề tài Luận án của tôi'
      : user?.vaiTro === 'GiangVien'
      ? 'Đề tài Hướng dẫn'
      : 'Tất cả Đề tài Luận án';

  const filteredItems = items.filter((item) => {
    if (filterTab === 'ALL') return true;
    return item.trangThai === filterTab;
  });

  return (
    <AppShell title={title} subtitle="Quản lý tiến độ luận văn Thạc sĩ / luận án Tiến sĩ & xét duyệt đủ điều kiện bảo vệ">
      {}
      <nav aria-label="Lọc đề tài theo trạng thái" className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-2">
          {['ALL', 'ChoDuyet', 'DaDuyet', 'DuDKBaoVe', 'DaBaoVe'].map((tab) => (
            <li key={tab}>
              <button
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  filterTab === tab
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL'
                  ? 'Tất cả đề tài'
                  : tab === 'ChoDuyet'
                  ? 'Chờ duyệt'
                  : tab === 'DaDuyet'
                  ? 'Đã duyệt'
                  : tab === 'DuDKBaoVe'
                  ? 'Đủ ĐK Bảo vệ'
                  : 'Đã Bảo vệ'}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportDeTaiToExcel(filteredItems)}
            className="rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>📊</span>
            <span>Xuất Excel Đề Tài ({filteredItems.length})</span>
          </button>

          {user?.vaiTro === 'HocVien' && (
            <CreateDeTaiForm
              onCreated={async () => {
                const list = await AcademicStore.fetchDeTaiList();
                setItems(list);
              }}
            />
          )}
        </div>
      </nav>

      {loading && (
        <section aria-label="Trạng thái tải dữ liệu" className="card text-center py-10">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
          <p className="mt-2 text-xs font-semibold text-slate-500">Đang tải dữ liệu đề tài...</p>
        </section>
      )}

      {!loading && filteredItems.length === 0 && (
        <section aria-label="Không có đề tài" className="card py-12 text-center text-sm text-slate-500">
          Chưa có đề tài nào trong danh mục này.
        </section>
      )}

      {}
      <section aria-label="Danh sách đề tài đào tạo sau đại học">
        <ul className="grid grid-cols-1 gap-4">
          {filteredItems.map((dt) => (
            <li key={dt.maDt}>
              <article className="card flex flex-col justify-between gap-4 sm:flex-row sm:items-center hover:shadow-md transition-all">
                <header className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={dt.trangThai} />
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 font-mono">
                      Mã: {dt.maDt}
                    </span>
                  </div>
                  <h3 className="truncate font-sans text-base font-bold text-slate-900 hover:text-blue-600">
                    <Link to={`/de-tai/${dt.maDt}`} className="hover:underline">
                      {dt.tenDt}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-500">
                    📅 Đăng ký: <time dateTime={dt.ngayDangKy}>{new Date(dt.ngayDangKy).toLocaleDateString('vi-VN')}</time>
                    {dt.giangVienHuongDan?.nguoiDung?.hoTen && ` · 👨‍🏫 GVHD: ${dt.giangVienHuongDan.nguoiDung.hoTen}`}
                    {dt.hocVien?.nguoiDung?.hoTen && ` · 🎓 Học viên: ${dt.hocVien.nguoiDung.hoTen}`}
                  </p>
                </header>

                <footer className="flex shrink-0 items-center gap-2 flex-wrap">
                  {(user?.vaiTro === 'Admin' || user?.vaiTro === 'GiangVien') && dt.trangThai !== 'ChoDuyet' && (
                    <button
                      type="button"
                      onClick={() => setSelectedTopicDecision(dt)}
                      className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Xem và in thông tin giao đề tài"
                    >
                      <span>📜</span>
                      <span>Thông tin giao đề tài</span>
                    </button>
                  )}

                  {(user?.vaiTro === 'GiangVien' || user?.vaiTro === 'Admin') && dt.trangThai === 'ChoDuyet' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => duyet(dt.maDt, 'DaDuyet')}
                        className="btn-primary py-1.5 px-3 text-xs cursor-pointer font-bold shadow-sm"
                      >
                        ✓ Duyệt Đề Tài
                      </button>
                      <button
                        type="button"
                        onClick={() => duyet(dt.maDt, 'TuChoi')}
                        className="btn-secondary py-1.5 px-3 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer font-bold"
                      >
                        ✕ Từ chối
                      </button>
                    </div>
                  )}
                  <Link to={`/de-tai/${dt.maDt}`} className="btn-secondary py-1.5 px-3 text-xs font-bold">
                    Chi tiết →
                  </Link>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {}
      {selectedTopicDecision && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <article className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <header className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                  Bản tham khảo
                </span>
                <h3 className="font-sans text-lg font-bold text-slate-900 mt-1">
                  Thông tin giao đề tài và phân công hướng dẫn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopicDecision(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="print-document my-5 space-y-3 text-sm text-slate-800">
              <h4 className="text-lg font-bold text-slate-900">Tóm tắt thông tin giao đề tài</h4>
              <p className="text-slate-600">Bản tham khảo để lập quyết định</p>
              <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><dt className="font-semibold">Đề tài</dt><dd>{selectedTopicDecision.tenDt}</dd></div>
                <div><dt className="font-semibold">Học viên</dt><dd>{selectedTopicDecision.hocVien?.nguoiDung?.hoTen || 'Chưa có dữ liệu'}</dd></div>
                <div><dt className="font-semibold">Chuyên ngành</dt><dd>{selectedTopicDecision.hocVien?.chuyenNganh?.tenCn || 'Chưa có dữ liệu'}</dd></div>
                <div><dt className="font-semibold">Người hướng dẫn chính</dt><dd>{selectedTopicDecision.giangVienHuongDan?.nguoiDung?.hoTen || 'Chưa có dữ liệu'}</dd></div>
                {selectedTopicDecision.giangVienHuongDan2?.nguoiDung?.hoTen && <div><dt className="font-semibold">Đồng hướng dẫn</dt><dd>{selectedTopicDecision.giangVienHuongDan2.nguoiDung.hoTen}</dd></div>}
                <div><dt className="font-semibold">Mã đề tài</dt><dd className="break-all">{selectedTopicDecision.maDt}</dd></div>
              </dl>
            </div>

            <footer className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedTopicDecision(null)}
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
                <span>In tóm tắt đề tài</span>
              </button>
            </footer>
          </article>
        </div>
      )}
    </AppShell>
  );
}

function CreateDeTaiForm({ onCreated }: { onCreated: () => void | Promise<void> }) {
  const [tenDt, setTenDt] = useState('');
  const [tenDtEn, setTenDtEn] = useState('');
  const [mucTieu, setMucTieu] = useState('');
  const [phuongPhap, setPhuongPhap] = useState('');
  const [duKienIsi, setDuKienIsi] = useState('');
  const [fileDeCuong, setFileDeCuong] = useState<string>();
  const [giangVienList, setGiangVienList] = useState<GiangVienOption[]>([]);
  const [maGvhd, setMaGvhd] = useState('');
  const [maGvhd2, setMaGvhd2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    userApi
      .giangVienList()
      .then((res) => {
        setGiangVienList(res.data || []);
      })
      .catch(() => setFormError('Không tải được danh mục giảng viên hướng dẫn từ máy chủ.'));
  }, [open]);

  function moTaGiangVien(gv: GiangVienOption): string {
    const hocHam = [gv.hocHam, gv.hocVi].filter(Boolean).join('. ');
    const chuyenMon = gv.chuyenMon ? ` — ${gv.chuyenMon}` : '';
    return `${hocHam ? hocHam + ' ' : ''}${gv.hoTen}${chuyenMon} (${gv.soNcsDangHd}/${gv.hanMucToiDa} NCS)`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!maGvhd) {
      setFormError('Vui lòng chọn Cán bộ hướng dẫn 1.');
      return;
    }
    if (maGvhd2 && maGvhd2 === maGvhd) {
      setFormError('Cán bộ hướng dẫn 2 không được trùng với Cán bộ hướng dẫn 1.');
      return;
    }

    setSubmitting(true);
    try {
      const thuyetMinh = [
        'Mục tiêu và phạm vi\n' + mucTieu.trim(),
        'Phương pháp\n' + phuongPhap.trim(),
        duKienIsi.trim() && 'Kế hoạch công bố\n' + duKienIsi.trim(),
      ].filter(Boolean).join('\n\n');
      await deTaiApi.create({ tenDt, tenDtEn, thuyetMinh, fileDeCuong, maGvhd, maGvhd2: maGvhd2 || undefined });
      setTenDt('');
      setTenDtEn('');
      setMucTieu('');
      setPhuongPhap('');
      setDuKienIsi('');
      setFileDeCuong(undefined);
      setOpen(false);
      await onCreated();
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || err?.message || 'Không thể đăng ký đề tài. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-primary cursor-pointer shadow-md text-xs font-bold">
          + Đăng ký Thuyết minh Đề tài Mới
        </button>
      ) : (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <article className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <header className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                  Hồ sơ đăng ký
                </span>
                <h3 className="font-sans text-lg font-bold text-slate-900 mt-1">
                  Đăng ký đề cương và thuyết minh
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleSubmit} className="my-5 space-y-4 text-xs font-sans">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Tên Đề tài Luận án (Tiếng Việt) *</label>
                <textarea
                  value={tenDt}
                  onChange={(e) => setTenDt(e.target.value)}
                  required
                  rows={2}
                  className="input-field text-xs font-semibold"
                  placeholder="VD: Nghiên cứu phát triển mô hình RAG tối ưu hóa truy xuất ngữ nghĩa trong quản trị học vụ sau đại học"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Tên Đề tài (Tiếng Anh - Thesis English Title) *</label>
                <textarea
                  value={tenDtEn}
                  onChange={(e) => setTenDtEn(e.target.value)}
                  required
                  rows={2}
                  className="input-field text-xs"
                  placeholder="VD: Research on Developing RAG Model for Optimizing Semantic Retrieval in Postgraduate Academic Governance"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Cán bộ Hướng dẫn 1 (Hướng dẫn chính) *</label>
                  <select
                    value={maGvhd}
                    onChange={(e) => setMaGvhd(e.target.value)}
                    required
                    className="input-field text-xs"
                  >
                    <option value="">— Chọn cán bộ hướng dẫn —</option>
                    {giangVienList.map((gv) => (
                      <option key={gv.maGv} value={gv.maGv} disabled={gv.conTrong === 0}>
                        {moTaGiangVien(gv)}
                        {gv.conTrong === 0 ? ' — ĐÃ ĐỦ ĐỊNH MỨC' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">Cán bộ Hướng dẫn 2 (Đồng hướng dẫn)</label>
                  <select value={maGvhd2} onChange={(e) => setMaGvhd2(e.target.value)} className="input-field text-xs">
                    <option value="">Không có (Chỉ 01 Cán bộ HD)</option>
                    {giangVienList
                      .filter((gv) => gv.maGv !== maGvhd)
                      .map((gv) => (
                        <option key={gv.maGv} value={gv.maGv}>
                          {moTaGiangVien(gv)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Mục tiêu &amp; Đối tượng Nghiên cứu *</label>
                <textarea
                  value={mucTieu}
                  onChange={(e) => setMucTieu(e.target.value)}
                  required
                  rows={3}
                  className="input-field text-xs"
                  placeholder="Mô tả cụ thể mục tiêu tổng quát, mục tiêu cụ thể và đối tượng, phạm vi nghiên cứu của đề tài luận án..."
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Phương pháp Luận &amp; Tiếp cận Nghiên cứu *</label>
                <textarea
                  value={phuongPhap}
                  onChange={(e) => setPhuongPhap(e.target.value)}
                  required
                  rows={3}
                  className="input-field text-xs"
                  placeholder="Nêu rõ phương pháp lý thuyết, mô hình hóa toán học, phương pháp thực nghiệm và công cụ kiểm chứng..."
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Kế hoạch Công bố Quốc tế (Cam kết chuẩn đầu ra) *</label>
                <input
                  value={duKienIsi}
                  onChange={(e) => setDuKienIsi(e.target.value)}
                  required
                  className="input-field text-xs"
                />
              </div>

              <FileUploadZone label="Đề cương đính kèm" accept=".pdf,.docx" onUploadSuccess={(file) => setFileDeCuong(file.url)} />

              {formError && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700"
                >
                  ⚠️ {formError}
                </p>
              )}

              <footer className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Hủy
                </button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs py-2 px-6 cursor-pointer font-bold shadow-md">
                  {submitting ? 'Đang gửi hồ sơ…' : 'Nộp Đề Cương Thuyết Minh'}
                </button>
              </footer>
            </form>
          </article>
        </div>
      )}
    </div>
  );
}
