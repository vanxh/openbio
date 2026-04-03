'use client';

import { useBentoHistory } from '@/app/[link]/_components/bento-history';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BentoSchema } from '@/server/db';
import { api } from '@/trpc/react';
import { Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import type * as z from 'zod';

export default function DeleteButton({
  bento,
}: {
  bento: z.infer<typeof BentoSchema>;
}) {
  const { link } = useParams<{ link: string }>();
  const { pushSnapshot } = useBentoHistory();

  const queryClient = api.useContext();

  const { mutateAsync: deleteBento } = api.profileLink.deleteBento.useMutation({
    onMutate: async () => {
      await queryClient.profileLink.getByLink.cancel({ link });
      const previous = queryClient.profileLink.getByLink.getData({ link });
      queryClient.profileLink.getByLink.setData({ link }, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          bento: old.bento.filter((b) => b.id !== bento.id),
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
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive active:scale-95"
          onClick={() => {
            pushSnapshot();
            deleteBento({
              link,
              id: bento.id,
            });
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        Delete
      </TooltipContent>
    </Tooltip>
  );
}
