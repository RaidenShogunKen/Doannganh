import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { authApi, CurrentUser, VaiTro } from '../lib/api';

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, matKhau: string) => Promise<void>;
  register: (data: { hoTen: string; email: string; matKhau: string; vaiTro?: VaiTro }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    let active = true;
    void authApi.me().then(({ data }) => {
      if (active && localStorage.getItem('accessToken') === token) persist({ accessToken: token, user: data });
    }).catch(() => {
      if (!active || localStorage.getItem('accessToken') !== token) return;
      try {
        setUser(JSON.parse(localStorage.getItem('user') || 'null'));
      } catch {
        logout();
      }
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  function persist(res: { accessToken: string; user: CurrentUser }) {
    const cleanedUser = {
      ...res.user,
      hoTen: res.user.hoTen.replace(/\s*\((NCS|Admin|GV)\)\s*$/i, '').trim(),
    };
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('user', JSON.stringify(cleanedUser));
    setUser(cleanedUser);
  }

  async function login(email: string, matKhau: string) {
    const { data } = await authApi.login(email.trim(), matKhau);
    persist(data);
  }

  async function register(payload: { hoTen: string; email: string; matKhau: string; vaiTro?: VaiTro }) {
    const { data } = await authApi.register(payload);
    persist(data);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được gọi bên trong <AuthProvider>');
  return ctx;
}
