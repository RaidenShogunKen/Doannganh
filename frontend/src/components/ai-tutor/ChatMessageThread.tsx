
import { RefObject, useRef, useState, useLayoutEffect, useEffect } from 'react';
import { AiCitation } from '../../lib/api';

interface Message {
  role: 'user' | 'ai';
  text: string;
  citations?: AiCitation[];
  time?: string;
}

interface SuggestedPrompt {
  icon: string;
  category: string;
  title: string;
  query: string;
}

interface ChatMessageThreadProps {
  messages: Message[];
  loading: boolean;
  isConversationEmpty: boolean;
  activeSuggestedPrompts: SuggestedPrompt[];
  messagesEndRef: RefObject<HTMLDivElement>;
  copiedIndex: number | null;
  onSend: (query: string) => void;
  onCopyCitation: (text: string, index: number) => void;
  onSelectCitation: (c: AiCitation) => void;
}

function getContextualFollowUps(lastAiText: string): string[] {
  const lower = lastAiText.toLowerCase();

  if (lower.includes('bài báo') || lower.includes('isi') || lower.includes('scopus') || lower.includes('hđgsnn')) {
    return [
      'Quy định tác giả chính (First/Corresponding Author) theo CV 1184?',
      'Ngưỡng tỷ lệ trùng lặp toàn văn luận án tối đa cho phép là bao nhiêu %?',
      'Điều kiện bảo vệ luận án tiến sĩ cần tối thiểu bao nhiêu bài báo?',
    ];
  }
  if (lower.includes('hội đồng') || lower.includes('phản biện') || lower.includes('chủ tịch')) {
    return [
      'Tiêu chuẩn và số lượng thành viên phản biện ngoài trường?',
      'Quy định về khoảng cách giờ bảo vệ không trùng lịch (±2 giờ)?',
      'Thủ tục nộp hồ sơ xin thành lập Hội đồng cấp trường?',
    ];
  }
  if (lower.includes('thạc sĩ') || lower.includes('thạc sỹ') || lower.includes('tt 23') || lower.includes('23/2021')) {
    return [
      'Chuẩn ngoại ngữ đầu ra bậc 4/6 (B2) đối với thạc sĩ?',
      'Khối lượng tín chỉ luận văn thạc sĩ theo định hướng nghiên cứu?',
      'Cơ cấu 05 thành viên Hội đồng chấm luận văn thạc sĩ?',
    ];
  }
  if (lower.includes('tiến sĩ') || lower.includes('ncs') || lower.includes('72 tháng') || lower.includes('18/2021')) {
    return [
      'Hạn mức hướng dẫn tối đa của Giáo sư, PGS và Tiến sĩ?',
      'Quy định về 03 chuyên đề tiến sĩ bắt buộc và điểm đạt?',
      'Thủ tục và thời hạn gia hạn đào tạo tiến sĩ quá 36 tháng?',
    ];
  }
  if (lower.includes('tiến độ') || lower.includes('báo cáo') || lower.includes('6 tháng')) {
    return [
      'Quy trình GVHD thẩm định và cho điểm báo cáo tiến độ 6 tháng?',
      'Hậu quả học vụ khi trễ hạn nộp báo cáo tiến độ 02 kỳ liên tiếp?',
      'Hồ sơ đăng ký đề tài nghiên cứu sinh gồm những giấy tờ gì?',
    ];
  }

  return [
    'Thời gian đào tạo tối đa của tiến sĩ là bao lâu?',
    'Chuẩn bài báo ISI/Scopus để bảo vệ luận án?',
    'Quy định về kiểm tra liêm chính học thuật và đạo văn?',
  ];
}

function renderFormattedText(text: string) {
  return text.split('\n').map((line, index) => {
    if (!line.trim()) return <div key={index} className="h-2" />;
    const content = line.replace(/^(###\s+|[-*]\s+)/, '').split(/(\*\*[^*]+\*\*)/g).map((part, position) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={position}>{part.slice(2, -2)}</strong> : part,
    );
    if (line.startsWith('### ')) {
      return <h4 key={index} className="mt-3 mb-1 text-sm font-bold text-slate-900">{content}</h4>;
    }
    return <p key={index} className="my-1 break-words leading-relaxed text-slate-800">{/^[-*]\s/.test(line) ? '• ' : ''}{content}</p>;
  });
}

export function ChatMessageThread({
  messages,
  loading,
  isConversationEmpty,
  activeSuggestedPrompts,
  copiedIndex,
  onSend,
  onCopyCitation,
  onSelectCitation,
}: ChatMessageThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollPinnedRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Lắng nghe sự kiện người dùng chủ động lăn chuột hoặc vuốt chạm lên trên
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      // Người dùng lăn chuột LÊN -> HỦY GHIM CUỘN NGAY LẬP TỨC
      autoScrollPinnedRef.current = false;
      setShowScrollBtn(true);
    }
  };

  const handleTouchStart = () => {
    // Khi chạm tay vào màn hình vuốt -> tạm thời bỏ ghim tự động
    autoScrollPinnedRef.current = false;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    // Nếu người dùng đã cuộn xuống sát đáy (< 30px) -> KÍCH HOẠT LẠI GHIM CUỘN TỰ ĐỘNG
    if (distanceFromBottom <= 30) {
      autoScrollPinnedRef.current = true;
      setShowScrollBtn(false);
    } else {
      setShowScrollBtn(true);
    }
  };

  // Khi có token stream hoặc tin nhắn mới: CHỈ CUỘN KHI NGƯỜI DÙNG ĐANG Ở ĐÁY
  useLayoutEffect(() => {
    if (autoScrollPinnedRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleScrollToBottomClick = () => {
    autoScrollPinnedRef.current = true;
    setShowScrollBtn(false);
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Lấy câu trả lời AI cuối cùng để sinh gợi ý đào sâu
  const lastAiMessage = [...messages].reverse().find((m) => m.role === 'ai' && m.text.length > 30);
  const followUpPrompts = lastAiMessage ? getContextualFollowUps(lastAiMessage.text) : [];

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6 bg-slate-50/40"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'ai' && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md">
                🏛️
              </div>
            )}

            <div className={`space-y-1.5 ${m.role === 'user' ? 'max-w-[75%]' : 'max-w-[88%]'}`}>
              <div
                className={`rounded-2xl p-4.5 text-[13px] leading-relaxed shadow-xs ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-none'
                }`}
              >
                {m.role === 'user' ? (
                  <p className="font-medium whitespace-pre-wrap">{m.text}</p>
                ) : m.text === '' ? (
                  <div className="flex items-center gap-1.5 py-1">
                    {[0, 0.2, 0.4].map((delay, di) => (
                      <span
                        key={di}
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#3b82f6',
                          animation: 'typingBounce 1.2s infinite ease-in-out',
                          animationDelay: `${delay}s`,
                        }}
                      />
                    ))}
                    <style>{`
                      @keyframes typingBounce {
                        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                        40% { transform: translateY(-6px); opacity: 1; }
                      }
                    `}</style>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-slate-800">
                    {renderFormattedText(m.text)}
                  </div>
                )}

                {/* Khối Căn Cứ Điều Khoản Pháp Lý */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3.5 border-t border-slate-100 pt-3">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      📚 Căn cứ pháp lý & Trích dẫn Thông tư:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {m.citations.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onSelectCitation(c)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                        >
                          <span>📄</span>
                          <span>{c.soHieu} · {c.dieuKhoan}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Thanh Thông Tin Dưới Tin Nhắn */}
              <div
                className={`flex items-center gap-3 px-2 text-[10px] text-slate-400 font-medium ${
                  m.role === 'user' ? 'justify-end' : 'justify-between'
                }`}
              >
                {m.time && <span>{m.time}</span>}
                {m.role === 'ai' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onCopyCitation(m.text, i)}
                      className="hover:text-blue-600 font-semibold cursor-pointer transition-colors"
                    >
                      {copiedIndex === i ? '✓ Đã chép' : '📋 Sao chép'}
                    </button>

                  </div>
                )}
              </div>
            </div>

            {m.role === 'user' && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white font-bold text-xs shadow-md">
                Tôi
              </div>
            )}
          </div>
        ))}

        {/* Khối Gợi Ý Ban Đầu Khi Chưa Có Tin Nhắn */}
        {isConversationEmpty && (
          <div className="pt-2 pb-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
              💡 Gợi Ý Các Vấn Đề Quy Chế Phù Hợp Với Vai Trò Của Bạn:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeSuggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSend(prompt.query)}
                  className="group p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-md transition-all text-left cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{prompt.icon}</span>
                    <span className="rounded-md bg-blue-50 text-blue-800 group-hover:bg-blue-100 group-hover:text-blue-900 text-[10px] font-bold px-2 py-0.5 border border-blue-200/60">
                      {prompt.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs group-hover:text-blue-700">
                    {prompt.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {prompt.query}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Khối Gợi Ý Đào Sâu Thông Minh Theo Ngữ Cảnh Sau Khi AI Trả Lời */}
        {!loading && !isConversationEmpty && followUpPrompts.length > 0 && (
          <div className="pt-2 pb-1 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-2">
              <span>✨</span>
              <span>Gợi ý câu hỏi đào sâu liên quan:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {followUpPrompts.map((fPrompt, fIdx) => (
                <button
                  key={fIdx}
                  type="button"
                  onClick={() => onSend(fPrompt)}
                  className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 transition-all cursor-pointer shadow-2xs"
                >
                  <span className="text-blue-500">↳</span>
                  <span>{fPrompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trạng Thái AI Đang Tìm Kiếm & Xử Lý */}
        {loading && (
          <div className="flex gap-3.5 justify-start animate-fade-in">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md">
              🏛️
            </div>
            <div className="rounded-2xl rounded-tl-none bg-white p-4 border border-slate-200 text-xs text-slate-600 space-y-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Trợ lý AI đang đối soát và phân tích quy chế...</span>
                <span className="flex gap-1 items-center">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: '200ms' }} />
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: '400ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nút Nổi Thông Minh: Cuộn Xuống Tin Nhắn Mới Khi Người Dùng Đang Đọc Ở Trên */}
      {showScrollBtn && (
        <div className="sticky bottom-2 flex justify-center z-20 pointer-events-none">
          <button
            type="button"
            onClick={handleScrollToBottomClick}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 shadow-xl backdrop-blur-md transition-all hover:scale-105 cursor-pointer border border-white/20 animate-fade-in"
          >
            <span>⬇</span>
            <span>Cuộn xuống câu trả lời mới</span>
          </button>
        </div>
      )}
    </div>
  );
}
