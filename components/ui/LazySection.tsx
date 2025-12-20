'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  /** How far before the element enters the viewport to trigger loading (in pixels) */
  rootMargin?: string;
  /** Minimum height for the placeholder to prevent layout shift */
  minHeight?: string;
  /** Fade in duration in ms */
  fadeDuration?: number;
}

export function LazySection({
  children,
  className,
  rootMargin = '200px',
  minHeight = '200px',
  fadeDuration = 400,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Trigger animation after a brief delay for smooth transition
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setHasAnimated(true);
            });
          });
          // Once visible, stop observing
          observer.unobserve(element);
        }
      },
      {
        rootMargin,
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{ minHeight: isVisible ? undefined : minHeight }}
    >
      {isVisible && (
        <div
          className="transition-all ease-out"
          style={{
            transitionDuration: `${fadeDuration}ms`,
            opacity: hasAnimated ? 1 : 0,
            transform: hasAnimated ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
