'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <header
      className={`
        sticky top-0 z-40 transition-all duration-300
        ${!isScrolled && isDark ? 'bg-dark-bg/95 backdrop-blur-md' : ''}
        ${!isScrolled && !isDark ? 'bg-white/95 backdrop-blur-md' : ''}
      `}
    >
      <div className="max-w-container mx-auto px-[21px] md:px-[29px] lg:px-[44px] py-2.5">
        <div
          className={`
            flex items-center justify-between transition-all duration-300
            px-6 py-1 border
            ${isScrolled && isDark ? 'bg-white' : ''}
            ${isScrolled && !isDark ? 'bg-dark-bg' : ''}
            ${isScrolled ? 'border-gray-400' : 'border-transparent'}
          `}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/sunvena-favicon.png"
                alt="SunVena Icon"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span
              className={`
                text-lg transition-colors duration-300
                ${isScrolled && isDark ? 'text-dark-bg' : ''}
                ${isScrolled && !isDark ? 'text-white' : ''}
                ${!isScrolled && isDark ? 'text-white' : ''}
                ${!isScrolled && !isDark ? 'text-dark-bg' : ''}
              `}
            >
              SunVena
            </span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle isScrolled={isScrolled} />
        </div>
      </div>
    </header>
  );
}
