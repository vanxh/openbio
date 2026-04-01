'use client';

import BentoCard from '@/components/bento/card';
import { api, type RouterOutputs } from '@/trpc/react';
import { useParams } from 'next/navigation';
import BentoLayout from './bento-layout';
import { usePreview } from './preview-context';

type ProfileLinkData = NonNullable<
  RouterOutputs['profileLink']['getByLink']
>;

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
      {profileLink.bento.map((b) => (
        <div key={b.id}>
          <BentoCard bento={b} editable={profileLink.isOwner && !preview} />
        </div>
      ))}
    </BentoLayout>
  );
}
