import { Link } from 'react-router';
import { LoginForm } from '../components/login-form';
import { useLogin } from '../hooks/use-login';

export function LoginPage() {
  const { login, isLoading, error } = useLogin();

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-neutral-800">
          <div className="flex justify-center mb-6">
            <img src="/pcmacs.svg" alt="PC Macs" className="h-14 w-auto" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Signage Admin</h1>
          <p className="text-neutral-400 mt-1 text-sm">Log in to manage your digital displays</p>
        </div>

        <div className="p-8">
          <LoginForm onSubmit={login} isLoading={isLoading} error={error} />

          <div className="mt-6 text-center">
            <Link
              to="/display"
              className="text-sm text-neutral-400 hover:text-white transition-colors underline decoration-neutral-600 underline-offset-4"
            >
              Launch Display Mode (TV)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
