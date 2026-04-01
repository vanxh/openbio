'use client';

import DeleteButton from '@/components/bento/overlay/delete-button';
import DragHandle from '@/components/bento/overlay/drag-handle';
import ManageSize from '@/components/bento/overlay/manage-size';
import { Button } from '@/components/ui/button';
import type { BentoSchema } from '@/server/db';
import { Maximize2 } from 'lucide-react';
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
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const leaveTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.outerWidth < 500;
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const gridItem = overlayRef.current?.closest(
      '.react-grid-item'
    ) as HTMLElement | null;
    if (!gridItem) {
      return;
    }
    if (active || sizePickerOpen) {
      gridItem.style.zIndex = '50';
      gridItem.style.overflow = 'visible';
    } else {
      gridItem.style.zIndex = '';
      gridItem.style.overflow = '';
    }
    return () => {
      gridItem.style.zIndex = '';
      gridItem.style.overflow = '';
    };
  }, [active, sizePickerOpen]);

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
    if (sizePickerOpen) {
      return;
    }
    leaveTimeout.current = setTimeout(() => {
      setActive(false);
    }, 200);
  };

  const closeSizePicker = () => {
    setSizePickerOpen(false);
    if (isMobile) {
      setActive(false);
    }
  };

  const stopDrag = (e: React.MouseEvent | React.PointerEvent) => {
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
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        if (!isMobile || !pointerStart.current) {
          return;
        }
        const dx = Math.abs(e.clientX - pointerStart.current.x);
        const dy = Math.abs(e.clientY - pointerStart.current.y);
        pointerStart.current = null;
        // If moved more than 5px, it was a drag not a tap
        if (dx > 5 || dy > 5) {
          return;
        }
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('fieldset')) {
          return;
        }
        setActive(!active);
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

          {/* Mobile: show a resize button that opens the size picker */}
          {isMobile && !sizePickerOpen && (
            <Button
              size="icon"
              variant="secondary"
              className="-translate-y-1/2 absolute top-0 right-0 z-30 translate-x-1/2 rounded-full shadow"
              onClick={() => setSizePickerOpen(true)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Mobile: portal size picker only when explicitly opened */}
          {isMobile && sizePickerOpen && (
            <ManageSize
              bento={bento}
              close={closeSizePicker}
              allowedSizes={allowedSizes}
            />
          )}

          {/* Desktop: always show size picker on hover */}
          {!isMobile && (
            <ManageSize
              bento={bento}
              close={() => setActive(false)}
              allowedSizes={allowedSizes}
              onHover={cancelHide}
              onLeave={hide}
            />
          )}
        </fieldset>
      )}
    </div>
  );
}
