import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import type { Slide, SlideSourceType, TransitionType } from '@/shared/types/api';
import { cn } from '@/shared/utils/cn';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Globe,
  Image as ImageIcon,
  MonitorPlay,
  Pencil,
  PlaySquare,
  Power,
  Trash2,
  Video,
} from 'lucide-react';

const TRANSITIONS: TransitionType[] = [
  'fade',
  'slide-left',
  'slide-right',
  'slide-up',
  'zoom-fade',
  'ken-burns',
];

const SOURCE_ICONS: Record<SlideSourceType, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  youtube: PlaySquare,
  google_slides: MonitorPlay,
  website: Globe,
};

interface SlideCardProps {
  slide: Slide;
  index: number;
  total: number;
  onToggleActive: (id: number, isActive: boolean) => void;
  onRemove: (id: number) => void;
  onDurationChange: (id: number, durationMs: number) => void;
  onTransitionChange: (id: number, transition: TransitionType) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (id: number) => void;
}

export function SlideCard({
  slide,
  index,
  total,
  onToggleActive,
  onRemove,
  onDurationChange,
  onTransitionChange,
  onMoveUp,
  onMoveDown,
  onEdit,
}: SlideCardProps) {
  const Icon = SOURCE_ICONS[slide.sourceType] ?? MonitorPlay;

  return (
    <div
      className={cn(
        'group flex items-center gap-4 bg-neutral-900 border rounded-xl p-4 transition-all',
        slide.isActive
          ? 'border-neutral-800 hover:border-neutral-700'
          : 'border-neutral-800/50 opacity-60',
      )}
    >
      <div className="flex flex-col items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className="h-7 w-7 text-neutral-500 hover:text-white disabled:opacity-25"
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <span className="text-xs font-mono text-neutral-600">{index + 1}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          className="h-7 w-7 text-neutral-500 hover:text-white disabled:opacity-25"
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-24 h-16 rounded-lg bg-neutral-800 overflow-hidden relative shrink-0">
        {slide.sourceType === 'image' ? (
          <img src={slide.url} alt={slide.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500">
            <Icon className="w-6 h-6" />
          </div>
        )}
        {!slide.isActive && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Power className="w-4 h-4 text-neutral-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'font-medium truncate text-sm',
              slide.isActive ? 'text-white' : 'text-neutral-400',
            )}
          >
            {slide.title}
          </span>
          <Badge>
            <Icon className="w-3 h-3" />
            {slide.sourceType}
          </Badge>
        </div>
        <p className="text-xs text-neutral-500 truncate font-mono">{slide.url}</p>
      </div>

      <div className="flex items-center gap-4 shrink-0 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Duration</span>
          {slide.sourceType === 'google_slides' ? (
            // Computed from slideCount × slideDurationMs — edit via the form
            <div className="flex items-center bg-neutral-950 px-2 py-1 rounded border border-neutral-800 text-neutral-500">
              <MonitorPlay className="w-3 h-3 mr-1" />
              <span className="text-sm italic">
                {slide.slideCount} × {slide.slideDurationMs / 1000}s
              </span>
            </div>
          ) : slide.durationMs === 0 ? (
            // youtube / video auto-advance — duration controlled by the media itself
            <div className="flex items-center bg-neutral-950 px-2 py-1 rounded border border-neutral-800 text-neutral-500">
              <Clock className="w-3 h-3 mr-1" />
              <span className="text-sm italic">auto</span>
            </div>
          ) : slide.sourceType === 'youtube' || slide.sourceType === 'video' ? (
            // Trimmed video — read-only (change via Edit form)
            <div className="flex items-center bg-neutral-950 px-2 py-1 rounded border border-neutral-800 text-neutral-500">
              <Clock className="w-3 h-3 mr-1" />
              <span className="text-sm">{slide.durationMs / 1000}s</span>
            </div>
          ) : (
            // image / website — user-editable display time
            <div className="flex items-center bg-neutral-950 px-2 py-1 rounded border border-neutral-800 text-neutral-300">
              <Clock className="w-3 h-3 mr-1 text-neutral-500" />
              <input
                type="number"
                min={1}
                value={slide.durationMs / 1000}
                onChange={(e) => onDurationChange(slide.id, Number(e.target.value) * 1000)}
                className="w-12 bg-transparent focus:outline-none text-right appearance-none"
              />
              <span className="ml-1 text-neutral-500">s</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Transition</span>
          <select
            value={slide.transitionIn}
            onChange={(e) => onTransitionChange(slide.id, e.target.value as TransitionType)}
            className="bg-neutral-950 text-neutral-300 px-2 py-1.5 rounded border border-neutral-800 focus:outline-none text-sm w-32 appearance-none"
          >
            {TRANSITIONS.map((t) => (
              <option key={t} value={t}>
                {t.replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-2 border-l border-neutral-800 pl-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(slide.id)}
          className="text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30 border border-transparent"
          title="Edit slide"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleActive(slide.id, !slide.isActive)}
          className={cn(
            'border',
            slide.isActive
              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 hover:bg-emerald-400/20'
              : 'text-neutral-400 bg-neutral-800 border-neutral-700 hover:bg-neutral-700',
          )}
          title={slide.isActive ? 'Disable slide' : 'Enable slide'}
        >
          <Power className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(slide.id)}
          className="text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent"
          title="Remove slide"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
