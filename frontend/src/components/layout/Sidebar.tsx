import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABEL, ROLE_NAV } from '../../lib/roles';

function getNavIcon(path: string) {
  switch (path) {
    case '/':
      return (
        <svg className="h-5 w-5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case '/hoc-phan':
      return (
        <svg className="h-5 w-5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case '/de-tai':
      return (
        <svg className="h-5 w-5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case '/ho-so':
      return (
        <svg className="h-5 w-5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case '/hoi-dong':
      return (
        <svg className="h-5 w-5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case '/ai-tutor':
      return (
        <svg className="h-5 w-5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case '/kiem-tra-dao-van':
    case '/plagiarism-check':
      return (
        <svg className="h-5 w-5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case '/nguoi-dung':
      return (
        <svg className="h-5 w-5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case '/analytics-dashboard':
      return (
        <svg className="h-5 w-5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const items = ROLE_NAV[user.vaiTro];

  const renderNavContent = () => (
    <>
      {}
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <figure className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30">
            <svg className="h-6 w-6" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </figure>
          <hgroup className="min-w-0">
            <h2 className="truncate font-sans text-base font-bold text-white tracking-tight">Quản Lý Đào Tạo</h2>
            <p className="text-[11px] font-medium text-slate-400">
              Cổng Thông Tin Học Vụ
            </p>
          </hgroup>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            aria-label="Đóng menu điều hướng"
          >
            ✕
          </button>
        )}
      </header>

      {}
      <nav aria-label="Danh mục phân hệ quản lý" className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {}
        <button
          type="button"
          onClick={() => {
            onCloseMobile?.();
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
          }}
          className="mb-4 flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white hover:border-slate-700 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span>🔍</span>
            <span>Tìm kiếm nhanh...</span>
          </span>
          <kbd className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-800">
            Ctrl K
          </kbd>
        </button>

        <h3 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Phân Hệ Quản Lý
        </h3>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={() => onCloseMobile?.()}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <span className="flex items-center gap-3 min-w-0">
                  {getNavIcon(item.to)}
                  <span className="truncate">{item.label}</span>
                </span>
                {item.to === '/ai-tutor' && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">AI</span>
                )}
                {item.to === '/hoc-phan' && (
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">Môn học</span>
                )}
                {item.to === '/de-tai' && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">Đề tài</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {}
      <footer className="border-t border-slate-800 bg-slate-950 p-4">
        <button
          onClick={logout}
          aria-label="Đăng xuất khỏi hệ thống"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-[0.98] cursor-pointer"
        >
          <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Đăng xuất hệ thống
        </button>
      </footer>
    </>
  );

  return (
    <>
      {}
      <aside aria-label="Thanh điều hướng ứng dụng" className="hidden lg:flex sticky top-0 h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-100 shadow-xl z-20 shrink-0">
        {renderNavContent()}
      </aside>

      {}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside
            aria-label="Thanh điều hướng di động"
            className="fixed inset-y-0 left-0 flex w-72 flex-col bg-slate-900 text-slate-100 shadow-2xl z-50 animate-drawer"
          >
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
}
