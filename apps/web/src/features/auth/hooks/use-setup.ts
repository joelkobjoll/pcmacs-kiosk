import { useState } from 'react';
import { useNavigate } from 'react-router';
import { authApi } from '../api/auth-api';
import { useAuth } from '../auth-context';

interface UseSetupReturn {
  setup: (password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useSetup(): UseSetupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  async function setup(password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await authApi.setup(password);
      setToken(token);
      navigate('/admin/playlist');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  }

  return { setup, isLoading, error };
}
