import { execSync } from 'node:child_process';
import { statfsSync } from 'node:fs';
import os from 'node:os';
import type { DeviceStatus } from '../domain/index.js';

function getXrandrResolution(): { width: number; height: number } | null {
  try {
    const output = execSync('xrandr --current', { encoding: 'utf-8', timeout: 5000 });
    for (const line of output.split('\n')) {
      if (!line.includes(' connected ')) continue;
      const match = /(\d+)x(\d+)\+\d+\+\d+/.exec(line);
      if (match) {
        return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
      }
    }
    return null;
  } catch {
    return null;
  }
}

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

    const resolution = getXrandrResolution();

    const networkInterfaces = Object.entries(os.networkInterfaces()).flatMap(
      ([name, addresses]) =>
        (addresses ?? []).map((addr) => ({
          name,
          address: addr.address,
          family: addr.family,
          internal: addr.internal,
        })),
    );

    return {
      uptimeSeconds,
      storageUsedBytes,
      storageTotalBytes,
      screenWidth: resolution?.width ?? null,
      screenHeight: resolution?.height ?? null,
      networkInterfaces,
    };
  }
}
