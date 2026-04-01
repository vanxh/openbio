'use client';

import { Button } from '@/components/ui/button';
import type { BentoSchema } from '@/server/db';
import { api } from '@/trpc/react';
import { Trash } from 'lucide-react';
import { useParams } from 'next/navigation';
import type * as z from 'zod';

export default function DeleteButton({
  bento,
}: {
  bento: z.infer<typeof BentoSchema>;
}) {
  const { link } = useParams<{ link: string }>();

  const queryClient = api.useContext();

  const { mutateAsync: deleteBento } = api.profileLink.deleteBento.useMutation({
    onMutate: () => {
      queryClient.profileLink.getByLink.setData(
        {
          link,
        },
        (old) => {
          if (!old) {
            return old;
          }

          return {
            ...old,
            bento: old.bento.filter((b) => b.id !== bento.id),
          };
        }
      );
    },
    onSettled: () => {
      queryClient.profileLink.getByLink.invalidate({ link });
    },
  });

  return (
    <Button
      size="icon"
      variant="secondary"
      className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-0 z-20 rounded-full shadow transition-transform duration-200 ease-in-out active:scale-95"
      onClick={() => {
        deleteBento({
          link,
          id: bento.id,
        });
      }}
    >
      <Trash className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
