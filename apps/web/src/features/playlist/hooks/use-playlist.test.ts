import type { Slide } from '@/shared/types/api';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as slidesApiModule from '../api/slides-api';
import { usePlaylist } from './use-playlist';

const mockSlides: Slide[] = [
  {
    id: 1,
    title: 'Slide A',
    sourceType: 'image',
    url: 'https://a.com',
    durationMs: 5000,
    transitionIn: 'fade',
    isActive: true,
    sortOrder: 0,
    slideCount: 1,
    slideDurationMs: 5000,
    ytStartSeconds: 0,
    ytEndSeconds: null,
    muted: true,
    qrUrl: null,
    scheduleStart: null,
    scheduleEnd: null,
    scheduleDays: null,
  },
  {
    id: 2,
    title: 'Slide B',
    sourceType: 'image',
    url: 'https://b.com',
    durationMs: 5000,
    transitionIn: 'fade',
    isActive: true,
    sortOrder: 1,
    slideCount: 1,
    slideDurationMs: 5000,
    ytStartSeconds: 0,
    ytEndSeconds: null,
    muted: true,
    qrUrl: null,
    scheduleStart: null,
    scheduleEnd: null,
    scheduleDays: null,
  },
];

beforeEach(() => {
  vi.spyOn(slidesApiModule.slidesApi, 'list').mockResolvedValue(mockSlides);
  vi.spyOn(slidesApiModule.slidesApi, 'update').mockResolvedValue(mockSlides[0]);
  vi.spyOn(slidesApiModule.slidesApi, 'remove').mockResolvedValue(undefined);
  vi.spyOn(slidesApiModule.slidesApi, 'reorder').mockResolvedValue(undefined);
});

describe('usePlaylist', () => {
  it('loads slides on mount', async () => {
    const { result } = renderHook(() => usePlaylist());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.slides).toHaveLength(2);
  });

  it('toggleActive optimistically updates slide', async () => {
    const { result } = renderHook(() => usePlaylist());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.toggleActive(1, false);
    });
    await waitFor(() => expect(result.current.slides[0].isActive).toBe(false));
    expect(slidesApiModule.slidesApi.update).toHaveBeenCalledWith(1, { isActive: false });
  });

  it('removeSlide optimistically removes slide', async () => {
    const { result } = renderHook(() => usePlaylist());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.removeSlide(1);
    });
    await waitFor(() => expect(result.current.slides).toHaveLength(1));
    expect(slidesApiModule.slidesApi.remove).toHaveBeenCalledWith(1);
  });

  it('moveUp swaps slides and calls reorder', async () => {
    const { result } = renderHook(() => usePlaylist());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.moveUp(1);
    });
    await waitFor(() => expect(result.current.slides[0].id).toBe(2));
    expect(slidesApiModule.slidesApi.reorder).toHaveBeenCalled();
  });

  it('moveDown swaps slides and calls reorder', async () => {
    const { result } = renderHook(() => usePlaylist());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => {
      result.current.moveDown(0);
    });
    await waitFor(() => expect(result.current.slides[0].id).toBe(2));
    expect(slidesApiModule.slidesApi.reorder).toHaveBeenCalled();
  });
});
