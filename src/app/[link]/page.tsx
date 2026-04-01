import {
  defaultMetadata,
  ogMetadata,
  twitterMetadata,
} from '@/app/shared-metadata';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ActionBar from './_components/action-bar';
import Bento from './_components/bento';
import ProfileLinkHeader from './_components/header';
import { PreviewProvider } from './_components/preview-context';
import ThemeWrapper from './_components/theme-wrapper';
import ViewportContainer from './_components/viewport-container';

type Props = {
  params: Promise<{
    link: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { link } = await params;

  const profileLink = await api.profileLink.getByLink({ link });

  const title = profileLink?.name ?? defaultMetadata.title;
  const description =
    profileLink?.bio ??
    `This is ${profileLink?.name ?? profileLink?.link}'s profile.`;

  return {
    ...defaultMetadata,
    title,
    description,
    twitter: {
      ...twitterMetadata,
      title,
      description,
      images: [`/api/og?title=${title}&description=${description}`],
    },
    openGraph: {
      ...ogMetadata,
      title,
      description,
      images: [`/api/og?title=${title}&description=${description}`],
    },
  };
}

export default async function Page({ params }: Props) {
  const { link } = await params;
  const profileLink = await api.profileLink.getByLink({ link });

  if (!profileLink) {
    notFound();
  }

  return (
    <ThemeWrapper
      theme={profileLink.theme}
      darkMode={profileLink.darkMode}
      accentColor={profileLink.accentColor}
    >
      <PreviewProvider>
        <ViewportContainer>
          <div className="flex flex-col gap-y-6">
            <ProfileLinkHeader />

            <Suspense
              fallback={
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square h-full w-full" />
                  ))}
                </div>
              }
            >
              <Bento />
            </Suspense>

            {profileLink.isOwner && <ActionBar />}

            <footer className="py-8 text-center">
              <Link
                href="/"
                className="text-muted-foreground text-xs transition-colors hover:text-foreground"
              >
                Made with OpenBio
              </Link>
            </footer>
          </div>
        </ViewportContainer>
      </PreviewProvider>
    </ThemeWrapper>
  );
}
