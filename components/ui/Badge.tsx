import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant: 'approved' | 'rejected' | 'pending';
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium',
        {
          'bg-green-100 text-green-800': variant === 'approved',
          'bg-red-100 text-red-800': variant === 'rejected',
          'bg-yellow-100 text-yellow-800': variant === 'pending',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
