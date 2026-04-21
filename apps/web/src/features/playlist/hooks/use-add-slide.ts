import type { Slide, SlideSourceType, TransitionType } from '@/shared/types/api';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { slidesApi } from '../api/slides-api';

interface AddSlideInput {
  title: string;
  sourceType: SlideSourceType;
  url: string;
  transitionIn: TransitionType;
  /** Used for all types except google_slides, youtube, and video */
  durationSeconds?: number;
  /** Google Slides only */
  slideCount?: number;
  /** Google Slides only — seconds per individual slide */
  slideDurationSeconds?: number;
  /** YouTube / Video — start playback at this second */
  ytStartSeconds?: number;
  /** YouTube / Video — stop at this second; omit to play the full duration and auto-advance */
  ytEndSeconds?: number | null;
  /** YouTube / Video — mute audio (default true) */
  muted?: boolean;
  /** Optional URL to show as QR code overlay */
  qrUrl?: string | null;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  scheduleDays?: number[] | null;
}

interface UseAddSlideReturn {
  addSlide: (input: AddSlideInput) => Promise<Slide | null>;
  isLoading: boolean;
}

export function useAddSlide(onSuccess: () => void): UseAddSlideReturn {
  const [isLoading, setIsLoading] = useState(false);

  const addSlide = useCallback(
    async (input: AddSlideInput): Promise<Slide | null> => {
      setIsLoading(true);
      try {
        const isGoogleSlides = input.sourceType === 'google_slides';
        const isVideoType = input.sourceType === 'youtube' || input.sourceType === 'video';
        const slide = await slidesApi.create({
          title: input.title,
          sourceType: input.sourceType,
          url: input.url,
          transitionIn: input.transitionIn,
          ...(isGoogleSlides && {
            slideCount: input.slideCount ?? 1,
            slideDurationMs: (input.slideDurationSeconds ?? 5) * 1000,
          }),
          ...(isVideoType && {
            ytStartSeconds: input.ytStartSeconds ?? 0,
            ytEndSeconds: input.ytEndSeconds ?? null,
            muted: input.muted ?? true,
          }),
          ...(!isGoogleSlides &&
            !isVideoType && {
              durationMs: (input.durationSeconds ?? 10) * 1000,
            }),
          qrUrl: input.qrUrl ?? null,
          scheduleStart: input.scheduleStart ?? null,
          scheduleEnd: input.scheduleEnd ?? null,
          scheduleDays: input.scheduleDays ?? null,
        });
        toast.success('Slide added to playlist');
        onSuccess();
        return slide;
      } catch {
        toast.error('Failed to add slide');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess],
  );

  return { addSlide, isLoading };
}
