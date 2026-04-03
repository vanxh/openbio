'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { useState } from 'react';

export default function EmailDigestToggle({
  defaultEnabled,
}: {
  defaultEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  const { mutate } = api.user.updateEmailDigest.useMutation({
    onSuccess: (data) => {
      setEnabled(data.emailDigest);
      toast({
        title: data.emailDigest ? 'Digest enabled' : 'Digest disabled',
        description: data.emailDigest
          ? 'You will receive weekly analytics emails.'
          : 'You will no longer receive digest emails.',
      });
    },
  });

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="email-digest">Weekly analytics digest</Label>
        <p className="text-muted-foreground text-xs">
          Receive a weekly summary of your profile views, clicks, and
          subscribers.
        </p>
      </div>
      <Switch
        id="email-digest"
        checked={enabled}
        onCheckedChange={(checked) => mutate({ enabled: checked })}
      />
    </div>
  );
}
