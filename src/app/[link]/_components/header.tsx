'use client';

import LinkQRModal from '@/components/modals/link-qr-modal';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import VerifiedBadge from '@/components/verified-badge';
import { api } from '@/trpc/react';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import TiptapUnderline from '@tiptap/extension-underline';
import { EditorContent, type Extension, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { QrCode } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import ProfileLinkAvatar from './avatar';
import BioToolbar from './bio-toolbar';

const extensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: 'Tell us about yourself!',
    showOnlyWhenEditable: true,
  }),
  TiptapLink.configure({ openOnClick: false }),
  TiptapUnderline,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
] as Extension[];

export default function ProfileLinkHeader() {
  const { link } = useParams<{ link: string }>();

  const [profileLink] = api.profileLink.getByLink.useSuspenseQuery({
    link,
  });

  const [name, setName] = useState(profileLink?.name);
  const [bio, setBio] = useState(profileLink?.bio);
  const [saving, startSaving] = useTransition();

  const { mutateAsync: updateProfileLink } =
    api.profileLink.update.useMutation();

  useEffect(() => {
    if (!profileLink?.isOwner) {
      return;
    }

    const save = () => {
      startSaving(async () => {
        await updateProfileLink({
          id: profileLink.id,
          name,
          bio: bio ?? undefined,
        });
      });
    };

    save();
  }, [name, bio, updateProfileLink, profileLink]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: profileLink?.bio,
    editorProps: {
      attributes: {
        class:
          'focus:outline-none dark:prose-invert prose-p:text-foreground prose-headings:font-cal mx-auto lg:prose-lg lg:prose-p:m-0',
      },
    },
    editable: profileLink?.isOwner,
    onUpdate: ({ editor }) => {
      setBio(editor.getHTML());
    },
  });

  if (!profileLink) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-start justify-between">
        <ProfileLinkAvatar profileLink={profileLink} />

        {profileLink.isOwner && (
          <div className="flex flex-row items-center gap-x-4">
            <Button
              disabled={saving}
              onClick={() => {
                navigator.clipboard
                  .writeText(`https://openbio.app/${profileLink.link}`)
                  .then(() => {
                    toast({
                      title: 'Copied to clipboard!',
                      description: 'Copied profile link to clipboard!',
                    });
                  })
                  .catch(() => undefined);
              }}
            >
              {saving ? 'Saving...' : 'Share'}
            </Button>

            <LinkQRModal profileLink={profileLink}>
              <Button size="icon" variant="outline" disabled={saving}>
                <QrCode className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </LinkQRModal>
          </div>
        )}
      </div>

      <div className="flex items-center gap-x-2">
        <input
          className="bg-transparent font-cal text-3xl text-foreground outline-none focus:outline-none md:text-4xl lg:text-6xl"
          defaultValue={profileLink.name}
          onChange={(e) => setName(e.target.value)}
          readOnly={!profileLink.isOwner}
        />
        {profileLink.isPremium && <VerifiedBadge />}
      </div>

      {profileLink.isOwner && editor && (
        <BioToolbar editor={editor} isPremium={!!profileLink.isPremium} />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
