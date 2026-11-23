'use client';

import type React from 'react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { sizeToGrid } from '@/components/bento/sizes';
import {
  type BentoBreakpoint,
  BentoBreakpointContext,
} from '@/components/bento/use-card-size';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import type { BentoSchema } from '@/types';
import { useParams } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  type Layouts,
  Responsive,
  type ResponsiveProps,
  WidthProvider,
} from 'react-grid-layout';
import type * as z from 'zod';
import { useBentoHistory } from './bento-history';
import { usePreview } from './preview-context';

function bentoToLayoutItem(
  b: z.infer<typeof BentoSchema>,
  breakpoint: 'sm' | 'md'
) {
  const { w, h } = sizeToGrid(b.size[breakpoint], breakpoint);
  return {
    i: b.id,
    x: b.position[breakpoint]?.x ?? 0,
    y: b.position[breakpoint]?.y ?? 0,
    w,
    h,
  };
}

type Bento = z.infer<typeof BentoSchema>;
type BentoPosition = Bento['position'];

/** New positions for every card a drag moved, keyed by card id. */
function findChangedPositions(bentos: Bento[], newLayouts: Layouts) {
  const positions: Record<string, BentoPosition> = {};

  for (const bento of bentos) {
    const position: BentoPosition = { ...bento.position };
    let changed = false;

    for (const breakpoint of ['sm', 'md'] as const) {
      const item = newLayouts[breakpoint]?.find((l) => l.i === bento.id);
      if (!item) {
        continue;
      }
      const current = bento.position[breakpoint];
      if (item.x !== current?.x || item.y !== current?.y) {
        position[breakpoint] = { x: item.x, y: item.y };
        changed = true;
      }
    }

    if (changed) {
      positions[bento.id] = position;
    }
  }

  return positions;
}

export default function BentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { link } = useParams<{ link: string }>();
  const ResponsiveGridLayout = useMemo(
    () => WidthProvider(Responsive) as React.ComponentType<ResponsiveProps>,
    []
  );

  const { preview } = usePreview();
  const { pushSnapshot } = useBentoHistory();
  const utils = api.useUtils();
  const { data: profileLink } = api.profileLink.getByLink.useQuery(
    { link },
    { staleTime: 60_000 }
  );

  const { mutate: updatePositions } =
    api.profileLink.updateBentoPositions.useMutation({
      onError: () => {
        toast({
          title: "Couldn't save layout",
          description: 'Your cards were moved back. Please try again.',
          variant: 'destructive',
        });
        utils.profileLink.getByLink.invalidate({ link });
      },
    });

  const hasDragged = useRef(false);

  // Which of the two stored layouts is on screen, so cards can render the
  // variant for the size they actually occupy.
  const [breakpoint, setBreakpoint] = useState<BentoBreakpoint>('md');

  const bentos = profileLink?.bento ?? [];

  const layouts = useMemo(
    () => ({
      sm: bentos.map((b) => bentoToLayoutItem(b, 'sm')),
      md: bentos.map((b) => bentoToLayoutItem(b, 'md')),
    }),
    [bentos]
  );

  const onLayoutChange = useCallback(
    (newLayouts: Layouts) => {
      if (!hasDragged.current || !profileLink) {
        return;
      }
      hasDragged.current = false;

      const positions = findChangedPositions(profileLink.bento, newLayouts);
      if (Object.keys(positions).length === 0) {
        return;
      }

      // Snapshot before touching the cache, so undo restores the old layout.
      pushSnapshot();

      // Keep the cache in step with the grid: later edits send the card as it
      // is cached, and a stale position there would undo this drag.
      utils.profileLink.getByLink.setData({ link }, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          bento: old.bento.map((b) => {
            const position = positions[b.id];
            return position ? { ...b, position } : b;
          }),
        };
      });

      // One request for the whole drag; the server applies it atomically.
      updatePositions({ link: profileLink.link, positions });
    },
    [link, profileLink, pushSnapshot, updatePositions, utils]
  );

  return (
    <BentoBreakpointContext.Provider value={breakpoint}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        cols={{ xxs: 2, xs: 2, sm: 2, md: 4, lg: 4 }}
        breakpoints={{ lg: 800, md: 600, sm: 300, xs: 0, xxs: 0 }}
        rowHeight={176}
        margin={[24, 24]}
        containerPadding={[0, 0]}
        draggableHandle={
          typeof window !== 'undefined' && window.innerWidth < 600
            ? '.drag-handle'
            : undefined
        }
        isResizable={false}
        onBreakpointChange={(_breakpoint, cols) => {
          setBreakpoint(cols <= 2 ? 'sm' : 'md');
        }}
        isDraggable={profileLink?.isOwner && !preview}
        onDragStart={() => {
          hasDragged.current = true;
        }}
        onDragStop={() => {
          // RGL reports the new layout right after this callback. If nothing
          // moved it reports nothing, so clear the flag once that has had its
          // chance, or the next unrelated layout change would look like a drag.
          setTimeout(() => {
            hasDragged.current = false;
          }, 0);
        }}
        onLayoutChange={(_newLayout, newLayouts) => {
          onLayoutChange(newLayouts);
        }}
      >
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        {children}
      </ResponsiveGridLayout>
    </BentoBreakpointContext.Provider>
  );
}
