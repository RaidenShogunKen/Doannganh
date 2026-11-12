
import { useEffect, useState } from 'react';
import { ChuyenNganh, CreateUserPayload, chuyenNganhApi } from '../../lib/api';

interface AddUserModalProps {
  onAdd: (payload: CreateUserPayload) => void | Promise<void>;
  onClose: () => void;
}

export function AddUserModal({ onAdd, onClose }: AddUserModalProps) {
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [sdt, setSdt] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [vaiTro, setVaiTro] = useState<'HocVien' | 'GiangVien' | 'Admin'>('HocVien');

  const [trinhDo, setTrinhDo] = useState<'TienSi' | 'ThacSi'>('TienSi');
  const [mshv, setMshv] = useState('');
  const [khoaHoc, setKhoaHoc] = useState('');
  const [maChuyenNganh, setMaChuyenNganh] = useState<number | ''>('');
  const [chuyenNganhList, setChuyenNganhList] = useState<ChuyenNganh[]>([]);

  const [hocHam, setHocHam] = useState('Phó Giáo sư');
  const [hocVi, setHocVi] = useState('Tiến sĩ');
  const [chuyenMon, setChuyenMon] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    chuyenNganhApi
      .list()
      .then((res) => setChuyenNganhList(res.data || []))
      .catch(() => setChuyenNganhList([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: CreateUserPayload = {
      hoTen,
      email,
      vaiTro,
      sdt: sdt || undefined,
      matKhau: matKhau || undefined,
      ...(vaiTro === 'HocVien' && {
        mshv,
        trinhDo,
        khoaHoc: khoaHoc || undefined,
        maChuyenNganh: maChuyenNganh === '' ? undefined : Number(maChuyenNganh),
      }),
      ...(vaiTro === 'GiangVien' && {
        hocHam: hocHam || undefined,
        hocVi: hocVi || undefined,
        chuyenMon: chuyenMon || undefined,
      }),
    };

    try {
      await onAdd(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-user-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <article className="card max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        <header className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
              Tạo Mới Tài Khoản Người Dùng
            </span>
            <h3 id="add-user-title" className="font-sans text-base font-bold text-slate-900 mt-1">
              Thêm Người Dùng &amp; Định Danh Học Thuật
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
            aria-label="Đóng form thêm người dùng"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="my-4 space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-bold text-slate-700">Họ và tên đầy đủ *</label>
            <input value={hoTen} onChange={(e) => setHoTen(e.target.value)} required className="input-field text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-slate-700">Địa chỉ Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field text-xs font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">Số điện thoại</label>
              <input value={sdt} onChange={(e) => setSdt(e.target.value)} className="input-field text-xs font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-slate-700">Vai trò hệ thống *</label>
              <select
                value={vaiTro}
                onChange={(e) => setVaiTro(e.target.value as any)}
                className="input-field text-xs"
              >
                <option value="HocVien">🎓 Nghiên cứu sinh / Học viên</option>
                <option value="GiangVien">👨‍🏫 Giảng viên hướng dẫn</option>
                <option value="Admin">🛡️ Quản trị viên Đào tạo</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">Mật khẩu khởi tạo</label>
              <input
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="Bỏ trống để tạo ngẫu nhiên"
                className="input-field text-xs font-mono"
              />
            </div>
          </div>

          {vaiTro === 'HocVien' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="font-bold text-slate-800 text-[11px] uppercase">Thông tin học vụ</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-600">Mã số học viên (MSHV) *</label>
                  <input
                    value={mshv}
                    onChange={(e) => setMshv(e.target.value)}
                    required
                    placeholder="VD: NCS2026001"
                    className="input-field text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-600">Trình độ đào tạo</label>
                  <select
                    value={trinhDo}
                    onChange={(e) => setTrinhDo(e.target.value as any)}
                    className="input-field text-xs"
                  >
                    <option value="TienSi">🔬 Tiến sĩ (NCS)</option>
                    <option value="ThacSi">🎓 Thạc sĩ</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-600">Chuyên ngành</label>
                  <select
                    value={maChuyenNganh}
                    onChange={(e) => setMaChuyenNganh(e.target.value === '' ? '' : Number(e.target.value))}
                    className="input-field text-xs"
                  >
                    <option value="">— Chưa phân ngành —</option>
                    {chuyenNganhList.map((cn) => (
                      <option key={cn.maCn} value={cn.maCn}>
                        {cn.tenCn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-slate-600">Khóa học</label>
                  <input
                    value={khoaHoc}
                    onChange={(e) => setKhoaHoc(e.target.value)}
                    placeholder="VD: Khóa K26 (2025 - 2029)"
                    className="input-field text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {vaiTro === 'GiangVien' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="font-bold text-slate-800 text-[11px] uppercase">
                Học hàm / học vị (quyết định định mức hướng dẫn — Điều 13 TT 18)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-600">Học hàm</label>
                  <select value={hocHam} onChange={(e) => setHocHam(e.target.value)} className="input-field text-xs">
                    <option value="Giáo sư">Giáo sư (tối đa 07 NCS)</option>
                    <option value="Phó Giáo sư">Phó Giáo sư (tối đa 05 NCS)</option>
                    <option value="">Không có học hàm (tối đa 03 NCS)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-slate-600">Học vị</label>
                  <select value={hocVi} onChange={(e) => setHocVi(e.target.value)} className="input-field text-xs">
                    <option value="Tiến sĩ khoa học">Tiến sĩ khoa học (TSKH)</option>
                    <option value="Tiến sĩ">Tiến sĩ (TS)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-slate-600">Đơn vị công tác / chuyên môn</label>
                <input
                  value={chuyenMon}
                  onChange={(e) => setChuyenMon(e.target.value)}
                  placeholder="VD: Khoa Công nghệ Thông tin"
                  className="input-field text-xs"
                />
              </div>
            </div>
          )}

          <footer className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4 cursor-pointer">
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs py-2 px-5 cursor-pointer font-bold shadow-md"
            >
              {submitting ? 'Đang tạo…' : 'Tạo Tài Khoản'}
            </button>
          </footer>
        </form>
      </article>
    </div>
  );
}
