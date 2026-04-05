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
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useState } from 'react';

const TONES = [
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Professional' },
  { value: 'creative', label: 'Creative' },
  { value: 'minimal', label: 'Minimal' },
] as const;

export default function BioWriter({
  name,
  links,
  onGenerated,
  children,
}: {
  name: string;
  links?: string[];
  onGenerated: (bio: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<(typeof TONES)[number]['value']>('casual');
  const [context, setContext] = useState('');
  const [generatedBio, setGeneratedBio] = useState('');

  const { data: credits } = api.ai.getCredits.useQuery(undefined, {
    enabled: open,
  });

  const { mutate: generate, isPending } = api.ai.generateBio.useMutation({
    onSuccess: (data) => {
      setGeneratedBio(data.bio);
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    generate({ name, links, tone, context: context || undefined });
  };

  const handleApply = () => {
    onGenerated(generatedBio);
    setOpen(false);
    setGeneratedBio('');
    toast({ title: 'Bio updated!', description: 'Your AI-generated bio has been applied.' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-cal">
            <Sparkles className="h-4 w-4 text-violet-500" />
            AI Bio Writer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {credits && (
            <p className="text-muted-foreground text-xs">
              {credits.remaining}/{credits.limit} credits remaining
            </p>
          )}

          {/* Tone selector */}
          <div className="space-y-2">
            <Label className="font-medium text-sm">Tone</Label>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    tone === t.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Extra context */}
          <div className="space-y-2">
            <Label htmlFor="ai-context" className="font-medium text-sm">
              Tell us about yourself{' '}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="ai-context"
              placeholder="e.g. developer, photographer, based in NYC..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isPending || (credits?.remaining ?? 0) < 1}
            className="w-full rounded-xl"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {isPending ? 'Generating...' : 'Generate Bio (1 credit)'}
          </Button>

          {/* Result */}
          {generatedBio && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="text-sm leading-relaxed">{generatedBio}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={handleGenerate}
                  disabled={isPending}
                >
                  Regenerate
                </Button>
                <Button className="flex-1 rounded-xl" onClick={handleApply}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
