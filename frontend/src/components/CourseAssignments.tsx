import { FormEvent, useEffect, useState } from 'react';
import {
  ChuyenNganh, chuyenNganhApi, GiangVienOption, HocVienChamDiem,
  MonHoc, monHocApi, PhanCongGiangDay, userApi,
} from '../lib/api';

const keyOf = ({ maMh, maGv, hocKyNamHoc }: PhanCongGiangDay) => `${maMh}|${maGv}|${hocKyNamHoc}`;

function errorText(err: any, fallback: string) {
  const message = err?.response?.data?.message;
  return Array.isArray(message) ? message.join('. ') : typeof message === 'string' ? message : fallback;
}

export function CourseAssignments({ courses, majors, admin }: {
  courses: MonHoc[]; majors: ChuyenNganh[]; admin: boolean;
}) {
  const [assignments, setAssignments] = useState<PhanCongGiangDay[]>([]);
  const [teachers, setTeachers] = useState<GiangVienOption[]>([]);
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [semester, setSemester] = useState('');
  const [majorId, setMajorId] = useState('');
  const [credits, setCredits] = useState<number | ''>('');
  const [selected, setSelected] = useState('');
  const [students, setStudents] = useState<HocVienChamDiem[]>([]);
  const [studentId, setStudentId] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const assignment = assignments.find((row) => keyOf(row) === selected);

  async function loadAssignments() {
    const { data } = await monHocApi.danhSachPhanCong();
    setAssignments(data);
  }

  useEffect(() => {
    loadAssignments().catch((err) => setError(errorText(err, 'Không tải được phân công.')));
    if (admin) userApi.giangVienList().then(({ data }) => setTeachers(data))
      .catch((err) => setError(errorText(err, 'Không tải được danh sách giảng viên.')));
  }, [admin]);

  useEffect(() => {
    setStudents([]);
    setStudentId('');
    setGrade('');
    if (!assignment) return;
    let current = true;
    setRosterLoading(true);
    setError('');
    monHocApi.danhSachChamDiem(assignment.maMh, assignment.hocKyNamHoc)
      .then(({ data }) => { if (current) setStudents(data); })
      .catch((err) => { if (current) setError(errorText(err, 'Không tải được danh sách học viên.')); })
      .finally(() => { if (current) setRosterLoading(false); });
    return () => { current = false; };
  }, [selected, assignment?.maMh, assignment?.hocKyNamHoc]);

  async function save(action: () => Promise<void>, message: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(message);
    } catch (err) {
      setError(errorText(err, 'Thao tác thất bại. Vui lòng thử lại.'));
    } finally {
      setBusy(false);
    }
  }

  function assign(event: FormEvent) {
    event.preventDefault();
    void save(async () => {
      await monHocApi.phanCong({ maMh: Number(courseId), maGv: teacherId, hocKyNamHoc: semester.trim() });
      await loadAssignments();
    }, 'Đã lưu phân công.');
  }

  function submitGrade(event: FormEvent) {
    event.preventDefault();
    if (!assignment || grade === '' || !studentId) return;
    const score = grade;
    void save(async () => {
      await monHocApi.capNhatDiem({ maHv: studentId, maMh: assignment.maMh, hocKyNamHoc: assignment.hocKyNamHoc, diem: score });
      setStudents((old) => old.map((student) => student.maHv === studentId ? { ...student, diem: String(score) } : student));
    }, 'Đã lưu điểm học phần.');
  }

  function saveCredits(event: FormEvent) {
    event.preventDefault();
    if (!majorId || credits === '') return;
    void save(async () => { await chuyenNganhApi.cauHinhHocPhan(Number(majorId), credits); }, 'Đã lưu số tín chỉ học phần dùng khi xét bảo vệ.');
  }

  return (
    <section className="card space-y-4 text-sm">
      <h2 className="text-lg font-bold text-slate-900">Phân công và nhập điểm</h2>
      {admin && <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer font-semibold text-slate-900">Phân công giảng viên</summary>
        <form className="mt-3 grid items-end gap-3 lg:grid-cols-4" onSubmit={assign}>
          <label className="font-medium text-slate-800">Học phần
            <select value={courseId} required onChange={(e) => setCourseId(e.target.value)} className="input-field mt-1">
              <option value="">Chọn học phần</option>
              {courses.map((course) => <option key={course.maMh} value={course.maMh}>{course.tenMh}</option>)}
            </select>
          </label>
          <label className="font-medium text-slate-800">Giảng viên
            <select value={teacherId} required onChange={(e) => setTeacherId(e.target.value)} className="input-field mt-1">
              <option value="">Chọn giảng viên</option>
              {teachers.map((teacher) => <option key={teacher.maGv} value={teacher.maGv}>{teacher.hoTen}</option>)}
            </select>
          </label>
          <label className="font-medium text-slate-800">Học kỳ
            <input value={semester} required maxLength={20} onChange={(e) => setSemester(e.target.value)} placeholder="HK1_2026-2027" className="input-field mt-1" />
          </label>
          <button className="btn-primary w-fit" disabled={busy}>Lưu phân công</button>
        </form>
      </details>}
      {admin && <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer font-semibold text-slate-900">Cấu hình tín chỉ trước bảo vệ</summary>
        <form className="mt-3 grid items-end gap-3 sm:grid-cols-3" onSubmit={saveCredits}>
          <label className="font-medium text-slate-800">Chương trình
            <select value={majorId} required onChange={(e) => {
              setMajorId(e.target.value);
              setCredits(majors.find((major) => String(major.maCn) === e.target.value)?.soTinChiHocPhan ?? '');
            }} className="input-field mt-1">
              <option value="">Chọn chuyên ngành</option>
              {majors.map((major) => <option key={major.maCn} value={major.maCn}>{major.tenCn} · {major.trinhDoDaoTao === 'TienSi' ? 'Tiến sĩ' : 'Thạc sĩ'}</option>)}
            </select>
          </label>
          <label className="font-medium text-slate-800">Số tín chỉ học phần
            <input type="number" required min={0} max={300} value={credits} onChange={(e) => setCredits(e.target.value === '' ? '' : Number(e.target.value))} className="input-field mt-1" />
          </label>
          <button className="btn-primary w-fit" disabled={busy}>Lưu yêu cầu học phần</button>
        </form>
      </details>}
      <label className="block font-medium text-slate-800">Phân công
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="input-field mt-1">
          <option value="">Chọn học phần theo học kỳ</option>
          {assignments.map((row) => <option key={keyOf(row)} value={keyOf(row)}>
            {row.monHoc.tenMh} · {row.hocKyNamHoc}{admin ? ' · ' + row.hoTen : ''}
          </option>)}
        </select>
      </label>
      {!assignments.length && <p className="text-slate-600">Chưa có phân công giảng dạy.</p>}
      {rosterLoading && assignment && <p role="status" className="text-slate-600">Đang tải học viên…</p>}
      {assignment && !rosterLoading && !students.length && <p className="text-slate-600">Chưa có học viên đăng ký trong học kỳ này.</p>}
      {assignment && students.length > 0 && <form className="grid items-end gap-3 sm:grid-cols-3" onSubmit={submitGrade}>
        <label className="font-medium text-slate-800">Học viên
          <select value={studentId} required onChange={(e) => {
            setStudentId(e.target.value);
            const score = students.find((student) => student.maHv === e.target.value)?.diem;
            setGrade(score == null ? '' : Number(score));
          }} className="input-field mt-1">
            <option value="">Chọn học viên</option>
            {students.map((student) => <option key={student.maHv} value={student.maHv}>{student.hoTen} · {student.mshv}</option>)}
          </select>
        </label>
        <label className="font-medium text-slate-800">Điểm (0–10)
          <input type="number" min={0} max={10} step={0.01} required value={grade} onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))} className="input-field mt-1" />
        </label>
        <button className="btn-primary w-fit" disabled={busy}>Lưu điểm</button>
      </form>}
      {admin && assignment && <button className="btn-secondary text-rose-800" disabled={busy} onClick={() => {
        if (!window.confirm('Gỡ phân công giảng dạy này?')) return;
        void save(async () => { await monHocApi.huyPhanCong(assignment); setSelected(''); await loadAssignments(); }, 'Đã gỡ phân công.');
      }}>Gỡ phân công đang chọn</button>}
      {error && <p role="alert" className="text-rose-800">{error}</p>}
      {notice && <p role="status" className="text-emerald-800">{notice}</p>}
    </section>
  );
}
