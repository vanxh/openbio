"use client";

import { useParams, useRouter } from "next/navigation";
import { Trash } from "lucide-react";
import type * as z from "zod";

import { type bentoSchema } from "@/server/db";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";

export default function DeleteButton({
  bento,
}: {
  bento: z.infer<typeof bentoSchema>;
}) {
  const router = useRouter();
  const { link } = useParams() as { link: string };

  return (
    <Button
      size="icon"
      variant="secondary"
      className="absolute left-0 top-0 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full shadow transition-transform duration-200 ease-in-out active:scale-95"
      onClick={() => {
        void api.profileLink.deleteBento
          .mutate({
            link,
            id: bento.id,
          })
          .then(() => {
            void router.refresh();
          });
      }}
    >
      <Trash className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
