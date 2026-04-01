'use client';

import BentoCard from '@/components/bento/card';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';
import BentoLayout from './bento-layout';
import { usePreview } from './preview-context';

export default function Bento() {
  const { link } = useParams<{ link: string }>();
  const { preview } = usePreview();

  const [profileLink] = api.profileLink.getByLink.useSuspenseQuery({
    link,
  });

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
