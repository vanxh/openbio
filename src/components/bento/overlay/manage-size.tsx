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
import type { ComponentType, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type * as z from 'zod';

function ResponsivePortal({ children }: { children: ReactNode }) {
  if (window.outerWidth > 500) {
    return children;
  }

  return createPortal(children, document.body);
}

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

  const size = window.outerWidth < 500 ? bento.size.sm : bento.size.md;

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

  return (
    <ResponsivePortal>
      <div className="-translate-x-1/2 container fixed bottom-6 left-1/2 z-20 mx-auto md:absolute md:bottom-0 md:w-max md:translate-y-1/2">
        <div className="flex items-center gap-x-4 rounded-lg bg-primary px-4 py-4 text-primary-foreground shadow md:gap-x-0 md:px-2 md:py-2">
          {sizeOptions.map((o) => (
            <button
              type="button"
              key={o.key}
              className={cn(
                'inline-flex items-center justify-center p-2 transition-transform duration-200 ease-in-out active:scale-95',
                size === o.key &&
                  'rounded-sm bg-secondary text-secondary-foreground'
              )}
              onClick={() => {
                updateBento({
                  link,
                  bento: {
                    ...bento,
                    size: {
                      ...bento.size,
                      [window.outerWidth < 500 ? 'sm' : 'md']: o.key,
                    },
                  },
                });
              }}
            >
              <o.icon />
            </button>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={close}
            className="ml-auto md:hidden"
          >
            Done
          </Button>
        </div>
      </div>
    </ResponsivePortal>
  );
}
