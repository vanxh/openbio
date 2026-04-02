'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { usePreview } from './preview-context';

export default function ViewportContainer({
  children,
}: {
  children: ReactNode;
}) {
  const { viewport, preview } = usePreview();
  const isMobile = viewport === 'mobile';

  if (isMobile && preview) {
    return (
      <div className="mx-auto flex h-full w-full max-w-3xl items-start justify-center py-8">
        <div className="relative mx-auto w-[375px]">
          {/* Phone frame */}
          <div className="overflow-hidden rounded-[3rem] border-8 border-[#1a1a1a] bg-background shadow-2xl">
            {/* Notch / Dynamic Island */}
            <div className="relative flex h-8 items-center justify-center bg-background">
              <div className="h-[22px] w-[100px] rounded-full bg-[#1a1a1a]" />
            </div>
            {/* Content area */}
            <div className="h-[700px] overflow-y-auto px-2 pb-8">
              {children}
            </div>
            {/* Home indicator */}
            <div className="flex h-6 items-center justify-center bg-background">
              <div className="h-1 w-28 rounded-full bg-foreground/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mx-auto h-full w-full transition-all duration-300',
        isMobile ? 'max-w-sm' : 'max-w-3xl'
      )}
    >
      {children}
    </div>
  );
}
