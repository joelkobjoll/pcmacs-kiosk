import { api } from '@/shared/hooks/use-api';
import type { MediaItem } from '@/shared/types/api';

export const mediaApi = {
  list(): Promise<MediaItem[]> {
    return api.get<MediaItem[]>('/media');
  },

  upload(file: File): Promise<MediaItem> {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload<MediaItem>('/media/upload', fd);
  },

  remove(id: number): Promise<void> {
    return api.delete<void>(`/media/${id}`);
  },
};
