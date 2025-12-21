import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn(
      'max-w-container mx-auto py-8',
      // Grafit-inspired responsive margins
      'px-[21px]',      // Mobile: 21px
      'md:px-[29px]',   // Tablet (780px+): 29px - iPad Air and larger
      'lg:px-[44px]',   // Desktop (1024px+): 44px
      className
    )}>
      {children}
    </div>
  );
}
