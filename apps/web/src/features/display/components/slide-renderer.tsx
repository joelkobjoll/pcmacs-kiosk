import type { Slide } from "@/shared/types/api";
import { MonitorPlay, Video } from "lucide-react";
import { useEffect, useRef } from "react";
import { QrOverlay } from "./qr-overlay";
import { VideoSlide } from "./video-slide";
import { YoutubeSlide, extractYoutubeVideoId } from "./youtube-slide";

interface SlideRendererProps {
  slide: Slide;
  /** Called when a video-type slide ends (YouTube IFrame API) */
  onVideoEnded?: () => void;
}

function toGoogleSlidesEmbedUrl(url: string, slideDurationMs: number): string {
  try {
    const match = url.match(/\/presentation\/d\/([^/?#]+)/);
    if (match) {
      // loop=false: play through once; kiosk timer (slideCount * slideDurationMs) then advances
      // rm=minimal: hides the Google toolbar for a clean kiosk look
      return `https://docs.google.com/presentation/d/${match[1]}/embed?start=true&loop=false&delayms=${slideDurationMs}&rm=minimal`;
    }
  } catch {}
  return url;
}

/** Google Slides embed — no sandbox so the JS auto-advance can run freely */
function GoogleSlidesSlide({ url, title }: { url: string; title: string }) {
  return (
    <iframe
      src={url}
      title={title}
      className="w-full h-full border-0"
      allowFullScreen
    />
  );
}

function IframeSlide({
  url,
  title,
  durationMs,
  onEnded,
}: {
  url: string;
  title: string;
  durationMs: number;
  onEnded?: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for KIOSK_PRESENTATION_INFO from the embedded page.
  // When durationMs is 0 (no manual override), use totalDurationMs reported by the page.
  useEffect(() => {
    if (durationMs !== 0 || !onEnded) return;

    function handleMessage(event: MessageEvent) {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        !event.data ||
        event.data.type !== "KIOSK_PRESENTATION_INFO"
      )
        return;

      const total: number = event.data.totalDurationMs ?? 0;
      if (total > 0) {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => onEnded?.(), total);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [durationMs, onEnded]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      title={title}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}

export function SlideRenderer({ slide, onVideoEnded }: SlideRendererProps) {
  const content = renderContent(slide, onVideoEnded);
  return (
    <div className="relative w-full h-full">
      {content}
      {slide.qrUrl && <QrOverlay url={slide.qrUrl} />}
    </div>
  );
}

function renderContent(slide: Slide, onVideoEnded?: () => void) {
  switch (slide.sourceType) {
    case "image":
      return (
        <img
          src={slide.url}
          alt={slide.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      );

    case "video":
      return (
        <VideoSlide
          src={slide.url}
          startSeconds={slide.ytStartSeconds}
          endSeconds={slide.ytEndSeconds}
          muted={slide.muted}
          onEnded={onVideoEnded ?? (() => {})}
        />
      );

    case "youtube": {
      const videoId = extractYoutubeVideoId(slide.url) ?? "";
      return (
        <YoutubeSlide
          videoId={videoId}
          startSeconds={slide.ytStartSeconds}
          endSeconds={slide.ytEndSeconds}
          muted={slide.muted}
          onEnded={onVideoEnded ?? (() => {})}
        />
      );
    }

    case "google_slides":
      return (
        <GoogleSlidesSlide
          url={toGoogleSlidesEmbedUrl(slide.url, slide.slideDurationMs)}
          title={slide.title}
        />
      );

    case "website":
      return (
        <IframeSlide
          url={slide.url}
          title={slide.title}
          durationMs={slide.durationMs}
          onEnded={onVideoEnded}
        />
      );

    default:
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-600 gap-4">
          <MonitorPlay className="w-24 h-24" />
          <Video className="w-8 h-8" />
        </div>
      );
  }
}
