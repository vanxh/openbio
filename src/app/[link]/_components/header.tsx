'use client';

import LinkQRModal from '@/components/modals/link-qr-modal';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import VerifiedBadge from '@/components/verified-badge';
import { getErrorMessage } from '@/lib/errors';
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
import { useEffect, useRef, useState, useTransition } from 'react';
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

type HeaderFields = { name?: string | null; bio?: string | null };

/**
 * The fields that differ from what the server holds, or null when nothing
 * needs saving. An emptied name is skipped: the last real one stays until
 * something is typed.
 */
function getUnsavedChanges(
  current: HeaderFields,
  saved: HeaderFields
): { name?: string; bio?: string } | null {
  const changes: { name?: string; bio?: string } = {};

  if (current.name?.trim() && current.name !== saved.name) {
    changes.name = current.name;
  }
  if (current.bio != null && current.bio !== saved.bio) {
    changes.bio = current.bio;
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

export default function ProfileLinkHeader({
  profileLink: initialData,
}: { profileLink: ProfileLinkData }) {
  const { link } = useParams<{ link: string }>();

  const { data: profileLink } = api.profileLink.getByLink.useQuery(
    { link },
    { initialData, staleTime: 60_000 }
  );

  const [name, setName] = useState(profileLink?.name);
  const [bio, setBio] = useState(profileLink?.bio);
  const [saving, startSaving] = useTransition();

  // What the server currently holds. Autosave sends only fields that differ
  // from this, so merely opening the page never writes anything.
  const saved = useRef({ name: profileLink?.name, bio: profileLink?.bio });

  const utils = api.useUtils();
  const { mutateAsync: updateProfileLink } =
    api.profileLink.update.useMutation();

  const profileLinkId = profileLink?.id;
  const isOwner = !!profileLink?.isOwner;

  useEffect(() => {
    if (!(isOwner && profileLinkId)) {
      return;
    }

    const changes = getUnsavedChanges({ name, bio }, saved.current);
    if (!changes) {
      return;
    }

    const timer = setTimeout(() => {
      startSaving(async () => {
        try {
          await updateProfileLink({ id: profileLinkId, ...changes });
          saved.current = { ...saved.current, ...changes };
          // Keep the cached profile in step, so nothing reading it (the AI
          // tools, the bio sync below) ever sees the pre-edit text.
          utils.profileLink.getByLink.setData({ link }, (old) =>
            old ? { ...old, ...changes } : old
          );
        } catch (err) {
          toast({
            title: "Couldn't save your profile",
            description: getErrorMessage(err),
            variant: 'destructive',
          });
        }
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [name, bio, updateProfileLink, profileLinkId, isOwner, link, utils]);

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

  // The bio can change underneath the editor (the AI profile builder writes
  // it directly). Adopt the server's copy unless the owner is mid-edit.
  const serverBio = profileLink?.bio;
  useEffect(() => {
    if (!editor || serverBio == null || editor.isFocused) {
      return;
    }
    if (serverBio !== saved.current.bio) {
      saved.current.bio = serverBio;
      setBio(serverBio);
      editor.commands.setContent(serverBio, { emitUpdate: false });
    }
  }, [editor, serverBio]);

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
          maxLength={100}
          aria-label="Display name"
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
