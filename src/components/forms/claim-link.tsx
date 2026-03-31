'use client';

import { claimLink } from '@/app/actions/claim-link';
import { GradientButton } from '@/components/ui/gradient-button';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/trpc/react';
import { Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';

function StatusIcon({
  isFetching,
  available,
}: {
  isFetching: boolean;
  available: boolean | undefined;
}) {
  if (isFetching) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }
  if (available) {
    return <Check className="h-4 w-4 text-green-500" />;
  }
  return <X className="h-4 w-4 text-red-500" />;
}

export default function ClaimLinkForm() {
  const [link, setLink] = useState('');
  const debouncedLink = useDebounce(link, 500);
  const { data: available, isFetching } =
    api.profileLink.linkAvailable.useQuery(
      { link: debouncedLink },
      { enabled: !!debouncedLink, staleTime: Number.POSITIVE_INFINITY }
    );

  const handleAction = () => {
    if (!debouncedLink || isFetching || !available) {
      return;
    }
    claimLink(link).catch(console.error);
  };

  return (
    <form className="space-y-4" action={handleAction}>
      <div className="flex h-12 items-center gap-x-1 rounded-xl border border-input bg-background px-4 shadow-sm focus-within:ring-2 focus-within:ring-violet-500/50">
        <span className="text-muted-foreground text-sm">openbio.app/</span>
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoFocus
          placeholder="yourname"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        {debouncedLink && (
          <div className="ml-auto">
            <StatusIcon isFetching={isFetching} available={available} />
          </div>
        )}
      </div>
      {debouncedLink && !isFetching && !available && (
        <p className="text-center text-red-500 text-sm">
          This username is taken
        </p>
      )}
      {debouncedLink && !isFetching && available && (
        <GradientButton type="submit" className="w-full">
          Claim my page
        </GradientButton>
      )}
    </form>
  );
}
