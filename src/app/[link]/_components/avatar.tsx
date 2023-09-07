"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone, type FileWithPath } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { generateClientDropzoneAccept } from "uploadthing/client";

import { type RouterOutputs } from "@/trpc/react";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Props = {
  profileLink: NonNullable<RouterOutputs["profileLink"]["getByLink"]>;
};

export default function ProfileLinkAvatar({ profileLink }: Props) {
  const [img, setImg] = useState(profileLink.image);

  const { startUpload } = useUploadThing("profileLinkImageUploader", {
    onClientUploadComplete: (data) => {
      if (!data?.[0]) return;
      setImg(data[0]?.url);
    },
    onUploadError: (err) => {
      toast({
        title: "Error",
        description: err.message,
      });
      setImg(profileLink.image ?? "/openbio.png");
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      void startUpload(acceptedFiles, {
        profileLinkId: profileLink.id,
      });
      setImg(URL.createObjectURL(acceptedFiles[0]!));
    },
    [profileLink.id, startUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(["image/png", "image/jpeg"]),
  });

  if (!profileLink.isOwner && !profileLink.image) return null;

  return (
    <div
      {...(profileLink.isOwner ? getRootProps() : {})}
      className={cn(
        "flex h-[100px] w-[100px] flex-col items-center justify-center gap-y-1 rounded-full border border-border bg-background/50 md:h-[150px] md:w-[150px]",
        !profileLink.image && profileLink.isOwner && "border-dashed",
        profileLink.isOwner && "cursor-pointer",
        img && "border-0 border-transparent bg-transparent"
      )}
    >
      {img && (
        <Image
          key={img}
          src={img}
          alt="Profile link image"
          width={150}
          height={150}
          className="max-h-full max-w-full rounded-full object-cover"
        />
      )}

      {profileLink.isOwner && !img && (
        <>
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-muted-foreground">Upload</p>
        </>
      )}

      {profileLink.isOwner && <input {...getInputProps()} />}
    </div>
  );
}
