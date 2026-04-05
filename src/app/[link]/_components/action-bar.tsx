'use client';

import ProfileBuilder from '@/components/ai/profile-builder';
import CreateLinkBentoModal from '@/components/modals/create-link-bento';
import CustomDomainModal from '@/components/modals/custom-domain';
import ThemeSettingsModal from '@/components/modals/theme-settings';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { api } from '@/trpc/react';
import {
  ArrowLeft,
  Calendar,
  CloudSun,
  Eye,
  EyeOff,
  Globe,
  ImagePlus,
  Link,
  Mail,
  MapPin,
  Music,
  Palette,
  Plus,
  Redo2,
  Sparkles,
  Timer,
  Type,
  Undo2,
} from 'lucide-react';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useBentoHistory } from './bento-history';
import { usePreview } from './preview-context';

export default function ActionBar() {
  const { preview } = usePreview();
  const { pushSnapshot, canUndo, canRedo, undo, redo } = useBentoHistory();
  const { link } = useParams<{ link: string }>();
  const queryClient = api.useContext();
  const { data: profileLink } = api.profileLink.getByLink.useQuery({ link });
  const [addOpen, setAddOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const { mutate: updateProfileLink } = api.profileLink.update.useMutation({
    onSuccess: () => {
      queryClient.profileLink.getByLink.invalidate({ link });
    },
  });

  const { mutateAsync: createBento } = api.profileLink.createBento.useMutation({
    onMutate: async (input) => {
      await queryClient.profileLink.getByLink.cancel({ link });
      const previous = queryClient.profileLink.getByLink.getData({ link });
      queryClient.profileLink.getByLink.setData({ link }, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          bento: [
            ...old.bento,
            {
              ...input.bento,
              clicks: 0,
              size: { sm: '2x2', md: '2x2' },
              position: { sm: { x: 0, y: 0 }, md: { x: 0, y: 0 } },
            },
          ],
        };
      });
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.profileLink.getByLink.setData({ link }, context.previous);
      }
    },
  });

  if (preview) {
    return null;
  }

  const btnClass =
    'inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-95 disabled:opacity-40 disabled:pointer-events-none';

  const menuItemClass =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted';

  const addCard = (bento: Record<string, unknown>) => {
    pushSnapshot();
    createBento({ link, bento: bento as never });
    setAddOpen(false);
  };

  return (
    <>
      <div className="-translate-x-1/2 container fixed bottom-6 left-1/2 z-50 mx-auto md:bottom-10">
        <div className="mx-auto flex w-max items-center gap-x-2 rounded-xl border border-border/50 bg-background/90 px-2 py-2 shadow-lg backdrop-blur-sm">
          <NextLink href="/app" className={btnClass} title="Back to dashboard">
            <ArrowLeft size={14} />
          </NextLink>

          <div className="h-5 w-px bg-border/40" />

          <button
            type="button"
            className={btnClass}
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={undo}
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            className={btnClass}
            title="Redo (Ctrl+Shift+Z)"
            disabled={!canRedo}
            onClick={redo}
          >
            <Redo2 size={14} />
          </button>

          <div className="h-5 w-px bg-border/40" />

          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={btnClass}
                title="Add card"
                data-tour="add-card"
              >
                <Plus size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1.5" side="top" sideOffset={12}>
              <button
                type="button"
                className={menuItemClass}
                onClick={() => {
                  setAddOpen(false);
                  setLinkModalOpen(true);
                }}
              >
                <Link size={14} className="shrink-0" />
                Link
              </button>
              <button
                type="button"
                className={menuItemClass}
                onClick={() =>
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'note',
                    text: '',
                  })
                }
              >
                <Type size={14} className="shrink-0" />
                Note
              </button>
              <button
                type="button"
                className={menuItemClass}
                onClick={() =>
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'image',
                    url: '',
                  })
                }
              >
                <ImagePlus size={14} className="shrink-0" />
                Image
              </button>
              <button
                type="button"
                className={menuItemClass}
                onClick={() =>
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'map',
                    latitude: 0,
                    longitude: 0,
                  })
                }
              >
                <MapPin size={14} className="shrink-0" />
                Map
              </button>
              <button
                type="button"
                className={menuItemClass}
                onClick={() =>
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'github',
                    username: '',
                  })
                }
              >
                <FaGithub size={14} className="shrink-0" />
                GitHub
              </button>
              <button
                type="button"
                className={menuItemClass}
                onClick={() =>
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'email-collect',
                  })
                }
              >
                <Mail size={14} className="shrink-0" />
                Email Collect
              </button>
              <button
                type="button"
                className={menuItemClass}
                onClick={() =>
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'countdown',
                    targetDate: '',
                    repeat: 'none',
                  })
                }
              >
                <Timer size={14} className="shrink-0" />
                Countdown
              </button>
              <button
                type="button"
                className={menuItemClass}
                onClick={() =>
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'weather',
                    latitude: 0,
                    longitude: 0,
                  })
                }
              >
                <CloudSun size={14} className="shrink-0" />
                Weather
              </button>
              <button
                type="button"
                className={menuItemClass}
                onClick={() =>
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'twitter',
                    tweetId: '',
                  })
                }
              >
                <FaXTwitter size={14} className="shrink-0" />
                Tweet
              </button>
              <button
                type="button"
                className={menuItemClass}
                onClick={() =>
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'calendar',
                    url: '',
                  })
                }
              >
                <Calendar size={14} className="shrink-0" />
                Booking
              </button>
              <button
                type="button"
                className={menuItemClass}
                onClick={() =>
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'music',
                    url: '',
                  })
                }
              >
                <Music size={14} className="shrink-0" />
                Music
              </button>
              {!profileLink?.bento.some((b) => b.type === 'views') && (
                <button
                  type="button"
                  className={menuItemClass}
                  onClick={() =>
                    addCard({
                      id: crypto.randomUUID(),
                      type: 'views',
                    })
                  }
                >
                  <Eye size={14} className="shrink-0" />
                  Profile Views
                </button>
              )}
            </PopoverContent>
          </Popover>

          <ThemeSettingsModal isPremium={!!profileLink?.isPremium}>
            <button
              type="button"
              className={btnClass}
              data-tour="theme-settings"
            >
              <Palette size={14} />
            </button>
          </ThemeSettingsModal>

          <CustomDomainModal isPremium={!!profileLink?.isPremium}>
            <button type="button" className={btnClass}>
              <Globe size={14} />
            </button>
          </CustomDomainModal>

          <button
            type="button"
            className={btnClass}
            title={
              profileLink?.isPublic
                ? 'Listed on Explore (click to hide)'
                : 'Hidden from Explore (click to show)'
            }
            onClick={() => {
              if (!profileLink) {
                return;
              }
              updateProfileLink({
                id: profileLink.id,
                isPublic: !profileLink.isPublic,
              });
            }}
          >
            {profileLink?.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          <div className="h-5 w-px bg-border/40" />

          <ProfileBuilder
            name={profileLink?.name ?? ''}
            onApply={(suggestion) => {
              // Apply bio via update mutation
              if (profileLink) {
                updateProfileLink({
                  id: profileLink.id,
                  bio: `<p>${suggestion.bio}</p>`,
                });
              }
              // Add suggested cards
              for (const card of suggestion.cards) {
                if (card.type === 'link' && card.value) {
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'link',
                    href: card.value,
                    clicks: 0,
                  });
                } else if (card.type === 'note') {
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'note',
                    text: card.value || card.title,
                  });
                } else if (card.type === 'github' && card.value) {
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'github',
                    username: card.value,
                  });
                } else if (card.type === 'email-collect') {
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'email-collect',
                  });
                } else if (card.type === 'music' && card.value) {
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'music',
                    url: card.value,
                  });
                } else if (card.type === 'calendar' && card.value) {
                  addCard({
                    id: crypto.randomUUID(),
                    type: 'calendar',
                    url: card.value,
                  });
                }
              }
            }}
          >
            <button
              type="button"
              className={`${btnClass} text-violet-500`}
              title="AI Profile Builder"
            >
              <Sparkles size={14} />
            </button>
          </ProfileBuilder>
        </div>
      </div>

      <CreateLinkBentoModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
      />
    </>
  );
}
