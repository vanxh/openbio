'use client';

import Image from '@/components/ui/remote-image';
import { toast } from '@/components/ui/use-toast';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '@/lib/upload-limits';
import { cn } from '@/lib/utils';
import type { RouterOutputs } from '@/trpc/react';
import { UploadCloud } from 'lucide-react';
import { useCallback, useState } from 'react';
import { type FileWithPath, useDropzone } from 'react-dropzone';

type Props = {
  profileLink: NonNullable<RouterOutputs['profileLink']['getByLink']>;
};

export default function ProfileLinkAvatar({ profileLink }: Props) {
  const [img, setImg] = useState(profileLink.image);

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast({
          title: 'Image too large',
          description: `Choose an image of ${MAX_UPLOAD_LABEL} or less.`,
          variant: 'destructive',
        });
        return;
      }

      setImg(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('profileLinkId', profileLink.id);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          throw new Error(data.error ?? 'Upload failed');
        }
        setImg(data.url);
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Upload failed',
        });
        setImg(profileLink.image ?? '/openbio.png');
      }
    },
    [profileLink.id, profileLink.image]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/png': [], 'image/jpeg': [], 'image/webp': [] },
    multiple: false,
  });

  if (!profileLink.isOwner && !profileLink.image) {
    return null;
  }

  return (
    <div
      {...(profileLink.isOwner ? getRootProps() : {})}
      className={cn(
        'flex h-[100px] w-[100px] flex-col items-center justify-center gap-y-1 rounded-full border border-border bg-background/50 shadow-lg ring-4 ring-background md:h-[150px] md:w-[150px]',
        !profileLink.image && profileLink.isOwner && 'border-dashed',
        profileLink.isOwner && 'cursor-pointer',
        img && 'border-0 border-transparent bg-transparent'
      )}
    >
      {img && (
        <Image
          key={img}
          src={img}
          alt={`${profileLink.name}'s profile picture`}
          width={150}
          height={150}
          priority
          className="max-h-full max-w-full rounded-full object-cover"
        />
      )}

      {profileLink.isOwner && !img && (
        <>
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="font-semibold text-muted-foreground text-sm">Upload</p>
        </>
      )}

      {profileLink.isOwner && <input {...getInputProps()} />}
    </div>
  );
}
