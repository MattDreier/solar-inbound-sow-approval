import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ children, variant = 'primary', isLoading = false, className, disabled, ...props }, ref) {
    const isSecondary = variant === 'secondary' || variant === 'danger';

    const content = isLoading ? (
      <span className="flex items-center gap-2">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {children}
      </span>
    ) : (
      children
    );

    return (
      <button
        ref={ref}
        className={cn(
          'px-8 py-3.5 rounded-none font-normal text-body transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group',
          {
            'bg-white text-gray-900 border-2 border-transparent dark:bg-dark-bg dark:text-white overflow-visible before:absolute before:inset-[-2px] before:bg-amber-500 before:[clip-path:inset(0_100%_0_0)] before:transition-[clip-path] before:duration-300 before:ease-out hover:before:[clip-path:inset(0)] hover:text-gray-900 dark:hover:text-gray-900 after:absolute after:inset-[-2px] after:border-2 after:border-amber-500 after:pointer-events-none after:[clip-path:inset(0_100%_0_0)] after:transition-[clip-path] after:duration-300 after:ease-out hover:after:[clip-path:inset(0)]': variant === 'primary',
            'bg-transparent text-white border-2 border-white dark:bg-transparent dark:text-black dark:border-black overflow-visible before:absolute before:inset-[-2px] before:border-2 before:border-amber-500 before:[clip-path:inset(0_100%_0_0)] before:transition-[clip-path] before:duration-300 before:ease-out hover:before:[clip-path:inset(0)]': isSecondary,
          },
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Text container - holds both layers in same position */}
        <span className="relative z-10 inline-block">
          {/* Base text */}
          <span className="relative">{content}</span>

          {/* Amber text overlay for secondary - positioned exactly on top */}
          {isSecondary && (
            <span
              className="absolute inset-0 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-hidden="true"
            >
              {content}
            </span>
          )}
        </span>
      </button>
    );
  }
);
