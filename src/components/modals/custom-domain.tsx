'use client';

const PROTOCOL_RE = /^https?:\/\//;
const TRAILING_SLASH_RE = /\/+$/;

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
import { Lock, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

function showProUpsell() {
  toast({
    title: 'Pro feature',
    description: 'Upgrade to Pro to unlock custom domains.',
  });
}

export default function CustomDomainModal({
  children,
  isPremium,
}: {
  children: ReactNode;
  isPremium: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { link } = useParams<{ link: string }>();
  const queryClient = api.useContext();

  const { data: profileLink } = api.profileLink.getByLink.useQuery({ link });

  const [domain, setDomain] = useState(profileLink?.customDomain ?? '');

  const { mutateAsync: updateLink, isPending } =
    api.profileLink.update.useMutation({
      onSuccess: () => {
        queryClient.profileLink.getByLink.invalidate({ link });
        router.refresh();
        setOpen(false);
        toast({
          title: 'Domain updated',
          description: domain
            ? 'Custom domain saved. Make sure your DNS is configured.'
            : 'Custom domain removed.',
        });
      },
      onError: (err) => {
        toast({
          title: 'Error',
          description: err.message,
        });
      },
    });

  const save = () => {
    if (!profileLink) {
      return;
    }
    if (!isPremium) {
      showProUpsell();
      return;
    }

    const cleaned = domain
      .trim()
      .toLowerCase()
      .replace(PROTOCOL_RE, '')
      .replace(TRAILING_SLASH_RE, '');

    updateLink({
      id: profileLink.id,
      customDomain: cleaned || null,
    });
  };

  const remove = () => {
    if (!profileLink) {
      return;
    }
    setDomain('');
    updateLink({
      id: profileLink.id,
      customDomain: null,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setDomain(profileLink?.customDomain ?? '');
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg" showClose>
        <DialogHeader>
          <DialogTitle className="font-cal">Custom Domain</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isPremium && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                Custom domains are a Pro feature. Upgrade to connect your own
                domain.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="custom-domain" className="font-medium text-sm">
              Domain
            </Label>
            <Input
              id="custom-domain"
              placeholder="mydomain.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={!isPremium}
              className="rounded-xl border border-border bg-card p-3"
            />
            <p className="text-muted-foreground text-xs">
              Enter your domain without http:// or trailing slashes.
            </p>
          </div>

          {isPremium && profileLink?.customDomain && (
            <div className="space-y-2">
              <Label className="font-medium text-sm">DNS Configuration</Label>
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="mb-2 text-muted-foreground text-xs">
                  Add this CNAME record in your DNS provider:
                </p>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
                  <span className="text-muted-foreground">Type</span>
                  <span>CNAME</span>
                  <span className="text-muted-foreground">Name</span>
                  <span>@</span>
                  <span className="text-muted-foreground">Value</span>
                  <span>cname.vercel-dns.com</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={save}
              className="flex-1 rounded-xl"
              disabled={isPending || !isPremium}
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
            {isPremium && profileLink?.customDomain && (
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 rounded-xl"
                onClick={remove}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isPremium && (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">
                Your subdomain{' '}
                <span className="font-medium text-foreground">
                  {link}.openbio.app
                </span>{' '}
                will always work alongside your custom domain.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
