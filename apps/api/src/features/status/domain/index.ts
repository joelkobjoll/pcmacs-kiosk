export type NetworkType = 'wifi' | 'ethernet' | 'unknown';
export type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface NetworkStatus {
  isConnected: boolean;
  interfaceName: string;
  type: NetworkType;
  ipAddress: string;
  ssid?: string;
  signalQuality?: SignalQuality;
  linkSpeed?: string;
}

export interface DeviceStatus {
  uptimeSeconds: number;
  storageUsedBytes: number;
  storageTotalBytes: number;
  screenWidth: number | null;
  screenHeight: number | null;
  networkStatus: NetworkStatus;
}
