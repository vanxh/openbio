'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/trpc/react';
import { LinkBentoSchema } from '@/types';
import { useParams } from 'next/navigation';
import { type ReactNode, useState } from 'react';

export default function CreateLinkBentoModal({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;

  const { link } = useParams<{ link: string }>();

  const [input, setInput] = useState('');

  const queryClient = api.useContext();

  const { mutateAsync: createBento } = api.profileLink.createBento.useMutation({
    onMutate: (bento) => {
      queryClient.profileLink.getByLink.setData(
        {
          link,
        },
        (old) => {
          if (!old) {
            return old;
          }

          return {
            ...old,
            bento: [...old.bento, LinkBentoSchema.parse(bento.bento)],
          };
        }
      );
    },
    onSuccess: () => {
      setOpen(false);
    },
    onSettled: () => {
      queryClient.profileLink.getByLink.invalidate({ link });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Link Card</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={(e) => {
            e.preventDefault();

            createBento({
              link,
              bento: {
                id: crypto.randomUUID(),
                type: 'link',
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
