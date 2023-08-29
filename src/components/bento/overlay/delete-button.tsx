"use client";

import { useRouter } from "next/navigation";
import { type Bento } from "@prisma/client";
import { Trash } from "lucide-react";

import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";

export default function DeleteButton({ bento }: { bento: Bento }) {
  const router = useRouter();

  return (
    <Button
      size="icon"
      variant="secondary"
      className="absolute left-0 top-0 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full shadow transition-transform duration-200 ease-in-out active:scale-95"
      onClick={() => {
        void api.profileLink.deleteProfileLinkBento
          .mutate(bento.id)
          .then(() => {
            void router.refresh();
          });
      }}
    >
      <Trash className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
