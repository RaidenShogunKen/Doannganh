
import { AiCitation } from '../../lib/api';

interface CitationModalProps {
  citation: AiCitation;
  onClose: () => void;
}

export function CitationModal({ citation, onClose }: CitationModalProps) {
  const handleCopy = () => {
    const text = `[${citation.soHieu}] ${citation.dieuKhoan}: ${citation.tieuDe}\n${citation.noiDung}\nNguồn: ${citation.linkGoc || 'Quy chế Bộ GD&ĐT'}`;
    navigator.clipboard.writeText(text);
    alert('Đã sao chép trích dẫn điều khoản vào bộ nhớ tạm!');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <article className="card max-w-2xl w-full shadow-2xl border-slate-700/30 bg-white rounded-3xl overflow-hidden p-6 animate-modal">
        <header className="flex items-start justify-between border-b border-slate-200 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                {citation.soHieu}
              </span>
              {citation.coQuan && (
                <span className="text-[11px] text-slate-500 font-medium">
                  {citation.coQuan}
                </span>
              )}
            </div>
            <h3 id="citation-modal-title" className="font-sans text-base font-bold text-slate-900 mt-1.5">
              {citation.dieuKhoan}: {citation.tieuDe}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-base font-bold cursor-pointer transition-colors"
            title="Đóng cửa sổ"
            aria-label="Đóng modal"
          >
            ✕
          </button>
        </header>

        <div className="my-4 space-y-3.5 text-xs font-sans">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center justify-between">
            <span>Văn bản: {citation.tenVanBan}</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px] border border-emerald-200">
              ✓ Đang có hiệu lực
            </span>
          </div>
          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap font-sans text-xs">
            {citation.noiDung}
          </div>
        </div>

        <footer className="flex items-center justify-between pt-3.5 border-t border-slate-200 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {citation.linkGoc && (
              <a
                href={citation.linkGoc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
              >
                <span>Mở Văn Bản Gốc (Thư Viện Pháp Luật)</span>
                <span>↗</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="btn-secondary text-xs py-2 px-3 cursor-pointer font-bold flex items-center gap-1"
            >
              <span>📋</span>
              <span>Sao chép</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4 cursor-pointer font-bold"
          >
            Đóng
          </button>
        </footer>
      </article>
    </div>
  );
}
