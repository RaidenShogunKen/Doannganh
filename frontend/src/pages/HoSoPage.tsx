import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { DonHocVuPanel } from '../components/DonHocVuPanel';
import { TuyenSinhPanel } from '../components/TuyenSinhPanel';
import { FileUploadZone } from '../components/ui/FileUploadZone';
import { FileAttachment } from '../components/ui/PdfViewerModal';
import { useAuth } from '../context/AuthContext';
import { hoSoApi, HoSoHocVienData } from '../lib/api';
import { AVATAR_UPDATED_EVENT, useUploadedAvatar } from '../lib/avatarService';

type Learner = Awaited<ReturnType<typeof hoSoApi.hoSoHocVienCuaToi>>['data'];
type Lecturer = Awaited<ReturnType<typeof hoSoApi.hoSoGiangVienCuaToi>>['data'];

const fields = [
  ['ngaySinh', 'Ngày sinh', 'date', 10],
  ['gioiTinh', 'Giới tính', 'text', 10],
  ['soCccd', 'CCCD hoặc hộ chiếu', 'text', 30],
  ['soDienThoai', 'Số điện thoại', 'tel', 15],
  ['diaChi', 'Địa chỉ', 'text', 300],
  ['bangCapDauVao', 'Bằng cấp đầu vào', 'text', 200],
  ['hinhThucDaoTao', 'Hình thức đào tạo', 'text', 100],
  ['coQuanCongTac', 'Cơ quan công tác', 'text', 200],
  ['ngoaiNgu', 'Ngoại ngữ tự khai', 'text', 200],
] as const;

function errorMessage(err: any) {
  const message = err?.response?.data?.message;
  return Array.isArray(message) ? message.join('. ') : typeof message === 'string' ? message : 'Không thực hiện được thao tác hồ sơ.';
}

export function HoSoPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <AppShell title="Hồ sơ học vụ" subtitle="Thông tin cá nhân và tiến độ xử lý đơn học vụ">
      <div className="mx-auto max-w-4xl space-y-5">
        {user.vaiTro === 'HocVien' && user.hocVien && <LearnerProfile key={user.maNd} name={user.hoTen} />}
        {user.vaiTro === 'GiangVien' && <LecturerProfile key={user.maNd} name={user.hoTen} />}
        {(user.vaiTro !== 'HocVien' || user.hocVien) && <DonHocVuPanel key={user.maNd} role={user.vaiTro} />}
        {user.vaiTro !== 'GiangVien' && <TuyenSinhPanel user={user} canApply={!user.hocVien} />}
      </div>
    </AppShell>
  );
}

function LearnerProfile({ name }: { name: string }) {
  const [profile, setProfile] = useState<Learner>();
  const [form, setForm] = useState<Partial<HoSoHocVienData>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const avatar = useUploadedAvatar(form.anhDaiDienUrl || profile?.anhDaiDienUrl);

  async function load() {
    setError('');
    try {
      const { data } = await hoSoApi.hoSoHocVienCuaToi();
      setProfile(data);
      setForm({ ...data, soDienThoai: data.nguoiDung?.sdt, maChuyenNganh: data.maChuyenNganh });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!profile?.maChuyenNganh) return;
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const values = Object.fromEntries(fields.map(([field]) => [field, form[field]?.trim()]));
      await hoSoApi.hoanThienHocVien({
        ...values, mshv: profile.mshv, trinhDo: profile.trinhDo, maChuyenNganh: profile.maChuyenNganh,
        ngaySinh: form.ngaySinh || undefined, huongNghienCuu: form.huongNghienCuu?.trim(),
        anhDaiDienUrl: form.anhDaiDienUrl,
      });
      window.dispatchEvent(new CustomEvent(AVATAR_UPDATED_EVENT, { detail: { url: form.anhDaiDienUrl } }));
      setNotice('Đã lưu hồ sơ học viên.');
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  return <section className="card space-y-4">
    <h2 className="text-lg font-bold text-slate-900">{name}</h2>
    {loading && <p role="status" className="text-sm text-slate-700">Đang tải hồ sơ…</p>}
    {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    {profile && <form onSubmit={save} className="space-y-4 text-sm">
      <dl className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
        <div><dt className="text-slate-600">Mã số học viên</dt><dd className="font-semibold">{profile.mshv}</dd></div>
        <div><dt className="text-slate-600">Trình độ</dt><dd className="font-semibold">{profile.trinhDo === 'TienSi' ? 'Tiến sĩ' : 'Thạc sĩ'}</dd></div>
        <div><dt className="text-slate-600">Chuyên ngành</dt><dd className="font-semibold">{profile.chuyenNganh?.tenCn || 'Chờ Phòng đào tạo cập nhật'}</dd></div>
        <div><dt className="text-slate-600">Khóa</dt><dd className="font-semibold">{profile.khoaHoc || 'Chưa có dữ liệu'}</dd></div>
      </dl>
      {profile.trangThai === 'TotNghiep' && <div className="space-y-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
        <p className="font-semibold">Đã được công nhận tốt nghiệp</p>
        {profile.soQuyetDinhTotNghiep && <p>{profile.soQuyetDinhTotNghiep} · {profile.ngayQuyetDinhTotNghiep?.split('-').reverse().join('/')}</p>}
        {profile.fileQuyetDinhTotNghiep && <FileAttachment fileUrl={profile.fileQuyetDinhTotNghiep}>Mở quyết định</FileAttachment>}
      </div>}
      <div className="flex flex-wrap items-center gap-4">
        {avatar && <img src={avatar} alt="Ảnh hồ sơ học viên" className="h-24 w-[4.5rem] rounded-lg border border-slate-200 object-cover" />}
        <FileUploadZone accept=".png,.jpg,.jpeg" label="Ảnh hồ sơ học viên" maxSizeMb={5} onUploadSuccess={(file) => {
          setForm((old) => ({ ...old, anhDaiDienUrl: file.url }));
        }} disabled={busy} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([field, label, type, limit]) => <label key={field} className="font-medium text-slate-800">{label}
          <input type={type} maxLength={limit} value={form[field] || ''} className="input-field mt-1"
            onChange={(event) => setForm((old) => ({ ...old, [field]: event.target.value }))} />
        </label>)}
      </div>
      <label className="block font-medium text-slate-800">Hướng nghiên cứu
        <textarea rows={3} value={form.huongNghienCuu || ''} onChange={(event) => setForm((old) => ({ ...old, huongNghienCuu: event.target.value }))} className="input-field mt-1" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={busy || !profile.maChuyenNganh}>{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>
        <button type="button" className="btn-secondary" onClick={() => window.print()}>In thông tin hồ sơ</button>
      </div>
    </form>}
  </section>;
}

function LecturerProfile({ name }: { name: string }) {
  const [profile, setProfile] = useState<Lecturer>();
  const [speciality, setSpeciality] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hoSoApi.hoSoGiangVienCuaToi().then(({ data }) => {
      setProfile(data);
      setSpeciality(data.chuyenMon || '');
    }).catch((err) => setError(errorMessage(err)));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await hoSoApi.hoanThienGiangVien({ chuyenMon: speciality.trim() });
      setNotice('Đã cập nhật chuyên môn.');
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  return <section className="card space-y-3">
    <h2 className="text-lg font-bold text-slate-900">{name}</h2>
    {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    {profile && <form onSubmit={save} className="space-y-3 text-sm">
      <p className="text-slate-700">{[profile.hocHam, profile.hocVi].filter(Boolean).join(' · ') || 'Chờ xác minh học hàm, học vị'}</p>
      <label className="block font-medium text-slate-800">Chuyên môn
        <textarea rows={3} maxLength={200} value={speciality} onChange={(event) => setSpeciality(event.target.value)} className="input-field mt-1" />
      </label>
      <button className="btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu chuyên môn'}</button>
    </form>}
  </section>;
}
