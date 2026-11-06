import React, { useEffect, useRef, useState } from 'react';
import lottie, { AnimationItem } from 'lottie-web/build/player/lottie_light';

interface LottieAnimationProps {
  animationPath?: string;
  animationData?: any;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  fallbackIcon?: React.ReactNode;
  speed?: number;
  ariaLabel?: string;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  animationPath,
  animationData,
  loop = true,
  autoplay = true,
  className = 'w-12 h-12',
  fallbackIcon,
  speed = 1,
  ariaLabel = 'FleetPulse Animation',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check for user's reduced-motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Destroy any existing animation instance
    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }

    try {
      if (animationData) {
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: prefersReducedMotion ? false : loop,
          autoplay: prefersReducedMotion ? false : autoplay,
          animationData,
        });
        if (animRef.current) {
          animRef.current.setSpeed(speed);
        }
      } else if (animationPath) {
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: prefersReducedMotion ? false : loop,
          autoplay: prefersReducedMotion ? false : autoplay,
          path: animationPath,
        });
        if (animRef.current) {
          animRef.current.setSpeed(speed);
        }
      }
    } catch (err) {
      console.warn('Failed to load Lottie animation:', err);
      setLoadError(true);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [animationPath, animationData, loop, autoplay, speed]);

  if (loadError && fallbackIcon) {
    return <div className={`flex items-center justify-center ${className}`}>{fallbackIcon}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center justify-center overflow-hidden pointer-events-none select-none ${className}`}
      aria-label={ariaLabel}
      role="img"
    />
  );
};
