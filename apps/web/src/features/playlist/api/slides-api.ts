import { api } from '@/shared/hooks/use-api';
import type { Slide } from '@/shared/types/api';

interface CreateSlideInput {
  title: string;
  sourceType: Slide['sourceType'];
  url: string;
  durationMs?: number;
  transitionIn: Slide['transitionIn'];
  slideCount?: number;
  slideDurationMs?: number;
  ytStartSeconds?: number;
  ytEndSeconds?: number | null;
  muted?: boolean;
  qrUrl?: string | null;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  scheduleDays?: number[] | null;
}

interface UpdateSlideInput {
  title?: string;
  sourceType?: Slide['sourceType'];
  url?: string;
  durationMs?: number;
  transitionIn?: Slide['transitionIn'];
  isActive?: boolean;
  slideCount?: number;
  slideDurationMs?: number;
  ytStartSeconds?: number;
  ytEndSeconds?: number | null;
  muted?: boolean;
  qrUrl?: string | null;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  scheduleDays?: number[] | null;
}

export const slidesApi = {
  list(): Promise<Slide[]> {
    return api.get<Slide[]>('/slides');
  },

  create(input: CreateSlideInput): Promise<Slide> {
    return api.post<Slide>('/slides', input);
  },

  update(id: number, input: UpdateSlideInput): Promise<Slide> {
    return api.patch<Slide>(`/slides/${id}`, input);
  },

  remove(id: number): Promise<void> {
    return api.delete<void>(`/slides/${id}`);
  },

  reorder(ids: number[]): Promise<void> {
    return api.patch<void>('/slides/reorder', { ids });
  },
};
