import { FormEvent, useEffect, useState } from 'react';
import { DonHocVu, donHocVuApi, VaiTro } from '../lib/api';
import { FileAttachment } from './ui/PdfViewerModal';
import { FileUploadZone } from './ui/FileUploadZone';

const kinds: Record<DonHocVu['loaiDon'], string> = {
  BaoLuu: 'Bảo lưu kết quả', GiaHan: 'Gia hạn đào tạo', QuayLaiHoc: 'Quay lại học',
};
const statuses: Record<DonHocVu['trangThai'], string> = {
  ChoDuyetGvhd: 'Chờ người hướng dẫn', ChoDuyetAdmin: 'Chờ Phòng đào tạo',
  DaDuyet: 'Đã phê duyệt', TuChoi: 'Từ chối',
};

function apiMessage(err: any) {
  const message = err?.response?.data?.message;
  return Array.isArray(message) ? message.join('. ') : typeof message === 'string' ? message : 'Chưa xử lý được đơn học vụ.';
}

export function DonHocVuPanel({ role }: { role: VaiTro }) {
  const [rows, setRows] = useState<DonHocVu[]>([]);
  const [kind, setKind] = useState<DonHocVu['loaiDon']>('BaoLuu');
  const [months, setMonths] = useState(6);
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState('');
  const [uploadKey, setUploadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try { setRows((await donHocVuApi.list()).data); }
    catch (err) { setError(apiMessage(err)); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [role]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await donHocVuApi.create({
        loaiDon: kind,
        soThang: kind === 'QuayLaiHoc' ? 0 : months,
        lyDo: reason.trim(),
        fileDinhKemUrl: attachment || undefined,
      });
      setReason('');
      setAttachment('');
      setUploadKey((key) => key + 1);
      await load();
    } catch (err) { setError(apiMessage(err)); }
    finally { setBusy(false); }
  }

  return (
    <section className="card space-y-4 text-sm">
      <h2 className="text-lg font-bold text-slate-900">Đơn học vụ</h2>
      {role === 'HocVien' && <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer font-semibold text-blue-800">Nộp đơn mới</summary>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="font-medium text-slate-800">Loại đơn
              <select value={kind} onChange={(e) => setKind(e.target.value as DonHocVu['loaiDon'])} className="input-field mt-1">
                {Object.entries(kinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            {kind !== 'QuayLaiHoc' && <label className="font-medium text-slate-800">Số tháng đề nghị
              <input type="number" required min={1} max={24} value={Number.isNaN(months) ? '' : months}
                onChange={(e) => setMonths(e.target.valueAsNumber)} className="input-field mt-1" />
            </label>}
          </div>
          <label className="block font-medium text-slate-800">Lý do và kế hoạch
            <textarea required maxLength={4000} value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="input-field mt-1" />
          </label>
          <FileUploadZone key={uploadKey} label="Tài liệu kèm theo (nếu có)" accept=".pdf" maxSizeMb={25}
            disabled={busy} onUploadSuccess={(file) => setAttachment(file.url)} />
          {attachment && <button type="button" className="btn-secondary" onClick={() => {
            setAttachment('');
            setUploadKey((key) => key + 1);
          }}>Bỏ tài liệu đính kèm</button>}
          <button className="btn-primary" disabled={busy || !reason.trim()}>{busy ? 'Đang gửi…' : 'Gửi đơn'}</button>
        </form>
      </details>}
      {error && <p role="alert" className="text-rose-800">{error}</p>}
      {loading && <p role="status" className="text-slate-700">Đang tải đơn học vụ…</p>}
      {!loading && !rows.length && !error && <p className="text-slate-600">Chưa có đơn học vụ.</p>}
      <ul className="divide-y divide-slate-200">
        {rows.map((row) => <li key={row.maDon} className="space-y-2 py-3">
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="font-semibold text-slate-900">{kinds[row.loaiDon]}{row.soThang ? ` · ${row.soThang} tháng` : ''}</h3>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">{statuses[row.trangThai]}</span>
          </div>
          {role !== 'HocVien' && <p className="text-slate-700">{row.hocVien?.nguoiDung?.hoTen} {row.deTai?.tenDt && '· ' + row.deTai.tenDt}</p>}
          <p className="whitespace-pre-wrap break-words text-slate-700">{row.lyDo}</p>
          {row.yKienGvhd && <p className="break-words text-slate-700">Ý kiến xử lý: {row.yKienGvhd}</p>}
          {row.quyetDinhSo && <p className="text-slate-700">Số quyết định: {row.quyetDinhSo}</p>}
          {row.fileDinhKemUrl && <FileAttachment fileUrl={row.fileDinhKemUrl}>Mở tệp đính kèm</FileAttachment>}
          {(role === 'GiangVien' && row.trangThai === 'ChoDuyetGvhd' ||
            role === 'Admin' && ['ChoDuyetGvhd', 'ChoDuyetAdmin'].includes(row.trangThai)) && (
            <ProcessRequest role={role} row={row} onSaved={load} />
          )}
        </li>)}
      </ul>
    </section>
  );
}

function ProcessRequest({ row, role, onSaved }: { row: DonHocVu; role: VaiTro; onSaved: () => Promise<void> }) {
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const review = role === 'GiangVien';
  const canApprove = review || row.trangThai === 'ChoDuyetAdmin';

  async function process(reject: boolean) {
    if ((reject || review) && !note.trim()) { setError('Vui lòng ghi ý kiến xử lý.'); return; }
    if (!reject && !review && !decision.trim()) { setError('Vui lòng nhập số quyết định.'); return; }
    setBusy(true);
    setError('');
    try {
      if (reject) await donHocVuApi.tuChoi(row.maDon, { lyDoTuChoi: note.trim() });
      else if (review) await donHocVuApi.gvhdDuyet(row.maDon, { yKienGvhd: note.trim() });
      else await donHocVuApi.adminDuyet(row.maDon, { quyetDinhSo: decision.trim() });
      await onSaved();
    } catch (err) { setError(apiMessage(err)); }
    finally { setBusy(false); }
  }

  return <details className="rounded-xl border border-slate-200 p-3">
    <summary className="cursor-pointer font-semibold text-blue-800">Xử lý đơn</summary>
    <div className="mt-3 space-y-2">
      <label className="block text-slate-800">Ý kiến hoặc lý do từ chối
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input-field mt-1" />
      </label>
      {!review && canApprove && <label className="block text-slate-800">Số quyết định
        <input value={decision} onChange={(e) => setDecision(e.target.value)} className="input-field mt-1" maxLength={100} />
      </label>}
      <div className="flex flex-wrap gap-2">
        {canApprove && <button type="button" disabled={busy} className="btn-primary" onClick={() => process(false)}>{review ? 'Chuyển Phòng đào tạo' : 'Phê duyệt'}</button>}
        <button type="button" disabled={busy} className="btn-secondary text-rose-800" onClick={() => process(true)}>Từ chối</button>
      </div>
      {error && <p role="alert" className="text-rose-800">{error}</p>}
    </div>
  </details>;
}
