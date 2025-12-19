'use client';

import { useState, useEffect } from 'react';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`
        sticky top-0 z-40 transition-all duration-300
        ${isScrolled ? '' : 'bg-dark-bg/95 backdrop-blur-md'}
      `}
    >
      <div className="max-w-container mx-auto px-[21px] md:px-[29px] lg:px-[44px] py-5">
        <div
          className={`
            flex items-center justify-between transition-all duration-300
            px-6 py-4
            ${isScrolled
              ? 'bg-white shadow-lg'
              : ''
            }
          `}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className={`
                w-11 h-11 flex items-center justify-center shadow-lg transition-all duration-300
                ${isScrolled
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-gray-800/20'
                  : 'bg-gradient-to-br from-primary to-accent-purple shadow-primary/10 ring-1 ring-white/5'
                }
              `}
            >
              <span className="text-white font-semibold text-xl">S</span>
            </div>
            <span
              className={`
                text-xl font-normal tracking-tight transition-colors duration-300
                ${isScrolled ? 'text-gray-900' : 'text-light-primary'}
              `}
            >
              SunVena Solar
            </span>
          </div>

          {/* CTA Button */}
          <a
            href="/contact"
            className={`
              px-6 py-2.5 font-medium transition-all duration-300
              ${isScrolled
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-white text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            Login
          </a>
        </div>
      </div>
    </header>
  );
}
