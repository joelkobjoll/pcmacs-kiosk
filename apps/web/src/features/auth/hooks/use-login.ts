import { useState } from 'react';
import { useNavigate } from 'react-router';
import { authApi } from '../api/auth-api';
import { useAuth } from '../auth-context';

interface UseLoginReturn {
  login: (password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useLogin(): UseLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  async function login(password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const { token } = await authApi.login(password);
      setToken(token);
      navigate('/admin/playlist');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error };
}
