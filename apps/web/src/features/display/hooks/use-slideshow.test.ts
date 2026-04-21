import * as slidesApiModule from '@/features/playlist/api/slides-api';
import type { Slide } from '@/shared/types/api';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSlideshow } from './use-slideshow';

// jsdom doesn't fire Image.onload — mock the preloader so it always resolves immediately
vi.mock('./use-preloader', () => ({
  usePreloader: () => ({ firstSlideReady: true }),
}));

const makeSlide = (id: number, durationMs = 1000): Slide => ({
  id,
  title: `Slide ${id}`,
  sourceType: 'image',
  url: `https://example.com/${id}`,
  durationMs,
  transitionIn: 'fade',
  isActive: true,
  sortOrder: id - 1,
  slideCount: 1,
  slideDurationMs: 5000,
  ytStartSeconds: 0,
  ytEndSeconds: null,
  muted: true,
  qrUrl: null,
  scheduleStart: null,
  scheduleEnd: null,
  scheduleDays: null,
});

describe('useSlideshow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(slidesApiModule.slidesApi, 'list').mockResolvedValue([
      makeSlide(1, 1000),
      makeSlide(2, 1000),
      makeSlide(3, 1000),
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function flushFetch() {
    // Flush the microtask queue so mocked resolved promises settle
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it('loads slides and starts at index 0', async () => {
    const { result } = renderHook(() => useSlideshow());
    await flushFetch();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentSlide?.id).toBe(1);
    expect(result.current.activeSlides).toHaveLength(3);
  });

  it('advances to next slide after duration', async () => {
    const { result } = renderHook(() => useSlideshow());
    await flushFetch();
    expect(result.current.currentSlide?.id).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.currentSlide?.id).toBe(2);
  });

  it('wraps around to first slide', async () => {
    const { result } = renderHook(() => useSlideshow());
    await flushFetch();
    act(() => {
      vi.advanceTimersByTime(1000);
    }); // → slide 2
    act(() => {
      vi.advanceTimersByTime(1000);
    }); // → slide 3
    act(() => {
      vi.advanceTimersByTime(1000);
    }); // → slide 1 (wrap)
    expect(result.current.currentSlide?.id).toBe(1);
  });

  it('does NOT auto-advance when durationMs is 0 (youtube full-video mode)', async () => {
    vi.spyOn(slidesApiModule.slidesApi, 'list').mockResolvedValue([
      makeSlide(1, 0), // youtube auto-advance sentinel
      makeSlide(2, 1000),
    ]);
    const { result } = renderHook(() => useSlideshow());
    await flushFetch();
    expect(result.current.currentSlide?.id).toBe(1);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.currentSlide?.id).toBe(1);
  });

  it('advance() immediately moves to next slide', async () => {
    const { result } = renderHook(() => useSlideshow());
    await flushFetch();
    expect(result.current.currentSlide?.id).toBe(1);
    act(() => {
      result.current.advance();
    });
    expect(result.current.currentSlide?.id).toBe(2);
  });
});
