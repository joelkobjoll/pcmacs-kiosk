import type { Slide } from '@/shared/types/api';
import { Globe, MonitorPlay, Video } from 'lucide-react';
import { useState } from 'react';
import { QrOverlay } from './qr-overlay';
import { VideoSlide } from './video-slide';
import { YoutubeSlide, extractYoutubeVideoId } from './youtube-slide';

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
  return <iframe src={url} title={title} className="w-full h-full border-0" allowFullScreen />;
}

function IframeSlide({
  url,
  title,
  fallbackBg,
}: { url: string; title: string; fallbackBg: string }) {
  const [blocked, setBlocked] = useState(false);

  if (blocked) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center ${fallbackBg} text-white/60`}
      >
        <Globe className="w-20 h-20 mb-6 opacity-30" />
        <p className="text-xl font-semibold opacity-60">{title}</p>
        <p className="text-sm font-mono mt-2 opacity-40">{url}</p>
        <p className="text-xs mt-4 opacity-30">This site cannot be embedded</p>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      title={title}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      onError={() => setBlocked(true)}
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
    case 'image':
      return (
        <img
          src={slide.url}
          alt={slide.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      );

    case 'video':
      return (
        <VideoSlide
          src={slide.url}
          startSeconds={slide.ytStartSeconds}
          endSeconds={slide.ytEndSeconds}
          muted={slide.muted}
          onEnded={onVideoEnded ?? (() => {})}
        />
      );

    case 'youtube': {
      const videoId = extractYoutubeVideoId(slide.url) ?? '';
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

    case 'google_slides':
      return (
        <GoogleSlidesSlide
          url={toGoogleSlidesEmbedUrl(slide.url, slide.slideDurationMs)}
          title={slide.title}
        />
      );

    case 'website':
      return <IframeSlide url={slide.url} title={slide.title} fallbackBg="bg-blue-950" />;

    default:
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-600 gap-4">
          <MonitorPlay className="w-24 h-24" />
          <Video className="w-8 h-8" />
        </div>
      );
  }
}
