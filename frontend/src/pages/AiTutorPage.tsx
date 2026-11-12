import { useEffect, useRef, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ChatInputBar } from '../components/ai-tutor/ChatInputBar';
import { ChatMessageThread } from '../components/ai-tutor/ChatMessageThread';
import { ChatSessionSidebar } from '../components/ai-tutor/ChatSessionSidebar';
import { CitationModal } from '../components/ai-tutor/CitationModal';
import { DocumentLibraryModal } from '../components/ai-tutor/DocumentLibraryModal';
import { AiCitation, aiTutorApi } from '../lib/api';

interface Message {
  role: 'user' | 'ai';
  text: string;
  citations?: AiCitation[];
  time?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  model: string;
}

const prompts = [
  { icon: '', category: 'Áp dụng theo khóa', title: 'Điều khoản chuyển tiếp', query: 'Thông tư 53/2026 áp dụng cho khóa nào?' },
  { icon: '', category: 'Tiến sĩ', title: 'Hội đồng luận án', query: 'Hội đồng đánh giá luận án theo Thông tư 53 có những yêu cầu nào?' },
  { icon: '', category: 'Thạc sĩ', title: 'Bảo vệ luận văn', query: 'Theo Thông tư 23, học viên cần những điều kiện gì để bảo vệ luận văn?' },
  { icon: '', category: 'Tiến sĩ', title: 'Công bố khoa học', query: 'Điều 14 Thông tư 18 quy định thế nào về công bố trước đánh giá tại đơn vị chuyên môn?' },
];
const displayTime = (date: string) => new Date(date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const now = () => displayTime(new Date().toISOString());

export function AiTutorPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [citation, setCitation] = useState<AiCitation | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inFlight = useRef<AbortController | null>(null);
  const selection = useRef(0);

  async function loadSessions() {
    const { data } = await aiTutorApi.listSessions();
    setSessions(data.map((session) => ({
      id: session.maHt, title: session.chuDe || 'Hội thoại',
      createdAt: displayTime(session.thoiGianBatDau), updatedAt: displayTime(session.thoiGianBatDau),
      model: '', messages: [],
    })));
  }

  useEffect(() => {
    loadSessions().catch(() => setError('Không tải được lịch sử hội thoại.'));
    return () => { inFlight.current?.abort(); selection.current++; };
  }, []);

  function newSession() {
    if (busy) return;
    selection.current++;
    setLoadingHistory(false);
    setActiveId('');
    setMessages([]);
    setInput('');
    setError('');
    textarea.current?.focus();
  }

  async function select(id: string) {
    if (busy || id === activeId) return;
    const version = ++selection.current;
    setLoadingHistory(true);
    setError('');
    setActiveId(id);
    setMessages([]);
    try {
      const { data } = await aiTutorApi.readSession(id);
      if (version !== selection.current) return;
      setMessages(data.map((message) => ({
        role: message.nguoiGui === 'User' ? 'user' : 'ai',
        text: message.noiDung,
        time: displayTime(message.thoiGian),
        citations: message.citations,
      })));
    } catch {
      if (version === selection.current) {
        setError('Không mở được hội thoại đã chọn.');
        setActiveId('');
      }
    } finally {
      if (version === selection.current) setLoadingHistory(false);
    }
  }

  async function remove(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    if (busy || !window.confirm('Xóa hội thoại này?')) return;
    try {
      await aiTutorApi.deleteSession(id);
      setSessions((old) => old.filter((session) => session.id !== id));
      if (activeId === id) newSession();
    } catch {
      setError('Không xóa được hội thoại.');
    }
  }

  async function clear() {
    if (busy || !window.confirm('Xóa tất cả lịch sử hội thoại?')) return;
    try {
      await aiTutorApi.clearSessions();
      setSessions([]);
      newSession();
    } catch {
      setError('Không xóa được lịch sử hội thoại.');
    }
  }

  async function send(raw: string) {
    const question = raw.trim();
    if (!question || inFlight.current || loadingHistory) return;
    if (question.length > 3000) { setError('Câu hỏi tối đa 3.000 ký tự.'); return; }
    const controller = new AbortController();
    inFlight.current = controller;
    setBusy(true);
    setInput('');
    setError('');
    const before = messages;
    let reply = '';
    let sources: AiCitation[] = [];
    let storedId = '';
    let modelUsed = '';
    const asked: Message = { role: 'user', text: question, time: now() };
    const showAnswer = () => setMessages([...before, asked, { role: 'ai', text: reply, citations: sources, time: modelUsed }]);
    showAnswer();
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/ai-tutor/chat/stream', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ cauHoi: question, maHt: activeId || undefined }),
      });
      if (!response.ok || !response.body) throw new Error('Không kết nối được trợ lý. Vui lòng thử lại.');
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      try {
        while (true) {
          const frame = await reader.read();
          if (frame.done) break;
          const parts = (buffer + frame.value).split('\n\n');
          buffer = parts.pop() || '';
          for (const line of parts) {
            if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
            const update = JSON.parse(line.slice(6));
            if (update.error) throw new Error(update.error);
            if (update.citations) sources = update.citations;
            if (update.token) reply += update.token;
            if (update.done) {
              storedId = update.maHt;
              reply = update.reply;
              modelUsed = update.modelUsed;
            }
            showAnswer();
          }
        }
      } finally {
        reader.releaseLock();
      }
      if (!storedId || !reply) throw new Error('Phiên trả lời bị gián đoạn. Vui lòng thử lại.');
      setActiveId(storedId);
      if (!activeId) {
        setSessions((old) => [{ id: storedId, title: question.slice(0, 80), model: '', createdAt: now(), updatedAt: now(), messages: [] }, ...old]);
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setMessages(before);
        setInput(question);
        setError(err?.message || 'Chưa nhận được câu trả lời.');
      }
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return (
    <AppShell title="Trợ lý quy chế đào tạo" subtitle="Tra cứu Thông tư 53/2026 và các quy chế áp dụng theo điều khoản chuyển tiếp">
      <div className="flex min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white md:h-[calc(100dvh-9rem)] md:flex-row">
        {showHistory && <ChatSessionSidebar sessions={sessions} activeSessionId={activeId} historySearch={search}
          onSearchChange={setSearch} onNewSession={newSession} onSelectSession={select} onDeleteSession={remove} onClearAll={clear} />}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-3">
            <button type="button" onClick={() => setShowHistory((value) => !value)} aria-expanded={showHistory} className="btn-secondary text-sm">Lịch sử</button>
            <button type="button" onClick={newSession} disabled={busy} className="btn-secondary text-sm">Hội thoại mới</button>
            <button type="button" onClick={() => setShowDocuments(true)} className="btn-secondary text-sm">Kho quy chế</button>
          </header>
          {error && <p role="alert" className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">{error}</p>}
          {loadingHistory && <p role="status" className="px-4 py-2 text-sm text-slate-700">Đang mở hội thoại…</p>}
          <ChatMessageThread messages={messages} loading={busy} isConversationEmpty={!messages.length}
            activeSuggestedPrompts={prompts} messagesEndRef={messagesEnd} copiedIndex={copied} onSend={send}
            onSelectCitation={setCitation} onCopyCitation={(content, index) => {
              navigator.clipboard.writeText(content).then(() => {
                setCopied(index);
                window.setTimeout(() => setCopied(null), 1500);
              }).catch(() => setError('Không sao chép được câu trả lời.'));
            }} />
          <ChatInputBar input={input} loading={busy || loadingHistory} isConversationEmpty={!messages.length}
            activeSuggestedPrompts={prompts} textareaRef={textarea} onInputChange={setInput} onQuickSend={send}
            onSubmit={(event) => { event.preventDefault(); void send(input); }}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault(); void send(input);
            } }} />
        </div>
      </div>
      {citation && <CitationModal citation={citation} onClose={() => setCitation(null)} />}
      {showDocuments && <DocumentLibraryModal onClose={() => setShowDocuments(false)} onAskAboutDoc={(document) => {
        setShowDocuments(false);
        setInput(`Giải thích ${document.dieuKhoan} (${document.tieuDe}) theo ${document.soHieu}.`);
        textarea.current?.focus();
      }} />}
    </AppShell>
  );
}
