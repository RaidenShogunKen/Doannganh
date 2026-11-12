
import { useState } from 'react';

interface BroadcastModalProps {
  totalUsers: number;
  onSend: (data: { title: string; message: string; target: 'ALL' | 'HocVien' | 'GiangVien' }) => void;
  onClose: () => void;
}

export function BroadcastModal({ totalUsers, onSend, onClose }: BroadcastModalProps) {
  const [broadcastTitle, setBroadcastTitle] = useState('Thông báo hạn nộp Báo cáo Tiến độ Học kỳ');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Đề nghị toàn thể Nghiên cứu sinh nộp Báo cáo tiến độ 6 tháng có xác nhận của GVHD trước ngày 30 hàng tháng.',
  );
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'HocVien' | 'GiangVien'>('ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend({
      title: broadcastTitle,
      message: broadcastMessage,
      target: broadcastTarget,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="broadcast-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <article className="card max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <header className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
              Thông Báo Học Vụ Toàn Trường
            </span>
            <h3 id="broadcast-modal-title" className="font-sans text-base font-bold text-slate-900 mt-1">
              Phát Thông Báo Tới Toàn Thể Người Dùng
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
            aria-label="Đóng modal thông báo"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="my-4 space-y-4 text-xs font-sans">
          <div>
            <label className="mb-1 block font-bold text-slate-700">Tiêu đề thông báo *</label>
            <input
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              required
              className="input-field text-xs font-semibold"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-700">Đối tượng nhận thông báo</label>
            <select
              value={broadcastTarget}
              onChange={(e) => setBroadcastTarget(e.target.value as any)}
              className="input-field text-xs"
            >
              <option value="ALL">📢 Toàn thể người dùng ({totalUsers} tài khoản)</option>
              <option value="HocVien">🔬 Tất cả Nghiên cứu sinh Tiến sĩ (NCS)</option>
              <option value="GiangVien">👨‍🏫 Tất cả Giảng viên Hướng dẫn (GVHD)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-700">Nội dung chi tiết *</label>
            <textarea
              rows={4}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              required
              className="input-field text-xs leading-relaxed"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px]">
            ℹ️ Thông báo sẽ hiển thị trực tiếp trong Khay Thông Báo (Notification Drawer) và gửi email tới hòm thư của người nhận.
          </div>

          <footer className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4 cursor-pointer"
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary text-xs py-2 px-5 cursor-pointer font-bold shadow-md">
              Gửi Thông Báo Ngay
            </button>
          </footer>
        </form>
      </article>
    </div>
  );
}
