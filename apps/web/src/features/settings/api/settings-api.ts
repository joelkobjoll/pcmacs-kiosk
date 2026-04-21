import { api } from '@/shared/hooks/use-api';
import type { Settings } from '@/shared/types/api';

export const settingsApi = {
  get(): Promise<Settings> {
    return api.get<Settings>('/settings');
  },

  update(settings: Partial<Settings>): Promise<Settings> {
    return api.patch<Settings>('/settings', settings);
  },
};
