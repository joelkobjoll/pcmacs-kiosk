import { useEffect, useRef } from 'react';

// Minimal type declarations for the YouTube IFrame API
interface YtPlayerState {
  ENDED: number;
  PLAYING: number;
  PAUSED: number;
}

interface YtPlayerOptions {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: {
    autoplay?: number;
    mute?: number;
    controls?: number;
    playsinline?: number;
    start?: number;
    end?: number;
    rel?: number;
    iv_load_policy?: number;
    modestbranding?: number;
    disablekb?: number;
  };
  events?: {
    onStateChange?: (event: { data: number }) => void;
    onReady?: () => void;
  };
}

interface YtPlayerInstance {
  destroy: () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementIdOrEl: string | HTMLElement,
        options: YtPlayerOptions,
      ) => YtPlayerInstance;
      PlayerState: YtPlayerState;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Module-level singleton so the script loads only once per page
let apiLoading = false;
let apiReady = false;
const readyCallbacks: Array<() => void> = [];

function loadYouTubeAPI(): Promise<void> {
  if (apiReady) return Promise.resolve();
  return new Promise((resolve) => {
    readyCallbacks.push(resolve);
    if (apiLoading) return;
    apiLoading = true;

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      if (prev) prev();
      for (const cb of readyCallbacks) cb();
      readyCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
}

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0] ?? null;
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] ?? null;
      return u.searchParams.get('v');
    }
  } catch {}
  return null;
}

interface YoutubeSlideProps {
  videoId: string;
  startSeconds: number;
  endSeconds: number | null;
  muted: boolean;
  onEnded: () => void;
}

export function YoutubeSlide({ videoId, startSeconds, endSeconds, muted, onEnded }: YoutubeSlideProps) {
  const idRef = useRef(`yt-${Math.random().toString(36).slice(2)}`);
  const playerRef = useRef<YtPlayerInstance | null>(null);
  // Keep onEnded stable across renders without restarting the player
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    loadYouTubeAPI().then(() => {
      if (cancelled) return;
      playerRef.current = new window.YT.Player(idRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: muted ? 1 : 0,
          controls: 0,        // no control bar
          playsinline: 1,
          rel: 0,             // no related videos at end
          iv_load_policy: 3,  // disable annotations/overlays
          modestbranding: 1,  // minimal YouTube branding
          disablekb: 1,       // disable keyboard shortcuts
          start: startSeconds || 0,
          ...(endSeconds != null ? { end: endSeconds } : {}),
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onEndedRef.current();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // Re-create player only when the video, trim, or mute changes
  }, [videoId, startSeconds, endSeconds, muted]);

  return <div id={idRef.current} className="w-full h-full" />;
}
