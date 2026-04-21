import { useAuth } from '@/features/auth/auth-context';
import { Navigate, Outlet } from 'react-router';

export function AuthGuard() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}
