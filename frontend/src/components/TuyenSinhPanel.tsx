import { FormEvent, useEffect, useState } from 'react';
import { ChuyenNganh, chuyenNganhApi, CurrentUser, DonTuyenSinh, tuyenSinhApi } from '../lib/api';
import { FileUploadZone } from './ui/FileUploadZone';
import { FileAttachment } from './ui/PdfViewerModal';

const statuses: Record<DonTuyenSinh['trangThai'], string> = {
  ChoDuyet: 'Chờ xét', DaDuyet: 'Đã duyệt, chờ nhập học', TuChoi: 'Từ chối', DaNhapHoc: 'Đã nhập học',
};
const degrees = { ThacSi: 'Thạc sĩ', TienSi: 'Tiến sĩ' };
const evidenceFields = [
  ['bangTotNghiepUrl', 'Bằng tốt nghiệp'],
  ['bangTiengAnhUrl', 'Minh chứng ngoại ngữ'],
  ['lyLichKhoaHocUrl', 'Lý lịch khoa học'],
] as const;
type EvidenceField = typeof evidenceFields[number][0];

function failure(err: unknown) {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return Array.isArray(message) ? message.join('. ') : typeof message === 'string' ? message : 'Chưa xử lý được hồ sơ tuyển sinh.';
}

export function TuyenSinhPanel({ user, canApply }: { user: CurrentUser; canApply: boolean }) {
  const [rows, setRows] = useState<DonTuyenSinh[]>();
  const [majors, setMajors] = useState<ChuyenNganh[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const admin = user.vaiTro === 'Admin';

  useEffect(() => {
    let active = true;
    setError('');
    void Promise.all([tuyenSinhApi.list(), chuyenNganhApi.list()]).then(([requests, programs]) => {
      if (active) {
        setRows(requests.data);
        setMajors(programs.data);
      }
    }).catch((err) => { if (active) setError(failure(err)); });
    return () => { active = false; };
  }, [user.maNd, retry]);

  function saved(row: DonTuyenSinh) {
    setRows((current) => [row, ...(current ?? []).filter((item) => item.maDon !== row.maDon)]);
    setNotice(statuses[row.trangThai]);
    setFormKey((key) => key + 1);
  }

  return <section className="card space-y-4 text-sm">
    <h2 className="text-lg font-bold text-slate-900">Hồ sơ tuyển sinh</h2>
    {error && <div role="alert" className="flex flex-wrap items-center gap-3 text-rose-800">{error}
      <button type="button" className="btn-secondary" onClick={() => setRetry((count) => count + 1)}>Tải lại hồ sơ</button>
    </div>}
    {!rows && !error && <p role="status" className="text-slate-700">Đang tải hồ sơ tuyển sinh…</p>}
    {notice && <p role="status" className="text-emerald-800">{notice}</p>}
    {rows && !admin && canApply && !rows.some((item) => item.trangThai !== 'TuChoi') &&
      <ApplicationForm key={formKey} user={user} majors={majors} onSaved={saved} />}
    {rows?.length === 0 && <p className="text-slate-600">Chưa có đơn tuyển sinh.</p>}
    <ul className="divide-y divide-slate-200">
      {rows?.map((row) => <li key={row.maDon} className="space-y-2 py-3">
        <h3 className="break-words font-semibold text-slate-900">{row.hoTen} · {degrees[row.trinhDoDangKy]}</h3>
        <p className="text-slate-700">{[row.chuyenNganhDangKy, statuses[row.trangThai]].filter(Boolean).join(' · ')}</p>
        {row.ghiChuAdmin && <p className="whitespace-pre-wrap break-words text-slate-700">{row.ghiChuAdmin}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {evidenceFields.map(([field, label]) => row[field] &&
            <FileAttachment key={field} fileUrl={row[field]}>{label}</FileAttachment>)}
          {row.fileQuyetDinhUrl && <FileAttachment fileUrl={row.fileQuyetDinhUrl}>Quyết định trúng tuyển</FileAttachment>}
        </div>
        {admin && ['ChoDuyet', 'DaDuyet'].includes(row.trangThai) &&
          <ProcessAdmission key={row.trangThai} row={row} majors={majors} onSaved={saved} />}
      </li>)}
    </ul>
  </section>;
}

function ApplicationForm({ user, majors, onSaved }: { user: CurrentUser; majors: ChuyenNganh[]; onSaved: (row: DonTuyenSinh) => void }) {
  const [degree, setDegree] = useState<DonTuyenSinh['trinhDoDangKy']>('ThacSi');
  const [major, setMajor] = useState('');
  const [files, setFiles] = useState<Partial<Record<EvidenceField, string>>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const programs = majors.filter((program) => program.trinhDoDaoTao === degree);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await tuyenSinhApi.create({
        hoTen: user.hoTen, email: user.email, trinhDoDangKy: degree, chuyenNganhDangKy: major, ...files,
      });
      onSaved(data);
    } catch (err) { setError(failure(err)); }
    finally { setBusy(false); }
  }

  return <details className="rounded-xl border border-slate-200 p-3">
    <summary className="cursor-pointer font-semibold text-blue-800">Nộp đơn dự tuyển</summary>
    <form onSubmit={submit} className="mt-3 space-y-3">
      <p className="break-words text-slate-700">{user.hoTen} · {user.email}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">Trình độ
          <select className="input-field mt-1" value={degree} onChange={(event) => {
            setDegree(event.target.value as DonTuyenSinh['trinhDoDangKy']);
            setMajor('');
          }}>
            <option value="ThacSi">Thạc sĩ</option><option value="TienSi">Tiến sĩ</option>
          </select>
        </label>
        <label className="block">Chuyên ngành
          <select required className="input-field mt-1" value={major} onChange={(event) => setMajor(event.target.value)}>
            <option value="">Chọn chuyên ngành</option>
            {programs.map((program) => <option key={program.maCn}>{program.tenCn}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {evidenceFields.map(([field, label]) => <FileUploadZone key={field} label={label} accept=".pdf" disabled={busy}
          onUploadSuccess={(file) => setFiles((previous) => ({ ...previous, [field]: file.url }))} />)}
      </div>
      <button type="submit" className="btn-primary" disabled={busy || !major || !files.bangTotNghiepUrl}>{busy ? 'Đang gửi…' : 'Gửi đơn dự tuyển'}</button>
      {error && <p role="alert" className="text-rose-800">{error}</p>}
    </form>
  </details>;
}

function ProcessAdmission({ row, majors, onSaved }: { row: DonTuyenSinh; majors: ChuyenNganh[]; onSaved: (row: DonTuyenSinh) => void }) {
  const [file, setFile] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reviewing = row.trangThai === 'ChoDuyet';
  const programs = majors.filter((program) => program.trinhDoDaoTao === row.trinhDoDangKy);

  async function save(operation: () => Promise<{ data: DonTuyenSinh }>) {
    setBusy(true);
    setError('');
    try { const { data } = await operation(); onSaved(data); }
    catch (err) { setError(failure(err)); }
    finally { setBusy(false); }
  }

  function enroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void save(() => tuyenSinhApi.nhapHoc(row.maDon, {
      mshv: String(form.get('mshv')).trim(), maChuyenNganh: Number(form.get('major')),
      khoaHoc: String(form.get('cohort')).trim(), ngayNhapHoc: String(form.get('date')),
    }));
  }

  return <details className="rounded-xl border border-slate-200 p-3">
    <summary className="cursor-pointer font-semibold text-blue-800">{reviewing ? 'Xét hồ sơ' : 'Xác nhận nhập học'}</summary>
    {reviewing ? <div className="mt-3 space-y-3">
      <FileUploadZone label="Quyết định trúng tuyển (PDF)" accept=".pdf" disabled={busy} onUploadSuccess={(upload) => setFile(upload.url)} />
      <button type="button" className="btn-primary" disabled={!file || busy}
        onClick={() => void save(() => tuyenSinhApi.duyet(row.maDon, file))}>Duyệt hồ sơ</button>
      <label className="block">Lý do từ chối
        <textarea rows={2} maxLength={4000} className="input-field mt-1" value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>
      <button type="button" className="btn-secondary" disabled={!reason.trim() || busy}
        onClick={() => void save(() => tuyenSinhApi.tuChoi(row.maDon, reason.trim()))}>Từ chối hồ sơ</button>
    </div> : <form className="mt-3 space-y-3" onSubmit={enroll}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">Mã học viên<input className="input-field mt-1" name="mshv" maxLength={20} required /></label>
        <label className="block">Khóa<input className="input-field mt-1" name="cohort" maxLength={50} required /></label>
        <label className="block">Chuyên ngành
          <select className="input-field mt-1" name="major" required defaultValue={programs.find((item) => item.tenCn === row.chuyenNganhDangKy)?.maCn ?? ''}>
            <option value="">Chọn chuyên ngành</option>
            {programs.map((program) => <option key={program.maCn} value={program.maCn}>{program.tenCn}</option>)}
          </select>
        </label>
        <label className="block">Ngày nhập học<input className="input-field mt-1" name="date" type="date" required /></label>
      </div>
      <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Xác nhận nhập học'}</button>
    </form>}
    {error && <p role="alert" className="mt-2 text-rose-800">{error}</p>}
  </details>;
}
