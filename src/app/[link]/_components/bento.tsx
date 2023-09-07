"use client";

import { type RouterOutputs, api } from "@/trpc/react";
import BentoCard from "@/components/bento/card";
import BentoLayout from "./bento-layout";

type Props = {
  profileLink: NonNullable<RouterOutputs["profileLink"]["getByLink"]>;
};

export default function Bento({ profileLink: initialProfileLink }: Props) {
  const { data: profileLink } = api.profileLink.getByLink.useQuery(
    {
      link: initialProfileLink.link,
    },
    {
      initialData: initialProfileLink,
    }
  );

  if (!profileLink) return null;

  return (
    <BentoLayout profileLink={initialProfileLink}>
      {profileLink.bento.map((b) => (
        <div key={b.id}>
          <BentoCard key={b.id} bento={b} editable={profileLink.isOwner} />
        </div>
      ))}
    </BentoLayout>
  );
}
