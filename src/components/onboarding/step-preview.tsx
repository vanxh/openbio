'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Loader2 } from 'lucide-react';

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
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-linear-to-br from-violet-500 to-pink-500 text-lg text-white">
              {name?.charAt(0)?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-3 font-cal text-xl">{name || 'Your Name'}</h3>
          {bio && <p className="mt-1 text-muted-foreground text-sm">{bio}</p>}
        </div>
        {filledSocials.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {filledSocials.map(([platform, username]) => (
              <span
                key={platform}
                className="rounded-full bg-muted px-3 py-1 text-xs"
              >
                {platform}: @{username}
              </span>
            ))}
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
