export type NetworkType = 'wifi' | 'ethernet' | 'unknown';
export type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor';

export type WifiBand = '2.4 GHz' | '5 GHz' | '6 GHz' | 'Unknown';

export interface NetworkStatus {
  isConnected: boolean;
  interfaceName: string;
  type: NetworkType;
  ipAddress: string;
  ssid?: string;
  signalQuality?: SignalQuality;
  signalDbm?: number;
  linkSpeed?: string;
  band?: WifiBand;
}

export interface DeviceStatus {
  uptimeSeconds: number;
  storageUsedBytes: number;
  storageTotalBytes: number;
  screenWidth: number | null;
  screenHeight: number | null;
  networkStatus: NetworkStatus;
}
