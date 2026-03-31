'use client';

import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import {
  AtSign,
  Github,
  Instagram,
  Linkedin,
  Twitch,
  Youtube,
} from 'lucide-react';
import { BiLogoTelegram } from 'react-icons/bi';
import { BsDiscord, BsTwitterX } from 'react-icons/bs';

const socials = [
  { key: 'twitter', name: 'X', icon: BsTwitterX, placeholder: 'username' },
  { key: 'github', name: 'GitHub', icon: Github, placeholder: 'username' },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'username',
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    placeholder: 'username',
  },
  {
    key: 'telegram',
    name: 'Telegram',
    icon: BiLogoTelegram,
    placeholder: 'username',
  },
  { key: 'discord', name: 'Discord', icon: BsDiscord, placeholder: 'username' },
  { key: 'youtube', name: 'YouTube', icon: Youtube, placeholder: 'username' },
  { key: 'twitch', name: 'Twitch', icon: Twitch, placeholder: 'username' },
] as const;

interface StepSocialsProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepSocials({
  values,
  onChange,
  onBack,
  onNext,
}: StepSocialsProps) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {socials.map((social) => (
          <div
            key={social.key}
            className="flex items-center gap-x-3 rounded-xl border border-border/50 bg-background p-3"
          >
            <social.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex flex-1 items-center gap-x-1">
              <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder={social.placeholder}
                value={values[social.key] ?? ''}
                onChange={(e) => onChange(social.key, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-x-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex-1 rounded-full"
        >
          Back
        </Button>
        <GradientButton onClick={onNext} className="flex-1">
          Next
        </GradientButton>
      </div>
    </div>
  );
}
