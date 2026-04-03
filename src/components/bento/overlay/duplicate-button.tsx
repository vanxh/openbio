'use client';

import { useBentoHistory } from '@/app/[link]/_components/bento-history';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  const { pushSnapshot } = useBentoHistory();

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
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:scale-95"
          onClick={() => {
            pushSnapshot();
            const {
              id: _id,
              clicks: _clicks,
              ...rest
            } = bento as z.infer<typeof BentoSchema> & { clicks?: number };
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
          <Copy className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        Duplicate
      </TooltipContent>
    </Tooltip>
  );
}
