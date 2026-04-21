import { api } from '@/shared/hooks/use-api';
import type { SetupStatus } from '@/shared/types/api';

export const authApi = {
  getSetupStatus(): Promise<SetupStatus> {
    return api.get<SetupStatus>('/setup/status');
  },

  login(password: string): Promise<{ token: string }> {
    return api.post<{ token: string }>('/auth/login', { password });
  },

  setup(password: string): Promise<{ token: string }> {
    return api.post<{ token: string }>('/auth/setup', { password });
  },

  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return api.post<void>('/auth/change-password', { oldPassword, newPassword });
  },
};
