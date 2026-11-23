'use client';

import BentoCard from '@/components/bento/card';
import { isBentoConfigured } from '@/lib/bento-configured';
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

  const { data: profileLink } = api.profileLink.getByLink.useQuery(
    { link },
    { initialData, staleTime: 60_000 }
  );

  if (!profileLink) {
    return null;
  }

  const editable = profileLink.isOwner && !preview;

  // Visitors (and the owner's preview) only see cards that are set up; while
  // editing, every card shows so it can be filled in.
  const cards = editable
    ? profileLink.bento
    : profileLink.bento.filter(isBentoConfigured);

  return (
    <BentoLayout>
      {cards.map((b, i) => (
        <div key={b.id}>
          <div
            className="h-full w-full animate-fade-up"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <BentoCard bento={b} editable={editable} linkId={profileLink.id} />
          </div>
        </div>
      ))}
    </BentoLayout>
  );
}
