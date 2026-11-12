
import { useState } from 'react';
import { ExtendedUser } from '../../pages/NguoiDungPage';
import { getAvatarForUser, saveAvatarForUser } from '../../lib/avatarService';

interface EditUserModalProps {
  user: ExtendedUser;
  onSave: (edited: ExtendedUser) => void;
  onClose: () => void;
}

export function EditUserModal({ user, onSave, onClose }: EditUserModalProps) {
  const [formData, setFormData] = useState<ExtendedUser>({ ...user });
  const [avatar, setAvatar] = useState<string | null>(
    () => getAvatarForUser(user.email, user.vaiTro) || user.avatar || null,
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (avatar) {
      saveAvatarForUser(formData.email, avatar);
    }
    onSave({ ...formData, avatar: avatar || undefined });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <article className="card max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <header className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
              Quản Trị Hệ Thống
            </span>
            <h3 id="edit-user-title" className="font-sans text-base font-bold text-slate-900 mt-1">
              Chỉnh Sửa Thông Tin Hành Chính &amp; Quyền Hạn
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
            aria-label="Đóng form chỉnh sửa"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="my-4 space-y-3.5 text-xs">
          {}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="h-12 w-12 rounded-xl bg-blue-100 overflow-hidden shrink-0 flex items-center justify-center text-lg font-bold text-blue-700 border border-blue-200">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                formData.hoTen.charAt(0)
              )}
            </div>
            <div className="flex-1 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">Ảnh chân dung đại diện</label>
              <div className="flex items-center gap-2">
                <label className="btn-secondary py-1 px-2.5 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1">
                  <span>📷</span>
                  <span>Đổi ảnh</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="text-[10px] text-rose-600 hover:underline font-semibold"
                  >
                    Gỡ ảnh
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-700">Họ và tên đầy đủ *</label>
            <input
              value={formData.hoTen}
              onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
              required
              className="input-field text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-slate-700">Địa chỉ Email *</label>
              <input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="input-field text-xs font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">Số điện thoại</label>
              <input
                value={formData.soDienThoai || ''}
                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                className="input-field text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-slate-700">Vai trò hệ thống</label>
              <select
                value={formData.vaiTro}
                onChange={(e) => setFormData({ ...formData, vaiTro: e.target.value as any })}
                className="input-field text-xs"
              >
                <option value="HocVien">🎓 Nghiên cứu sinh / Học viên</option>
                <option value="GiangVien">👨‍🏫 Giảng viên</option>
                <option value="Admin">🛡️ Quản trị viên</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">Trạng thái tài khoản</label>
              <select
                value={formData.trangThai}
                onChange={(e) => setFormData({ ...formData, trangThai: e.target.value as any })}
                className="input-field text-xs"
              >
                <option value="Active">🟢 Đang hoạt động</option>
                <option value="Graduated">🎓 Đã tốt nghiệp</option>
                <option value="Locked">🔴 Đã khóa</option>
              </select>
            </div>
          </div>

          {formData.vaiTro === 'GiangVien' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="font-bold text-slate-800 text-[11px] uppercase">
                Học hàm / học vị (quyết định định mức hướng dẫn — Điều 13 TT 18)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-600">Học hàm</label>
                  <select
                    value={formData.hocHam || ''}
                    onChange={(e) => setFormData({ ...formData, hocHam: e.target.value })}
                    className="input-field text-xs"
                  >
                    <option value="Giáo sư">Giáo sư (tối đa 07 NCS)</option>
                    <option value="Phó Giáo sư">Phó Giáo sư (tối đa 05 NCS)</option>
                    <option value="">Không có học hàm (tối đa 03 NCS)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-slate-600">Học vị</label>
                  <select
                    value={formData.hocVi || ''}
                    onChange={(e) => setFormData({ ...formData, hocVi: e.target.value })}
                    className="input-field text-xs"
                  >
                    <option value="Tiến sĩ khoa học">Tiến sĩ khoa học (TSKH)</option>
                    <option value="Tiến sĩ">Tiến sĩ (TS)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-slate-600">Đơn vị công tác / chuyên môn</label>
                <input
                  value={formData.khoa || ''}
                  onChange={(e) => setFormData({ ...formData, khoa: e.target.value })}
                  className="input-field text-xs"
                />
              </div>
            </div>
          )}

          {formData.vaiTro === 'HocVien' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="font-bold text-slate-800 text-[11px] uppercase">Thông tin học vụ NCS:</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-600">Mã số NCS (MSHV)</label>
                  <input
                    value={formData.mshv || ''}
                    onChange={(e) => setFormData({ ...formData, mshv: e.target.value })}
                    className="input-field text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-600">Trình độ</label>
                  <select
                    value={formData.trinhDo || 'TienSi'}
                    onChange={(e) => setFormData({ ...formData, trinhDo: e.target.value as any })}
                    className="input-field text-xs"
                  >
                    <option value="TienSi">🔬 Tiến sĩ (NCS)</option>
                    <option value="ThacSi">🎓 Thạc sĩ</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-slate-600">Khóa học</label>
                  <input
                    value={formData.khoaHoc || ''}
                    onChange={(e) => setFormData({ ...formData, khoaHoc: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-600">Chuyên ngành đào tạo</label>
                  <input
                    value={formData.chuyenNganh || 'Chưa phân ngành'}
                    readOnly
                    disabled
                    title="Chuyên ngành do Phòng Đào tạo phân theo quyết định trúng tuyển"
                    className="input-field text-xs bg-slate-100 text-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          <footer className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4 cursor-pointer"
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary text-xs py-2 px-5 cursor-pointer font-bold shadow-md">
              Lưu Thay Đổi
            </button>
          </footer>
        </form>
      </article>
    </div>
  );
}
