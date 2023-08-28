"use client";

import { useCallback, useEffect, useState } from "react";
import { type ProfileLink } from "@prisma/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useDropzone } from "react-dropzone";
import type { FileWithPath } from "react-dropzone";
import { UploadCloud } from "lucide-react";

import { api } from "@/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { generateClientDropzoneAccept } from "uploadthing/client";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  profileLink: ProfileLink & {
    isOwner: boolean;
  };
};

const extensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: "Tell us about yourself!",
    showOnlyWhenEditable: true,
  }),
];

function ProfileLinkAvatar({ profileLink }: Props) {
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
          className="rounded-full object-cover"
        />
      )}

      {profileLink.isOwner && !profileLink.image && (
        <>
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-muted-foreground">Upload</p>
        </>
      )}

      {profileLink.isOwner && <input {...getInputProps()} />}
    </div>
  );
}

export default function ProfileLinkEditor({ profileLink }: Props) {
  const nameClass =
    "focus:outline-none text-foreground text-3xl font-bold md:text-4xl lg:text-6xl font-cal bg-transparent outline-none";
  const editorClass =
    "focus:outline-none dark:prose-invert prose-p:text-foreground prose-headings:font-cal mx-auto lg:prose-lg lg:prose-p:m-0";

  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profileLink.name);
  const [bio, setBio] = useState(profileLink.bio);

  const debouncedName = useDebounce(name, 500);
  useEffect(() => {
    if (!profileLink.isOwner) return;

    setSaving(true);
    api.profileLink.updateProfileLink
      .mutate({
        link: profileLink.link,
        name: debouncedName,
      })
      .then(() => null)
      .catch((_) => null)
      .finally(() => {
        setSaving(false);
      });
  }, [debouncedName, profileLink.isOwner, profileLink.link, profileLink.name]);

  const debouncedBio = useDebounce(bio, 500);
  useEffect(() => {
    if (!profileLink.isOwner) return;

    setSaving(true);
    api.profileLink.updateProfileLink
      .mutate({
        link: profileLink.link,
        bio: debouncedBio ?? undefined,
      })
      .then(() => null)
      .catch((_) => null)
      .finally(() => {
        setSaving(false);
      });
  }, [debouncedBio, profileLink.isOwner, profileLink.link, profileLink.bio]);

  const editor = useEditor({
    extensions,
    content: profileLink.bio,
    editorProps: {
      attributes: {
        class: editorClass,
      },
    },
    editable: profileLink.isOwner,
    onUpdate: ({ editor }) => {
      setBio(editor.getHTML());
    },
  });

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-start justify-between">
        <ProfileLinkAvatar profileLink={profileLink} />

        {profileLink.isOwner && (
          <Button
            disabled={saving}
            onClick={() => {
              void navigator.clipboard.writeText(
                `https://openbio.app/${profileLink.link}`
              );
              toast({
                title: "Copied!",
                description: "Copied profile link to clipboard!",
              });
            }}
          >
            {saving ? "Saving..." : "Share"}
          </Button>
        )}
      </div>

      <input
        className={nameClass}
        defaultValue={profileLink.name}
        onChange={(e) => setName(e.target.value)}
        readOnly={!profileLink.isOwner}
      />

      <EditorContent editor={editor} />
    </div>
  );
}
