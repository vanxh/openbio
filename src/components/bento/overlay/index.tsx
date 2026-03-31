'use client';

import DeleteButton from '@/components/bento/overlay/delete-button';
import DragHandle from '@/components/bento/overlay/drag-handle';
import ManageSize from '@/components/bento/overlay/manage-size';
import { cn } from '@/lib/utils';
import type { BentoSchema } from '@/server/db';
import { useRef, useState } from 'react';
import type * as z from 'zod';

export default function CardOverlay({
  bento,
}: {
  bento: z.infer<typeof BentoSchema>;
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
        <fieldset onMouseEnter={show} onMouseLeave={hide} className="contents">
          <DeleteButton bento={bento} />
          <DragHandle />
          <ManageSize bento={bento} close={() => setActive(false)} />
        </fieldset>
      )}
    </div>
  );
}
