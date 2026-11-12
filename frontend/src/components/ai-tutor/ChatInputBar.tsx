
import { FormEvent, RefObject } from 'react';

interface SuggestedPrompt {
  icon: string;
  category: string;
  title: string;
  query: string;
}

interface ChatInputBarProps {
  input: string;
  loading: boolean;
  isConversationEmpty: boolean;
  activeSuggestedPrompts: SuggestedPrompt[];
  textareaRef: RefObject<HTMLTextAreaElement>;
  onInputChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onQuickSend: (query: string) => void;
}

export function ChatInputBar({
  input,
  loading,
  isConversationEmpty,
  activeSuggestedPrompts,
  textareaRef,
  onInputChange,
  onSubmit,
  onKeyDown,
  onQuickSend,
}: ChatInputBarProps) {
  return (
    <footer className="border-t border-slate-200 bg-white p-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-2.5">
        {}
        {!isConversationEmpty && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">Hỏi nhanh:</span>
            {activeSuggestedPrompts.slice(0, 4).map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onQuickSend(p.query)}
                className="shrink-0 rounded-full border border-blue-200/80 bg-blue-50/70 px-3 py-1 text-[11px] font-bold text-blue-800 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-900 transition-all cursor-pointer"
              >
                {p.icon} {p.title}
              </button>
            ))}
          </div>
        )}

        {}
        <form
          onSubmit={onSubmit}
          className="relative flex items-end gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-2 focus-within:border-blue-600 focus-within:bg-white focus-within:shadow-md transition-all"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Nhập câu hỏi của bạn về quy chế đào tạo, chuẩn bài báo ISI/Scopus, liêm chính học thuật... (Enter để gửi, Shift+Enter xuống dòng)"
            className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-32"
            aria-label="Nhập câu hỏi"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <span>{loading ? 'Đang tra cứu...' : 'Gửi Câu Hỏi'}</span>
            <span>→</span>
          </button>
        </form>

        <p className="text-[10px] text-slate-400 text-center">
          * Câu trả lời được đối chiếu tự động với Thông tư 18/2021/TT-BGDĐT &amp; Thông tư 23/2021/TT-BGDĐT. Vui lòng bấm vào các thẻ Điều khoản để kiểm chứng toàn văn.
        </p>
      </div>
    </footer>
  );
}
