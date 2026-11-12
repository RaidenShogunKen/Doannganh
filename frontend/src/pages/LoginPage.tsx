import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAxiosError } from 'axios';

export function LoginPage() {
  const { user, login, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [applying, setApplying] = useState(false);
  const [name, setName] = useState('');

  if (user) return <Navigate to={user.vaiTro === 'HocVien' && !user.hocVien ? '/ho-so' : '/'} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (applying) {
        await register({ hoTen: name.trim(), email: email.trim(), matKhau });
        navigate('/ho-so', { replace: true });
        return;
      }
      await login(email, matKhau);
      const dest = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(dest, { replace: true });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setError('Email hoặc mật khẩu không chính xác.');
      } else if (isAxiosError(err) && err.response?.data?.message) {
        const message = err.response.data.message;
        setError(Array.isArray(message) ? message.join('. ') : String(message));
      } else {
        setError('Không thể kết nối máy chủ hoặc thông tin xác thực không hợp lệ.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main aria-label="Màn hình đăng nhập hệ thống" className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {}
      <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="absolute -right-32 -bottom-32 h-[500px] w-[500px] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" aria-hidden="true" />

      <section className="relative w-full max-w-md animate-fade-in z-10">
        {}
        <header className="mb-8 text-center">
          <figure className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 text-white shadow-2xl ring-4 ring-white/10">
            <svg className="h-9 w-9" width="36" height="36" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </figure>
          <hgroup>
            <h1 className="font-sans text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Hệ Thống Quản Lý Đào Tạo
            </h1>
            <p className="mt-2 text-sm text-slate-400 font-medium">
              Cổng Đăng Nhập Xác Thực Đào Tạo Sau Đại Học
            </p>
          </hgroup>
        </header>

        {}
        <article className="rounded-3xl border border-white/15 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-2xl">
          <form onSubmit={handleSubmit} aria-label={applying ? 'Tạo tài khoản dự tuyển' : 'Đăng nhập'} className="space-y-5">
            {applying && <label className="block text-sm font-semibold text-slate-200">Họ và tên
              <input autoComplete="name" minLength={2} maxLength={100} required value={name} onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:outline-blue-500" />
            </label>}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Email Đăng Nhập
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={100}
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 pl-10 text-sm text-white placeholder:text-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="ten@truong.edu.vn"
                />
                <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v15a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2m4 0h2a2 2 0 012 2v4" />
                </svg>
              </div>
            </div>

            <div>
              <label htmlFor="matKhau" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Mật Khẩu
              </label>
              <div className="relative">
                <input
                  id="matKhau"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={applying ? 'new-password' : 'current-password'}
                  minLength={applying ? 8 : undefined}
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
                <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.038 10.038 0 013.682-.743c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div aria-live="polite">
              {error && (
                <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Đang xử lý…' : applying ? 'Tạo tài khoản dự tuyển' : 'Đăng nhập'}
            </button>
            <button type="button" className="block w-full py-2 text-sm font-semibold text-blue-200 underline hover:text-white" disabled={submitting}
              onClick={() => { setApplying(!applying); setError(null); }}>
              {applying ? 'Quay lại đăng nhập' : 'Đăng ký tài khoản dự tuyển'}
            </button>
          </form>
        </article>

        <footer className="mt-6 text-center text-xs text-slate-400">
          <p>Hệ thống Quản lý Đào tạo Sau Đại học © 2026. Tích hợp AI Academic Advisor.</p>
        </footer>
      </section>
    </main>
  );
}
