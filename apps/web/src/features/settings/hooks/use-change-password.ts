import { authApi } from '@/features/auth/api/auth-api';
import { HttpError } from '@/shared/hooks/use-api';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseChangePasswordReturn {
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useChangePassword(): UseChangePasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        await authApi.changePassword(oldPassword, newPassword);
        toast.success('Password changed successfully');
        return true;
      } catch (err) {
        const message =
          err instanceof HttpError && err.status === 401
            ? 'Current password is incorrect'
            : 'Failed to change password';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { changePassword, isLoading, error };
}
