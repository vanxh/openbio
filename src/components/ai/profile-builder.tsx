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
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { Check, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useState } from 'react';

type ProfileSuggestion = {
  bio: string;
  cards: { type: string; title: string; value: string }[];
};

export default function ProfileBuilder({
  name,
  onApply,
  children,
}: {
  name: string;
  onApply: (suggestion: ProfileSuggestion) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<ProfileSuggestion | null>(null);

  const { data: credits } = api.ai.getCredits.useQuery(undefined, {
    enabled: open,
  });

  const { mutate: build, isPending } = api.ai.buildProfile.useMutation({
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleBuild = () => {
    build({ name, description });
  };

  const handleApply = () => {
    if (!result) {
      return;
    }
    onApply(result);
    setOpen(false);
    setResult(null);
    setDescription('');
    toast({
      title: 'Profile built!',
      description: 'AI suggestions have been applied to your profile.',
    });
  };

  const cardTypeLabels: Record<string, string> = {
    link: 'Link',
    note: 'Note',
    music: 'Music',
    calendar: 'Booking',
    github: 'GitHub',
    'email-collect': 'Newsletter',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-cal text-xl">
            <Sparkles className="h-4 w-4 text-violet-500" />
            AI Profile Builder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {credits && (
            <p className="text-muted-foreground text-xs">
              {credits.remaining}/{credits.limit} credits remaining
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="ai-desc" className="font-medium text-sm">
              Describe yourself
            </Label>
            <Input
              id="ai-desc"
              placeholder="e.g. I'm a freelance photographer based in Mumbai who shoots weddings and street photography"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-muted-foreground text-xs">
              The more detail you give, the better the suggestions.
            </p>
          </div>

          <Button
            onClick={handleBuild}
            disabled={
              isPending || !description.trim() || (credits?.remaining ?? 0) < 3
            }
            className="w-full rounded-xl"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {isPending ? 'Building...' : 'Build Profile (3 credits)'}
          </Button>

          {result && (
            <div className="space-y-4">
              {/* Generated bio */}
              <div className="space-y-1.5">
                <p className="font-medium text-sm">Suggested Bio</p>
                <div className="rounded-xl border border-border bg-muted/50 p-3">
                  <p className="text-sm leading-relaxed">{result.bio}</p>
                </div>
              </div>

              {/* Suggested cards */}
              <div className="space-y-1.5">
                <p className="font-medium text-sm">Suggested Cards</p>
                <div className="space-y-2">
                  {result.cards.map((card, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background font-medium text-xs">
                        {cardTypeLabels[card.type] ?? card.type}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {card.title}
                        </p>
                        {card.value && (
                          <p className="truncate text-muted-foreground text-xs">
                            {card.value}
                          </p>
                        )}
                      </div>
                      <Check className="h-4 w-4 shrink-0 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={handleBuild}
                  disabled={isPending}
                >
                  Regenerate
                </Button>
                <Button className="flex-1 rounded-xl" onClick={handleApply}>
                  Apply All
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
