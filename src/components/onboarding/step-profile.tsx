'use client';

import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepProfileProps {
  name: string;
  bio: string;
  onNameChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onNext: () => void;
}

export function StepProfile({
  name,
  bio,
  onNameChange,
  onBioChange,
  onNext,
}: StepProfileProps) {
  return (
    <div className="flex flex-col gap-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          placeholder="John Doe"
          className="h-11 rounded-xl"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={3}
          placeholder="Tell the world about yourself..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
        />
      </div>
      <GradientButton onClick={onNext} disabled={!name} className="mt-2 w-full">
        Next
      </GradientButton>
    </div>
  );
}
