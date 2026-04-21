import type { Slide } from '@/shared/types/api';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { slidesApi } from '../api/slides-api';

interface UsePlaylistReturn {
  slides: Slide[];
  isLoading: boolean;
  toggleActive: (id: number, isActive: boolean) => Promise<void>;
  removeSlide: (id: number) => Promise<void>;
  updateDuration: (id: number, durationMs: number) => Promise<void>;
  updateTransition: (id: number, transitionIn: Slide['transitionIn']) => Promise<void>;
  moveUp: (index: number) => Promise<void>;
  moveDown: (index: number) => Promise<void>;
  reload: () => Promise<void>;
}

export function usePlaylist(): UsePlaylistReturn {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await slidesApi.list();
      setSlides(data);
    } catch {
      toast.error('Failed to load playlist');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleActive = useCallback(
    async (id: number, isActive: boolean) => {
      setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, isActive } : s)));
      try {
        await slidesApi.update(id, { isActive });
      } catch {
        toast.error('Failed to update slide');
        reload();
      }
    },
    [reload],
  );

  const removeSlide = useCallback(
    async (id: number) => {
      setSlides((prev) => prev.filter((s) => s.id !== id));
      try {
        await slidesApi.remove(id);
        toast.success('Slide removed');
      } catch {
        toast.error('Failed to remove slide');
        reload();
      }
    },
    [reload],
  );

  const updateDuration = useCallback(
    async (id: number, durationMs: number) => {
      setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, durationMs } : s)));
      try {
        await slidesApi.update(id, { durationMs });
      } catch {
        toast.error('Failed to update duration');
        reload();
      }
    },
    [reload],
  );

  const updateTransition = useCallback(
    async (id: number, transitionIn: Slide['transitionIn']) => {
      setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, transitionIn } : s)));
      try {
        await slidesApi.update(id, { transitionIn });
      } catch {
        toast.error('Failed to update transition');
        reload();
      }
    },
    [reload],
  );

  const moveUp = useCallback(
    async (index: number) => {
      if (index === 0) return;
      const next = [...slides];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      setSlides(next);
      try {
        await slidesApi.reorder(next.map((s) => s.id));
      } catch {
        toast.error('Failed to reorder');
        reload();
      }
    },
    [slides, reload],
  );

  const moveDown = useCallback(
    async (index: number) => {
      if (index === slides.length - 1) return;
      const next = [...slides];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      setSlides(next);
      try {
        await slidesApi.reorder(next.map((s) => s.id));
      } catch {
        toast.error('Failed to reorder');
        reload();
      }
    },
    [slides, reload],
  );

  return {
    slides,
    isLoading,
    toggleActive,
    removeSlide,
    updateDuration,
    updateTransition,
    moveUp,
    moveDown,
    reload,
  };
}
