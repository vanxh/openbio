'use client';

import { api } from '@/trpc/react';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function MarketingFooter() {
  const { link } = useParams<{ link: string }>();

  const { data: profileLink } = api.profileLink.getByLink.useQuery(
    {
      link,
    },
    {
      staleTime: Number.POSITIVE_INFINITY,
      enabled: !!link,
    }
  );

  const { data: views } = api.profileLink.getViews.useQuery(
    {
      id: profileLink?.id ?? '',
    },
    {
      staleTime: Number.POSITIVE_INFINITY,
      enabled: !!profileLink,
    }
  );

  return (
    <footer className="bottom-0 flex w-full max-w-3xl flex-col items-center justify-center gap-y-2 md:items-start">
      <div className="flex w-full items-center justify-between">
        <span className="font-medium text-sm">
          Powered by{' '}
          <Link
            href="https://openbio.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            OpenBio
          </Link>
        </span>

        {views !== null && (
          <div className="flex flex-row items-center gap-x-2 text-muted-foreground">
            <Eye size={16} />
            <span className="text-sm">{views}</span>
          </div>
        )}
      </div>
    </footer>
  );
}
