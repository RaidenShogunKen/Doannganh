
import { ExtendedUser } from '../../pages/NguoiDungPage';
import { ROLE_LABEL } from '../../lib/roles';
import { getAvatarForUser } from '../../lib/avatarService';

interface UserDetailModalProps {
  user: ExtendedUser;
  onClose: () => void;
}

export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <article className="card max-w-xl w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <header className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
              Hồ Sơ Người Dùng
            </span>
            <h3 id="user-detail-title" className="font-sans text-lg font-bold text-slate-900 mt-1">
              {user.hoTen}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
            aria-label="Đóng chi tiết hồ sơ"
          >
            ✕
          </button>
        </header>

        <div className="my-5 space-y-4 text-xs font-sans">
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="h-16 w-16 rounded-xl bg-blue-200 overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold text-blue-800 border border-blue-300">
              {getAvatarForUser(user.email, user.vaiTro) || user.avatar ? (
                <img
                  src={(getAvatarForUser(user.email, user.vaiTro) || user.avatar)!}
                  alt={user.hoTen}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.hoTen.charAt(0)
              )}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">{user.hoTen}</h4>
              <p className="font-mono text-slate-600">{user.email}</p>
              <p className="text-slate-500">
                SĐT: <strong>{user.soDienThoai || 'Chưa cập nhật'}</strong>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Vai trò hệ thống:</span>
              <span className="font-bold text-blue-700">{ROLE_LABEL[user.vaiTro]}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Trạng thái tài khoản:</span>
              <span className="font-bold text-emerald-700">{user.trangThai}</span>
            </div>
            {user.vaiTro === 'HocVien' && (
              <>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Mã số nghiên cứu sinh:</span>
                  <strong className="font-mono">{user.mshv}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Chuyên ngành đào tạo:</span>
                  <strong>{user.chuyenNganh}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Khóa đào tạo:</span>
                  <span>{user.khoaHoc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cán bộ hướng dẫn chính:</span>
                  <strong className="text-slate-900">{user.gvhd}</strong>
                </div>
              </>
            )}
            {user.vaiTro === 'GiangVien' && (
              <>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Học hàm / Học vị:</span>
                  <strong>{user.hocHam} — {user.hocVi}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Khoa / Bộ môn trực thuộc:</span>
                  <strong>{user.khoa}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tải trọng hướng dẫn (Điều 13 TT 18):</span>
                  <strong className="text-indigo-700">{user.ncsDangHuongDan} / {user.hanMucToiDa} NCS</strong>
                </div>
              </>
            )}
          </div>

          <footer className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4 cursor-pointer"
            >
              Đóng
            </button>
          </footer>
        </div>
      </article>
    </div>
  );
}
