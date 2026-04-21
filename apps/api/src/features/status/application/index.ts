import { statfsSync } from 'node:fs';
import os from 'node:os';
import type { DeviceStatus } from '../domain/index.js';

export class GetDeviceStatusUseCase {
  execute(): DeviceStatus {
    const uptimeSeconds = os.uptime();

    let storageUsedBytes = 0;
    let storageTotalBytes = 0;
    try {
      const stat = statfsSync('/');
      storageTotalBytes = stat.blocks * stat.bsize;
      storageUsedBytes = (stat.blocks - stat.bfree) * stat.bsize;
    } catch {
      // statfs not available on all platforms (e.g., Windows CI)
    }

    return { uptimeSeconds, storageUsedBytes, storageTotalBytes };
  }
}
