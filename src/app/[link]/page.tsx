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

        <Bento />

        {profileLink.isOwner && <ActionBar />}
      </div>
    </div>
  );
}
