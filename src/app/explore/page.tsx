import { api } from '@/trpc/server';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Explore Profiles | OpenBio',
  description: 'Discover creative profiles built with OpenBio',
};

export default async function ExplorePage() {
  const { profiles } = await api.profileLink.listPublic({ limit: 20 });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-cal text-4xl">Explore</h1>
        <p className="mt-2 text-muted-foreground">
          Discover creative profiles built with OpenBio
        </p>
      </div>
      {profiles.length === 0 ? (
        <p className="text-muted-foreground">No public profiles yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/${profile.link}`}
              className="group flex flex-col items-center gap-2 rounded-lg border border-border px-3 py-4 transition-colors hover:border-primary"
            >
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name ?? ''}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-muted" />
              )}
              <div className="w-full text-center">
                <p className="truncate font-cal text-sm">{profile.name}</p>
                <p className="truncate text-muted-foreground text-xs">@{profile.link}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
