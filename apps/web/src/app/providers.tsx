import { AuthProvider } from '@/features/auth/auth-context';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster theme="dark" position="top-right" richColors />
    </AuthProvider>
  );
}
