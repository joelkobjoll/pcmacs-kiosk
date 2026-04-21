import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { KeyRound, Save } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useChangePassword } from '../hooks/use-change-password';

export function ChangePasswordForm() {
  const { changePassword, isLoading, error } = useChangePassword();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setLocalError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirm) {
      setLocalError('Passwords do not match');
      return;
    }
    setLocalError(null);
    const ok = await changePassword(oldPassword, newPassword);
    if (ok) {
      setOldPassword('');
      setNewPassword('');
      setConfirm('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  const displayError = localError ?? error;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="oldPassword">Current Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            id="oldPassword"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Enter current password"
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            id="confirmPassword"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password"
            className="pl-10"
            required
          />
        </div>
      </div>

      {displayError && <p className="text-sm text-red-400">{displayError}</p>}
      {success && <p className="text-sm text-emerald-400">Password changed successfully!</p>}

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving…' : 'Change Password'}
        </Button>
      </div>
    </form>
  );
}
