import { authApi } from '@/features/auth/api/auth-api';
import type { SetupStatus } from '@/shared/types/api';
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';

export function SetupGuard() {
  const [status, setStatus] = useState<SetupStatus | null>(null);

  useEffect(() => {
    authApi.getSetupStatus().then(setStatus).catch(console.error);
  }, []);

  if (!status) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!status.isSetup) return <Navigate to="/setup" replace />;
  return <Outlet />;
}
