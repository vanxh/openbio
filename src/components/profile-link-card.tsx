import { Skeleton } from '@/components/ui/skeleton';
import type { RouterOutputs } from '@/trpc/react';
import { api } from '@/trpc/server';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export function ProfileLinkCardSkeleton() {
  return (
    <div className="flex flex-col rounded-md border border-border bg-background px-4 py-2 transition-transform active:scale-95">
      <span className="font-cal text-lg">
        <Skeleton className="h-6 w-36" />
      </span>

      <span className="mt-2 text-muted-foreground text-sm">
        <Skeleton className="h-4 w-24" />
      </span>

      <div className="mt-4 flex items-center gap-x-4 text-muted-foreground">
        <span className="inline-flex items-center gap-x-2">
          <Skeleton className="h-4 w-4" />
          <span className="text-xs">
            <Skeleton className="h-4 w-12" />
          </span>
        </span>
      </div>
    </div>
  );
}

export default async function ProfileLinkCard({
  link,
}: {
  link: NonNullable<RouterOutputs['profileLink']['getAll'][0]>;
}) {
  const views = await api.profileLink.getViews({ id: link.id });

  return (
    <Link
      href={`/${link.link}`}
      className="relative flex flex-col rounded-md border border-border bg-background px-4 py-2 transition-transform active:scale-95"
    >
      <div className="flex items-center justify-between">
        <span className="font-cal text-lg">{link.name}</span>
      </div>
      <span className="text-muted-foreground text-sm">
        openbio.app/{link.link}
      </span>

      <div className="mt-4 flex items-center gap-x-4 text-muted-foreground">
        <span className="inline-flex items-center gap-x-2">
          <Eye size={16} />
          <span className="text-xs">
            {views || '0'} {views === 1 ? 'view' : 'views'}
          </span>
        </span>
      </div>
    </Link>
  );
}
