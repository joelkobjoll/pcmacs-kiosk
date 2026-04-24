import type { MediaItem, UploadProgress } from '@/shared/types/api';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as mediaApiModule from '../api/media-api';
import { useMedia } from './use-media';

const mockItem: MediaItem = {
  id: 1,
  filename: 'abc.mp4',
  originalName: 'video.mp4',
  mimeType: 'video/mp4',
  sizeBytes: 1024,
  url: '/uploads/abc.mp4',
  createdAt: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.spyOn(mediaApiModule.mediaApi, 'list').mockResolvedValue([mockItem]);
  vi.spyOn(mediaApiModule.mediaApi, 'remove').mockResolvedValue(undefined);
  vi.spyOn(mediaApiModule.mediaApi, 'upload').mockReturnValue({
    promise: Promise.resolve(mockItem),
    abort: vi.fn(),
  });
});

describe('useMedia', () => {
  it('loads media on mount', async () => {
    const { result } = renderHook(() => useMedia());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);
  });

  it('uploadFile validates unsupported file type', async () => {
    const { result } = renderHook(() => useMedia());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const badFile = new File(['x'], 'bad.exe', { type: 'application/octet-stream' });
    await act(async () => {
      await result.current.uploadFile(badFile);
    });

    expect(result.current.uploadState.isUploading).toBe(false);
    expect(mediaApiModule.mediaApi.upload).not.toHaveBeenCalled();
  });

  it('uploadFile validates oversized file', async () => {
    const { result } = renderHook(() => useMedia());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const hugeFile = new File(['x'], 'huge.mp4', { type: 'video/mp4' });
    Object.defineProperty(hugeFile, 'size', { value: 3 * 1024 * 1024 * 1024 });

    await act(async () => {
      await result.current.uploadFile(hugeFile);
    });

    expect(result.current.uploadState.isUploading).toBe(false);
    expect(mediaApiModule.mediaApi.upload).not.toHaveBeenCalled();
  });

  it('uploadFile tracks progress and succeeds', async () => {
    let progressCb: ((p: UploadProgress) => void) | undefined;

    vi.spyOn(mediaApiModule.mediaApi, 'upload').mockImplementation(
      (_file: File, onProgress: (p: UploadProgress) => void) => {
        progressCb = onProgress;
        return {
          promise: new Promise<MediaItem>((resolve) => {
            setTimeout(() => {
              onProgress({ loaded: 512, total: 1024, percent: 50 });
              setTimeout(() => {
                onProgress({ loaded: 1024, total: 1024, percent: 100 });
                resolve(mockItem);
              }, 10);
            }, 10);
          }),
          abort: vi.fn(),
        };
      },
    );

    const { result } = renderHook(() => useMedia());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['x'], 'test.mp4', { type: 'video/mp4' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(result.current.items).toContainEqual(mockItem);
    expect(result.current.uploadState.isUploading).toBe(false);
    expect(progressCb).toBeDefined();
  });

  it('uploadFile handles error', async () => {
    vi.spyOn(mediaApiModule.mediaApi, 'upload').mockImplementation(
      (_file: File, _onProgress: (p: UploadProgress) => void) => ({
        promise: Promise.reject(new Error('Server error')),
        abort: vi.fn(),
      }),
    );

    const { result } = renderHook(() => useMedia());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['x'], 'test.mp4', { type: 'video/mp4' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(result.current.uploadState.isUploading).toBe(false);
  });

  it('cancelUpload aborts in-progress upload', async () => {
    const abortFn = vi.fn();
    vi.spyOn(mediaApiModule.mediaApi, 'upload').mockImplementation(
      (_file: File, _onProgress: (p: UploadProgress) => void) => ({
        promise: new Promise<MediaItem>(() => {
          // never resolves
        }),
        abort: abortFn,
      }),
    );

    const { result } = renderHook(() => useMedia());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['x'], 'test.mp4', { type: 'video/mp4' });

    act(() => {
      result.current.uploadFile(file);
    });

    await waitFor(() => expect(result.current.uploadState.isUploading).toBe(true));

    act(() => {
      result.current.cancelUpload();
    });

    expect(abortFn).toHaveBeenCalled();
    expect(result.current.uploadState.isUploading).toBe(false);
  });

  it('removeItem optimistically removes item', async () => {
    const { result } = renderHook(() => useMedia());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.removeItem(1);
    });

    await waitFor(() => expect(result.current.items).toHaveLength(0));
    expect(mediaApiModule.mediaApi.remove).toHaveBeenCalledWith(1);
  });
});
