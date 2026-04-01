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

  useEffect(() => {
    const gridItem = overlayRef.current?.closest(
      '.react-grid-item'
    ) as HTMLElement | null;
    if (!gridItem) {
      return;
    }
    if (active) {
      gridItem.style.overflow = 'visible';
      gridItem.style.zIndex = '10';
    } else {
      gridItem.style.overflow = '';
      gridItem.style.zIndex = '';
    }
    return () => {
      gridItem.style.overflow = '';
      gridItem.style.zIndex = '';
    };
  }, [active]);

  const show = () => {
    if (leaveTimeout.current) {
      clearTimeout(leaveTimeout.current);
      leaveTimeout.current = null;
    }
    setActive(true);
  };

  const hide = () => {
    leaveTimeout.current = setTimeout(() => {
      setActive(false);
    }, 150);
  };

  const stopDrag = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={overlayRef}
      role="toolbar"
      className="absolute top-0 left-0 z-20 h-full w-full"
      onClickCapture={() => {
        if (window.outerWidth < 500) {
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
          onMouseEnter={show}
          onMouseLeave={hide}
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
          />
        </fieldset>
      )}
    </div>
  );
}
