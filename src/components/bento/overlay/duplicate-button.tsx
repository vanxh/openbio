'use client';

import { useBentoHistory } from '@/app/[link]/_components/bento-history';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
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

  const { mutate: createBento } = api.profileLink.createBento.useMutation({
    // The optimistic card must be the exact card sent to the server: with a
    // different id, later edits to the copy would match nothing and be lost.
    onMutate: async (input) => {
      await queryClient.profileLink.getByLink.cancel({ link });
      const previous = queryClient.profileLink.getByLink.getData({ link });
      queryClient.profileLink.getByLink.setData({ link }, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          bento: [...old.bento, input.bento as z.infer<typeof BentoSchema>],
        };
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.profileLink.getByLink.setData({ link }, context.previous);
      }
      toast({
        title: "Couldn't duplicate this card",
        description: 'Please try again.',
        variant: 'destructive',
      });
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
            createBento({
              link,
              bento: {
                ...bento,
                ...('clicks' in bento && { clicks: 0 }),
                id: crypto.randomUUID(),
                position: { sm: { x: 0, y: 0 }, md: { x: 0, y: 0 } },
              },
            });
          }}
          aria-label="Duplicate card"
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
