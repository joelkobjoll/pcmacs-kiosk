import type { Settings } from '@/shared/types/api';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { settingsApi } from '../api/settings-api';

interface UseSettingsReturn {
  settings: Settings | null;
  isLoading: boolean;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    settingsApi
      .get()
      .then(setSettings)
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setIsLoading(false));
  }, []);

  const updateSettings = useCallback(async (partial: Partial<Settings>) => {
    try {
      const updated = await settingsApi.update(partial);
      setSettings(updated);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  }, []);

  return { settings, isLoading, updateSettings };
}
