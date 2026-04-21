import type { Slide } from '@/shared/types/api';
import { useEffect, useRef, useState } from 'react';

/**
 * Preloads the asset for a single slide.
 * - image: creates an Image element and waits for onload
 * - video: creates a video element and waits for loadedmetadata (enough to start playing)
 * - all other types: resolves immediately (iframes / youtube handle their own loading)
 * Never rejects — a failed preload just resolves so the show can go on.
 */
function preloadAsset(slide: Slide): Promise<void> {
  if (slide.sourceType === 'image') {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = slide.url;
    });
  }
  if (slide.sourceType === 'video') {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => resolve();
      video.onerror = () => resolve();
      video.src = slide.url;
    });
  }
  return Promise.resolve();
}

interface UsePreloaderReturn {
  /** True once the first active slide's asset is ready to display */
  firstSlideReady: boolean;
}

/**
 * Eagerly preloads all active slide assets.
 * Marks firstSlideReady as soon as the first slide is available so the
 * display can start while the rest load in the background.
 */
export function usePreloader(slides: Slide[]): UsePreloaderReturn {
  const [firstSlideReady, setFirstSlideReady] = useState(false);
  const preloadedUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (slides.length === 0) return;

    const active = slides.filter((s) => s.isActive);
    if (active.length === 0) {
      setFirstSlideReady(true);
      return;
    }

    const [first, ...rest] = active;

    // Unblock the display as soon as the first slide is ready
    preloadAsset(first).then(() => {
      preloadedUrls.current.add(first.url);
      setFirstSlideReady(true);
    });

    // Preload remaining slides in background without blocking
    for (const slide of rest) {
      if (!preloadedUrls.current.has(slide.url)) {
        preloadAsset(slide).then(() => {
          preloadedUrls.current.add(slide.url);
        });
      }
    }
  }, [slides]);

  return { firstSlideReady };
}
