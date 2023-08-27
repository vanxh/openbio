"use client";

import { useEffect, useState } from "react";
import { type ProfileLink } from "@prisma/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { toast } from "./ui/use-toast";

const extensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: "Tell us about yourself!",
    showOnlyWhenEditable: true,
  }),
];

export default function ProfileLinkEditor({
  profileLink,
}: {
  profileLink: ProfileLink & {
    isOwner: boolean;
  };
}) {
  const nameClass =
    "focus:outline-none text-foreground text-2xl font-bold md:text-4xl lg:text-6xl font-cal bg-transparent outline-none";
  const editorClass =
    "focus:outline-none dark:prose-invert prose-p:text-foreground prose-headings:font-cal mx-auto lg:prose-lg";

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
        <div className="h-[100px] w-[100px] rounded-full border border-dashed border-border bg-background/50"></div>

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
