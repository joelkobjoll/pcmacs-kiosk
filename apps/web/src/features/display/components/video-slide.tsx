import { useRef } from 'react';

interface VideoSlideProps {
  src: string;
  /** Start playback at this second (0 = from beginning) */
  startSeconds: number;
  /** Stop playback and advance at this second. null = play to end */
  endSeconds: number | null;
  muted: boolean;
  onEnded: () => void;
}

/**
 * HTML5 video player with optional trim and auto-advance.
 * When endSeconds is null: plays full video and calls onEnded at the natural end.
 * When endSeconds is set: stops at that timestamp and calls onEnded.
 */
export function VideoSlide({ src, startSeconds, endSeconds, muted, onEnded }: VideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  return (
    <video
      ref={videoRef}
      src={src}
      className="w-full h-full object-cover"
      autoPlay
      muted={muted}
      playsInline
      onLoadedMetadata={() => {
        const video = videoRef.current;
        if (!video) return;
        if (startSeconds > 0) {
          video.currentTime = startSeconds;
        }
      }}
      onTimeUpdate={() => {
        if (endSeconds == null) return;
        const video = videoRef.current;
        if (!video) return;
        if (video.currentTime >= endSeconds) {
          video.pause();
          onEndedRef.current();
        }
      }}
      onEnded={() => {
        // Only fire for the full-video case; trim case is handled by onTimeUpdate
        if (endSeconds != null) return;
        onEndedRef.current();
      }}
    />
  );
}
