import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { ArrowRight, KeyRound, Shield } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useSetup } from '../hooks/use-setup';

export function SetupPage() {
  const { setup, isLoading, error } = useSetup();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match');
      return;
    }
    setLocalError(null);
    setup(password);
  }

  const displayError = localError ?? error;

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-neutral-800">
          <div className="flex justify-center mb-5">
            <div className="h-14 w-14 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
              <Shield className="h-7 w-7 text-blue-400" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white">First-Time Setup</h1>
          <p className="text-neutral-400 mt-1 text-sm">
            Set an admin password to secure your kiosk
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {displayError && <p className="text-sm text-red-400">{displayError}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Setting up…' : 'Create Password'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
