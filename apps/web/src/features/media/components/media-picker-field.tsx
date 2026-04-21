import { Input } from '@/shared/components/ui/input';
import type { MediaItem, SlideSourceType } from '@/shared/types/api';
import { cn } from '@/shared/utils/cn';
import { CheckCircle2, Image as ImageIcon, Link, Video } from 'lucide-react';
import { useState } from 'react';
import { useMedia } from '../hooks/use-media';

export function isLibrarySourceType(type: SlideSourceType): type is 'image' | 'video' {
  return type === 'image' || type === 'video';
}

interface MediaPickerFieldProps {
  sourceType: SlideSourceType;
  value: string;
  onChange: (url: string) => void;
}

/**
 * URL field that shows a library picker for image/video types,
 * and a plain URL input for all other types.
 */
export function MediaPickerField({ sourceType, value, onChange }: MediaPickerFieldProps) {
  const [mode, setMode] = useState<'library' | 'url'>(() => {
    if (!isLibrarySourceType(sourceType)) return 'url';
    // If value is already set and doesn't look like an upload path, start in URL mode
    if (value && !value.includes('/uploads/')) return 'url';
    return 'library';
  });
  const { items, isLoading } = useMedia();

  if (!isLibrarySourceType(sourceType)) {
    return (
      <Input
        placeholder="https://..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    );
  }

  const filteredItems = items.filter((item) =>
    sourceType === 'image'
      ? item.mimeType.startsWith('image/')
      : item.mimeType.startsWith('video/'),
  );

  return (
    <div className="space-y-2">
      <div className="flex rounded-lg overflow-hidden border border-neutral-700 w-fit">
        <button
          type="button"
          onClick={() => setMode('library')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
            mode === 'library'
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:text-white',
          )}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Library
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
            mode === 'url'
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:text-white',
          )}
        >
          <Link className="w-3.5 h-3.5" />
          URL
        </button>
      </div>

      {mode === 'library' ? (
        <LibraryGrid
          items={filteredItems}
          isLoading={isLoading}
          sourceType={sourceType}
          selectedUrl={value}
          onSelect={onChange}
        />
      ) : (
        <Input
          placeholder="https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      )}

      {mode === 'library' && value && (
        <p className="text-xs text-neutral-500 truncate font-mono">{value}</p>
      )}
    </div>
  );
}

interface LibraryGridProps {
  items: MediaItem[];
  isLoading: boolean;
  sourceType: 'image' | 'video';
  selectedUrl: string;
  onSelect: (url: string) => void;
}

function LibraryGrid({ items, isLoading, sourceType, selectedUrl, onSelect }: LibraryGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24 bg-neutral-950 rounded-lg border border-neutral-800">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    const Icon = sourceType === 'image' ? ImageIcon : Video;
    return (
      <div className="flex flex-col items-center justify-center h-24 bg-neutral-950 rounded-lg border border-dashed border-neutral-800 gap-2 text-neutral-500">
        <Icon className="w-6 h-6" />
        <p className="text-xs">
          No {sourceType === 'image' ? 'images' : 'videos'} uploaded yet — use the Media Library
          tab.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-52 overflow-y-auto grid grid-cols-4 gap-2 pr-0.5">
      {items.map((item) => {
        const isSelected = item.url === selectedUrl;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.url)}
            title={item.originalName}
            className={cn(
              'relative aspect-video rounded-lg overflow-hidden border-2 transition-all',
              isSelected
                ? 'border-blue-500 ring-2 ring-blue-500/30'
                : 'border-neutral-700 hover:border-neutral-500',
            )}
          >
            {item.mimeType.startsWith('image/') ? (
              <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                <Video className="w-5 h-5" />
              </div>
            )}
            {isSelected && (
              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white drop-shadow" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
