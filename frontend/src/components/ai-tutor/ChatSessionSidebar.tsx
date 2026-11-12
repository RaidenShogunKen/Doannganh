
import { ChatSession } from '../../pages/AiTutorPage';

interface ChatSessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  historySearch: string;
  onSearchChange: (v: string) => void;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export function ChatSessionSidebar({
  sessions,
  activeSessionId,
  historySearch,
  onSearchChange,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onClearAll,
}: ChatSessionSidebarProps) {
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(historySearch.toLowerCase()),
  );

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-slate-50/80 flex flex-col justify-between transition-all duration-300">
      <div className="flex flex-col h-full overflow-hidden">
        {}
        <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-white/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">💬</span>
              <h3 className="text-xs font-bold text-slate-900">Lịch Sử Hội Thoại</h3>
              <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[10px] font-bold text-blue-800">
                {sessions.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onNewSession}
              className="btn-primary py-1.5 px-2.5 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
              title="Tạo phiên hội thoại mới"
            >
              <span>➕</span>
              <span>Mới</span>
            </button>
          </div>

          <div className="relative">
            <input
              value={historySearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm phiên chat..."
              className="input-field text-xs py-1.5 pl-7 pr-2 w-full bg-slate-50"
            />
            <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
          </div>
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Không tìm thấy hội thoại nào
            </div>
          ) : (
            filteredSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`group relative rounded-xl p-2.5 text-xs transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs'
                      : 'bg-white/60 border-slate-200/80 text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-xs shrink-0">{isActive ? '🔹' : '💬'}</span>
                      <h4 className="font-bold truncate text-[12px]">{s.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => onDeleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-600 rounded p-1 text-slate-400 transition-opacity cursor-pointer text-xs"
                      title="Xóa phiên hội thoại này"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pl-4">
                    <span>{s.updatedAt || s.createdAt}</span>
                    <span className="font-medium">{s.messages.length} tin nhắn</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {}
        <div className="p-3 border-t border-slate-200 bg-white/70 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Đã lưu tự động</span>
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-[10px] text-slate-400 hover:text-rose-600 hover:underline cursor-pointer"
          >
            Xóa tất cả
          </button>
        </div>
      </div>
    </aside>
  );
}
