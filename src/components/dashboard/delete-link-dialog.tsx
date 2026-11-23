'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/errors';
import { api } from '@/trpc/react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

/** Confirms, then permanently deletes a profile page. */
export function DeleteLinkDialog({
  link,
  children,
}: {
  link: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();

  const { mutate: deleteLink, isPending } = api.profileLink.delete.useMutation({
    onSuccess: async () => {
      setOpen(false);
      toast({
        title: 'Page deleted',
        description: `openbio.app/${link} has been removed.`,
      });
      await utils.profileLink.getAll.invalidate();
      // The dashboard list is server-rendered.
      router.refresh();
    },
    onError: (err) => {
      toast({
        title: "Couldn't delete this page",
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cal text-xl">
            Delete this page?
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              openbio.app/{link}
            </span>{' '}
            will be removed along with its cards, analytics and collected
            emails. The name becomes available for anyone to claim. This cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            className="rounded-xl px-6"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl px-6"
            onClick={() => deleteLink({ link })}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
