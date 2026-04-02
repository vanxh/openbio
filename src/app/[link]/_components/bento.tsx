'use client';

import BentoCard from '@/components/bento/card';
import { type RouterOutputs, api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import BentoLayout from './bento-layout';
import { usePreview } from './preview-context';

type ProfileLinkData = NonNullable<RouterOutputs['profileLink']['getByLink']>;

export default function Bento({
  profileLink: initialData,
}: { profileLink: ProfileLinkData }) {
  const { link } = useParams<{ link: string }>();
  const { preview } = usePreview();

  const [profileLink] = api.profileLink.getByLink.useSuspenseQuery(
    { link },
    { initialData, staleTime: 60_000 }
  );

  if (!profileLink) {
    return null;
  }

  return (
    <BentoLayout>
      {profileLink.bento.map((b, i) => (
        <div key={b.id}>
          <div
            className="h-full w-full animate-fade-up"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <BentoCard bento={b} editable={profileLink.isOwner && !preview} />
          </div>
        </div>
      ))}
    </BentoLayout>
  );
}
