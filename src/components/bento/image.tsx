'use client';

import CardOverlay from '@/components/bento/overlay';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { AssetBentoSchema } from '@/types';
import { ImagePlus } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import type { FileWithPath } from 'react-dropzone';
import type * as z from 'zod';

type BentoData = z.infer<typeof AssetBentoSchema>;

export const IMAGE_CARD_SIZES = ['2x2', '4x1', '4x2', '2x4', '4x4'] as const;

export default function ImageCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [imgUrl, setImgUrl] = useState(bento.url || '');
  const [uploading, setUploading] = useState(false);

  const { mutateAsync: updateBento } =
    api.profileLink.updateBento.useMutation();

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      setUploading(true);
      setImgUrl(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload/bento-image', {
          method: 'POST',
          body: formData,
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          throw new Error(data.error ?? 'Upload failed');
        }
        setImgUrl(data.url);
        await updateBento({
          link: params.link,
          bento: { ...bento, url: data.url },
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Upload failed',
        });
        setImgUrl(bento.url || '');
      } finally {
        setUploading(false);
      }
    },
    [bento, params.link, updateBento]
  );

  const mdSize = bento.size.md ?? '2x2';
  const isBanner = mdSize === '4x1';
  const hasImage = !!imgUrl;

  // Empty state: show placeholder with upload label on hover/tap
  if (!hasImage && editable) {
    const inputId = `bento-image-${bento.id}`;
    return (
      <div className="group relative z-0 flex h-full w-full select-none flex-col items-center justify-center gap-y-2 rounded-2xl border border-border border-dashed bg-card/50 shadow-sm transition-transform duration-200 ease-in-out md:cursor-move">
        <CardOverlay bento={bento} allowedSizes={IMAGE_CARD_SIZES} />
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onDrop([file as FileWithPath]);
            }
          }}
        />
        <ImagePlus className="h-6 w-6 text-muted-foreground" />
        <p className="text-muted-foreground text-xs">
          {uploading ? 'Uploading...' : 'No image'}
        </p>
        <label
          htmlFor={inputId}
          className="absolute bottom-3 z-50 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ImagePlus className="h-4 w-4" />
        </label>
      </div>
    );
  }

  // Empty state: not editable, no image
  if (!hasImage) {
    return null;
  }

  // Image exists
  return (
    <div
      className={cn(
        'group relative z-0 h-full w-full select-none rounded-2xl border border-border/50 bg-card shadow-sm',
        editable
          ? 'transition-transform duration-200 ease-in-out md:cursor-move'
          : 'transition-all duration-200 hover:shadow-md',
        uploading && 'opacity-50'
      )}
    >
      {editable && (
        <CardOverlay bento={bento} allowedSizes={IMAGE_CARD_SIZES} />
      )}
      {/* Separate clipping container for image only */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <Image
          src={imgUrl}
          alt={bento.caption ?? 'Image'}
          fill
          className="object-cover"
        />
        {bento.caption && !isBanner && (
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-3">
            <p className="font-medium text-sm text-white">{bento.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
