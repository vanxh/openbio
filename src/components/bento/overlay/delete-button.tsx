"use client";

import { useParams, useRouter } from "next/navigation";
import { Trash } from "lucide-react";
import type * as z from "zod";

import { type bentoSchema } from "@/server/db";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";

export default function DeleteButton({
  bento,
}: {
  bento: z.infer<typeof bentoSchema>;
}) {
  const router = useRouter();
  const { link } = useParams<{ link: string }>();

  const queryClient = api.useContext();

  const { mutateAsync: deleteBento } = api.profileLink.deleteBento.useMutation({
    onMutate: () => {
      void queryClient.profileLink.getByLink.setData(
        {
          link,
        },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            bento: old.bento.filter((b) => b.id !== bento.id),
          };
        }
      );
    },
    onSuccess: () => {
      void queryClient.profileLink.getByLink.invalidate({ link });
      void router.refresh();
    },
  });

  return (
    <Button
      size="icon"
      variant="secondary"
      className="absolute left-0 top-0 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full shadow transition-transform duration-200 ease-in-out active:scale-95"
      onClick={() => {
        void deleteBento({
          link,
          id: bento.id,
        });
      }}
    >
      <Trash className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
