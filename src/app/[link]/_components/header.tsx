"use client";

import { useEffect, useState, useTransition } from "react";
import { useEditor, EditorContent, type Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { QrCode } from "lucide-react";

import { type RouterOutputs, api } from "@/trpc/react";
import LinkQRModal from "@/components/modals/link-qr-modal";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import ProfileLinkAvatar from "./avatar";

type Props = {
  profileLink: NonNullable<RouterOutputs["profileLink"]["getByLink"]>;
};

const extensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: "Tell us about yourself!",
    showOnlyWhenEditable: true,
  }),
] as Extension[];

export default function ProfileLinkHeader({
  profileLink: initialProfileLink,
}: Props) {
  const { data: profileLink } = api.profileLink.getByLink.useQuery(
    {
      link: initialProfileLink.link,
    },
    {
      initialData: initialProfileLink,
    }
  );

  const [name, setName] = useState(initialProfileLink.name);
  const [bio, setBio] = useState(initialProfileLink.bio);
  const [saving, startSaving] = useTransition();

  const { mutateAsync: updateProfileLink } =
    api.profileLink.update.useMutation();

  useEffect(() => {
    if (!profileLink?.isOwner) return;

    const save = () => {
      startSaving(async () => {
        await updateProfileLink({
          id: profileLink.id,
          name,
          bio: bio ?? undefined,
        });
      });
    };

    void save();
  }, [name, bio, startSaving, updateProfileLink, profileLink]);

  const editor = useEditor({
    extensions,
    content: profileLink?.bio,
    editorProps: {
      attributes: {
        class:
          "focus:outline-none dark:prose-invert prose-p:text-foreground prose-headings:font-cal mx-auto lg:prose-lg lg:prose-p:m-0",
      },
    },
    editable: profileLink?.isOwner,
    onUpdate: ({ editor }) => {
      setBio(editor.getHTML());
    },
  });

  if (!profileLink) return null;

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-start justify-between">
        <ProfileLinkAvatar profileLink={initialProfileLink} />

        {profileLink.isOwner && (
          <div className="flex flex-row items-center gap-x-4">
            <Button
              disabled={saving}
              onClick={() => {
                void navigator.clipboard.writeText(
                  `https://openbio.app/${profileLink.link}`
                );
                toast({
                  title: "Copied to clipboard!",
                  description: "Copied profile link to clipboard!",
                });
              }}
            >
              {saving ? "Saving..." : "Share"}
            </Button>

            <LinkQRModal profileLink={profileLink}>
              <Button size="icon" variant="outline" disabled={saving}>
                <QrCode className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </LinkQRModal>
          </div>
        )}
      </div>

      <input
        className="bg-transparent font-cal text-3xl font-bold text-foreground outline-none focus:outline-none md:text-4xl lg:text-6xl"
        defaultValue={profileLink.name}
        onChange={(e) => setName(e.target.value)}
        readOnly={!profileLink.isOwner}
      />

      <EditorContent editor={editor} />
    </div>
  );
}
