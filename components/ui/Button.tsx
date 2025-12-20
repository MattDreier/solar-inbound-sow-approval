import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ children, variant = 'primary', isLoading = false, className, disabled, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          'px-8 py-3.5 rounded-none font-normal text-body transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group',
          {
            'bg-white text-gray-900 hover:bg-gray-100 dark:bg-dark-bg dark:text-white dark:hover:bg-dark-hover': variant === 'primary',
            'bg-transparent text-white hover:bg-white/10 border-2 border-white dark:bg-transparent dark:text-black dark:hover:bg-black/5 dark:border-black': variant === 'secondary' || variant === 'danger',
          },
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
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
        )}
      </button>
    );
  }
);
