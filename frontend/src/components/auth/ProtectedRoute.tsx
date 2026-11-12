import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { VaiTro } from '../../lib/api';

export function ProtectedRoute({ children, allow }: { children: JSX.Element; allow?: VaiTro[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/dang-nhap" state={{ from: location }} replace />;
  }

  if (allow && !allow.includes(user.vaiTro)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
