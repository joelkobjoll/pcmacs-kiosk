import { type ReactNode, createContext, useContext, useState } from 'react';

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('auth_token'));

  function setToken(newToken: string) {
    localStorage.setItem('auth_token', newToken);
    setTokenState(newToken);
  }

  function clearToken() {
    localStorage.removeItem('auth_token');
    setTokenState(null);
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, setToken, clearToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
