import type { Metadata } from "next";

import {
  defaultMetadata,
  twitterMetadata,
  ogMetadata,
} from "@/app/shared-metadata";
import { api } from "@/trpc/server";
import BentoCard from "@/components/bento/card";
import BentoLayout from "@/components/bento/layout";
import ActionBar from "@/components/bento/action-bar";
import ProfileLinkEditor from "@/components/profile-link-editor";

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
    return (
      <div className="mx-auto h-full w-full text-center">
        <p>This link does not exist. Please check the link and try again.</p>
      </div>
    );
  }

  await api.profileLink.recordVisit.mutate({ id: profileLink.id });

  return (
    <div className="h-full w-full max-w-3xl">
      <div className="flex flex-col gap-y-6">
        <ProfileLinkEditor profileLink={profileLink} />

        <BentoLayout profileLink={profileLink}>
          {profileLink.bento.map((b) => (
            <div key={b.id}>
              <BentoCard key={b.id} bento={b} editable={profileLink.isOwner} />
            </div>
          ))}
        </BentoLayout>

        {profileLink.isOwner && <ActionBar />}
      </div>
    </div>
  );
}
