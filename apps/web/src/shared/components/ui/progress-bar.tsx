import { cn } from '@/shared/utils/cn';

interface ProgressBarProps {
  progress: number; // 0-100
  loaded: number; // bytes
  total: number; // bytes
  speedBps?: number; // bytes/sec
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function formatSpeed(bps: number): string {
  return `${formatBytes(bps)}/s`;
}

export function ProgressBar({ progress, loaded, total, speedBps, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-150 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>
          {formatBytes(loaded)} / {formatBytes(total)}
        </span>
        <span className="font-medium text-white">{Math.round(clamped)}%</span>
        {speedBps !== undefined && speedBps > 0 && <span>{formatSpeed(speedBps)}</span>}
      </div>
    </div>
  );
}
