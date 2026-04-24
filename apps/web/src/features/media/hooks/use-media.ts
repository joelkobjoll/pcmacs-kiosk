import type { MediaItem, UploadProgress } from '@/shared/types/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { mediaApi } from '../api/media-api';

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB
const ALLOWED_TYPES = /image\/(jpeg|png|gif|webp|svg\+xml)|video\/(mp4|webm)/;

export interface UploadState {
  isUploading: boolean;
  progress: number;
  loaded: number;
  total: number;
  speedBps: number;
  abort: (() => void) | null;
}

interface UseMediaReturn {
  items: MediaItem[];
  isLoading: boolean;
  uploadState: UploadState;
  uploadFile: (file: File) => Promise<void>;
  cancelUpload: () => void;
  removeItem: (id: number) => Promise<void>;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.test(file.type)) {
    return 'Unsupported file type. Only images (JPEG, PNG, GIF, WebP, SVG) and videos (MP4, WebM) are allowed.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024 / 1024)} GB.`;
  }
  return null;
}

export function useMedia(): UseMediaReturn {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    loaded: 0,
    total: 0,
    speedBps: 0,
    abort: null,
  });

  const lastProgressRef = useRef<{ loaded: number; time: number } | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await mediaApi.list();
      setItems(data);
    } catch {
      toast.error('Failed to load media library');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const cancelUpload = useCallback(() => {
    setUploadState((prev) => {
      prev.abort?.();
      return { ...prev, isUploading: false, abort: null };
    });
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    lastProgressRef.current = null;

    setUploadState({
      isUploading: true,
      progress: 0,
      loaded: 0,
      total: file.size,
      speedBps: 0,
      abort: null,
    });

    const handleProgress = (progress: UploadProgress) => {
      const now = Date.now();
      let speedBps = 0;

      if (lastProgressRef.current) {
        const dt = (now - lastProgressRef.current.time) / 1000;
        const dLoaded = progress.loaded - lastProgressRef.current.loaded;
        if (dt > 0) {
          speedBps = dLoaded / dt;
        }
      }

      lastProgressRef.current = { loaded: progress.loaded, time: now };

      setUploadState((prev) => ({
        ...prev,
        progress: progress.percent,
        loaded: progress.loaded,
        total: progress.total,
        speedBps,
      }));
    };

    const { promise, abort } = mediaApi.upload(file, handleProgress);

    setUploadState((prev) => ({ ...prev, abort }));

    try {
      const item = await promise;
      setItems((prev) => [item, ...prev]);
      toast.success(`${file.name} uploaded`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      if (message === 'Upload cancelled') {
        toast.info('Upload cancelled');
      } else {
        toast.error(message);
      }
    } finally {
      setUploadState({
        isUploading: false,
        progress: 0,
        loaded: 0,
        total: 0,
        speedBps: 0,
        abort: null,
      });
      lastProgressRef.current = null;
    }
  }, []);

  const removeItem = useCallback(
    async (id: number) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      try {
        await mediaApi.remove(id);
        toast.success('File deleted');
      } catch {
        toast.error('Failed to delete file');
        reload();
      }
    },
    [reload],
  );

  return { items, isLoading, uploadState, uploadFile, cancelUpload, removeItem };
}
