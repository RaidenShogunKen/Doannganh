import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  baiBaoApi, BaiBao, ChecklistBaoVe, deTaiApi, DeTai, donHocVuApi, hoSoApi,
  LoaiMinhChung, tienDoApi, TienDo, TrangThaiMinhChung,
} from '../lib/api';
import { OcrScannerModal, ExtractedAcademicInfo } from '../components/ocr/OcrScannerModal';
import { FileUploadZone } from '../components/ui/FileUploadZone';
import { FileAttachment } from '../components/ui/PdfViewerModal';
import { exportBaiBaoToExcel } from '../lib/exportService';

const editableStatuses = ['DaDuyet', 'DangThucHien', 'KhongDat'];
const evidenceStatuses: Record<TrangThaiMinhChung, string> = {
  ChoDuyet: 'Chờ duyệt',
  DaDuyet: 'Đã xác nhận',
  CanBoSung: 'Cần bổ sung',
};
const progressStatuses: Record<string, string> = {
  DatYeuCau: 'Đạt yêu cầu', Dat: 'Đạt yêu cầu', XuatSac: 'Xuất sắc', CanBoSung: 'Cần bổ sung',
};

function messageFromError(error: any, fallback: string) {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join('. ') : typeof message === 'string' ? message : fallback;
}

export function DeTaiDetailPage() {
  const { maDt = '' } = useParams<{ maDt: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<{ topic: DeTai; reports: TienDo[]; papers: BaiBao[]; checklist: ChecklistBaoVe }>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    setError('');
    try {
      const [topic, reports, checklist] = await Promise.all([
        deTaiApi.getById(maDt), tienDoApi.listByDeTai(maDt), deTaiApi.checklist(maDt),
      ]);
      const learner = topic.data.hocVien?.maHv;
      const papers = learner ? (await baiBaoApi.listByHocVien(learner)).data : [];
      setData({ topic: topic.data, reports: reports.data, papers, checklist: checklist.data });
    } catch (err) {
      setError(messageFromError(err, 'Không tải được hồ sơ. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setData(undefined);
    setLoading(true);
    setNotice('');
    void refresh();
  }, [maDt]);

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await deTaiApi.xacNhanDuDieuKien(maDt);
      await refresh();
      setNotice('Đã xác nhận đủ điều kiện lập hội đồng bảo vệ.');
    } catch (err) {
      setError(messageFromError(err, 'Chưa thể xác nhận hồ sơ.'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <AppShell title="Hồ sơ đề tài"><p role="status">Đang tải hồ sơ…</p></AppShell>;
  if (!data) return (
    <AppShell title="Hồ sơ đề tài">
      <p role="alert" className="text-rose-800">{error}</p>
      <button type="button" className="btn-secondary mt-3" onClick={refresh}>Thử lại</button>
    </AppShell>
  );

  const { topic, reports, papers, checklist } = data;
  const student = user?.vaiTro === 'HocVien';
  const doctoral = topic.hocVien?.trinhDo === 'TienSi';
  const isStudying = topic.hocVien?.trangThai === 'DangHoc';
  const canEdit = editableStatuses.includes(topic.trangThai);
  const canRequestExtension = isStudying && ['DaDuyet', 'DangThucHien', 'DuDKBaoVe', 'DuDieuKienBaoVe'].includes(topic.trangThai);

  function updateChecklist(value: ChecklistBaoVe) {
    setData((current) => current && { ...current, checklist: value });
  }

  return (
    <AppShell title={topic.tenDt} subtitle={topic.tenDtEn}>
      <div className="space-y-6">
        <section className="card space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={topic.trangThai} />
            <span className="text-sm font-medium text-slate-700">{doctoral ? 'Tiến sĩ' : 'Thạc sĩ'}</span>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-600">Học viên</dt><dd className="font-semibold text-slate-900">{topic.hocVien?.nguoiDung?.hoTen || 'Chưa cập nhật'}</dd></div>
            <div><dt className="text-slate-600">Người hướng dẫn</dt><dd className="font-semibold text-slate-900">
              {[topic.giangVienHuongDan?.nguoiDung?.hoTen, topic.giangVienHuongDan2?.nguoiDung?.hoTen].filter(Boolean).join(', ') || 'Chưa cập nhật'}
            </dd></div>
          </dl>
          {topic.hanNopLuanAn && <p className="text-sm text-slate-800">
            Hạn nộp luận văn, luận án <strong>{topic.hanNopLuanAn.split('-').reverse().join('/')}</strong>
          </p>}
          {user?.vaiTro === 'Admin' && ['DaDuyet', 'DangThucHien'].includes(topic.trangThai) &&
            (!topic.hanNopLuanAn || !topic.tongSoThangGiaHan) &&
            <SubmissionDeadlineForm maDt={maDt} current={topic.hanNopLuanAn} onSaved={refresh} />}
          {(topic.thuyetMinh || topic.fileDeCuong) && (
            <details className="rounded-xl border border-slate-200 p-3 text-sm">
              <summary className="cursor-pointer font-semibold text-slate-900">Đề cương và thuyết minh</summary>
              {topic.thuyetMinh && <p className="mt-2 whitespace-pre-wrap break-words text-slate-700">{topic.thuyetMinh}</p>}
              {topic.fileDeCuong && <div className="mt-2"><FileAttachment fileUrl={topic.fileDeCuong}>Mở đề cương</FileAttachment></div>}
            </details>
          )}
          {student && canRequestExtension && <GiaHanForm maDt={maDt} />}
          {topic.hocVien?.soQuyetDinhTotNghiep && <p className="text-sm font-semibold text-emerald-800">
            Đã công nhận tốt nghiệp · {topic.hocVien.soQuyetDinhTotNghiep} · {topic.hocVien.ngayQuyetDinhTotNghiep?.split('-').reverse().join('/')}
          </p>}
          {user?.vaiTro === 'Admin' && topic.trangThai === 'DaBaoVe' && isStudying &&
            <GraduationDecisionForm maDt={maDt} onSaved={refresh} />}
        </section>

        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

        <section aria-labelledby="defense-checklist" className="card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="defense-checklist" className="text-lg font-bold text-slate-900">Điều kiện bảo vệ</h2>
              <p className="mt-1 text-sm text-slate-600">
                {checklist.tieuChi.filter((item) => item.dat).length}/{checklist.tieuChi.length} tiêu chí đã đạt
              </p>
            </div>
            {checklist.coTheXacNhan && (
              <button type="button" className="btn-primary" disabled={busy || !checklist.duDieuKien} onClick={confirm}>
                {busy ? 'Đang xác nhận…' : 'Xác nhận đủ điều kiện'}
              </button>
            )}
          </div>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {checklist.tieuChi.map((item) => (
              <EvidenceRow key={item.id} maDt={maDt} item={item} onUpdated={updateChecklist} />
            ))}
          </ul>
          <Link to="/kiem-tra-dao-van" className="text-sm font-semibold text-blue-700 underline">
            Mở công cụ đối sánh văn bản
          </Link>
        </section>

        <div className={`grid gap-6 ${doctoral ? 'lg:grid-cols-2' : ''}`}>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Báo cáo tiến độ</h2>
            {student && isStudying && canEdit && <TaoTienDoForm maDt={maDt} lanTiepTheo={Math.max(0, ...reports.map((report) => report.lanBaoCao)) + 1} onCreated={refresh} />}
            {reports.length === 0 && <p className="text-sm text-slate-600">Chưa có báo cáo tiến độ.</p>}
            {reports.map((report) => (
              <article key={report.maTd} className="card space-y-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">Báo cáo lần {report.lanBaoCao}</h3>
                  <time className="text-slate-600" dateTime={report.ngayBaoCao}>
                    {new Date(report.ngayBaoCao).toLocaleDateString('vi-VN')}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words text-slate-700">{report.noiDung}</p>
                {report.fileBaoCaoUrl && <FileAttachment fileUrl={report.fileBaoCaoUrl}>Mở báo cáo</FileAttachment>}
                <p className="font-semibold text-slate-800">{progressStatuses[report.danhGiaKq || ''] || 'Chờ nhận xét'}</p>
                {report.nhanXetGvhd && <p className="break-words text-slate-700">{report.nhanXetGvhd}</p>}
                {!student && canEdit && <NhanXetForm maTd={report.maTd} onSaved={refresh} />}
              </article>
            ))}
          </section>
          {doctoral && <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Công bố khoa học</h2>
              {papers.length > 0 && <button className="btn-secondary text-sm" onClick={() => exportBaiBaoToExcel(papers)}>Xuất Excel</button>}
            </div>
            {student && isStudying && canEdit && <TaoBaiBaoForm onCreated={refresh} />}
            {papers.length === 0 && <p className="text-sm text-slate-600">Chưa có công bố được khai báo.</p>}
            {papers.map((paper) => (
              <article key={paper.maBb} className="card space-y-2 text-sm">
                <h3 className="break-words font-semibold text-slate-900">{paper.tieuDe}</h3>
                <p className="text-slate-700">{[paper.tenTapChiHoiThao, paper.phanLoai, paper.vaiTroTacGia].filter(Boolean).join(' · ')}</p>
                <p className="break-words text-slate-600">{[paper.doi && 'DOI ' + paper.doi, paper.issn && 'ISSN ' + paper.issn].filter(Boolean).join(' · ')}</p>
                {paper.fileMinhChung && <FileAttachment fileUrl={paper.fileMinhChung}>Mở minh chứng</FileAttachment>}
              </article>
            ))}
          </section>}
        </div>
      </div>
    </AppShell>
  );
}

function GraduationDecisionForm({ maDt, onSaved }: { maDt: string; onSaved: () => Promise<void> }) {
  const [fileUrl, setFileUrl] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await hoSoApi.ghiNhanTotNghiep(maDt, {
        soQuyetDinh: String(form.get('decision')).trim(),
        ngayQuyetDinh: String(form.get('date')),
        fileUrl,
        daDoiChieu: confirmed,
      });
      await onSaved();
    } catch (err) { setError(messageFromError(err, 'Chưa ghi nhận được quyết định.')); }
    finally { setBusy(false); }
  }

  return <details className="rounded-xl border border-slate-200 p-3 text-sm">
    <summary className="cursor-pointer font-semibold text-blue-800">Ghi nhận quyết định tốt nghiệp</summary>
    <form className="mt-3 space-y-3" onSubmit={submit}>
      <p className="text-slate-700">Nhập thông tin từ quyết định công nhận tốt nghiệp đã ban hành.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">Số quyết định<input name="decision" required maxLength={100} className="input-field mt-1" /></label>
        <label className="block">Ngày quyết định<input name="date" type="date" required className="input-field mt-1" /></label>
      </div>
      <FileUploadZone label="Quyết định công nhận tốt nghiệp (PDF)" accept=".pdf" disabled={busy}
        onUploadSuccess={(file) => setFileUrl(file.url)} />
      <label className="flex items-start gap-2 text-slate-800">
        <input className="mt-1" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        Đã đối chiếu các điều kiện của chương trình, bản nộp sau bảo vệ và nghĩa vụ của học viên.
      </label>
      <button type="submit" className="btn-primary" disabled={busy || !fileUrl || !confirmed}>{busy ? 'Đang lưu…' : 'Ghi nhận quyết định'}</button>
      {error && <p role="alert" className="text-rose-800">{error}</p>}
    </form>
  </details>;
}

function SubmissionDeadlineForm({ maDt, current, onSaved }: { maDt: string; current?: string; onSaved: () => Promise<void> }) {
  const [deadline, setDeadline] = useState(current ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await deTaiApi.capNhatHanNop(maDt, deadline);
      await onSaved();
      setSaved(true);
    } catch (err) { setError(messageFromError(err, 'Chưa lưu được hạn nộp.')); }
    finally { setBusy(false); }
  }

  return <details className="rounded-xl border border-slate-200 p-3 text-sm">
    <summary className="cursor-pointer font-semibold text-blue-800">Cập nhật hạn nộp</summary>
    <form className="mt-3 space-y-3" onSubmit={submit}>
      <label className="block">Hạn nộp theo kế hoạch đào tạo
        <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="input-field mt-1" required />
      </label>
      <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Đang lưu…' : 'Lưu hạn nộp'}</button>
      {saved && <p role="status" className="text-emerald-800">Đã lưu hạn nộp.</p>}
      {error && <p role="alert" className="text-rose-800">{error}</p>}
    </form>
  </details>;
}

function EvidenceRow({ maDt, item, onUpdated }: {
  maDt: string;
  item: ChecklistBaoVe['tieuChi'][number];
  onUpdated: (value: ChecklistBaoVe) => void;
}) {
  const [fileUrl, setFileUrl] = useState('');
  const [decision, setDecision] = useState<TrangThaiMinhChung>('DaDuyet');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const editable = item.canSubmit || (item.canReview && item.evidence);

  async function save(action: 'upload' | 'review') {
    setBusy(true);
    setError('');
    try {
      const { data } = action === 'upload'
        ? await deTaiApi.nopMinhChung(maDt, item.id as LoaiMinhChung, fileUrl)
        : await deTaiApi.duyetMinhChung(maDt, item.id as LoaiMinhChung, decision, note);
      setFileUrl('');
      setNote('');
      onUpdated(data);
    } catch (err) {
      setError(messageFromError(err, 'Chưa lưu được minh chứng.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="space-y-2 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{item.ten}</h3>
          {item.chiTiet && <p className="mt-1 break-words text-slate-600">{item.chiTiet}</p>}
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${item.dat ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
          {item.evidence ? evidenceStatuses[item.evidence.trangThai] : item.dat ? 'Đạt' : 'Chưa đủ'}
        </span>
      </div>
      {item.evidence?.fileUrl && <FileAttachment fileUrl={item.evidence.fileUrl}>Mở minh chứng</FileAttachment>}
      {editable && <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer font-semibold text-blue-800">Cập nhật minh chứng</summary>
        <div className="mt-3 space-y-3">
          {item.canSubmit && <div className="space-y-2">
            <FileUploadZone key={item.evidence?.fileUrl || item.id} accept=".pdf,.docx,.jpg,.jpeg,.png" onUploadSuccess={(file) => setFileUrl(file.url)} disabled={busy} />
            <button type="button" className="btn-secondary text-sm" disabled={!fileUrl || busy} onClick={() => save('upload')}>Gửi minh chứng</button>
          </div>}
          {item.canReview && item.evidence && <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void save('review'); }}>
            <label className="block font-medium text-slate-800">
              Kết quả
              <select value={decision} onChange={(event) => setDecision(event.target.value as TrangThaiMinhChung)} className="input-field mt-1">
                <option value="DaDuyet">Xác nhận đạt</option>
                <option value="CanBoSung">Yêu cầu bổ sung</option>
              </select>
            </label>
            <label className="block font-medium text-slate-800">
              Căn cứ hoặc nội dung cần bổ sung
              <textarea value={note} required maxLength={1000} onChange={(event) => setNote(event.target.value)} className="input-field mt-1" rows={2} />
            </label>
            <button className="btn-primary text-sm" disabled={!note.trim() || busy}>Lưu xét duyệt</button>
          </form>}
          {error && <p role="alert" className="text-rose-800">{error}</p>}
        </div>
      </details>}
    </li>
  );
}

function GiaHanForm({ maDt }: { maDt: string }) {
  const [months, setMonths] = useState(6);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await donHocVuApi.create({ maDt, loaiDon: 'GiaHan', soThang: months, lyDo: reason.trim() });
      setNotice('Đã gửi đơn gia hạn, chờ người hướng dẫn xem xét.');
      setReason('');
    } catch (err) {
      setError(messageFromError(err, 'Không gửi được đơn gia hạn.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-xl border border-slate-200 p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-slate-900">Xin gia hạn đào tạo</summary>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <label className="block font-medium text-slate-800">
          Số tháng đề nghị
          <input type="number" required min={1} max={24} value={months} onChange={(event) => setMonths(event.target.valueAsNumber)} className="input-field mt-1" />
        </label>
        <label className="block font-medium text-slate-800">
          Lý do và kế hoạch hoàn thành
          <textarea required value={reason} onChange={(event) => setReason(event.target.value)} className="input-field mt-1" rows={3} />
        </label>
        <button className="btn-primary" disabled={busy || !reason.trim()}>Gửi đơn</button>
        {notice && <p role="status" className="text-emerald-800">{notice}</p>}
        {error && <p role="alert" className="text-rose-800">{error}</p>}
      </form>
    </details>
  );
}

function TaoTienDoForm({ maDt, lanTiepTheo, onCreated }: { maDt: string; lanTiepTheo: number; onCreated: () => void }) {
  const [noiDung, setNoiDung] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await tienDoApi.create({ maDt, noiDung, fileBaoCaoUrl: uploadedFileUrl });
      setNoiDung('');
      setUploadedFileUrl('');
      onCreated();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không nộp được báo cáo tiến độ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card border-2 border-brand-500/20 bg-brand-50/20 p-4 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Nộp Báo cáo Tiến độ Lần {lanTiepTheo} (6 Tháng)</h3>
      <textarea
        value={noiDung}
        onChange={(e) => setNoiDung(e.target.value)}
        required
        minLength={10}
        maxLength={10000}
        rows={3}
        className="input-field text-xs"
        placeholder="Mô tả chi tiết khối lượng công việc, bài báo đang viết và kết quả nghiên cứu đã hoàn thành trong 6 tháng qua..."
      />

      <FileUploadZone
        label="Đính kèm tệp Báo cáo tiến độ chi tiết (PDF, DOCX):"
        onUploadSuccess={(res) => setUploadedFileUrl(res.url)}
      />

      <button type="submit" disabled={submitting} className="btn-primary text-xs cursor-pointer">
        {submitting ? 'Đang gửi…' : 'Gửi Báo Cáo Tiến Độ'}
      </button>
    </form>
  );
}

function NhanXetForm({ maTd, onSaved }: { maTd: string; onSaved: () => void }) {
  const [nhanXet, setNhanXet] = useState('');
  const [diemSo, setDiemSo] = useState<number | ''>('');
  const [danhGiaKq, setDanhGiaKq] = useState<'XuatSac' | 'Dat' | 'CanBoSung'>('Dat');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (diemSo === '' || Number(diemSo) < 0 || Number(diemSo) > 10) {
      alert('Điểm đánh giá báo cáo tiến độ phải nằm trong thang 0.0 – 10.0.');
      return;
    }
    setSubmitting(true);
    try {
      await tienDoApi.nhanXet(maTd, nhanXet, Number(diemSo), danhGiaKq);
      setNhanXet('');
      setDiemSo('');
      onSaved();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không lưu được nhận xét. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        value={nhanXet}
        onChange={(e) => setNhanXet(e.target.value)}
        required
        maxLength={5000}
        className="input-field text-xs flex-1"
        placeholder="Viết nhận xét đánh giá kết quả kỳ 6 tháng của GVHD..."
      />
      <input
        type="number"
        step="0.1"
        min={0}
        max={10}
        value={diemSo}
        onChange={(e) => setDiemSo(e.target.value === '' ? '' : Number(e.target.value))}
        required
        aria-label="Điểm đánh giá báo cáo tiến độ (thang 10)"
        placeholder="Điểm /10"
        className="input-field text-xs w-24 shrink-0"
      />
      <select
        value={danhGiaKq}
        onChange={(e) => setDanhGiaKq(e.target.value as 'XuatSac' | 'Dat' | 'CanBoSung')}
        aria-label="Kết quả đánh giá kỳ báo cáo"
        className="input-field text-xs w-36 shrink-0"
      >
        <option value="XuatSac">Xuất sắc</option>
        <option value="Dat">Đạt</option>
        <option value="CanBoSung">Cần bổ sung</option>
      </select>
      <button type="submit" disabled={submitting} className="btn-primary py-1.5 px-3 text-xs shrink-0 cursor-pointer">
        {submitting ? 'Đang lưu…' : 'Gửi Nhận xét'}
      </button>
    </form>
  );
}

function TaoBaiBaoForm({ onCreated }: { onCreated: () => void }) {
  const [tieuDe, setTieuDe] = useState('');
  const [tenTapChi, setTenTapChi] = useState('');
  const [doi, setDoi] = useState('');
  const [issn, setIssn] = useState('');
  const [phanLoai, setPhanLoai] = useState('');
  const [publishedOn, setPublishedOn] = useState('');
  const [vaiTro, setVaiTro] = useState('Tác giả thứ nhất (First Author)');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadKey, setUploadKey] = useState(0);

  const handleApplyOcr = (info: ExtractedAcademicInfo) => {
    if (info.tieuDe) setTieuDe(info.tieuDe);
    if (info.tenTapChiHoiThao) setTenTapChi(info.tenTapChiHoiThao);
    if (info.doi) setDoi(info.doi);
    if (info.issn) setIssn(info.issn);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await baiBaoApi.create({
        tieuDe,
        tenTapChiHoiThao: tenTapChi,
        phanLoai,
        doi: doi.trim() || undefined,
        issn: issn.trim() || undefined,
        vaiTroTacGia: vaiTro,
        ngayCongBo: publishedOn || undefined,
        fileMinhChung: uploadedUrl,
      });
      setTieuDe('');
      setTenTapChi('');
      setDoi('');
      setIssn('');
      setUploadedUrl('');
      setPublishedOn('');
      setPhanLoai('');
      setUploadKey((key) => key + 1);
      onCreated();
    } catch (err) {
      setError(messageFromError(err, 'Không lưu được minh chứng bài báo. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="card border-2 border-emerald-500/20 bg-emerald-50/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Nộp Minh chứng Bài báo Khoa học
          </h3>
          <button
            type="button"
            onClick={() => setShowOcrModal(true)}
            className="rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <span>📷</span>
            <span>Quét OCR Tự Động Từ Ảnh / PDF</span>
          </button>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Tiêu đề bài báo khoa học *</label>
          <input
            value={tieuDe}
            onChange={(e) => setTieuDe(e.target.value)}
            required
            minLength={5}
            className="input-field text-xs"
            placeholder="Tiêu đề bài báo đăng ký công nhận"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Tên Tạp chí / Hội thảo quốc tế *</label>
            <input
              value={tenTapChi}
              onChange={(e) => setTenTapChi(e.target.value)}
              required
              className="input-field text-xs"
              placeholder="VD: IEEE Transactions on Knowledge Eng"
            />
          </div>
          <div>
            <label htmlFor="publication-type" className="text-xs font-bold text-slate-700 block mb-1">Phân loại công bố *</label>
            <select id="publication-type" required value={phanLoai} onChange={(e) => setPhanLoai(e.target.value)} className="input-field text-xs">
              <option value="">Chọn phân loại</option>
              <option value="ISI">ISI / Web of Science</option>
              <option value="Scopus">Scopus</option>
              <option value="HDGSNN">Danh mục Hội đồng Giáo sư Nhà nước</option>
              <option value="TrongNuoc">Công bố trong nước khác</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Mã định danh DOI</label>
            <input value={doi} onChange={(e) => setDoi(e.target.value)} className="input-field text-xs font-mono" placeholder="VD: 10.1109/..." />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Chỉ số ISSN / ISBN</label>
            <input value={issn} onChange={(e) => setIssn(e.target.value)} className="input-field text-xs font-mono" placeholder="VD: 1939-1382" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Vai trò Tác giả *</label>
            <select value={vaiTro} onChange={(e) => setVaiTro(e.target.value)} className="input-field text-xs">
              <option value="Tác giả thứ nhất (First Author)">Tác giả thứ nhất (First Author)</option>
              <option value="Tác giả liên hệ (Corresponding Author)">Tác giả liên hệ (Corresponding Author)</option>
              <option value="Đồng tác giả (Co-Author)">Đồng tác giả (Co-Author)</option>
            </select>
          </div>
        </div>

        <label className="block text-xs font-bold text-slate-700">Ngày công bố
          <input type="date" value={publishedOn} onChange={(event) => setPublishedOn(event.target.value)} className="input-field mt-1" />
        </label>
        <FileUploadZone key={uploadKey} accept=".pdf,.png,.jpg,.jpeg"
          label="Tệp minh chứng (PDF hoặc ảnh)"
          disabled={submitting}
          onUploadSuccess={(res) => setUploadedUrl(res.url)}
        />

        <button type="submit" disabled={submitting || !uploadedUrl} className="btn-primary text-xs cursor-pointer">
          {submitting ? 'Đang lưu…' : 'Lưu công bố'}
        </button>
        {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
      </form>

      {}
      <OcrScannerModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onApply={handleApplyOcr}
      />
    </>
  );
}
