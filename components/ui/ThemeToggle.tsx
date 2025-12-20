'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Circle } from 'lucide-react';

interface ThemeToggleProps {
  isScrolled?: boolean;
}

export function ThemeToggle({ isScrolled = false }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return placeholder to prevent layout shift
    return (
      <button
        className="p-1 opacity-0 pointer-events-none transition-all duration-300"
        aria-label="Toggle theme"
      >
        <Circle className="h-[18px] w-[18px]" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  // Icon color needs to contrast with background:
  // Light mode: dark icon at top (white bg), white icon when scrolled (black bg)
  // Dark mode: white icon at top (dark bg), dark icon when scrolled (white bg)
  const iconColor = isDark
    ? (isScrolled ? 'text-gray-900' : 'text-white')  // Dark mode
    : (isScrolled ? 'text-white' : 'text-gray-900');  // Light mode

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`
        p-1 transition-all duration-300 hover:opacity-70
        ${iconColor}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Circle className="h-[18px] w-[18px] transition-transform duration-300 fill-current" />
      ) : (
        <Moon className="h-[18px] w-[18px] transition-transform duration-300" />
      )}
    </button>
  );
}
