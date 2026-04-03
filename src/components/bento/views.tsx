'use client';

import CardOverlay from '@/components/bento/overlay';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { ViewsBentoSchema } from '@/types';
import { Eye } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type * as z from 'zod';

type BentoData = z.infer<typeof ViewsBentoSchema>;

export const VIEWS_CARD_SIZES = ['2x2', '4x1'] as const;

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) {
      return;
    }
    prevTarget.current = target;

    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}

function CompactViews({ views }: { views: number }) {
  const animatedCount = useCountUp(views);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-5">
      <Eye size={24} className="text-muted-foreground" />
      <div className="text-center">
        <p className="font-cal text-3xl leading-tight">
          {animatedCount.toLocaleString()}
        </p>
        <p className="mt-1 text-muted-foreground text-xs">profile views</p>
      </div>
    </div>
  );
}

function BannerViews({ views }: { views: number }) {
  const animatedCount = useCountUp(views);
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 px-6">
      <Eye size={18} className="shrink-0 text-muted-foreground" />
      <p className="font-cal text-xl leading-tight">
        {animatedCount.toLocaleString()}
      </p>
      <p className="text-muted-foreground text-sm">profile views</p>
    </div>
  );
}

export default function ViewsCard({
  bento,
  editable,
  linkId,
}: {
  bento: BentoData;
  editable?: boolean;
  linkId?: string;
}) {
  const { data: views } = api.profileLink.getViews.useQuery(
    { id: linkId ?? '' },
    { enabled: !!linkId, staleTime: 5 * 60 * 1000 }
  );

  const mdSize = bento.size.md ?? '2x2';

  return (
    <div
      className={cn(
        'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-card shadow-sm',
        editable
          ? 'transition-transform duration-200 ease-in-out md:cursor-move'
          : 'hover:-translate-y-0.5 transition-all duration-200 hover:border-border/80 hover:shadow-md'
      )}
    >
      {editable && (
        <CardOverlay bento={bento} allowedSizes={VIEWS_CARD_SIZES} />
      )}

      {mdSize === '4x1' ? (
        <BannerViews views={views ?? 0} />
      ) : (
        <CompactViews views={views ?? 0} />
      )}
    </div>
  );
}
