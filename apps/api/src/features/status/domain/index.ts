export interface DeviceStatus {
  uptimeSeconds: number;
  storageUsedBytes: number;
  storageTotalBytes: number;
  screenWidth: number | null;
  screenHeight: number | null;
  networkInterfaces: { name: string; address: string; family: string; internal: boolean }[];
}
