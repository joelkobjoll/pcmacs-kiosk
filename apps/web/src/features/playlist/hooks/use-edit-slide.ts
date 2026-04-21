import type { Slide } from '@/shared/types/api';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { slidesApi } from '../api/slides-api';

interface EditSlideData {
  title: string;
  sourceType: Slide['sourceType'];
  url: string;
  transitionIn: Slide['transitionIn'];
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

export function useEditSlide(onSuccess: (slide: Slide) => void) {
  const [isLoading, setIsLoading] = useState(false);

  const editSlide = useCallback(
    async (id: number, data: EditSlideData) => {
      setIsLoading(true);
      try {
        const isGoogleSlides = data.sourceType === 'google_slides';
        const isVideoType = data.sourceType === 'youtube' || data.sourceType === 'video';
        const updated = await slidesApi.update(id, {
          title: data.title,
          sourceType: data.sourceType,
          url: data.url,
          transitionIn: data.transitionIn,
          ...(isGoogleSlides && {
            slideCount: data.slideCount ?? 1,
            slideDurationMs: (data.slideDurationSeconds ?? 5) * 1000,
          }),
          ...(isVideoType && {
            ytStartSeconds: data.ytStartSeconds ?? 0,
            ytEndSeconds: data.ytEndSeconds ?? null,
            muted: data.muted ?? true,
          }),
          ...(!isGoogleSlides &&
            !isVideoType && {
              durationMs: (data.durationSeconds ?? 10) * 1000,
            }),
          qrUrl: data.qrUrl ?? null,
          scheduleStart: data.scheduleStart ?? null,
          scheduleEnd: data.scheduleEnd ?? null,
          scheduleDays: data.scheduleDays ?? null,
        });
        toast.success('Slide updated');
        onSuccess(updated);
        return updated;
      } catch {
        toast.error('Failed to update slide');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess],
  );

  return { editSlide, isLoading };
}
