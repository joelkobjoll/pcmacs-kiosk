import {
  MediaPickerField,
  isLibrarySourceType,
} from '@/features/media/components/media-picker-field';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Modal } from '@/shared/components/ui/modal';
import { Select } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import type { Slide, SlideSourceType, TransitionType } from '@/shared/types/api';
import { X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import {
  ScheduleFields,
  defaultScheduleValue,
  scheduleValueFromApi,
  scheduleValueToApi,
  type ScheduleValue,
} from './schedule-fields';

const SOURCE_TYPES: { value: SlideSourceType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'google_slides', label: 'Google Slides' },
  { value: 'website', label: 'Website' },
];

const TRANSITIONS: TransitionType[] = [
  'fade',
  'slide-left',
  'slide-right',
  'slide-up',
  'zoom-fade',
  'ken-burns',
];

interface EditSlideFormSubmitData {
  title: string;
  sourceType: SlideSourceType;
  url: string;
  transitionIn: TransitionType;
  durationSeconds?: number;
  slideCount?: number;
  slideDurationSeconds?: number;
  ytStartSeconds?: number;
  ytEndSeconds?: number | null;
  muted?: boolean;
  qrUrl?: string | null;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  scheduleDays?: number[] | null;
}

interface EditSlideFormProps {
  slide: Slide | null;
  isLoading: boolean;
  open: boolean;
  onSubmit: (data: EditSlideFormSubmitData) => void;
  onCancel: () => void;
}

export function EditSlideForm({ slide, isLoading, open, onSubmit, onCancel }: EditSlideFormProps) {
  const [sourceType, setSourceType] = useState<SlideSourceType>(slide?.sourceType ?? 'image');
  const [url, setUrl] = useState(slide?.url ?? '');
  const isVideoType = sourceType === 'youtube' || sourceType === 'video';
  const [muted, setMuted] = useState(slide?.muted ?? true);
  const [schedule, setSchedule] = useState<ScheduleValue>(() =>
    slide ? scheduleValueFromApi(slide.scheduleStart, slide.scheduleEnd, slide.scheduleDays) : defaultScheduleValue(),
  );

  if (!slide) return null;

  function handleSourceTypeChange(newType: SlideSourceType) {
    if (isLibrarySourceType(sourceType) !== isLibrarySourceType(newType)) {
      setUrl('');
    }
    setSourceType(newType);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url) return;
    const fd = new FormData(e.currentTarget);
    const type = fd.get('sourceType') as SlideSourceType;
    const isVideoSubmit = type === 'youtube' || type === 'video';
    const rawStart = fd.get('ytStartSeconds');
    const rawEnd = fd.get('ytEndSeconds');
    const rawQrUrl = (fd.get('qrUrl') as string)?.trim() || null;
    const schedApi = scheduleValueToApi(schedule);
    onSubmit({
      title: fd.get('title') as string,
      sourceType: type,
      url,
      transitionIn: fd.get('transitionIn') as TransitionType,
      qrUrl: rawQrUrl,
      ...schedApi,
      ...(type === 'google_slides' && {
        slideCount: Number(fd.get('slideCount')),
        slideDurationSeconds: Number(fd.get('slideDurationSeconds')),
      }),
      ...(isVideoSubmit && {
        ytStartSeconds: rawStart ? Number(rawStart) : 0,
        ytEndSeconds: rawEnd ? Number(rawEnd) : null,
        muted,
      }),
      ...(!isVideoSubmit &&
        type !== 'google_slides' && {
          durationSeconds: Number(fd.get('durationSeconds')) || 0,
        }),
    });
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onCancel()} showCloseButton={false} className="border-amber-500/30">
      <form onSubmit={handleSubmit}>
        <div className="relative px-6 py-5 border-b border-neutral-800">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l" />
          <h3 className="text-base font-semibold text-white">Edit Slide</h3>
          <p className="text-xs text-neutral-400 mt-0.5 truncate">{slide.title}</p>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              name="title"
              placeholder="Slide title"
              defaultValue={slide.title}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sourceType">Source Type</Label>
            <Select
              id="edit-sourceType"
              name="sourceType"
              value={sourceType}
              onChange={(e) => handleSourceTypeChange(e.target.value as SlideSourceType)}
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="edit-url">URL / Source</Label>
            <MediaPickerField sourceType={sourceType} value={url} onChange={setUrl} />
          </div>

          {sourceType === 'google_slides' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-slideCount">Number of Slides</Label>
                <Input
                  id="edit-slideCount"
                  name="slideCount"
                  type="number"
                  min={1}
                  defaultValue={slide.slideCount}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slideDurationSeconds">Seconds Per Slide</Label>
                <Input
                  id="edit-slideDurationSeconds"
                  name="slideDurationSeconds"
                  type="number"
                  min={1}
                  defaultValue={slide.slideDurationMs / 1000}
                  required
                />
              </div>
            </>
          ) : sourceType === 'youtube' || sourceType === 'video' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-ytStartSeconds">Start (seconds, optional)</Label>
                <Input
                  id="edit-ytStartSeconds"
                  name="ytStartSeconds"
                  type="number"
                  min={0}
                  defaultValue={slide.ytStartSeconds || undefined}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ytEndSeconds">End (seconds, optional)</Label>
                <Input
                  id="edit-ytEndSeconds"
                  name="ytEndSeconds"
                  type="number"
                  min={1}
                  defaultValue={slide.ytEndSeconds ?? undefined}
                  placeholder="Full video"
                />
                <p className="text-xs text-neutral-500">
                  Leave blank to play the full video and auto-advance when it ends.
                </p>
              </div>

              {isVideoType && (
                <div className="flex items-center justify-between py-1">
                  <div>
                    <Label className="cursor-pointer">Mute audio</Label>
                    <p className="text-xs text-neutral-500 mt-0.5">Recommended for kiosk displays</p>
                  </div>
                  <Switch checked={muted} onCheckedChange={setMuted} />
                </div>
              )}
            </>
          ) : sourceType === 'website' ? (
            <div className="space-y-2">
              <Label htmlFor="edit-durationSeconds">Duration (seconds, optional)</Label>
              <Input
                id="edit-durationSeconds"
                name="durationSeconds"
                type="number"
                min={1}
                defaultValue={slide.durationMs > 0 ? slide.durationMs / 1000 : undefined}
                placeholder="Auto — leave blank to not auto-advance"
              />
              <p className="text-xs text-neutral-500">
                Leave blank if the embedded page controls its own timing. Set a value to auto-advance
                after that many seconds.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="edit-durationSeconds">Duration (seconds)</Label>
              <Input
                id="edit-durationSeconds"
                name="durationSeconds"
                type="number"
                min={1}
                defaultValue={slide.durationMs / 1000}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-transitionIn">Transition</Label>
            <Select id="edit-transitionIn" name="transitionIn" defaultValue={slide.transitionIn}>
              {TRANSITIONS.map((t) => (
                <option key={t} value={t}>
                  {t.replace('-', ' ')}
                </option>
              ))}
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="edit-qrUrl">QR Code URL (optional)</Label>
            <Input
              id="edit-qrUrl"
              name="qrUrl"
              type="url"
              defaultValue={slide.qrUrl ?? undefined}
              placeholder="https://example.com — scan-to-visit overlay"
            />
            <p className="text-xs text-neutral-500">
              When set, a scannable QR code appears in the corner of this slide.
            </p>
          </div>

          <ScheduleFields value={schedule} onChange={setSchedule} />
        </div>

        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
