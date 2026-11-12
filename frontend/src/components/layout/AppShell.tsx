import { ReactNode, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABEL } from '../../lib/roles';
import { ThongBao, VaiTro } from '../../lib/api';

import { AcademicStore, ACADEMIC_STATE_EVENT } from '../../lib/academicStore';
import { getAvatarForUser, AVATAR_UPDATED_EVENT, useUploadedAvatar } from '../../lib/avatarService';

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  link?: string;
  roles?: VaiTro[];
}

function nhanThoiGian(iso: string): string {
  const moc = new Date(iso).getTime();
  if (Number.isNaN(moc)) return '';
  const phut = Math.floor((Date.now() - moc) / 60000);
  if (phut < 1) return 'Vừa xong';
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.floor(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.floor(gio / 24);
  return ngay < 30 ? `${ngay} ngày trước` : new Date(iso).toLocaleDateString('vi-VN');
}

const KIEU_THEO_LOAI: Record<string, NotificationItem['type']> = {
  DeTai: 'info',
  DonHocVu: 'warning',
  TuyenSinh: 'info',
  HoiDong: 'success',
  BaiBao: 'success',
  HeThong: 'info',
};

function mapThongBao(tb: ThongBao): NotificationItem {
  return {
    id: tb.maTb,
    title: tb.tieuDe,
    desc: tb.noiDung,
    time: nhanThoiGian(tb.thoiGian),
    type: KIEU_THEO_LOAI[tb.loaiTb] || 'info',
    read: tb.daDoc,
    link: tb.duongDan,
  };
}

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRole: VaiTro = user?.vaiTro || 'HocVien';

  const [avatarUrl, setAvatarUrl] = useState(user?.hocVien?.anhDaiDienUrl);
  const uploadedAvatar = useUploadedAvatar(avatarUrl);
  const [legacyAvatar, setLegacyAvatar] = useState<string | null>(() => getAvatarForUser(user?.email));
  const userAvatar = uploadedAvatar || legacyAvatar;
  useEffect(() => {
    setAvatarUrl(user?.hocVien?.anhDaiDienUrl);
    setLegacyAvatar(getAvatarForUser(user?.email));
    const updateAvatar = (event: Event) => {
      const detail = (event as CustomEvent<{ email?: string; url?: string; avatar?: string }>).detail;
      if (detail?.email && detail.email !== user?.email?.toLowerCase()) return;
      if (detail?.url) setAvatarUrl(detail.url);
      if (detail?.avatar) setLegacyAvatar(detail.avatar);
    };
    window.addEventListener(AVATAR_UPDATED_EVENT, updateAvatar);
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, updateAvatar);
  }, [user?.maNd]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const taiThongBao = async () => {
    try {
      const list = await AcademicStore.fetchNotifications(30);
      setNotifications(list.map(mapThongBao));
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    taiThongBao();

    const controller = new AbortController();
    const token = localStorage.getItem('accessToken');
    if (token) {
      void fetch('/api/v1/notification/stream', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok || !response.body) return;
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        try {
          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            const frames = (buffer + value).split('\n\n');
            buffer = frames.pop() || '';
            if (frames.some((frame) => frame.startsWith('data:'))) void taiThongBao();
          }
        } finally {
          reader.releaseLock();
        }
      }).catch(() => { /* periodic refresh also covers disconnected streams */ });
    }
    const refreshTimer = window.setInterval(taiThongBao, 60_000);
    window.addEventListener('focus', taiThongBao);

    const handleAcademicChange = (e: any) => {
      if (e?.detail?.topic === 'notification') return;
      taiThongBao();
    };
    window.addEventListener(ACADEMIC_STATE_EVENT, handleAcademicChange);
    return () => {
      window.removeEventListener(ACADEMIC_STATE_EVENT, handleAcademicChange);
      controller.abort();
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', taiThongBao);
    };
  }, [user?.maNd]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayedNotifications = notifications.filter((n) =>
    notificationFilter === 'unread' ? !n.read : true,
  );

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await AcademicStore.markAllNotificationsRead();
    } catch {
      taiThongBao();
    }
  };

  const markSingleAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await AcademicStore.markNotificationRead(id);
    } catch {
      taiThongBao();
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markSingleAsRead(item.id);
    if (item.link) {
      setShowNotifications(false);
      navigate(item.link);
    }
  };

  return (
    <div id="app-root" className="flex min-h-screen bg-slate-50">
      {}
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      {}
      <div className="flex flex-1 flex-col min-w-0">
        {}
        <header role="banner" className="sticky top-0 z-10 flex flex-wrap items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 py-3 backdrop-blur-md gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0"
              aria-label="Mở danh mục điều hướng"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <hgroup className="min-w-0">
              <h1 className="font-sans text-base sm:text-lg lg:text-xl font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md lg:max-w-none">{title}</h1>
              {subtitle && <p className="mt-0.5 text-xs font-normal text-slate-500 line-clamp-1">{subtitle}</p>}
            </hgroup>
          </div>

          <aside aria-label="Thông tin nhanh tài khoản" className="flex items-center gap-2.5 sm:gap-3.5">
            {}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative flex items-center justify-center rounded-xl border p-2 transition-all cursor-pointer shadow-2xs ${
                  showNotifications
                    ? 'border-blue-500 bg-blue-50/60 text-blue-700 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={`Thông báo học vụ (${unreadCount} chưa đọc)`}
              >
                <span className="text-base leading-none">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-xs border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {}
              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-84 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 animate-modal overflow-hidden">
                  {}
                  <header className="border-b border-slate-100 bg-slate-50/90 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-xs font-bold text-slate-900">
                          Thông Báo Học Vụ
                        </span>
                        <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.2">
                          {currentRole === 'HocVien' ? 'NCS' : currentRole === 'GiangVien' ? 'GVHD' : 'Admin'}
                        </span>
                      </div>

                      {unreadCount > 0 ? (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>✓</span>
                          <span>Đánh dấu tất cả đã đọc</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <span>✓</span>
                          <span>Đã đọc hết</span>
                        </span>
                      )}
                    </div>

                    {}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex rounded-lg bg-slate-200/70 p-0.5 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setNotificationFilter('all')}
                          className={`rounded-md px-2.5 py-0.5 transition-all cursor-pointer ${
                            notificationFilter === 'all'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Tất cả ({notifications.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotificationFilter('unread')}
                          className={`rounded-md px-2.5 py-0.5 transition-all cursor-pointer ${
                            notificationFilter === 'unread'
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Chưa đọc ({unreadCount})
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">
                        {ROLE_LABEL[currentRole]}
                      </span>
                    </div>
                  </header>

                  {}
                  <ul className="max-h-84 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {displayedNotifications.map((n) => (
                      <li
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`group relative p-3.5 transition-colors hover:bg-slate-50 cursor-pointer ${
                          !n.read ? 'bg-blue-50/50' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {}
                          {!n.read && (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600 shadow-xs ring-2 ring-blue-200 animate-pulse"
                              title="Chưa đọc"
                            />
                          )}

                          <span className="text-base shrink-0">
                            {n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : '📢'}
                          </span>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className={`truncate text-xs ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-1">
                                {n.time}
                              </span>
                            </div>

                            <p className="text-slate-600 leading-relaxed line-clamp-2 text-[11px]">
                              {n.desc}
                            </p>

                            <div className="flex items-center justify-between pt-1">
                              {n.link ? (
                                <span className="text-[10px] font-bold text-blue-600 group-hover:underline">
                                  Bấm để xử lý ngay →
                                </span>
                              ) : <span />}

                              {!n.read && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markSingleAsRead(n.id);
                                  }}
                                  className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors px-1 py-0.5 rounded"
                                  title="Đánh dấu đã đọc thông báo này"
                                >
                                  ✓ Đã đọc
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}

                    {displayedNotifications.length === 0 && (
                      <li className="p-8 text-center text-xs text-slate-400 space-y-1.5">
                        <span className="text-2xl block">🎉</span>
                        <p className="font-semibold text-slate-700">
                          {notificationFilter === 'unread'
                            ? 'Bạn đã đọc hết tất cả thông báo!'
                            : 'Không có thông báo nào'}
                        </p>
                      </li>
                    )}
                  </ul>

                  {}
                  <footer className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={taiThongBao}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer font-medium"
                      title="Tải lại thông báo mới nhất từ máy chủ"
                    >
                      🔄 Làm mới
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </footer>
                </div>
              )}
            </div>

            {}
            {user && (
              <figure className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-2xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white overflow-hidden ring-1 ring-blue-300 shrink-0">
                  {userAvatar ? (
                    <img src={userAvatar} alt={user.hoTen} className="h-full w-full object-cover" />
                  ) : (
                    user.hoTen.charAt(0)
                  )}
                </div>
                <figcaption className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                  {user.hoTen}
                </figcaption>
              </figure>
            )}
          </aside>
        </header>

        {}
        <main id="main-content" className="flex-1 p-6 sm:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
