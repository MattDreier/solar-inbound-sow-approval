import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  highlighted?: boolean;
  className?: string;
}

export function Card({ children, highlighted = false, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-6',
        highlighted
          ? 'bg-commission-bg border-commission-border'
          : 'bg-white border-gray-200',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 pb-3 border-b border-gray-200', className)}>
      <h2 className="text-xl font-semibold text-gray-900">{children}</h2>
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}
