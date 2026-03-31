import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export function PillBadge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-x-1.5 rounded-full border border-border/50 bg-background px-3 py-1 text-muted-foreground text-sm',
        className
      )}
      {...props}
    />
  );
}
