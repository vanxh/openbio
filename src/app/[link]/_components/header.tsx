'use client';

import LinkQRModal from '@/components/modals/link-qr-modal';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import VerifiedBadge from '@/components/verified-badge';
import { type RouterOutputs, api } from '@/trpc/react';
import Highlight from '@tiptap/extension-highlight';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import TiptapUnderline from '@tiptap/extension-underline';
import { EditorContent, type Extension, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Eye,
  Monitor,
  PenLine,
  QrCode,
  Share2,
  Smartphone,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import ProfileLinkAvatar from './avatar';
import BioToolbar from './bio-toolbar';
import { usePreview } from './preview-context';

const extensions = [
  StarterKit.configure({
    link: false,
    underline: false,
  }),
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

type ProfileLinkData = NonNullable<RouterOutputs['profileLink']['getByLink']>;

export default function ProfileLinkHeader({
  profileLink: initialData,
}: { profileLink: ProfileLinkData }) {
  const { link } = useParams<{ link: string }>();

  const [profileLink] = api.profileLink.getByLink.useSuspenseQuery(
    { link },
    { initialData, staleTime: 60_000 }
  );

  const [name, setName] = useState(profileLink?.name);
  const [bio, setBio] = useState(profileLink?.bio);
  const [saving, startSaving] = useTransition();

  const { mutateAsync: updateProfileLink } =
    api.profileLink.update.useMutation();

  useEffect(() => {
    if (!profileLink?.isOwner) {
      return;
    }

    const timer = setTimeout(() => {
      startSaving(async () => {
        await updateProfileLink({
          id: profileLink.id,
          name,
          bio: bio ?? undefined,
        });
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [name, bio, updateProfileLink, profileLink]);

  const { preview, setPreview, viewport, setViewport } = usePreview();

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
    editable: profileLink?.isOwner && !preview,
    onUpdate: ({ editor }) => {
      setBio(editor.getHTML());
    },
  });

  if (!profileLink) {
    return null;
  }

  const isEditable = profileLink.isOwner && !preview;

  return (
    <div className="flex flex-col gap-y-4" data-tour="profile-header">
      <div className="flex items-start justify-between">
        <ProfileLinkAvatar profileLink={profileLink} />

        {profileLink.isOwner && (
          <div className="flex flex-row flex-wrap items-center justify-end gap-2">
            <Button
              size="icon"
              variant={preview ? 'default' : 'outline'}
              onClick={() => setPreview(!preview)}
              data-tour="preview-toggle"
            >
              {preview ? (
                <PenLine className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Eye className="h-[1.2rem] w-[1.2rem]" />
              )}
            </Button>

            {!preview && (
              <>
                <div
                  className="hidden items-center rounded-md border border-border md:flex"
                  data-tour="viewport-switcher"
                >
                  <Button
                    size="icon"
                    variant={viewport === 'desktop' ? 'default' : 'ghost'}
                    className="rounded-r-none"
                    onClick={() => setViewport('desktop')}
                  >
                    <Monitor className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewport === 'mobile' ? 'default' : 'ghost'}
                    className="rounded-l-none"
                    onClick={() => setViewport('mobile')}
                  >
                    <Smartphone className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </div>

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
              </>
            )}
          </div>
        )}

        {!profileLink.isOwner && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `https://openbio.app/${profileLink.link}`;
                if (navigator.share) {
                  navigator
                    .share({
                      title: profileLink.name ?? 'OpenBio Profile',
                      url,
                    })
                    .catch(() => undefined);
                } else {
                  navigator.clipboard
                    .writeText(url)
                    .then(() => {
                      toast({
                        title: 'Copied to clipboard!',
                        description: 'Profile link copied!',
                      });
                    })
                    .catch(() => undefined);
                }
              }}
            >
              <Share2 className="mr-1.5 h-4 w-4" />
              Share
            </Button>
            <LinkQRModal profileLink={profileLink}>
              <Button size="icon" variant="outline" className="h-9 w-9">
                <QrCode className="h-4 w-4" />
              </Button>
            </LinkQRModal>
          </div>
        )}
      </div>

      <div className="flex items-center gap-x-2">
        <input
          className="min-w-0 shrink bg-transparent font-cal text-3xl text-foreground outline-none focus:outline-none md:text-4xl lg:text-6xl"
          defaultValue={profileLink.name}
          onChange={(e) => setName(e.target.value)}
          readOnly={!isEditable}
          size={Math.max((name ?? profileLink.name ?? '').length, 1)}
        />
        {profileLink.isPremium && <VerifiedBadge />}
      </div>

      <div className="group/bio relative">
        <EditorContent editor={editor} />
        {isEditable && editor && (
          <div className="invisible absolute left-0 z-40 mt-1 group-focus-within/bio:visible">
            <BioToolbar
              editor={editor}
              isPremium={!!profileLink.isPremium}
              name={profileLink.name ?? ''}
              links={profileLink.bento
                .filter((b) => b.type === 'link' && 'href' in b)
                .map((b) => (b as { href: string }).href)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
