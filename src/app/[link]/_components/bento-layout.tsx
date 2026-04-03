'use client';

import type React from 'react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { sizeToGrid } from '@/components/bento/sizes';
import { api } from '@/trpc/react';
import type { BentoSchema } from '@/types';
import { useParams } from 'next/navigation';
import { useCallback, useMemo, useRef } from 'react';
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

function findChangedPositions(
  bentos: z.infer<typeof BentoSchema>[],
  newLayouts: Layouts
) {
  const updates: Array<{
    bento: z.infer<typeof BentoSchema>;
    smPos: { x: number; y: number } | undefined;
    mdPos: { x: number; y: number } | undefined;
  }> = [];

  for (const bento of bentos) {
    const sm = newLayouts.sm?.find((l) => l.i === bento.id);
    const md = newLayouts.md?.find((l) => l.i === bento.id);

    const smPos = sm ? { x: sm.x, y: sm.y } : undefined;
    const mdPos = md ? { x: md.x, y: md.y } : undefined;

    const smChanged =
      smPos &&
      (smPos.x !== bento.position.sm?.x || smPos.y !== bento.position.sm?.y);
    const mdChanged =
      mdPos &&
      (mdPos.x !== bento.position.md?.x || mdPos.y !== bento.position.md?.y);

    if (smChanged || mdChanged) {
      updates.push({ bento, smPos, mdPos });
    }
  }

  return updates;
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
  const [profileLink] = api.profileLink.getByLink.useSuspenseQuery({ link });

  const { mutateAsync: updateBento } =
    api.profileLink.updateBento.useMutation();

  const hasDragged = useRef(false);

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

      const updates = findChangedPositions(profileLink.bento, newLayouts);

      // Run updates sequentially to prevent race conditions
      let chain = Promise.resolve();
      for (const { bento, smPos, mdPos } of updates) {
        chain = chain.then(() =>
          updateBento({
            link: profileLink.link,
            bento: {
              ...bento,
              position: {
                sm: smPos ?? bento.position.sm,
                md: mdPos ?? bento.position.md,
              },
            },
          }).then(() => undefined)
        );
      }
    },
    [profileLink, updateBento]
  );

  return (
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
      isDraggable={profileLink?.isOwner && !preview}
      onDragStart={() => {
        pushSnapshot();
        hasDragged.current = true;
      }}
      onLayoutChange={(_newLayout, newLayouts) => {
        onLayoutChange(newLayouts);
      }}
    >
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      {children}
    </ResponsiveGridLayout>
  );
}
