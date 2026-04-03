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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/${profile.link}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border p-6 transition-colors hover:border-primary"
            >
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name ?? ''}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted" />
              )}
              <div className="text-center">
                <p className="font-cal text-lg">{profile.name}</p>
                <p className="text-muted-foreground text-sm">@{profile.link}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
