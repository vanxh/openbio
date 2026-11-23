'use client';

import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import type { BentoSchema } from '@/types';
import { useParams } from 'next/navigation';
import { useCallback } from 'react';
import type * as z from 'zod';

type Bento = z.infer<typeof BentoSchema>;

/**
 * Save one edited card. The card is written to the profile query cache first
 * so the page updates immediately and later edits (resize, drag) start from
 * the new values; if the server rejects it, the previous card is put back and
 * the owner is told. Resolves to whether the save succeeded.
 */
export function useSaveBento() {
  const { link } = useParams<{ link: string }>();
  const utils = api.useUtils();
  const { mutateAsync, isPending } = api.profileLink.updateBento.useMutation();

  const saveBento = useCallback(
    async (bento: Bento): Promise<boolean> => {
      const replaceCard = (next: Bento) => {
        utils.profileLink.getByLink.setData({ link }, (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            bento: old.bento.map((b) => (b.id === next.id ? next : b)),
          };
        });
      };

      // A refetch that started before this edit must not overwrite it.
      await utils.profileLink.getByLink.cancel({ link });

      const previous = utils.profileLink.getByLink
        .getData({ link })
        ?.bento.find((b) => b.id === bento.id);

      replaceCard(bento);

      try {
        await mutateAsync({ link, bento });
        return true;
      } catch {
        if (previous) {
          replaceCard(previous);
        }
        toast({
          title: "Couldn't save this card",
          description: 'Check the values and your connection, then try again.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [link, mutateAsync, utils]
  );

  return { saveBento, isPending };
}
