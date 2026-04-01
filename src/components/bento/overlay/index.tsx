'use client';

import DeleteButton from '@/components/bento/overlay/delete-button';
import DragHandle from '@/components/bento/overlay/drag-handle';
import ManageSize from '@/components/bento/overlay/manage-size';
import { cn } from '@/lib/utils';
import type { BentoSchema } from '@/server/db';
import type React from 'react';
import { useRef, useState } from 'react';
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

  // Prevent drag from starting when clicking overlay controls
  const stopDrag = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      role="toolbar"
      className={cn(
        'absolute top-0 left-0 z-20 h-full w-full',
        active && 'rounded-md border-2 border-border md:border-0'
      )}
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
