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
import type { AssetBentoSchema } from '@/types';
import { ImagePlus, Pencil } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ChangeEvent, RefObject } from 'react';
import { useCallback, useRef, useState } from 'react';
import type { FileWithPath } from 'react-dropzone';
import type * as z from 'zod';

type BentoData = z.infer<typeof AssetBentoSchema>;

export const IMAGE_CARD_SIZES = ['2x2', '4x1', '4x2', '2x4', '4x4'] as const;

function getUploadButtonLabel(uploading: boolean, hasImage: boolean) {
  if (uploading) {
    return 'Uploading...';
  }
  if (hasImage) {
    return 'Replace Image';
  }
  return 'Upload Image';
}

function ImageEditModal({
  open,
  onOpenChange,
  modalImgUrl,
  caption,
  setCaption,
  href,
  setHref,
  uploading,
  onUploadClick,
  onSave,
  fileInputRef,
  onFileChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modalImgUrl: string;
  caption: string;
  setCaption: (v: string) => void;
  href: string;
  setHref: (v: string) => void;
  uploading: boolean;
  onUploadClick: () => void;
  onSave: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-cal">Edit Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {modalImgUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border">
              <Image
                src={modalImgUrl}
                alt="Preview"
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border border-dashed bg-muted/50">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={onFileChange}
          />

          <Button
            variant="outline"
            className="w-full rounded-xl"
            disabled={uploading}
            onClick={onUploadClick}
          >
            {getUploadButtonLabel(uploading, !!modalImgUrl)}
          </Button>

          <div className="space-y-2">
            <Label htmlFor="caption" className="font-medium text-sm">
              Caption
            </Label>
            <Input
              id="caption"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="rounded-xl border border-border bg-card p-3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-href" className="font-medium text-sm">
              Link URL
            </Label>
            <Input
              id="image-href"
              placeholder="https://example.com"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              className="rounded-xl border border-border bg-card p-3"
            />
          </div>

          <Button
            className="w-full rounded-xl"
            onClick={onSave}
            disabled={uploading}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  const [editOpen, setEditOpen] = useState(false);
  const [modalImgUrl, setModalImgUrl] = useState(bento.url || '');
  const [caption, setCaption] = useState(bento.caption ?? '');
  const [href, setHref] = useState(bento.href ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: updateBento } =
    api.profileLink.updateBento.useMutation();

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      setUploading(true);
      setModalImgUrl(URL.createObjectURL(file));

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
        setModalImgUrl(data.url);
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Upload failed',
        });
        setModalImgUrl(bento.url || '');
      } finally {
        setUploading(false);
      }
    },
    [bento.url]
  );

  const handleSave = async () => {
    setImgUrl(modalImgUrl);
    await updateBento({
      link: params.link,
      bento: {
        ...bento,
        url: modalImgUrl,
        caption: caption || undefined,
        href: href || undefined,
      },
    });
    setEditOpen(false);
  };

  const handleOpenEdit = () => {
    setModalImgUrl(imgUrl || bento.url || '');
    setCaption(bento.caption ?? '');
    setHref(bento.href ?? '');
    setEditOpen(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDrop([file as FileWithPath]);
    }
  };

  const mdSize = bento.size.md ?? '2x2';
  const isBanner = mdSize === '4x1';
  const hasImage = !!imgUrl;

  return (
    <>
      {!hasImage && editable && (
        <EmptyEditableCard
          bento={bento}
          uploading={uploading}
          onEdit={handleOpenEdit}
        />
      )}

      {hasImage && (
        <ImageDisplay
          bento={bento}
          imgUrl={imgUrl}
          editable={editable}
          uploading={uploading}
          isBanner={isBanner}
          onEdit={handleOpenEdit}
        />
      )}

      <ImageEditModal
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
        }}
        modalImgUrl={modalImgUrl}
        caption={caption}
        setCaption={setCaption}
        href={href}
        setHref={setHref}
        uploading={uploading}
        onUploadClick={() => fileInputRef.current?.click()}
        onSave={handleSave}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
      />
    </>
  );
}

function EmptyEditableCard({
  bento,
  uploading,
  onEdit,
}: {
  bento: BentoData;
  uploading: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="group relative z-0 flex h-full w-full select-none flex-col items-center justify-center gap-y-2 rounded-2xl border border-border border-dashed bg-card/50 shadow-sm transition-transform duration-200 ease-in-out md:cursor-move">
      <CardOverlay bento={bento} allowedSizes={IMAGE_CARD_SIZES} />
      <ImagePlus className="h-6 w-6 text-muted-foreground" />
      <p className="text-muted-foreground text-xs">
        {uploading ? 'Uploading...' : 'No image'}
      </p>
      <button
        type="button"
        className="absolute right-3 bottom-3 z-50 cursor-pointer rounded-lg border border-border/50 bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}

function ImageDisplay({
  bento,
  imgUrl,
  editable,
  uploading,
  isBanner,
  onEdit,
}: {
  bento: BentoData;
  imgUrl: string;
  editable?: boolean;
  uploading: boolean;
  isBanner: boolean;
  onEdit: () => void;
}) {
  const hasLink = !!bento.href && !editable;

  const content = (
    <div
      className={cn(
        'group relative z-0 h-full w-full select-none rounded-2xl border border-border bg-card shadow-sm',
        editable
          ? 'transition-transform duration-200 ease-in-out md:cursor-move'
          : 'hover:-translate-y-0.5 transition-all duration-200 hover:border-border/80 hover:shadow-md',
        uploading && 'opacity-50'
      )}
    >
      {editable && (
        <CardOverlay bento={bento} allowedSizes={IMAGE_CARD_SIZES} />
      )}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <Image
          src={imgUrl}
          alt={bento.caption ?? 'Image'}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
        {bento.caption && !isBanner && (
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-3">
            <p className="font-medium text-sm text-white">{bento.caption}</p>
          </div>
        )}
      </div>

      {editable && (
        <button
          type="button"
          className="absolute right-3 bottom-3 z-50 cursor-pointer rounded-lg border border-border/50 bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (hasLink) {
    return (
      <Link
        href={bento.href as string}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full w-full"
      >
        {content}
      </Link>
    );
  }

  return content;
}
