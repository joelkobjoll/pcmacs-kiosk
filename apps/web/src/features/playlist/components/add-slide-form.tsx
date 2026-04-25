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
import type { SlideSourceType, TransitionType } from '@/shared/types/api';
import { X } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import {
  ScheduleFields,
  defaultScheduleValue,
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

interface AddSlideFormProps {
  defaultDurationSeconds: number;
  defaultTransition: TransitionType;
  isLoading: boolean;
  open: boolean;
  onSubmit: (data: {
    title: string;
    sourceType: SlideSourceType;
    url: string;
    durationSeconds?: number;
    transitionIn: TransitionType;
    slideCount?: number;
    slideDurationSeconds?: number;
    ytStartSeconds?: number;
    ytEndSeconds?: number | null;
    muted?: boolean;
    qrUrl?: string | null;
    scheduleStart?: string | null;
    scheduleEnd?: string | null;
    scheduleDays?: number[] | null;
  }) => void;
  onCancel: () => void;
}

export function AddSlideForm({
  defaultDurationSeconds,
  defaultTransition,
  isLoading,
  open,
  onSubmit,
  onCancel,
}: AddSlideFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [sourceType, setSourceType] = useState<SlideSourceType>('image');
  const [url, setUrl] = useState('');
  const [muted, setMuted] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleValue>(defaultScheduleValue());
  function handleSourceTypeChange(newType: SlideSourceType) {
    // Clear URL when switching between library (image/video) and non-library types
    if (isLibrarySourceType(sourceType) !== isLibrarySourceType(newType)) {
      setUrl('');
    }
    setSourceType(newType);
  }

  useEffect(() => {
    if (open) {
      setSourceType('image');
      setUrl('');
      setMuted(true);
      setSchedule(defaultScheduleValue());
      formRef.current?.reset();
    }
  }, [open]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url) return;
    const fd = new FormData(e.currentTarget);
    const type = fd.get('sourceType') as SlideSourceType;
    const isVideoType = type === 'youtube' || type === 'video';
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
      ...(isVideoType && {
        ytStartSeconds: rawStart ? Number(rawStart) : 0,
        ytEndSeconds: rawEnd ? Number(rawEnd) : null,
        muted,
      }),
      ...(!isVideoType &&
        type !== 'google_slides' && {
          durationSeconds: Number(fd.get('durationSeconds')) || 0,
        }),
    });
    formRef.current?.reset();
    setUrl('');
    setSourceType('image');
    setMuted(true);
    setSchedule(defaultScheduleValue());
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onCancel()} showCloseButton={false} className="border-blue-500/30">
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="relative px-6 py-5 border-b border-neutral-800">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l" />
          <h3 className="text-base font-semibold text-white">New Media Source</h3>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Slide title" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceType">Source Type</Label>
            <Select
              id="sourceType"
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
            <Label htmlFor="url">URL / Source</Label>
            <MediaPickerField sourceType={sourceType} value={url} onChange={setUrl} />
          </div>

          {sourceType === 'google_slides' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="slideCount">Number of Slides</Label>
                <Input
                  id="slideCount"
                  name="slideCount"
                  type="number"
                  min={1}
                  defaultValue={20}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slideDurationSeconds">Seconds Per Slide</Label>
                <Input
                  id="slideDurationSeconds"
                  name="slideDurationSeconds"
                  type="number"
                  min={1}
                  defaultValue={5}
                  required
                />
              </div>
            </>
          ) : sourceType === 'youtube' || sourceType === 'video' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="ytStartSeconds">Start (seconds, optional)</Label>
                <Input
                  id="ytStartSeconds"
                  name="ytStartSeconds"
                  type="number"
                  min={0}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ytEndSeconds">End (seconds, optional)</Label>
                <Input
                  id="ytEndSeconds"
                  name="ytEndSeconds"
                  type="number"
                  min={1}
                  placeholder="Full video"
                />
                <p className="text-xs text-neutral-500">
                  Leave blank to play the full video and auto-advance when it ends.
                </p>
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <Label className="cursor-pointer">Mute audio</Label>
                  <p className="text-xs text-neutral-500 mt-0.5">Recommended for kiosk displays</p>
                </div>
                <Switch checked={muted} onCheckedChange={setMuted} />
              </div>
            </>
          ) : sourceType === 'website' ? (
            <div className="space-y-2">
              <Label htmlFor="durationSeconds">Duration (seconds, optional)</Label>
              <Input
                id="durationSeconds"
                name="durationSeconds"
                type="number"
                min={1}
                placeholder="Auto — leave blank to not auto-advance"
              />
              <p className="text-xs text-neutral-500">
                Leave blank if the embedded page controls its own timing. Set a value to auto-advance
                after that many seconds.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="durationSeconds">Duration (seconds)</Label>
              <Input
                id="durationSeconds"
                name="durationSeconds"
                type="number"
                min={1}
                defaultValue={defaultDurationSeconds}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="transitionIn">Transition</Label>
            <Select id="transitionIn" name="transitionIn" defaultValue={defaultTransition}>
              {TRANSITIONS.map((t) => (
                <option key={t} value={t}>
                  {t.replace('-', ' ')}
                </option>
              ))}
            </Select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="qrUrl">QR Code URL (optional)</Label>
            <Input
              id="qrUrl"
              name="qrUrl"
              type="url"
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
            {isLoading ? 'Adding…' : 'Add to Playlist'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
