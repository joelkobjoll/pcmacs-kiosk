import type { DeviceStatus } from '@/shared/types/api';
import { useEffect, useState } from 'react';
import { statusApi } from '../api/status-api';

export function useDeviceStatus() {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statusApi
      .get()
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setIsLoading(false));
  }, []);

  return { status, isLoading };
}
