'use client';

import Size2x2 from '@/components/icons/size-2x2';
import Size2x4 from '@/components/icons/size-2x4';
import Size4x1 from '@/components/icons/size-4x1';
import Size4x2 from '@/components/icons/size-4x2';
import Size4x4 from '@/components/icons/size-4x4';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import type { ComponentType } from 'react';
import { createPortal } from 'react-dom';
import type * as z from 'zod';

const ALL_SIZE_OPTIONS: { key: string; icon: ComponentType }[] = [
  { key: '2x2', icon: Size2x2 },
  { key: '4x1', icon: Size4x1 },
  { key: '4x2', icon: Size4x2 },
  { key: '2x4', icon: Size2x4 },
  { key: '4x4', icon: Size4x4 },
];

export default function ManageSize({
  bento,
  close,
  allowedSizes,
}: {
  bento: z.infer<typeof import('@/types').BentoSchema>;
  close: () => void;
  allowedSizes?: readonly string[];
}) {
  const { link } = useParams<{ link: string }>();
  const isMobile = window.outerWidth < 500;
  const size = isMobile ? bento.size.sm : bento.size.md;

  const sizeOptions = allowedSizes
    ? ALL_SIZE_OPTIONS.filter((o) => allowedSizes.includes(o.key))
    : ALL_SIZE_OPTIONS;

  const queryClient = api.useContext();

  const { mutateAsync: updateBento } = api.profileLink.updateBento.useMutation({
    onMutate: (input) => {
      queryClient.profileLink.getByLink.setData({ link }, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          bento: old.bento.map((b) => {
            if (b.id === input.bento.id) {
              return { ...b, size: input.bento.size ?? b.size };
            }
            return b;
          }),
        };
      });
    },
    onSettled: () => {
      queryClient.profileLink.getByLink.invalidate({ link });
    },
  });

  const handleSizeClick = (key: string) => {
    updateBento({
      link,
      bento: {
        ...bento,
        size: {
          ...bento.size,
          [isMobile ? 'sm' : 'md']: key,
        },
      },
    });
  };

  const sizeButtons = (
    <div className="flex items-center gap-x-1 rounded-xl bg-primary px-2 py-2 text-primary-foreground shadow-lg">
      {sizeOptions.map((o) => (
        <button
          type="button"
          key={o.key}
          className={cn(
            'inline-flex items-center justify-center rounded-lg p-2 transition-all duration-150 active:scale-95',
            size === o.key && 'bg-secondary text-secondary-foreground'
          )}
          onClick={() => handleSizeClick(o.key)}
        >
          <o.icon />
        </button>
      ))}
    </div>
  );

  // Mobile: fixed bottom sheet with backdrop, portaled to body
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-100">
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss */}
        <div className="absolute inset-0 bg-black/20" onClick={close} />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pt-4 pb-8">
          {sizeButtons}
          <Button
            type="button"
            variant="secondary"
            onClick={close}
            className="w-full max-w-xs rounded-xl"
          >
            Done
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  // Desktop: absolute positioned below card
  return (
    <div className="-translate-x-1/2 absolute bottom-2 left-1/2 z-100 translate-y-full">
      {sizeButtons}
    </div>
  );
}
