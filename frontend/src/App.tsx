import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CommandPalette } from './components/ui/CommandPalette';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeTaiPage } from './pages/DeTaiPage';
import { HoSoPage } from './pages/HoSoPage';

const HocPhanPage = lazy(() => import('./pages/HocPhanPage').then((module) => ({ default: module.HocPhanPage })));
const DeTaiDetailPage = lazy(() => import('./pages/DeTaiDetailPage').then((module) => ({ default: module.DeTaiDetailPage })));
const HoiDongPage = lazy(() => import('./pages/HoiDongPage').then((module) => ({ default: module.HoiDongPage })));
const PlagiarismCheckPage = lazy(() => import('./pages/PlagiarismCheckPage').then((module) => ({ default: module.PlagiarismCheckPage })));
const AnalyticsDashboardPage = lazy(() => import('./pages/AnalyticsDashboardPage').then((module) => ({ default: module.AnalyticsDashboardPage })));
const AiTutorPage = lazy(() => import('./pages/AiTutorPage').then((module) => ({ default: module.AiTutorPage })));
const NguoiDungPage = lazy(() => import('./pages/NguoiDungPage').then((module) => ({ default: module.NguoiDungPage })));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CommandPalette />
          <Suspense fallback={<p role="status" className="p-6 text-sm text-slate-700">Đang mở trang…</p>}>
          <Routes>
            <Route path="/dang-nhap" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hoc-phan"
            element={
              <ProtectedRoute>
                <HocPhanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/de-tai"
            element={
              <ProtectedRoute>
                <DeTaiPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/de-tai/:maDt"
            element={
              <ProtectedRoute>
                <DeTaiDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ho-so"
            element={
              <ProtectedRoute>
                <HoSoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hoi-dong"
            element={
              <ProtectedRoute>
                <HoiDongPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-tutor"
            element={
              <ProtectedRoute>
                <AiTutorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kiem-tra-dao-van"
            element={
              <ProtectedRoute>
                <PlagiarismCheckPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plagiarism-check"
            element={
              <ProtectedRoute>
                <PlagiarismCheckPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nguoi-dung"
            element={
              <ProtectedRoute allow={['Admin']}>
                <NguoiDungPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics-dashboard"
            element={
              <ProtectedRoute allow={['Admin']}>
                <AnalyticsDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
