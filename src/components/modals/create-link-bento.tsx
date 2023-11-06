"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { LinkBentoSchema } from "@/types";

export default function CreateLinkBentoModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const { link } = useParams<{ link: string }>();

  const [input, setInput] = useState("");

  const queryClient = api.useContext();

  const { mutateAsync: createBento } = api.profileLink.createBento.useMutation({
    onMutate: (bento) => {
      void queryClient.profileLink.getByLink.setData(
        {
          link,
        },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            bento: [...old.bento, LinkBentoSchema.parse(bento.bento)],
          };
        },
      );
    },
    onSuccess: () => {
      void queryClient.profileLink.getByLink.invalidate({ link });
      void router.refresh();
      setOpen(false);
    },
  });

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
          onSubmit={(e) => {
            e.preventDefault();

            void createBento({
              link,
              bento: {
                id: crypto.randomUUID(),
                type: "link",
                href: input,
              },
            });
          }}
        >
          <Input
            type="url"
            placeholder="Enter link"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="flex gap-x-4">
            <Button type="submit" disabled={!input} className="w-full">
              Create
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
