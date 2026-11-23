'use client';

import CardOverlay from '@/components/bento/overlay';
import { useCardSize } from '@/components/bento/use-card-size';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveBento } from '@/hooks/use-save-bento';
import { isHostOf } from '@/lib/url';
import { cn } from '@/lib/utils';
import type { CalendarBentoSchema } from '@/types';
import { Calendar, ExternalLink, Pencil } from 'lucide-react';
import { useState } from 'react';
import type * as z from 'zod';

type BentoData = z.infer<typeof CalendarBentoSchema>;

export const CALENDAR_CARD_SIZES = ['2x2', '4x2', '4x4'] as const;

type Provider = 'cal' | 'calendly';

/**
 * Which booking provider a URL belongs to. Matched on the real hostname: the
 * page is framed on openbio.app, so a lookalike such as `cal.com.evil.net` or
 * `medical.com` must never count.
 */
function getProvider(url: string): Provider | null {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== 'https:') {
      return null;
    }
    if (isHostOf(hostname, 'cal.com')) {
      return 'cal';
    }
    if (isHostOf(hostname, 'calendly.com')) {
      return 'calendly';
    }
    return null;
  } catch {
    return null;
  }
}

function getEmbedUrl(url: string): string | null {
  const provider = getProvider(url);
  if (!provider) {
    return null;
  }

  // Set the embed flags through the URL API so an address that already has a
  // query string stays valid.
  const embed = new URL(url);
  if (provider === 'cal') {
    embed.searchParams.set('embed', 'true');
    embed.searchParams.set('theme', 'light');
  } else {
    embed.searchParams.set('embed_type', 'inline');
  }
  return embed.href;
}

function getProviderName(url: string): string {
  const provider = getProvider(url);
  if (provider === 'cal') {
    return 'Cal.com';
  }
  if (provider === 'calendly') {
    return 'Calendly';
  }
  return 'Calendar';
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
    <div className="flex h-full w-full flex-col p-6">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50">
        <Calendar className="h-5 w-5 text-foreground" />
      </div>
      <div className="mt-auto space-y-1">
        <p className="font-cal text-base leading-tight">{title}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
            onClick={onBookClick}
          >
            <Calendar className="h-3.5 w-3.5" />
            Book a time
          </button>
          <span className="text-muted-foreground/60 text-xs">
            via {provider}
          </span>
        </div>
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
  const [editOpen, setEditOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [url, setUrl] = useState(bento.url ?? '');
  const [title, setTitle] = useState(bento.title ?? '');
  const [description, setDescription] = useState(bento.description ?? '');

  const { saveBento, isPending } = useSaveBento();

  const handleSave = async () => {
    const saved = await saveBento({
      ...bento,
      url: url || '',
      title: title || undefined,
      description: description || undefined,
    });
    if (!saved) {
      return;
    }
    setEditOpen(false);
  };

  const cardSize = useCardSize(bento);
  const embedUrl = getEmbedUrl(bento.url);

  return (
    <>
      <div
        className={cn(
          'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-card shadow-sm',
          editable
            ? 'transition-transform duration-200 ease-in-out md:cursor-move'
            : 'hover:-translate-y-0.5 transition-all duration-200 hover:border-border/80 hover:shadow-md'
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
            compact={cardSize === '2x2'}
          />
        </div>

        {editable && (
          <button
            type="button"
            aria-label="Edit card"
            className="absolute top-3 right-3 z-50 cursor-pointer rounded-lg border border-border/50 bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground focus-visible:opacity-100 group-hover:opacity-100"
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
            <DialogTitle className="flex items-center justify-between font-cal text-xl">
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
            <DialogTitle className="font-cal text-xl">
              Edit Booking Card
            </DialogTitle>
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

            <Button
              onClick={handleSave}
              disabled={isPending}
              className="w-full rounded-xl"
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
