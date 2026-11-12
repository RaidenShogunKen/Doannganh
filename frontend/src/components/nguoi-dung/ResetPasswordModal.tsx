
import { ExtendedUser } from '../../pages/NguoiDungPage';

interface ResetPasswordModalProps {
  user: ExtendedUser;
  onConfirm: () => void;
  onClose: () => void;
}

export function ResetPasswordModal({ user, onConfirm, onClose }: ResetPasswordModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-pass-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <article className="card max-w-sm w-full shadow-2xl text-center p-6 space-y-4 animate-in fade-in zoom-in duration-200">
        <span className="text-3xl">🔑</span>
        <div>
          <h3 id="reset-pass-title" className="font-sans text-base font-bold text-slate-900">
            Đặt Lại Mật Khẩu
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản <strong>{user.hoTen}</strong> ({user.email})?
          </p>
          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-blue-700">
            Hệ thống sẽ tạo và hiển thị mật khẩu mới một lần.
          </div>
        </div>
        <div className="flex justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary text-xs py-2 px-5 cursor-pointer font-bold"
          >
            Xác Nhận Đặt Lại
          </button>
        </div>
      </article>
    </div>
  );
}
