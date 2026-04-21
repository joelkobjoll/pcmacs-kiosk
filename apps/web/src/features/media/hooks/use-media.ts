import type { MediaItem } from '@/shared/types/api';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { mediaApi } from '../api/media-api';

interface UseMediaReturn {
  items: MediaItem[];
  isLoading: boolean;
  isUploading: boolean;
  uploadFile: (file: File) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export function useMedia(): UseMediaReturn {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

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

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const item = await mediaApi.upload(file);
      setItems((prev) => [item, ...prev]);
      toast.success(`${file.name} uploaded`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
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

  return { items, isLoading, isUploading, uploadFile, removeItem };
}
