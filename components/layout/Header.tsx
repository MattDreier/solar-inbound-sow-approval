'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { clearAllSOWStates } from '@/lib/storage';

/**
 * Header component with sticky positioning (tablet and up only).
 *
 * LAYOUT STRUCTURE:
 *   <header>                        ← sticky element
 *     <div className="py-2.5">      ← padding wrapper (10px top + 10px bottom)
 *       <div className="h-[58px]">  ← visible dark bar with border
 *
 * IMPORTANT: If you change the header dimensions (py-2.5, h-[58px], or border),
 * you MUST update the CSS variables in globals.css:
 *   --header-padding-y: 10px       (py-2.5 = 0.625rem = 10px)
 *   --header-content-height: 58px  (h-[58px])
 *   --header-border-width: 1px     (border width)
 *
 * The sticky CTA offset is calculated from where the VISIBLE bar ends:
 *   visible-bottom = padding-top + content-height = 68px
 *   sticky-offset = visible-bottom + border-width = 69px
 */
export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // TEMPORARY: Clear localStorage for testing
  const handleLogoClick = () => {
    clearAllSOWStates();
    alert('localStorage cleared! Refresh the page to reset the SOW state.');
    window.location.reload();
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <header className="md:sticky md:top-0 z-40 transition-all duration-300">
      {/* Padding: 21px mobile, 29px tablet (780px+), 44px desktop (1024px+) */}
      <div className="max-w-container mx-auto px-[21px] md:px-[29px] lg:px-[44px] py-2.5">
        <div
          className={`
            flex items-center justify-between transition-all duration-300
            h-[58px] px-6 py-1 border
            ${isScrolled && isDark ? 'bg-white' : ''}
            ${isScrolled && !isDark ? 'bg-dark-bg' : ''}
            ${isScrolled ? 'border-gray-400' : 'border-transparent'}
          `}
        >
          {/* Logo - TEMPORARY: Click to clear localStorage */}
          <button
            onClick={handleLogoClick}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            type="button"
            title="[Testing] Click to clear localStorage"
          >
            <div className="relative h-12 w-32">
              <Image
                src="/sunvena-logo-transparent-background.png"
                alt="SunVena Solar Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle isScrolled={isScrolled} />
        </div>
      </div>
    </header>
  );
}
