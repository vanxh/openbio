'use client';

import BioWriter from '@/components/ai/bio-writer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OpenBioLogo from '@/public/openbio.png';
import { api } from '@/trpc/react';
import { AtSign, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { BiLogoTelegram } from 'react-icons/bi';
import { BsDiscord, BsTwitterX } from 'react-icons/bs';
import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTwitch,
  FaYoutube,
} from 'react-icons/fa';

const SOCIALS = [
  { key: 'twitter', name: 'X', icon: BsTwitterX, placeholder: 'username' },
  { key: 'github', name: 'GitHub', icon: FaGithub, placeholder: 'username' },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: FaInstagram,
    placeholder: 'username',
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: FaLinkedinIn,
    placeholder: 'username',
  },
  { key: 'youtube', name: 'YouTube', icon: FaYoutube, placeholder: 'channel' },
  {
    key: 'discord',
    name: 'Discord',
    icon: BsDiscord,
    placeholder: 'username',
  },
  {
    key: 'telegram',
    name: 'Telegram',
    icon: BiLogoTelegram,
    placeholder: 'username',
  },
  { key: 'twitch', name: 'Twitch', icon: FaTwitch, placeholder: 'username' },
] as const;

const SOCIAL_URLS: Record<string, string> = {
  twitter: 'x.com',
  github: 'github.com',
  instagram: 'instagram.com',
  linkedin: 'linkedin.com/in',
  youtube: 'youtube.com/@',
  discord: 'discord.com',
  telegram: 't.me',
  twitch: 'twitch.tv',
};

const SOCIAL_COLORS: Record<string, { text: string; bg: string }> = {
  twitter: { text: 'text-foreground', bg: 'bg-foreground/5' },
  github: { text: 'text-foreground', bg: 'bg-gray-500/5' },
  instagram: { text: 'text-[#F56040]', bg: 'bg-[#F56040]/5' },
  linkedin: { text: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/5' },
  youtube: { text: 'text-[#FF0000]', bg: 'bg-[#FF0000]/5' },
  discord: { text: 'text-[#5A65EA]', bg: 'bg-[#5A65EA]/5' },
  telegram: { text: 'text-[#0088CC]', bg: 'bg-[#0088CC]/5' },
  twitch: { text: 'text-[#9146FF]', bg: 'bg-[#9146FF]/5' },
};

const SOCIAL_ACTIONS: Record<string, string> = {
  twitter: 'Follow',
  github: 'Follow',
  instagram: 'Follow',
  linkedin: 'Connect',
  youtube: 'Subscribe',
  discord: 'Join',
  telegram: 'Message',
  twitch: 'Follow',
};

function PreviewCard({
  platform,
  username,
  icon: Icon,
}: {
  platform: string;
  username: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  const colors = SOCIAL_COLORS[platform] ?? {
    text: 'text-foreground',
    bg: 'bg-muted',
  };
  const action = SOCIAL_ACTIONS[platform] ?? 'Visit';
  const url = SOCIAL_URLS[platform] ?? '';

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-border/50 bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.bg}`}
        >
          <Icon size={16} className={colors.text} />
        </div>
        <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[9px] text-background">
          {action}
        </span>
      </div>
      <div className="mt-2">
        <p className="truncate font-medium text-[10px]">@{username}</p>
        <p className="truncate text-[8px] text-muted-foreground">
          {url}/{username}
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  const searchParams = useSearchParams();
  const link = searchParams.get('link') ?? '';
  const router = useRouter();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { mutateAsync: createLink } = api.profileLink.create.useMutation();

  const handleSocialChange = (key: string, value: string) => {
    setSocials((prev) => ({ ...prev, [key]: value }));
  };

  const filledSocials = Object.entries(socials).filter(([, v]) => v);

  const handlePublish = async () => {
    if (!link || !name) {
      return;
    }
    setLoading(true);
    try {
      await createLink({
        link,
        name: name || undefined,
        bio: bio || undefined,
        twitter: socials.twitter || undefined,
        github: socials.github || undefined,
        linkedin: socials.linkedin || undefined,
        instagram: socials.instagram || undefined,
        telegram: socials.telegram || undefined,
        discord: socials.discord || undefined,
        youtube: socials.youtube || undefined,
        twitch: socials.twitch || undefined,
      });
      router.push(`/${link}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl animate-fade-up overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">
          {/* Left — Form */}
          <div className="space-y-6 p-8">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Image src={OpenBioLogo} alt="OpenBio" width={36} height={36} />
              </Link>
              <div>
                <h1 className="font-cal text-xl">Set up your page</h1>
                <p className="text-muted-foreground text-xs">
                  openbio.app/{link}
                </p>
              </div>
            </div>

            {/* Name + Bio */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium text-sm">
                  Display name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio" className="font-medium text-sm">
                    Bio
                  </Label>
                  <BioWriter
                    name={name || link}
                    links={filledSocials.map(
                      ([k, v]) => `${SOCIAL_URLS[k] ?? k}/${v}`
                    )}
                    onGenerated={setBio}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-violet-500 text-xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      Write with AI
                    </Button>
                  </BioWriter>
                </div>
                <textarea
                  id="bio"
                  rows={2}
                  placeholder="Tell the world about yourself..."
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <Label className="font-medium text-sm">Social links</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SOCIALS.map((social) => (
                  <div
                    key={social.key}
                    className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background px-3 py-2.5"
                  >
                    <social.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-1 items-center gap-1">
                      <AtSign className="h-3 w-3 text-muted-foreground" />
                      <input
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        placeholder={social.placeholder}
                        value={socials[social.key] ?? ''}
                        onChange={(e) =>
                          handleSocialChange(social.key, e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/claim-link"
                className="text-muted-foreground text-sm hover:text-foreground"
              >
                ← Back
              </Link>
              <GradientButton
                onClick={() => {
                  handlePublish().catch(console.error);
                }}
                disabled={loading || !name}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create page'
                )}
              </GradientButton>
            </div>
          </div>

          {/* Right — Live Preview (actual profile layout) */}
          <div className="hidden border-border/50 border-l bg-muted/20 lg:block">
            <div className="sticky top-0 p-5">
              <p className="mb-3 font-medium text-[10px] text-muted-foreground uppercase tracking-widest">
                Live Preview
              </p>

              {/* Scaled-down profile preview */}
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm">
                <div className="p-5">
                  {/* Header — matches actual profile layout */}
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-14 w-14 shadow-sm">
                      <AvatarFallback className="bg-foreground text-background text-lg">
                        {name?.charAt(0)?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-2.5 font-cal text-base">
                      {name || 'Your Name'}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      @{link || 'username'}
                    </p>
                    {bio && (
                      <p className="mt-1.5 line-clamp-2 max-w-[220px] text-[10px] text-muted-foreground leading-relaxed">
                        {bio}
                      </p>
                    )}
                  </div>

                  {/* Bento grid preview */}
                  {filledSocials.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {filledSocials.map(([platform, username]) => {
                        const social = SOCIALS.find((s) => s.key === platform);
                        if (!social) {
                          return null;
                        }
                        return (
                          <PreviewCard
                            key={platform}
                            platform={platform}
                            username={username}
                            icon={social.icon}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Empty state */}
                  {filledSocials.length === 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex h-20 items-center justify-center rounded-xl border border-border/40 border-dashed bg-muted/30"
                        >
                          <span className="text-[9px] text-muted-foreground/30">
                            Card
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-4 text-center">
                    <span className="text-[8px] text-muted-foreground/50">
                      openbio.app/{link || 'username'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
