'use client';

import { useState } from 'react';

// Animation variants with their display names and CSS classes
// Beacon is default (first in list)
const GLOW_VARIANTS = [
  { id: 'beacon', name: 'Beacon', class: 'animate-glow-beacon' },
  { id: 'breathing', name: 'Breathing', class: 'animate-glow-breathing' },
  { id: 'heartbeat', name: 'Heartbeat', class: 'animate-glow-heartbeat' },
  { id: 'reactor', name: 'Reactor', class: 'animate-glow-reactor' },
  { id: 'emergency', name: 'Emergency', class: 'animate-glow-emergency' },
  { id: 'candle', name: 'Candle', class: 'animate-glow-candle' },
] as const;

interface GlowDotProps {
  /** Allow clicking to preview different animations (dev mode) */
  interactive?: boolean;
  /** Additional classes for the outer container */
  className?: string;
}

export function GlowDot({ interactive = false, className = '' }: GlowDotProps) {
  const [variantIndex, setVariantIndex] = useState(0);

  const currentVariant = GLOW_VARIANTS[variantIndex];

  const handleClick = () => {
    if (!interactive) return;
    const nextIndex = (variantIndex + 1) % GLOW_VARIANTS.length;
    setVariantIndex(nextIndex);
  };

  return (
    <span
      className={`flex items-center justify-center h-3 w-3 flex-shrink-0 relative ${className}`}
      onClick={handleClick}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
      title={interactive ? `Glow preview: ${currentVariant.name}` : undefined}
    >
      <span
        className={`${currentVariant.class} relative inline-flex rounded-full h-[5px] w-[5px] bg-status-pending`}
      />
    </span>
  );
}

// Export variant list for external use if needed
export { GLOW_VARIANTS };
