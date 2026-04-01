'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { usePreview } from './preview-context';

export default function ViewportContainer({
  children,
}: {
  children: ReactNode;
}) {
  const { viewport } = usePreview();

  return (
    <div
      className={cn(
        'mx-auto h-full w-full transition-all duration-300',
        viewport === 'mobile' ? 'max-w-sm' : 'max-w-3xl'
      )}
    >
      {children}
    </div>
  );
}
