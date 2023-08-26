"use client";

import { type Bento } from "@prisma/client";
import { Trash2 } from "lucide-react";

import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";

export default function DeleteButton({ bento }: { bento: Bento }) {
  return (
    <Button
      size="icon"
      className="absolute -right-3 top-0 z-20 -translate-y-1/2 transition-opacity duration-200 ease-in-out active:scale-95"
      onClick={() => {
        void api.profileLink.deleteProfileLinkBento.mutate(bento.id);
      }}
    >
      <Trash2 className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
