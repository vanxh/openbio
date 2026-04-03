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
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { CalendarBentoSchema } from '@/types';
import { Calendar, ExternalLink, Pencil } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import type * as z from 'zod';

type BentoData = z.infer<typeof CalendarBentoSchema>;

export const CALENDAR_CARD_SIZES = ['2x2', '4x2', '4x4'] as const;

function getEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('cal.com')) {
      return `${url}?embed=true&theme=light`;
    }
    if (parsed.hostname.includes('calendly.com')) {
      return `${url}?embed_type=inline`;
    }
    return null;
  } catch {
    return null;
  }
}

function getProviderName(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('cal.com')) {
      return 'Cal.com';
    }
    if (parsed.hostname.includes('calendly.com')) {
      return 'Calendly';
    }
    return 'Calendar';
  } catch {
    return 'Calendar';
  }
}

function CalendarDisplay({
  bento,
  onBookClick,
  compact,
}: {
  bento: BentoData;
  onBookClick: () => void;
  compact?: boolean;
}) {
  const title = bento.title || 'Book a time';
  const description = bento.description || 'Schedule a meeting with me';
  const provider = getProviderName(bento.url);

  if (compact) {
    return (
      <div className="flex h-full w-full flex-col p-5">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50">
          <Calendar className="h-5 w-5 text-foreground" />
        </div>
        <div className="mt-auto">
          <p className="font-cal text-sm leading-tight">{title}</p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground text-xs transition-opacity hover:opacity-90"
            onClick={onBookClick}
          >
            Book
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-center gap-3 p-6">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50">
        <Calendar className="h-5 w-5 text-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-cal text-base leading-tight">{title}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
          onClick={onBookClick}
        >
          <Calendar className="h-3.5 w-3.5" />
          Book a time
        </button>
        <span className="text-muted-foreground/60 text-xs">via {provider}</span>
      </div>
    </div>
  );
}

export default function CalendarCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [url, setUrl] = useState(bento.url ?? '');
  const [title, setTitle] = useState(bento.title ?? '');
  const [description, setDescription] = useState(bento.description ?? '');

  const queryClient = api.useContext();
  const { mutateAsync: updateBento } =
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
                url: url || '',
                title: title || undefined,
                description: description || undefined,
              }
            : b
        ),
      };
    });

    await updateBento({
      link: params.link,
      bento: {
        ...bento,
        url: url || '',
        title: title || undefined,
        description: description || undefined,
      },
    });
    setEditOpen(false);
  };

  const mdSize = bento.size.md ?? '2x2';
  const embedUrl = getEmbedUrl(bento.url);

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
          <CardOverlay bento={bento} allowedSizes={CALENDAR_CARD_SIZES} />
        )}

        {/* biome-ignore lint/nursery/noStaticElementInteractions: stops drag propagation so booking button works */}
        <div
          role="presentation"
          className="relative z-10 h-full"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <CalendarDisplay
            bento={bento}
            onBookClick={() => {
              if (embedUrl) {
                setBookOpen(true);
              } else if (bento.url) {
                window.open(bento.url, '_blank', 'noopener');
              }
            }}
            compact={mdSize === '2x2'}
          />
        </div>

        {editable && (
          <button
            type="button"
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
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

      {/* Booking modal with embedded calendar */}
      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="flex h-[85vh] max-h-175 flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center justify-between font-cal">
              {bento.title || 'Book a time'}
              <a
                href={bento.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-normal text-muted-foreground text-xs hover:text-foreground"
              >
                Open in {getProviderName(bento.url)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </DialogTitle>
          </DialogHeader>
          {embedUrl && (
            <iframe
              src={embedUrl}
              className="min-h-0 flex-1 rounded-lg border-0"
              title="Book a time"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cal">Edit Booking Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cal-url" className="font-medium text-sm">
                Booking URL
              </Label>
              <Input
                id="cal-url"
                placeholder="https://cal.com/yourname or https://calendly.com/yourname"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-muted-foreground text-xs">
                Supports Cal.com and Calendly links
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cal-title" className="font-medium text-sm">
                Title
              </Label>
              <Input
                id="cal-title"
                placeholder="Book a time"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cal-desc" className="font-medium text-sm">
                Description
              </Label>
              <Input
                id="cal-desc"
                placeholder="Schedule a meeting with me"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Button onClick={handleSave} className="w-full rounded-xl">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
