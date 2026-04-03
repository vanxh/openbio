'use client';

import CardOverlay from '@/components/bento/overlay';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { EmailCollectBentoSchema } from '@/types';
import { Check, Mail, Pencil, Send } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import type * as z from 'zod';

type BentoData = z.infer<typeof EmailCollectBentoSchema>;

export const EMAIL_COLLECT_CARD_SIZES = ['2x2', '4x2', '4x4'] as const;

function SubscribeForm({
  bento,
  linkId,
  compact,
}: {
  bento: BentoData;
  linkId?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { mutate: subscribe, isPending } =
    api.profileLink.subscribe.useMutation({
      onSuccess: () => {
        setSubmitted(true);
        setEmail('');
        toast({
          title: 'Subscribed!',
          description: 'You will receive updates from this creator.',
        });
      },
      onError: (err) => {
        toast({
          title: 'Error',
          description: err.message,
        });
      },
    });

  const heading = bento.heading || 'Stay in touch';
  const description =
    bento.description || 'Get notified when I post something new.';
  const buttonText = bento.buttonText || 'Subscribe';

  if (submitted) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-5 text-center">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-5 w-5 text-primary" />
        </div>
        <p className="font-cal text-sm">You&apos;re subscribed!</p>
        <p className="text-muted-foreground text-xs">Thanks for subscribing.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex h-full w-full flex-col p-5">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50">
          <Mail className="h-5 w-5 text-foreground" />
        </div>
        <div className="mt-auto space-y-2">
          <p className="font-cal text-sm leading-tight">{heading}</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email && linkId) {
                subscribe({ linkId, email });
              }
            }}
          >
            <Input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 rounded-lg text-xs"
              required
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 shrink-0 rounded-lg px-2"
              disabled={isPending || !linkId}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-center gap-3 p-6">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50">
        <Mail className="h-5 w-5 text-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-cal text-base leading-tight">{heading}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (email && linkId) {
            subscribe({ linkId, email });
          }
        }}
      >
        <Input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl"
          required
        />
        <Button
          type="submit"
          className="shrink-0 rounded-xl"
          disabled={isPending || !linkId}
        >
          {buttonText}
        </Button>
      </form>
    </div>
  );
}

export default function EmailCollectCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [heading, setHeading] = useState(bento.heading ?? '');
  const [description, setDescription] = useState(bento.description ?? '');
  const [buttonText, setButtonText] = useState(bento.buttonText ?? '');

  const { data: profileLink } = api.profileLink.getByLink.useQuery({
    link: params.link,
  });
  const queryClient = api.useContext();
  const { mutateAsync: updateBento, isPending: isSaving } =
    api.profileLink.updateBento.useMutation();

  const handleSave = async () => {
    queryClient.profileLink.getByLink.setData({ link: params.link }, (old) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        bento: old.bento.map((b) =>
          b.id === bento.id
            ? {
                ...b,
                heading: heading || undefined,
                description: description || undefined,
                buttonText: buttonText || undefined,
              }
            : b
        ),
      };
    });

    await updateBento({
      link: params.link,
      bento: {
        ...bento,
        heading: heading || undefined,
        description: description || undefined,
        buttonText: buttonText || undefined,
      },
    });
    setEditOpen(false);
  };

  const mdSize = bento.size.md ?? '2x2';

  return (
    <>
      <div
        className={cn(
          'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-card shadow-sm',
          editable
            ? 'transition-transform duration-200 ease-in-out md:cursor-move'
            : 'transition-all duration-200 hover:shadow-md'
        )}
      >
        {editable && (
          <CardOverlay bento={bento} allowedSizes={EMAIL_COLLECT_CARD_SIZES} />
        )}

        {/* biome-ignore lint/nursery/noStaticElementInteractions: stops drag propagation so form inputs are usable */}
        <div
          role="presentation"
          className="relative z-10 h-full"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <SubscribeForm
            bento={bento}
            linkId={profileLink?.id}
            compact={mdSize === '2x2'}
          />
        </div>

        {editable && (
          <button
            type="button"
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-lg border border-border/50 bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cal">
              Edit Email Collection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ec-heading" className="font-medium text-sm">
                Heading
              </Label>
              <Input
                id="ec-heading"
                placeholder="Stay in touch"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ec-desc" className="font-medium text-sm">
                Description
              </Label>
              <Input
                id="ec-desc"
                placeholder="Get notified when I post something new."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ec-btn" className="font-medium text-sm">
                Button Text
              </Label>
              <Input
                id="ec-btn"
                placeholder="Subscribe"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-xl"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
