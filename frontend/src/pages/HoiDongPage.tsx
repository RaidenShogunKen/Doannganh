import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { FileUploadZone } from '../components/ui/FileUploadZone';
import { FileAttachment } from '../components/ui/PdfViewerModal';
import { useAuth } from '../context/AuthContext';
import { DeTai, deTaiApi, GiangVienOption, HoiDong, hoiDongApi, QuyCheBaoVe, userApi } from '../lib/api';
import { exportHoiDongPdf } from '../lib/exportService';

type Ballot = 'TanThanh' | 'KhongTanThanh';
const positions = ['ChuTich', 'ThuKy', 'PhanBien1', 'PhanBien2', 'UyVien'];
const positionNames: Record<string, string> = {
  ChuTich: 'Chủ tịch', ThuKy: 'Thư ký', PhanBien1: 'Phản biện 1', PhanBien2: 'Phản biện 2', UyVien: 'Ủy viên',
};
const scoreLabels = ['Tính cấp thiết và tổng quan', 'Phương pháp và độ tin cậy', 'Đóng góp và giá trị khoa học', 'Trình bày và trả lời'];
const scoreMax = [2, 3, 3, 2];

function errorText(error: any, fallback: string) {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join('. ') : typeof message === 'string' ? message : fallback;
}

export function HoiDongPage() {
  const { user } = useAuth();
  const [councils, setCouncils] = useState<HoiDong[]>([]);
  const [topics, setTopics] = useState<DeTai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const admin = user?.vaiTro === 'Admin';
  const teacher = user?.vaiTro === 'GiangVien';

  async function refresh() {
    setError('');
    try {
      const { data } = await hoiDongApi.list();
      setCouncils(data);
      if (admin) setTopics((await deTaiApi.list()).data);
    } catch (err) {
      setError(errorText(err, 'Không tải được hội đồng. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCouncils([]);
    setTopics([]);
    setLoading(true);
    void refresh();
  }, [user?.maNd]);

  function saved(message: string) {
    setNotice(message);
    void refresh();
  }

  return (
    <AppShell title="Hội đồng đánh giá" subtitle="Lịch đánh giá, thành viên và kết quả bảo vệ">
      <div className="space-y-5">
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error} <button type="button" className="ml-2 font-semibold underline" onClick={refresh}>Thử lại</button>
        </p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        {admin && <CreateCouncil topics={topics} onSaved={() => saved('Đã lập lịch hội đồng.')} />}
        {loading && <p role="status" className="text-sm text-slate-700">Đang tải lịch…</p>}
        {!loading && !error && !councils.length && <p className="card text-sm text-slate-700">Chưa có hội đồng trong phạm vi tài khoản.</p>}
        {councils.map((council) => {
          const member = council.thanhVien?.find((item) => item.maGv === user?.maNd);
          const hasStarted = new Date(council.ngayBaoVe) <= new Date();
          const doctoral = council.deTai?.hocVien?.trinhDo === 'TienSi';
          const canScore = teacher && member && (doctoral ||
            ![council.deTai?.maGvhd, council.deTai?.maGvhd2].includes(user?.maNd));
          return (
            <article key={council.maHd} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-bold text-slate-900">{council.deTai?.tenDt || 'Hội đồng đánh giá'}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {council.capDanhGia === 'CoSo' ? 'Đánh giá tại đơn vị chuyên môn' : `Bảo vệ lần ${council.lanBaoVe || 1}`}
                    {council.deTai?.hocVien?.nguoiDung?.hoTen && ' · ' + council.deTai.hocVien.nguoiDung.hoTen}
                  </p>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">{council.ketQua || 'Chờ đánh giá'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
                {council.ngayBaoVe && <time dateTime={council.ngayBaoVe}>{new Date(council.ngayBaoVe).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</time>}
                {council.diaDiem && <span>{council.diaDiem}</span>}
                {council.quyChe && <span>{council.quyChe === 'ThongTu53' ? 'TT 53/2026' : doctoral ? 'TT 18/2021 (chuyển tiếp)' : 'TT 23/2021 (chuyển tiếp)'}</span>}
                {(admin || user?.vaiTro === 'HocVien') && council.deTai?.maDt && <Link className="font-semibold text-blue-700 underline" to={`/de-tai/${council.deTai.maDt}`}>Xem đề tài</Link>}
              </div>
              <details className="rounded-xl border border-slate-200 p-3 text-sm">
                <summary className="cursor-pointer font-semibold text-slate-900">Thành viên ({council.thanhVien?.length || 0})</summary>
                <ul className="mt-2 divide-y divide-slate-200">
                  {council.thanhVien?.map((item) => <li key={item.maGv} className="flex flex-wrap justify-between gap-2 py-2 text-slate-700">
                    <span>{item.giangVien?.nguoiDung?.hoTen || 'Giảng viên'}</span>
                    <span>{positionNames[item.chucDanh] || item.chucDanh}</span>
                  </li>)}
                </ul>
              </details>
              {council.ketQua && council.diemTb != null && <p className="text-sm text-slate-700">Điểm trung bình {Number(council.diemTb).toFixed(2)}/10</p>}
              {council.kienNghiBaoVeLai && <p className="text-sm text-amber-800">Hồ sơ có thể được xem xét đánh giá lần hai.</p>}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {council.bienBanUrl && <FileAttachment fileUrl={council.bienBanUrl}>Mở biên bản đã lưu</FileAttachment>}
                {council.ketQua && <button type="button" className="btn-secondary" onClick={() => {
                  void exportHoiDongPdf(council).catch(() => setError('Không xuất được PDF hội đồng.'));
                }}>Tải tóm tắt PDF</button>}
              </div>
              {hasStarted && !council.ketQua && canScore && <ScoreCouncil council={council} member={member} onSaved={() => saved('Đã lưu phiếu đánh giá.')} />}
              {hasStarted && !council.ketQua && admin && <FinalizeCouncil council={council} onSaved={() => saved('Đã chốt kết quả theo biên bản.')} />}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}

function CreateCouncil({ topics, onSaved }: { topics: DeTai[]; onSaved: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [teachers, setTeachers] = useState<GiangVienOption[]>([]);
  const [topicId, setTopicId] = useState('');
  const [level, setLevel] = useState('CapTruong');
  const [policy, setPolicy] = useState<QuyCheBaoVe | ''>('');
  const [dateTime, setDateTime] = useState('');
  const [room, setRoom] = useState('');
  const [checked, setChecked] = useState(false);
  const [members, setMembers] = useState<{ maGv: string; external: boolean; institution: string }[]>([]);
  const [count, setCount] = useState(5);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    userApi.giangVienList().then(({ data }) => setTeachers(data))
      .catch(() => setError('Không tải được danh sách giảng viên.'));
  }, [expanded]);

  const available = topics.filter((topic) => level === 'CapTruong'
    ? topic.trangThai === 'DuDKBaoVe'
    : topic.hocVien?.trinhDo === 'TienSi' && ['DaDuyet', 'DangThucHien'].includes(topic.trangThai));
  const topic = available.find((item) => item.maDt === topicId);
  const allowThree = level === 'CoSo' || (policy === 'ThongTu53' && topic?.hocVien?.trinhDo === 'ThacSi');

  function changeMember(index: number, value: Partial<typeof members[number]>) {
    setMembers((old) => {
      const next = [...old];
      next[index] = { ...(old[index] || { maGv: '', external: false, institution: '' }), ...value };
      return next;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!topic || !policy) return;
    setBusy(true);
    setError('');
    try {
      await hoiDongApi.create({
        maDt: topic.maDt, capDanhGia: level, quyChe: policy, daKiemTraTieuChuan: checked,
        ngayBaoVe: dateTime + ':00+07:00', diaDiem: room.trim(),
        thanhVien: Array.from({ length: count }, (_, index) => ({
          maGv: members[index]?.maGv || '',
          chucDanh: positions[index] || 'UyVien',
          coQuanCt: members[index]?.external ? members[index].institution.trim() : 'TrongCoSoDaoTao',
        })),
      });
      setExpanded(false);
      setTopicId('');
      setMembers([]);
      setChecked(false);
      onSaved();
    } catch (err) {
      setError(errorText(err, 'Chưa lập được hội đồng.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="card" open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
      <summary className="cursor-pointer font-bold text-slate-900">Lập hội đồng</summary>
      {expanded && <form onSubmit={submit} className="mt-4 space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="font-medium text-slate-800">Cấp đánh giá
            <select value={level} onChange={(event) => { setLevel(event.target.value); setTopicId(''); setCount(5); }} className="input-field mt-1">
              <option value="CapTruong">Bảo vệ tại cơ sở đào tạo</option>
              <option value="CoSo">Đánh giá tại đơn vị chuyên môn</option>
            </select>
          </label>
          <label className="font-medium text-slate-800">Đề tài
            <select value={topicId} required onChange={(event) => { setTopicId(event.target.value); setCount(5); }} className="input-field mt-1">
              <option value="">Chọn đề tài</option>
              {available.map((item) => <option key={item.maDt} value={item.maDt}>{item.tenDt}</option>)}
            </select>
          </label>
          <label className="font-medium text-slate-800">Quy chế áp dụng cho khóa
            <select value={policy} required onChange={(event) => { setPolicy(event.target.value as QuyCheBaoVe); setCount(5); }} className="input-field mt-1">
              <option value="">Chọn quy chế</option>
              <option value="ChuyenTiep2021">Thông tư 18/23 năm 2021 theo điều khoản chuyển tiếp</option>
              <option value="ThongTu53">Thông tư 53/2026</option>
            </select>
          </label>
          <label className="font-medium text-slate-800">Số thành viên
            <select value={count} onChange={(event) => setCount(Number(event.target.value))} className="input-field mt-1">
              {(allowThree ? [3, 5, 7, 9, 11] : [5, 7, 9, 11]).map((number) => <option key={number}>{number}</option>)}
            </select>
          </label>
          <label className="font-medium text-slate-800">Ngày và giờ tại Việt Nam
            <input type="datetime-local" required value={dateTime} onChange={(event) => setDateTime(event.target.value)} className="input-field mt-1" />
          </label>
          <label className="font-medium text-slate-800">Địa điểm
            <input required maxLength={150} value={room} onChange={(event) => setRoom(event.target.value)} className="input-field mt-1" />
          </label>
        </div>
        {!available.length && <p className="text-slate-600">Chưa có đề tài phù hợp với cấp đánh giá đã chọn.</p>}
        <fieldset className="space-y-2">
          <legend className="mb-2 font-semibold text-slate-900">Thành viên hội đồng</legend>
          {Array.from({ length: count }, (_, index) => {
            const member = members[index];
            return (
              <div key={index} className="grid items-start gap-2 border-t border-slate-200 py-2 sm:grid-cols-2">
                <label className="font-medium text-slate-800">{positionNames[positions[index] || 'UyVien']}
                  <select required value={member?.maGv || ''} onChange={(event) => changeMember(index, { maGv: event.target.value })} className="input-field mt-1">
                    <option value="">Chọn giảng viên</option>
                    {teachers.filter((item) => item.maGv === member?.maGv ||
                      !members.slice(0, count).some((selected) => selected?.maGv === item.maGv))
                      .map((item) => <option key={item.maGv} value={item.maGv}>{[item.hocHam, item.hocVi, item.hoTen].filter(Boolean).join(' ')}</option>)}
                  </select>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-slate-800">
                    <input type="checkbox" checked={member?.external || false} onChange={(event) => changeMember(index, { external: event.target.checked })} />
                    Ngoài cơ sở đào tạo
                  </label>
                  {member?.external && <label className="block text-slate-800">Cơ quan công tác
                    <input required maxLength={150} value={member.institution} onChange={(event) => changeMember(index, { institution: event.target.value })} className="input-field mt-1" />
                  </label>}
                </div>
              </div>
            );
          })}
        </fieldset>
        <label className="flex items-start gap-2 text-slate-800">
          <input className="mt-1" type="checkbox" required checked={checked} onChange={(event) => setChecked(event.target.checked)} />
          Đã thẩm tra tiêu chuẩn chuyên môn, cơ quan công tác và xung đột lợi ích của thành viên.
        </label>
        {error && <p role="alert" className="text-rose-800">{error}</p>}
        <button className="btn-primary" disabled={busy || !available.length}>{busy ? 'Đang lưu…' : 'Lập lịch hội đồng'}</button>
      </form>}
    </details>
  );
}

function ScoreCouncil({ council, member, onSaved }: {
  council: HoiDong;
  member: NonNullable<HoiDong['thanhVien']>[number];
  onSaved: () => void;
}) {
  const [scores, setScores] = useState<(number | '')[]>([
    member.diemTieuChi1 == null ? '' : Number(member.diemTieuChi1),
    member.diemTieuChi2 == null ? '' : Number(member.diemTieuChi2),
    member.diemTieuChi3 == null ? '' : Number(member.diemTieuChi3),
    member.diemTieuChi4 == null ? '' : Number(member.diemTieuChi4),
  ]);
  const [note, setNote] = useState(member.nhanXet || '');
  const [ballot, setBallot] = useState<Ballot | ''>(member.phieu || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const voting = council.capDanhGia === 'CapTruong' && council.deTai?.hocVien?.trinhDo === 'TienSi';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await hoiDongApi.chamDiem(council.maHd, {
        diemTieuChi1: Number(scores[0]), diemTieuChi2: Number(scores[1]),
        diemTieuChi3: Number(scores[2]), diemTieuChi4: Number(scores[3]),
        nhanXet: note.trim(), quyetNghi: voting ? ballot || undefined : undefined,
      });
      onSaved();
    } catch (err) {
      setError(errorText(err, 'Chưa lưu được phiếu đánh giá.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-xl border border-slate-200 p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-blue-800">{member.tongDiem != null ? 'Cập nhật phiếu của tôi' : 'Nộp phiếu đánh giá'}</summary>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {scoreLabels.map((label, index) => <label key={label} className="font-medium text-slate-800">{label} (tối đa {scoreMax[index]})
            <input type="number" required min={0} max={scoreMax[index]} step={0.1} value={scores[index]} className="input-field mt-1"
              onChange={(event) => setScores((old) => old.map((value, i) => i === index ? (event.target.value === '' ? '' : Number(event.target.value)) : value))} />
          </label>)}
        </div>
        <label className="block font-medium text-slate-800">Nhận xét
          <textarea maxLength={4000} value={note} onChange={(event) => setNote(event.target.value)} className="input-field mt-1" rows={3} />
        </label>
        {voting && <BallotSelect ballot={ballot} onChange={setBallot} label="Phiếu biểu quyết" />}
        {error && <p role="alert" className="text-rose-800">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu phiếu'}</button>
      </form>
    </details>
  );
}

function FinalizeCouncil({ council, onSaved }: { council: HoiDong; onSaved: () => void }) {
  const [present, setPresent] = useState<string[]>([]);
  const [file, setFile] = useState('');
  const [allowRetry, setAllowRetry] = useState(false);
  const [ballot, setBallot] = useState<Ballot | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const doctoral = council.deTai?.hocVien?.trinhDo === 'TienSi';
  const fromMinutes = council.capDanhGia === 'CoSo' || (!doctoral && council.quyChe === 'ThongTu53');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file || !present.length) return;
    setError('');
    setBusy(true);
    try {
      await hoiDongApi.ghiNhanKetQua(council.maHd, {
        thanhVienCoMat: present, bienBanUrl: file, kienNghiBaoVeLai: allowRetry,
        quyetNghi: fromMinutes ? ballot || undefined : undefined,
      });
      onSaved();
    } catch (err) {
      setError(errorText(err, 'Chưa chốt được kết quả.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-xl border border-slate-200 p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-blue-800">Chốt kết quả hội đồng</summary>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <fieldset className="space-y-2">
          <legend className="mb-2 font-semibold text-slate-900">Thành viên có mặt</legend>
          {council.thanhVien?.map((member) => <label key={member.maGv} className="flex items-center gap-2 text-slate-800">
            <input type="checkbox" checked={present.includes(member.maGv)} onChange={(event) =>
              setPresent((old) => event.target.checked ? [...old, member.maGv] : old.filter((id) => id !== member.maGv))} />
            {member.giangVien?.nguoiDung?.hoTen} · {positionNames[member.chucDanh]}
            {member.tongDiem != null && <span className="text-slate-600">(đã nộp phiếu)</span>}
          </label>)}
        </fieldset>
        <FileUploadZone label="Biên bản đã ký" accept=".pdf" onUploadSuccess={(result) => setFile(result.url)} disabled={busy} />
        {fromMinutes && <BallotSelect ballot={ballot} onChange={setBallot} label="Kết luận ghi trong biên bản" />}
        {doctoral && council.capDanhGia === 'CapTruong' && (council.lanBaoVe || 1) < 2 && (
          <label className="flex items-start gap-2 text-slate-800">
            <input type="checkbox" checked={allowRetry} onChange={(event) => setAllowRetry(event.target.checked)} />
            Biên bản có kiến nghị bảo vệ lại nếu kết quả không thông qua.
          </label>
        )}
        {error && <p role="alert" className="text-rose-800">{error}</p>}
        <button className="btn-primary" disabled={busy || !file || !present.length}>{busy ? 'Đang chốt…' : 'Chốt và công bố kết quả'}</button>
      </form>
    </details>
  );
}

function BallotSelect({ ballot, onChange, label }: { ballot: Ballot | ''; onChange: (value: Ballot | '') => void; label: string }) {
  return <label className="block font-medium text-slate-800">{label}
    <select value={ballot} required onChange={(event) => onChange(event.target.value as Ballot | '')} className="input-field mt-1">
      <option value="">Chọn kết quả</option>
      <option value="TanThanh">Thông qua</option>
      <option value="KhongTanThanh">Không thông qua</option>
    </select>
  </label>;
}
