import { Button } from '@/shared/components/ui/button';
import type { MediaItem } from '@/shared/types/api';
import { Image as ImageIcon, Trash2, Video } from 'lucide-react';

interface MediaCardProps {
  item: MediaItem;
  onRemove: (id: number) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaCard({ item, onRemove }: MediaCardProps) {
  const isImage = item.mimeType.startsWith('image/');

  return (
    <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 group">
      <div className="aspect-video relative bg-neutral-800">
        {isImage ? (
          <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500">
            <Video className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur text-white text-xs font-medium rounded">
          {isImage ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
          {isImage ? 'image' : 'video'}
        </div>
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onRemove(item.id)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-neutral-300 truncate">{item.originalName}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{formatBytes(item.sizeBytes)}</p>
      </div>
    </div>
  );
}
