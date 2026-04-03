'use client';

import { Button } from '@/components/ui/button';
import type { BentoSchema } from '@/server/db';
import { api } from '@/trpc/react';
import { Copy } from 'lucide-react';
import { useParams } from 'next/navigation';
import type * as z from 'zod';

export default function DuplicateButton({
  bento,
}: {
  bento: z.infer<typeof BentoSchema>;
}) {
  const { link } = useParams<{ link: string }>();

  const queryClient = api.useContext();

  const { mutateAsync: createBento } = api.profileLink.createBento.useMutation({
    onMutate: async () => {
      await queryClient.profileLink.getByLink.cancel({ link });
      const previous = queryClient.profileLink.getByLink.getData({ link });
      queryClient.profileLink.getByLink.setData({ link }, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          bento: [
            ...old.bento,
            {
              ...bento,
              id: crypto.randomUUID(),
              position: { sm: { x: 0, y: 0 }, md: { x: 0, y: 0 } },
            },
          ],
        };
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.profileLink.getByLink.setData({ link }, context.previous);
      }
    },
  });

  return (
    <Button
      size="icon"
      variant="secondary"
      className="-translate-y-1/2 absolute top-0 left-6 z-30 translate-x-1/2 rounded-full shadow transition-transform duration-200 ease-in-out active:scale-95"
      onClick={() => {
        const { id: _id, clicks: _clicks, ...rest } = bento as z.infer<typeof BentoSchema> & { clicks?: number };
        createBento({
          link,
          bento: {
            ...rest,
            id: crypto.randomUUID(),
            position: { sm: { x: 0, y: 0 }, md: { x: 0, y: 0 } },
          } as never,
        });
      }}
    >
      <Copy className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
