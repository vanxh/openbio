import { api } from '@/trpc/server';
import { LayoutGrid } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Explore Profiles | OpenBio',
  description: 'Discover creative profiles built with OpenBio',
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').trim();
}

export default async function ExplorePage() {
  const { profiles } = await api.profileLink.listPublic({ limit: 40 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 max-w-xl">
        <h1 className="font-cal text-4xl md:text-5xl">Explore</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Discover creative profiles built with OpenBio. Get inspired, connect
          with creators, and build your own.
        </p>
        <Link
          href="/claim-link"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
        >
          Create yours free
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <LayoutGrid className="h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-lg">No public profiles yet</p>
          <p className="text-muted-foreground text-sm">
            Be the first to share your profile with the world.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const bio = profile.bio ? stripHtml(profile.bio) : null;
            const cardCount = Array.isArray(profile.bento)
              ? profile.bento.length
              : 0;

            return (
              <Link
                key={profile.id}
                href={`/${profile.link}`}
                className="group flex items-start gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary hover:shadow-sm"
              >
                {profile.image ? (
                  <Image
                    src={profile.image}
                    alt={profile.name ?? ''}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-full bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-cal text-base">{profile.name}</p>
                  <p className="text-muted-foreground text-xs">
                    @{profile.link}
                  </p>
                  {bio && (
                    <p className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                      {bio}
                    </p>
                  )}
                  {cardCount > 0 && (
                    <p className="mt-1.5 text-muted-foreground/70 text-xs">
                      {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
