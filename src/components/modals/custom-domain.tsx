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
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

function showProUpsell() {
  toast({
    title: 'Pro feature',
    description: 'Upgrade to Pro to unlock custom domains.',
  });
}

function cleanDomain(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(PROTOCOL_RE, '')
    .replace(TRAILING_SLASH_RE, '');
}

function DnsRecord({
  type,
  name,
  value,
}: {
  type: string;
  name: string;
  value: string;
}) {
  const copyValue = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied', description: `"${text}" copied to clipboard` });
    });
  };

  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4">
      <p className="mb-3 text-muted-foreground text-xs">
        Add this record in your DNS provider:
      </p>
      <div className="grid grid-cols-[60px_1fr_auto] items-center gap-x-3 gap-y-2 font-mono text-xs">
        <span className="text-muted-foreground">Type</span>
        <span className="font-semibold">{type}</span>
        <div />

        <span className="text-muted-foreground">Name</span>
        <span className="font-semibold">{name}</span>
        <button
          type="button"
          onClick={() => copyValue(name)}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Copy className="h-3 w-3" />
        </button>

        <span className="text-muted-foreground">Value</span>
        <span className="truncate font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => copyValue(value)}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Copy className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function DomainStatus({
  configured,
  verified,
}: {
  configured: boolean;
  verified: boolean;
}) {
  if (configured && verified) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <p className="text-sm">Domain is configured and verified</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p className="text-sm">
        {configured
          ? 'DNS configured but domain not yet verified'
          : 'DNS not configured yet — add the record below'}
      </p>
    </div>
  );
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

  const cleaned = cleanDomain(domain);
  const hasDomain = !!profileLink?.customDomain;
  const domainChanged = cleaned !== (profileLink?.customDomain ?? '');

  // Check domain DNS status
  const {
    data: domainCheck,
    isLoading: isChecking,
    refetch: recheckDomain,
  } = api.profileLink.checkDomain.useQuery(
    { domain: profileLink?.customDomain ?? '' },
    {
      enabled: hasDomain && open,
      refetchInterval: false,
    }
  );

  const { mutateAsync: updateLink, isPending } =
    api.profileLink.update.useMutation({
      onSuccess: () => {
        queryClient.profileLink.getByLink.invalidate({ link });
        queryClient.profileLink.checkDomain.invalidate();
        router.refresh();
        toast({
          title: 'Domain updated',
          description: domain
            ? 'Custom domain saved. Configure your DNS to complete setup.'
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
    if (!profileLink || !isPremium) {
      showProUpsell();
      return;
    }

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
              placeholder="bio.mydomain.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={!isPremium}
              className="rounded-xl border border-border bg-card p-3"
            />
            <p className="text-muted-foreground text-xs">
              Enter your domain without http:// or trailing slashes.
            </p>
          </div>

          {/* DNS instructions — show when domain is entered */}
          {isPremium && cleaned && (
            <div className="space-y-3">
              <Label className="font-medium text-sm">DNS Configuration</Label>

              {/* Show status if domain is already saved */}
              {hasDomain && !domainChanged && domainCheck && (
                <DomainStatus
                  configured={domainCheck.configured}
                  verified={domainCheck.verified}
                />
              )}

              {/* DNS record to add */}
              {cleaned.split('.').length > 2 ? (
                <DnsRecord
                  type="CNAME"
                  name={cleaned.split('.').slice(0, -2).join('.')}
                  value="cname.vercel-dns.com"
                />
              ) : (
                <DnsRecord type="A" name="@" value="76.76.21.21" />
              )}

              {/* Recheck button */}
              {hasDomain && !domainChanged && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 rounded-xl"
                  onClick={() => recheckDomain()}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Check DNS
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={save}
              className={cn(
                'flex-1 rounded-xl',
                !domainChanged && 'opacity-50'
              )}
              disabled={isPending || !isPremium || !domainChanged}
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
            {isPremium && hasDomain && (
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
            <p className="text-muted-foreground text-xs">
              Your subdomain{' '}
              <span className="font-medium text-foreground">
                {link}.openbio.app
              </span>{' '}
              will always work alongside your custom domain.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
