'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/trpc/react';
import { LinkBentoSchema } from '@/types';
import { Globe } from 'lucide-react';
import { useParams } from 'next/navigation';
import type React from 'react';
import { type ReactNode, useState } from 'react';
import { BiLogoTelegram } from 'react-icons/bi';
import { BsDiscord, BsThreads, BsTwitterX } from 'react-icons/bs';
import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaTwitch,
  FaYoutube,
} from 'react-icons/fa';

const SOCIAL_PRESETS = [
  {
    name: 'Instagram',
    icon: <FaInstagram size={20} />,
    color: '#E4405F',
    placeholder: 'https://instagram.com/username',
  },
  {
    name: 'YouTube',
    icon: <FaYoutube size={20} />,
    color: '#FF0000',
    placeholder: 'https://youtube.com/@channel',
  },
  {
    name: 'Twitter / X',
    icon: <BsTwitterX size={18} />,
    color: '#000000',
    placeholder: 'https://x.com/username',
  },
  {
    name: 'TikTok',
    icon: <FaTiktok size={18} />,
    color: '#000000',
    placeholder: 'https://tiktok.com/@username',
  },
  {
    name: 'LinkedIn',
    icon: <FaLinkedinIn size={20} />,
    color: '#0A66C2',
    placeholder: 'https://linkedin.com/in/username',
  },
  {
    name: 'GitHub',
    icon: <FaGithub size={20} />,
    color: '#333333',
    placeholder: 'https://github.com/username',
  },
  {
    name: 'Discord',
    icon: <BsDiscord size={20} />,
    color: '#5A65EA',
    placeholder: 'https://discord.gg/invite',
  },
  {
    name: 'Twitch',
    icon: <FaTwitch size={18} />,
    color: '#9146FF',
    placeholder: 'https://twitch.tv/username',
  },
  {
    name: 'Telegram',
    icon: <BiLogoTelegram size={22} />,
    color: '#0088CC',
    placeholder: 'https://t.me/username',
  },
  {
    name: 'Threads',
    icon: <BsThreads size={18} />,
    color: '#000000',
    placeholder: 'https://threads.net/@username',
  },
] as const;

export default function CreateLinkBentoModal({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;

  const { link } = useParams<{ link: string }>();

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [input, setInput] = useState('');

  const queryClient = api.useContext();

  const { mutateAsync: createBento, isPending } =
    api.profileLink.createBento.useMutation({
      onMutate: (bento) => {
        queryClient.profileLink.getByLink.setData({ link }, (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            bento: [...old.bento, LinkBentoSchema.parse(bento.bento)],
          };
        });
      },
      onSuccess: () => {
        setOpen(false);
        setInput('');
        setSelectedPreset(null);
      },
      onSettled: () => {
        queryClient.profileLink.getByLink.invalidate({ link });
      },
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) {
      return;
    }
    createBento({
      link,
      bento: {
        id: crypto.randomUUID(),
        type: 'link',
        href: input,
      },
    });
  };

  const activePreset =
    selectedPreset !== null ? SOCIAL_PRESETS[selectedPreset] : undefined;

  const placeholder = activePreset?.placeholder ?? 'https://example.com';

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setInput('');
          setSelectedPreset(null);
        }
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-cal text-xl">Add Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Social presets grid */}
          <div className="grid grid-cols-5 gap-2">
            {SOCIAL_PRESETS.map((preset, i) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setSelectedPreset(selectedPreset === i ? null : i);
                  setInput('');
                }}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-3 transition-all ${
                  selectedPreset === i
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted/50 hover:bg-muted'
                }`}
              >
                <span style={{ color: preset.color }}>{preset.icon}</span>
                <span className="truncate font-medium text-[10px] leading-tight">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>

          {/* Custom URL option */}
          {selectedPreset === null && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <div className="h-px flex-1 bg-border" />
              <span>or paste any URL</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          {/* URL input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                {activePreset ? (
                  <span style={{ color: activePreset.color }}>
                    {activePreset.icon}
                  </span>
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <Input
                type="url"
                placeholder={placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="rounded-xl"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl px-6"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!input || isPending}
                className="rounded-xl px-6"
              >
                {isPending ? 'Adding...' : 'Add link'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
