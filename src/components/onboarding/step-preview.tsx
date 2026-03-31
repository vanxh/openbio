'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Github, Instagram, Linkedin, Twitch, Youtube } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { BiLogoTelegram } from 'react-icons/bi';
import { BsDiscord, BsTwitterX } from 'react-icons/bs';

const socialIcons: Record<
  string,
  ComponentType<SVGProps<SVGSVGElement> | { className?: string }>
> = {
  twitter: BsTwitterX,
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
  telegram: BiLogoTelegram,
  discord: BsDiscord,
  youtube: Youtube,
  twitch: Twitch,
};

const socialUrls: Record<string, string> = {
  twitter: 'x.com',
  github: 'github.com',
  linkedin: 'linkedin.com/in',
  instagram: 'instagram.com',
  telegram: 't.me',
  discord: 'discord.com',
  youtube: 'youtube.com/@',
  twitch: 'twitch.tv',
};

interface StepPreviewProps {
  name: string;
  bio: string;
  socials: Record<string, string>;
  onBack: () => void;
  onPublish: () => void;
  loading: boolean;
}

export function StepPreview({
  name,
  bio,
  socials,
  onBack,
  onPublish,
  loading,
}: StepPreviewProps) {
  const filledSocials = Object.entries(socials).filter(([, v]) => v);

  return (
    <div className="flex flex-col gap-y-6">
      <div className="rounded-2xl border border-border/50 bg-background p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-foreground text-2xl text-background">
              {name?.charAt(0)?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-3 font-cal text-xl">{name || 'Your Name'}</h3>
          {bio && <p className="mt-1 text-muted-foreground text-sm">{bio}</p>}
        </div>

        {filledSocials.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-2">
            {filledSocials.map(([platform, username]) => {
              const Icon = socialIcons[platform];
              const url = socialUrls[platform];
              return (
                <div
                  key={platform}
                  className="flex items-center gap-x-2 rounded-xl border border-border/50 px-3 py-2"
                >
                  {Icon && (
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate text-muted-foreground text-xs">
                    {url}/{username}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-x-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex-1 rounded-full"
        >
          Back
        </Button>
        <GradientButton
          onClick={onPublish}
          disabled={loading}
          className="flex-1"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish'}
        </GradientButton>
      </div>
    </div>
  );
}
