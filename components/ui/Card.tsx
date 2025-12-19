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
          ? 'bg-commission-bg border-commission-border shadow-lg shadow-commission-border/10 p-10'
          : 'bg-dark-card/50 border-dark-border/40 hover:border-dark-border/70 hover:bg-dark-card/70 shadow-sm p-9',
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
    <div className={cn('mb-6 pb-4 border-b border-dark-border', className)}>
      <h2 className="text-heading-3 text-light-primary">{children}</h2>
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
