import type { TransitionType } from '@/shared/types/api';
import { AnimatePresence, motion } from 'motion/react';
import type { Target, Transition, Variants } from 'motion/react';
import type { ReactNode } from 'react';

function getVariants(type: TransitionType): Variants {
  const slide = (from: Target, to: Target): Variants => ({
    initial: from,
    animate: to,
    exit: from,
  });

  switch (type) {
    case 'slide-left':
      return slide({ x: '100%', opacity: 1 }, { x: 0, opacity: 1 });
    case 'slide-right':
      return slide({ x: '-100%', opacity: 1 }, { x: 0, opacity: 1 });
    case 'slide-up':
      return slide({ y: '100%', opacity: 1 }, { y: 0, opacity: 1 });
    case 'zoom-fade':
      return {
        initial: { scale: 1.1, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 },
      };
    case 'ken-burns':
      return {
        initial: { scale: 1.0, opacity: 0 },
        animate: { scale: 1.15, opacity: 1 },
        exit: { opacity: 0 },
      };
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
}

interface TransitionWrapperProps {
  slideKey: string | number;
  transition: TransitionType;
  durationMs: number;
  children: ReactNode;
}

export function TransitionWrapper({
  slideKey,
  transition,
  durationMs,
  children,
}: TransitionWrapperProps) {
  const variants = getVariants(transition);
  const transitionProps: Transition =
    transition === 'ken-burns'
      ? { duration: durationMs / 1000, ease: 'linear' }
      : { duration: 1.2, ease: [0.22, 1, 0.36, 1] };

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={slideKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transitionProps}
        className="absolute inset-0 origin-center"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
