'use client';

import CardOverlay from '@/components/bento/overlay';
import { AppleMusic } from '@/components/icons/apple-music';
import { Spotify } from '@/components/icons/spotify';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { MusicBentoSchema } from '@/types';
import { ExternalLink, Music, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import type * as z from 'zod';

type BentoData = z.infer<typeof MusicBentoSchema>;

export const MUSIC_CARD_SIZES = ['2x2', '4x2'] as const;

function ProviderIcon({ provider }: { provider: 'spotify' | 'apple' }) {
  if (provider === 'spotify') {
    return <Spotify className="h-5 w-5" />;
  }
  return <AppleMusic className="h-5 w-5 rounded" />;
}

function MusicDisplay({
  url,
  compact,
}: {
  url: string;
  compact?: boolean;
}) {
  const { data: metadata, isLoading } =
    api.profileLink.getMusicMetadata.useQuery(
      { url },
      { enabled: !!url, staleTime: 60_000 * 60 }
    );

  if (!url) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
        <Music
          className={cn(
            'text-muted-foreground/40',
            compact ? 'h-6 w-6' : 'h-8 w-8'
          )}
        />
        <p className="text-muted-foreground text-xs">
          {compact ? 'Add a song' : 'Paste a Spotify or Apple Music link'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center gap-3 p-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full w-full flex-col p-5"
      >
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50">
          <Music className="h-5 w-5 text-foreground" />
        </div>
        <div className="mt-auto">
          <p className="font-cal text-sm leading-tight">Listen</p>
          <p className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
            Open <ExternalLink className="h-3 w-3" />
          </p>
        </div>
      </a>
    );
  }

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex h-full w-full overflow-hidden rounded-2xl"
      >
        {/* Blurred background */}
        <div className="absolute inset-0">
          <Image
            src={metadata.artwork}
            alt=""
            fill
            className="object-cover blur-2xl brightness-50 saturate-150"
            sizes="200px"
          />
        </div>

        {/* Content */}
        <div className="relative flex h-full w-full items-center gap-3 p-4">
          <Image
            src={metadata.artwork}
            alt={metadata.title}
            width={80}
            height={80}
            className="h-20 w-20 shrink-0 rounded-lg object-cover shadow-lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-cal text-sm text-white">
              {metadata.title}
            </p>
            {metadata.artist && (
              <p className="mt-0.5 truncate text-white/70 text-xs">
                {metadata.artist}
              </p>
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <ProviderIcon provider={metadata.provider} />
              <span className="text-white/50 text-xs">
                {metadata.provider === 'spotify' ? 'Spotify' : 'Apple Music'}
              </span>
            </div>
          </div>
        </div>
      </a>
    );
  }

  // Wide (4x2) layout
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex h-full w-full overflow-hidden rounded-2xl"
    >
      {/* Blurred background */}
      <div className="absolute inset-0">
        <Image
          src={metadata.artwork}
          alt=""
          fill
          className="object-cover blur-3xl brightness-[0.35] saturate-150"
          sizes="500px"
        />
      </div>

      {/* Content */}
      <div className="relative flex h-full w-full items-center gap-5 p-5">
        <Image
          src={metadata.artwork}
          alt={metadata.title}
          width={140}
          height={140}
          className="h-full max-h-36 w-auto shrink-0 rounded-xl object-cover shadow-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-cal text-lg text-white">
            {metadata.title}
          </p>
          {metadata.artist && (
            <p className="mt-1 truncate text-sm text-white/70">
              {metadata.artist}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <ProviderIcon provider={metadata.provider} />
            <span className="text-white/50 text-xs">
              Listen on{' '}
              {metadata.provider === 'spotify' ? 'Spotify' : 'Apple Music'}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function MusicCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [url, setUrl] = useState(bento.url ?? '');

  const queryClient = api.useContext();
  const { mutateAsync: updateBento, isPending } =
    api.profileLink.updateBento.useMutation();

  const handleSave = async () => {
    queryClient.profileLink.getByLink.setData({ link: params.link }, (old) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        bento: old.bento.map((b) =>
          b.id === bento.id ? { ...b, url: url || '' } : b
        ),
      };
    });

    await updateBento({
      link: params.link,
      bento: { ...bento, url: url || '' },
    });
    setEditOpen(false);
  };

  const mdSize = bento.size.md ?? '2x2';
  const isCompact = mdSize === '2x2';

  // Preview in edit modal
  const previewUrl = url || '';
  const { data: previewMetadata } = api.profileLink.getMusicMetadata.useQuery(
    { url: previewUrl },
    { enabled: !!previewUrl && editOpen, staleTime: 60_000 * 60 }
  );

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
          <CardOverlay bento={bento} allowedSizes={MUSIC_CARD_SIZES} />
        )}

        <MusicDisplay url={bento.url} compact={isCompact} />

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
            <DialogTitle className="font-cal">Edit Music Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="music-url" className="font-medium text-sm">
                Song or Playlist URL
              </Label>
              <Input
                id="music-url"
                placeholder="https://open.spotify.com/track/... or https://music.apple.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-muted-foreground text-xs">
                Paste a Spotify or Apple Music link
              </p>
            </div>

            {previewMetadata && (
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Image
                  src={previewMetadata.artwork}
                  alt={previewMetadata.title}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    {previewMetadata.title}
                  </p>
                  {previewMetadata.artist && (
                    <p className="truncate text-muted-foreground text-xs">
                      {previewMetadata.artist}
                    </p>
                  )}
                </div>
                <ProviderIcon provider={previewMetadata.provider} />
              </div>
            )}

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
