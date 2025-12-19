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
        'inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide',
        {
          'bg-status-approved/10 text-status-approved border border-status-approved/30': variant === 'approved',
          'bg-status-rejected/10 text-status-rejected border border-status-rejected/30': variant === 'rejected',
          'bg-status-pending/10 text-status-pending border border-status-pending/30': variant === 'pending',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
