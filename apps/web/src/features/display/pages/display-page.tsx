import { MonitorPlay } from 'lucide-react';
import { SlideRenderer } from '../components/slide-renderer';
import { TransitionWrapper } from '../components/transition-wrapper';
import { useSlideshow } from '../hooks/use-slideshow';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-8 pointer-events-none select-none">
      <MonitorPlay className="w-20 h-20 text-white/15" />
      <div className="flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 bg-white/30 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      <p className="text-white/15 text-xs font-mono uppercase tracking-[0.25em]">
        Loading content
      </p>
    </div>
  );
}

export function DisplayPage() {
  const { currentSlide, isLoading, activeSlides, advance } = useSlideshow();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!currentSlide || activeSlides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-neutral-500">
        <MonitorPlay className="w-16 h-16 mb-4 opacity-50 animate-pulse" />
        <p className="text-xl font-mono uppercase tracking-widest">No active content</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black cursor-none pointer-events-none select-none">
      <TransitionWrapper
        slideKey={currentSlide.id}
        transition={currentSlide.transitionIn}
        durationMs={currentSlide.durationMs}
      >
        <SlideRenderer slide={currentSlide} onVideoEnded={advance} />
      </TransitionWrapper>
    </div>
  );
}
