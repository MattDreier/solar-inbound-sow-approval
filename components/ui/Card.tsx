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
        'border transition-all duration-300',
        highlighted
          ? 'bg-commission-bg border-commission-border p-10'
          : 'bg-card/50 border-border/40 hover:border-border/70 hover:bg-card/70 p-9',
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
    <div className={cn('mb-6 pb-4 border-b border-border', className)}>
      <h2 className="text-heading-3 text-text-primary">{children}</h2>
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}
