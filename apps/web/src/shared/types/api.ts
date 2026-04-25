export interface ApiError {
  message: string;
  status: number;
}

export interface ApiResponse<T> {
  data: T;
}

export type SlideSourceType = 'image' | 'video' | 'youtube' | 'google_slides' | 'website';
export type TransitionType =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'zoom-fade'
  | 'ken-burns';

export interface Slide {
  id: number;
  title: string;
  sourceType: SlideSourceType;
  url: string;
  durationMs: number;
  transitionIn: TransitionType;
  isActive: boolean;
  sortOrder: number;
  slideCount: number;
  slideDurationMs: number;
  /** YouTube only: start playback at this second */
  ytStartSeconds: number;
  /** YouTube only: stop at this second. null = play to end and auto-advance */
  ytEndSeconds: number | null;
  /** Whether the video plays muted (youtube and video types) */
  muted: boolean;
  /** Optional URL to show as QR code overlay on the display */
  qrUrl: string | null;
  /** Daily display window start "HH:MM" 24h. null = no restriction */
  scheduleStart: string | null;
  /** Daily display window end "HH:MM" 24h. null = no restriction */
  scheduleEnd: string | null;
  /** Days of week to show (0=Sun…6=Sat). null = every day */
  scheduleDays: number[] | null;
}

export interface Settings {
  defaultDurationMs: number;
  defaultTransition: TransitionType;
  autoReload: boolean;
  offlineFallback: boolean;
  googleApiKey: string;
}

export interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

export interface SetupStatus {
  isSetup: boolean;
  localIp: string;
}

export type NetworkType = 'wifi' | 'ethernet' | 'unknown';
export type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface NetworkStatus {
  isConnected: boolean;
  interfaceName: string;
  type: NetworkType;
  ipAddress: string;
  ssid?: string;
  signalQuality?: SignalQuality;
  signalDbm?: number;
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

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}
