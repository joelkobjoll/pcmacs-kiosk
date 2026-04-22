import { slidesApi } from "@/features/playlist/api/slides-api";
import type { Slide } from "@/shared/types/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePreloader } from "./use-preloader";

const POLL_INTERVAL_MS = 10_000;
const CACHE_KEY = "pcmacs_slides_cache";

interface UseSlideshow {
  currentSlide: Slide | null;
  currentIndex: number;
  activeSlides: Slide[];
  isLoading: boolean;
  /** True until the first successful server fetch completes (cache does not satisfy this) */
  isFetching: boolean;
  /** Call to immediately advance to the next slide (used by YouTube IFrame API) */
  advance: () => void;
}

function loadCache(): Slide[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as Slide[];
  } catch {}
  return [];
}

function saveCache(slides: Slide[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(slides));
  } catch {}
}

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function isScheduledNow(slide: Slide): boolean {
  const now = new Date();

  if (slide.scheduleDays && slide.scheduleDays.length > 0) {
    if (!slide.scheduleDays.includes(now.getDay())) return false;
  }

  if (slide.scheduleStart || slide.scheduleEnd) {
    const cur = now.getHours() * 60 + now.getMinutes();
    const start = parseTimeToMinutes(slide.scheduleStart ?? "00:00");
    const end = parseTimeToMinutes(slide.scheduleEnd ?? "23:59");
    if (end >= start) {
      if (cur < start || cur > end) return false;
    } else {
      // Overnight window (e.g. 22:00 – 06:00)
      if (cur < start && cur > end) return false;
    }
  }

  return true;
}

export function useSlideshow(): UseSlideshow {
  const [allSlides, setAllSlides] = useState<Slide[]>(() => loadCache());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timerEpoch, setTimerEpoch] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeLengthRef = useRef(0);
  // Track the ID of the currently showing slide so polls don't reset it
  const currentSlideIdRef = useRef<number | null>(null);

  const activeSlides = allSlides.filter((s) => s.isActive && isScheduledNow(s));
  const currentSlide = activeSlides[currentIndex] ?? null;

  activeLengthRef.current = activeSlides.length;
  currentSlideIdRef.current = currentSlide?.id ?? null;

  const { firstSlideReady } = usePreloader(allSlides);

  // Still loading while fetching AND no cache available, or waiting for first preload
  const isLoading = (isFetching && allSlides.length === 0) || !firstSlideReady;

  const fetchSlides = useCallback(async () => {
    try {
      const data = await slidesApi.list();
      saveCache(data);
      setAllSlides(data);
      // After a poll, try to keep the same slide playing
      const active = data.filter((s) => s.isActive && isScheduledNow(s));
      const currentId = currentSlideIdRef.current;
      if (currentId !== null) {
        const idx = active.findIndex((s) => s.id === currentId);
        if (idx !== -1) {
          setCurrentIndex(idx);
          return;
        }
      }
      // Current slide gone — stay at same index (clamped) so show continues
      setCurrentIndex((prev) => Math.min(prev, Math.max(active.length - 1, 0)));
    } catch {
      // Network error — keep showing cached content, no-op
    } finally {
      setIsFetching(false);
    }
  }, []);

  /** Immediately advance to the next slide, cancelling any pending timer */
  const advance = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentIndex(
      (prev) => (prev + 1) % Math.max(activeLengthRef.current, 1),
    );
  }, []);

  // Initial load + polling
  useEffect(() => {
    fetchSlides();
    pollRef.current = setInterval(fetchSlides, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchSlides]);

  // Re-evaluate schedule every minute so slides appear/disappear at their window boundary
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-advance timer — skipped for slides with durationMs=0 (e.g. YouTube full-video)
  useEffect(() => {
    if (!currentSlide) return;
    if (currentSlide.durationMs === 0) return; // IFrame API will call advance()

    timerRef.current = setTimeout(() => {
      setCurrentIndex(
        (prev) => (prev + 1) % Math.max(activeLengthRef.current, 1),
      );
      // Increment epoch so this effect always re-arms, even when the index wraps
      // back to the same value (e.g. single-slide playlist) and currentSlide?.id
      // doesn't change — without this React bails out and the timer never fires again.
      setTimerEpoch((e) => e + 1);
    }, currentSlide.durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Use primitive deps so polls that rebuild object refs don't reset the timer.
    // timerEpoch ensures re-arm even when slide id stays the same after wrapping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide?.id, currentSlide?.durationMs, timerEpoch]);

  // Safety clamp: if index goes out of bounds (e.g. slides deleted)
  useEffect(() => {
    if (currentIndex >= activeSlides.length && activeSlides.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  return {
    currentSlide,
    currentIndex,
    activeSlides,
    isLoading,
    isFetching,
    advance,
  };
}
