import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { VaiTro } from '../../lib/api';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  path: string;
  roles?: VaiTro[];
}

const COMMANDS: CommandItem[] = [
  { id: 'dashboard', title: 'Bảng điều khiển Học vụ', category: 'Điều hướng', icon: '📊', path: '/' },
  { id: 'detai', title: 'Đề tài & Báo cáo Tiến độ', category: 'Học thuật', icon: '📑', path: '/de-tai' },
  { id: 'hocphan', title: 'Tiến độ Học phần & Bảng điểm', category: 'Học thuật', icon: '🎓', path: '/hoc-phan' },
  { id: 'hoidong', title: 'Lịch Hội đồng Bảo vệ Luận án', category: 'Hội đồng', icon: '🏛️', path: '/hoi-dong' },
  { id: 'plagiarism', title: 'Kiểm Tra Liêm Chính Học Thuật & Quét Trùng Lặp Luận Án', category: 'Học thuật AI', icon: '🛡️', path: '/kiem-tra-dao-van' },
  { id: 'aitutor', title: 'Trợ Lý AI Tư Vấn Quy Chế Đào Tạo (TT 18 & 23)', category: 'Học thuật AI', icon: '🏛️', path: '/ai-tutor' },
  { id: 'hoso', title: 'Hồ sơ & Lý lịch Khoa học', category: 'Tài khoản', icon: '👤', path: '/ho-so' },
  { id: 'nguoidung', title: 'Quản lý Người dùng & Phân quyền', category: 'Hệ thống', icon: '⚙️', path: '/nguoi-dung', roles: ['Admin'] },
];

export function CommandPalette() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const userRole = user?.vaiTro || 'HocVien';
  const roleCommands = COMMANDS.filter((cmd) => !cmd.roles || cmd.roles.includes(userRole));

  const filtered = roleCommands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex].path);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm và điều hướng nhanh"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-slate-100 bg-slate-50/50">
          <span className="text-slate-400 text-lg mr-3">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Tìm kiếm màn hình, đề tài, tra cứu quy chế... (Ctrl+K)"
            className="w-full py-4 text-sm text-slate-900 bg-transparent placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-slate-500 bg-slate-200 rounded-md">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Không tìm thấy lệnh hoặc trang phù hợp
            </p>
          ) : (
            <ul role="listbox" className="space-y-1">
              {filtered.map((item, idx) => (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  onClick={() => handleSelect(item.path)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-sm transition-colors ${
                    idx === selectedIndex ? 'cmd-item-active' : 'cmd-item-idle'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${idx === selectedIndex ? 'cmd-tag-active' : 'cmd-tag-idle'}`}>
                    {item.category}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          <span>Dùng ↑ ↓ để chọn, Enter để mở</span>
          <span>Phím tắt: Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
