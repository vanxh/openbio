import type { Metadata } from "next";

import {
  defaultMetadata,
  twitterMetadata,
  ogMetadata,
} from "@/app/shared-metadata";
import { api } from "@/trpc/server";
import ProfileLinkHeader from "./_components/header";
import Bento from "./_components/bento";
import ActionBar from "./_components/action-bar";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  params: {
    link: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { link } = params;

  const profileLink = await api.profileLink.getByLink.query({ link });

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
  const { link } = params;
  const profileLink = await api.profileLink.getByLink.query({ link });

  if (!profileLink) {
    notFound();
  }

  return (
    <div className="h-full w-full max-w-3xl">
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
      </div>
    </div>
  );
}
