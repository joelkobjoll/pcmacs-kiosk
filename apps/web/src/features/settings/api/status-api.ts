import { api } from '@/shared/hooks/use-api';
import type { DeviceStatus } from '@/shared/types/api';

export const statusApi = {
  get(): Promise<DeviceStatus> {
    return api.get<DeviceStatus>('/status');
  },
};
