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

function getMacOsWifiInterface(): string | null {
  const output = execSafe('networksetup -listallhardwareports');
  if (!output) return null;

  const lines = output.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    // Match: "Hardware Port: Wi-Fi" or "Hardware Port: AirPort" or "Hardware Port: WLAN"
    if (line.includes('hardware port') && (line.includes('wi-fi') || line.includes('airport') || line.includes('wlan'))) {
      // Look for "Device: enX" in the next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const deviceMatch = /Device:\s*(\S+)/.exec(lines[j]);
        if (deviceMatch) return deviceMatch[1];
      }
    }
  }
  return null;
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
    // Check /sys for wireless (Linux)
    readFileSync(`/sys/class/net/${iface}/wireless`);
    return true;
  } catch {
    // Linux fallback: try iwgetid
    const ssid = execSafe(`iwgetid ${iface} -r`);
    if (ssid !== null) return true;

    // macOS: use networksetup to check if this is a WiFi interface
    const networksetupOutput = execSafe(`networksetup -getairportnetwork ${iface}`);
    if (networksetupOutput) {
      // If it returns anything OTHER than these error phrases, it's WiFi
      const lower = networksetupOutput.toLowerCase();
      const isError =
        lower.includes('not a wi-fi interface') ||
        lower.includes('not associated') ||
        lower.includes('unable to retrieve') ||
        lower.includes('error');

      // Also check if it looks like a valid response (contains the interface name and a network)
      const looksValid = networksetupOutput.includes(':') || networksetupOutput.length > 3;

      if (!isError && looksValid) return true;
    }

    // macOS fallback: check ifconfig for wireless media
    const ifconfigOutput = execSafe(`ifconfig ${iface}`);
    if (ifconfigOutput) {
      const lower = ifconfigOutput.toLowerCase();
      if (lower.includes('ieee80211') || lower.includes('wl')) return true;
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

function bandFromFrequency(mhz: number): import('../domain/index.js').WifiBand {
  if (mhz >= 2400 && mhz <= 2500) return '2.4 GHz';
  if (mhz >= 4900 && mhz <= 5900) return '5 GHz';
  if (mhz >= 5925 && mhz <= 7125) return '6 GHz';
  return 'Unknown';
}

function bandFromChannel(channel: number): import('../domain/index.js').WifiBand {
  if (channel >= 1 && channel <= 14) return '2.4 GHz';
  if (channel >= 36 && channel <= 165) return '5 GHz';
  return 'Unknown';
}

function getWifiInfo(iface: string): { ssid?: string; signalQuality?: SignalQuality; signalDbm?: number; band?: import('../domain/index.js').WifiBand; linkSpeed?: string } {
  const info: { ssid?: string; signalQuality?: SignalQuality; signalDbm?: number; band?: import('../domain/index.js').WifiBand; linkSpeed?: string } = {};

  // Try iwgetid for SSID
  const ssid = execSafe(`iwgetid ${iface} -r`);
  if (ssid) info.ssid = ssid;

  // Try iw dev for signal level and frequency
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
    const freqMatch = /freq:\s*(\d+)/.exec(iwOutput);
    if (freqMatch) {
      info.band = bandFromFrequency(parseInt(freqMatch[1], 10));
    }
    const bitrateMatch = /rx bitrate:\s*(.+)/.exec(iwOutput);
    if (bitrateMatch) {
      info.linkSpeed = bitrateMatch[1].trim();
    }
    // Also try to extract SSID from iw if iwgetid failed
    if (!info.ssid) {
      const ssidMatch = /SSID:\s*(.+)/.exec(iwOutput);
      if (ssidMatch) info.ssid = ssidMatch[1].trim();
    }
  }

  // macOS: try networksetup first (more reliable than airport)
  const networksetupSsid = execSafe(`networksetup -getairportnetwork ${iface}`);
  if (networksetupSsid) {
    // Handle formats:
    // "Current Wi-Fi Network: MyNetworkName"
    // "MyNetworkName" (older macOS without prefix)
    // "You are not associated with an AirPort network." (not connected)
    const lower = networksetupSsid.toLowerCase();

    // Skip error/disconnected messages
    const isDisconnected =
      lower.includes('not associated') ||
      lower.includes('not a wi-fi') ||
      lower.includes('power is currently off') ||
      lower.includes('unable to retrieve');

    if (!isDisconnected) {
      // Try to extract SSID - could be "Current Wi-Fi Network: Name" or just "Name"
      const match = /(?:Current Wi-Fi Network:\s*)?(.+)/.exec(networksetupSsid);
      if (match) {
        const ssid = match[1].trim();
        if (ssid.length > 0 && !ssid.toLowerCase().includes('error')) {
          info.ssid = ssid;
        }
      }
    }
  }

  // macOS fallback via airport tool (may be missing on some versions)
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
    if (!info.band) {
      const channelMatch = /channel:\s*(\d+)/.exec(airportOutput);
      if (channelMatch) {
        info.band = bandFromChannel(parseInt(channelMatch[1], 10));
      }
    }
    if (!info.linkSpeed) {
      const lastTxRateMatch = /lastTxRate:\s*(\d+)/.exec(airportOutput);
      if (lastTxRateMatch) {
        info.linkSpeed = `${lastTxRateMatch[1]} Mbps`;
      }
    }
  }

  // macOS: fallback signal info via system_profiler if airport is unavailable
  if (!info.signalQuality) {
    const systemProfilerOutput = execSafe('system_profiler SPAirPortDataType');
    if (systemProfilerOutput) {
      // Try to find the active interface's signal info
      const sections = systemProfilerOutput.split(/\n\s*\n/);
      for (const section of sections) {
        if (!section.includes(iface)) continue;
        const rssiMatch = /Signal \/? Noise:\s*([-\d]+)/.exec(section);
        if (rssiMatch) {
          const dbm = parseInt(rssiMatch[1], 10);
          info.signalDbm = dbm;
          const percent = Math.max(0, Math.min(100, 2 * (dbm + 100)));
          info.signalQuality = parseSignalQuality(percent);
        }
        const channelMatch = /Channel:\s*(\d+)/.exec(section);
        if (channelMatch && !info.band) {
          info.band = bandFromChannel(parseInt(channelMatch[1], 10));
        }
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

  // macOS: find WiFi interface
  let wifiIface: string | null = null;
  if (process.platform === 'darwin') {
    wifiIface = getMacOsWifiInterface();
  }

  // If WiFi interface matches default route, it's definitely WiFi
  if (wifiIface && wifiIface === iface) {
    const wifiInfo = getWifiInfo(wifiIface);
    return {
      isConnected: true,
      interfaceName: wifiIface,
      type: 'wifi',
      ipAddress: getInterfaceIp(wifiIface),
      ssid: wifiInfo.ssid ?? 'Unknown Network',
      signalQuality: wifiInfo.signalQuality,
      signalDbm: wifiInfo.signalDbm,
      band: wifiInfo.band,
      linkSpeed: wifiInfo.linkSpeed,
    };
  }

  // If WiFi is a different interface but connected, show WiFi
  if (wifiIface && wifiIface !== iface) {
    const wifiInfo = getWifiInfo(wifiIface);
    if (wifiInfo.ssid) {
      return {
        isConnected: true,
        interfaceName: wifiIface,
        type: 'wifi',
        ipAddress: getInterfaceIp(wifiIface),
        ssid: wifiInfo.ssid,
        signalQuality: wifiInfo.signalQuality,
        signalDbm: wifiInfo.signalDbm,
        band: wifiInfo.band,
        linkSpeed: wifiInfo.linkSpeed,
      };
    }
  }

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
      band: wifiInfo.band,
      linkSpeed: wifiInfo.linkSpeed,
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
