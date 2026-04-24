import { api } from '@/shared/hooks/use-api';
import type { MediaItem, UploadProgress } from '@/shared/types/api';

export const mediaApi = {
  list(): Promise<MediaItem[]> {
    return api.get<MediaItem[]>('/media');
  },

  upload(
    file: File,
    onProgress: (progress: UploadProgress) => void,
  ): { promise: Promise<MediaItem>; abort: () => void } {
    const fd = new FormData();
    fd.append('file', file);
    return api.uploadWithProgress<MediaItem>('/media/upload', fd, onProgress);
  },

  remove(id: number): Promise<void> {
    return api.delete<void>(`/media/${id}`);
  },
};
