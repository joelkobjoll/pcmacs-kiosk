import { execSync } from 'node:child_process';
import { readFileSync, statfsSync } from 'node:fs';
import os from 'node:os';
import type { DeviceStatus, NetworkStatus, SignalQuality } from '../domain/index.js';

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

function execSafe(command: string, timeout = 3000): string | null {
  try {
    return execSync(command, { encoding: 'utf-8', timeout }).trim();
  } catch {
    return null;
  }
}

function parseSignalQuality(level: number): SignalQuality {
  if (level >= 70) return 'excellent';
  if (level >= 50) return 'good';
  if (level >= 30) return 'fair';
  return 'poor';
}

function getDefaultRouteInterface(): string | null {
  // Linux: ip route get 1.1.1.1
  const linuxRoute = execSafe('ip route get 1.1.1.1');
  if (linuxRoute) {
    const match = /dev\s+(\S+)/.exec(linuxRoute);
    if (match) return match[1];
  }

  // macOS / BSD: route -n get default
  const bsdRoute = execSafe('route -n get default');
  if (bsdRoute) {
    const match = /interface:\s*(\S+)/.exec(bsdRoute);
    if (match) return match[1];
  }

  return null;
}

function isWirelessInterface(iface: string): boolean {
  try {
    // Check /sys for wireless
    readFileSync(`/sys/class/net/${iface}/wireless`);
    return true;
  } catch {
    // Fallback: try iwgetid
    const ssid = execSafe(`iwgetid ${iface} -r`);
    if (ssid !== null) return true;

    // macOS fallback
    const networksetupOutput = execSafe(`networksetup -getairportnetwork ${iface}`);
    if (networksetupOutput !== null && !networksetupOutput.includes('not a Wi-Fi interface')) {
      return true;
    }

    return false;
  }
}

function getInterfaceState(iface: string): 'up' | 'down' | 'unknown' {
  // Linux
  const state = execSafe(`cat /sys/class/net/${iface}/operstate`);
  if (state === 'up') return 'up';
  if (state === 'down') return 'down';

  // macOS
  const ifconfigOutput = execSafe(`ifconfig ${iface}`);
  if (ifconfigOutput) {
    if (ifconfigOutput.includes('status: active')) return 'up';
    if (ifconfigOutput.includes('status: inactive')) return 'down';
  }

  return 'unknown';
}

function getInterfaceIp(iface: string): string {
  const interfaces = os.networkInterfaces();
  const addrs = interfaces[iface];
  if (!addrs) return '127.0.0.1';
  for (const addr of addrs) {
    if (addr.family === 'IPv4' && !addr.internal) {
      return addr.address;
    }
  }
  return '127.0.0.1';
}

function getWifiInfo(iface: string): { ssid?: string; signalQuality?: SignalQuality; signalDbm?: number } {
  const info: { ssid?: string; signalQuality?: SignalQuality; signalDbm?: number } = {};

  // Try iwgetid for SSID
  const ssid = execSafe(`iwgetid ${iface} -r`);
  if (ssid) info.ssid = ssid;

  // Try iw dev for signal level
  const iwOutput = execSafe(`iw dev ${iface} link`);
  if (iwOutput) {
    const signalMatch = /signal:\s*([-\d]+)/.exec(iwOutput);
    if (signalMatch) {
      const dbm = parseInt(signalMatch[1], 10);
      info.signalDbm = dbm;
      // Convert dBm to approximate percentage (typical range: -30 to -90)
      const percent = Math.max(0, Math.min(100, 2 * (dbm + 100)));
      info.signalQuality = parseSignalQuality(percent);
    }
    // Also try to extract SSID from iw if iwgetid failed
    if (!info.ssid) {
      const ssidMatch = /SSID:\s*(.+)/.exec(iwOutput);
      if (ssidMatch) info.ssid = ssidMatch[1].trim();
    }
  }

  // macOS fallback
  const airportOutput = execSafe('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I');
  if (airportOutput) {
    if (!info.ssid) {
      const ssidMatch = /\s*SSID:\s*(.+)/.exec(airportOutput);
      if (ssidMatch) info.ssid = ssidMatch[1].trim();
    }
    if (!info.signalQuality) {
      const agrCtlRssiMatch = /agrCtlRSSI:\s*([-\d]+)/.exec(airportOutput);
      if (agrCtlRssiMatch) {
        const dbm = parseInt(agrCtlRssiMatch[1], 10);
        info.signalDbm = dbm;
        const percent = Math.max(0, Math.min(100, 2 * (dbm + 100)));
        info.signalQuality = parseSignalQuality(percent);
      }
    }
  }

  return info;
}

function getEthernetSpeed(iface: string): string | undefined {
  const ethtoolOutput = execSafe(`ethtool ${iface}`);
  if (ethtoolOutput) {
    const speedMatch = /Speed:\s*(\S+)/.exec(ethtoolOutput);
    if (speedMatch) return speedMatch[1];
  }
  return undefined;
}

function getNetworkStatus(): NetworkStatus {
  const iface = getDefaultRouteInterface();

  if (!iface) {
    return {
      isConnected: false,
      interfaceName: 'unknown',
      type: 'unknown',
      ipAddress: '127.0.0.1',
    };
  }

  const state = getInterfaceState(iface);
  const isConnected = state === 'up';
  const ipAddress = getInterfaceIp(iface);

  if (!isConnected) {
    return {
      isConnected: false,
      interfaceName: iface,
      type: 'unknown',
      ipAddress,
    };
  }

  const wireless = isWirelessInterface(iface);

  if (wireless) {
    const wifiInfo = getWifiInfo(iface);
    return {
      isConnected: true,
      interfaceName: iface,
      type: 'wifi',
      ipAddress,
      ssid: wifiInfo.ssid,
      signalQuality: wifiInfo.signalQuality,
      signalDbm: wifiInfo.signalDbm,
    };
  }

  return {
    isConnected: true,
    interfaceName: iface,
    type: 'ethernet',
    ipAddress,
    linkSpeed: getEthernetSpeed(iface),
  };
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
    const networkStatus = getNetworkStatus();

    return {
      uptimeSeconds,
      storageUsedBytes,
      storageTotalBytes,
      screenWidth: resolution?.width ?? null,
      screenHeight: resolution?.height ?? null,
      networkStatus,
    };
  }
}
