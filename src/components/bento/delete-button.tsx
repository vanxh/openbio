"use client";

import { type Bento } from "@prisma/client";
import { Trash2 } from "lucide-react";

import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";

export default function DeleteButton({ bento }: { bento: Bento }) {
  return (
    <Button
      size="icon"
      className="absolute -right-3 -top-3 z-20 hidden transition-opacity duration-200 ease-in-out active:scale-95 md:group-hover:inline-flex"
      onClick={() => {
        void api.profileLink.deleteProfileLinkBento.mutate(bento.id);
      }}
    >
      <Trash2 className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
