'use client';

import DeleteButton from '@/components/bento/overlay/delete-button';
import DragHandle from '@/components/bento/overlay/drag-handle';
import ManageSize from '@/components/bento/overlay/manage-size';
import type { BentoSchema } from '@/server/db';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type * as z from 'zod';

export default function CardOverlay({
  bento,
  allowedSizes,
}: {
  bento: z.infer<typeof BentoSchema>;
  allowedSizes?: readonly string[];
}) {
  const [active, setActive] = useState(false);
  const leaveTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Raise z-index of the grid item when overlay is active so controls aren't hidden behind adjacent cards
  useEffect(() => {
    const gridItem = overlayRef.current?.closest(
      '.react-grid-item'
    ) as HTMLElement | null;
    if (!gridItem) {
      return;
    }
    if (active) {
      gridItem.style.zIndex = '50';
    } else {
      gridItem.style.zIndex = '';
    }
    return () => {
      gridItem.style.zIndex = '';
    };
  }, [active]);

  const cancelHide = () => {
    if (leaveTimeout.current) {
      clearTimeout(leaveTimeout.current);
      leaveTimeout.current = null;
    }
  };

  const show = () => {
    cancelHide();
    setActive(true);
  };

  const hide = () => {
    leaveTimeout.current = setTimeout(() => {
      setActive(false);
    }, 200);
  };

  const stopDrag = (e: React.MouseEvent | React.PointerEvent) => {
    // Let drag handle events propagate to react-grid-layout
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle')) {
      return;
    }
    e.stopPropagation();
  };

  return (
    <div
      ref={overlayRef}
      role="toolbar"
      className="absolute top-0 left-0 z-20 h-full w-full"
      onClick={(e) => {
        if (window.outerWidth < 500) {
          const target = e.target as HTMLElement;
          // Don't toggle if clicking an actual button or inside the size picker
          if (target.closest('button') || target.closest('fieldset')) {
            return;
          }
          setActive(!active);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setActive(!active);
        }
      }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {active && (
        <fieldset
          onMouseDown={stopDrag}
          onPointerDown={stopDrag}
          className="contents"
        >
          <DeleteButton bento={bento} />
          <DragHandle />
          <ManageSize
            bento={bento}
            close={() => setActive(false)}
            allowedSizes={allowedSizes}
            onHover={cancelHide}
            onLeave={hide}
          />
        </fieldset>
      )}
    </div>
  );
}
