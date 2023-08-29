"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreateLinkBentoModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const { link } = useParams() as { link: string };

  const [input, setInput] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Link Card</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={async (e) => {
            e.preventDefault();

            await api.profileLink.createBento.mutate({
              link,
              type: "LINK",
              href: input,
            });

            void router.refresh();
            setOpen(false);
          }}
        >
          <Input
            type="url"
            placeholder="Enter link"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <Button type="submit" disabled={!input} className="w-full">
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
