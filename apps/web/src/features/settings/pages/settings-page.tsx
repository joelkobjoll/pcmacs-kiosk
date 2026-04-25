import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { KeyRound, Monitor, Smartphone, Wifi, EthernetPort } from 'lucide-react';
import type { NetworkStatus } from '@/shared/types/api';
import { ChangePasswordForm } from '../components/change-password-form';
import { SettingsForm } from '../components/settings-form';
import { useDeviceStatus } from '../hooks/use-device-status';
import { useSettings } from '../hooks/use-settings';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function getSignalDbmColor(dbm: number): string {
  if (dbm >= -50) return 'text-emerald-400';
  if (dbm >= -65) return 'text-blue-400';
  if (dbm >= -80) return 'text-amber-400';
  return 'text-red-400';
}

function NetworkCard({ network }: { network: NetworkStatus }) {
  const statusColor = network.isConnected ? 'bg-emerald-500' : 'bg-red-500';
  const statusLabel = network.isConnected ? 'Connected' : 'Disconnected';

  const typeIcon = network.type === 'wifi' ? (
    <Wifi className="w-4 h-4 text-blue-400" />
  ) : network.type === 'ethernet' ? (
    <EthernetPort className="w-4 h-4 text-blue-400" />
  ) : null;

  const typeLabel = network.type === 'wifi' && network.ssid
    ? network.band
      ? `WiFi: ${network.ssid} (${network.band})`
      : `WiFi: ${network.ssid}`
    : network.type === 'wifi'
    ? 'WiFi'
    : network.type === 'ethernet'
    ? 'Ethernet'
    : network.interfaceName !== 'unknown'
    ? network.interfaceName
    : 'No connection';

  const subtitle = network.type === 'wifi' && network.signalQuality
    ? network.signalDbm !== undefined
      ? `${network.signalDbm} dBm \u00b7 ${network.signalQuality.charAt(0).toUpperCase() + network.signalQuality.slice(1)} signal${network.linkSpeed ? ` \u00b7 ${network.linkSpeed}` : ''}`
      : `${network.signalQuality.charAt(0).toUpperCase() + network.signalQuality.slice(1)} signal${network.linkSpeed ? ` \u00b7 ${network.linkSpeed}` : ''}`
    : network.type === 'ethernet' && network.linkSpeed
    ? network.linkSpeed
    : null;

  const signalColor = network.type === 'wifi' && network.signalDbm !== undefined
    ? getSignalDbmColor(network.signalDbm)
    : 'text-neutral-500';

  return (
    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
          Network
        </p>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-neutral-400">{statusLabel}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {typeIcon && (
          <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center border border-neutral-800">
            {typeIcon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-200">{typeLabel}</p>
          <p className="font-mono text-xs text-neutral-400">{network.ipAddress}</p>
          {subtitle && (
            <p className={`text-xs mt-0.5 ${signalColor}`}>{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { settings, isLoading, updateSettings } = useSettings();
  const { status: deviceStatus, isLoading: statusLoading } = useDeviceStatus();

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const screenLabel =
    deviceStatus?.screenWidth && deviceStatus?.screenHeight
      ? `${deviceStatus.screenWidth}×${deviceStatus.screenHeight}`
      : typeof window !== 'undefined'
        ? `${window.screen.width}×${window.screen.height}`
        : '—';

  const storageFreeBytes = deviceStatus
    ? deviceStatus.storageTotalBytes - deviceStatus.storageUsedBytes
    : 0;

  const stats = [
    {
      label: 'Storage Used',
      value: deviceStatus ? formatBytes(deviceStatus.storageUsedBytes) : '—',
      sub: deviceStatus ? `${formatBytes(storageFreeBytes)} free` : 'Loading…',
      color: 'text-emerald-400',
    },
    {
      label: 'Uptime',
      value: deviceStatus ? formatUptime(deviceStatus.uptimeSeconds) : '—',
      sub: 'Since last reboot',
      color: 'text-neutral-400',
    },
    {
      label: 'Screen',
      value: screenLabel,
      sub: `${window.screen.colorDepth}-bit colour`,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-400" />
            Display Settings
          </CardTitle>
          <CardDescription>Configure default behaviour for the TV player</CardDescription>
        </CardHeader>
        <SettingsForm settings={settings} onSave={updateSettings} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            Change Password
          </CardTitle>
          <CardDescription>Update the admin password for this kiosk</CardDescription>
        </CardHeader>
        <ChangePasswordForm />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-neutral-400" />
            Device Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center gap-2 text-neutral-500 text-sm">
              <div className="w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-neutral-950 p-4 rounded-xl border border-neutral-800"
                  >
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className={`text-xs mt-1 ${stat.color}`}>{stat.sub}</p>
                  </div>
                ))}
              </div>

              {deviceStatus && (
                <NetworkCard network={deviceStatus.networkStatus} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
