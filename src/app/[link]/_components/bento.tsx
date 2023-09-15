"use client";

import { api } from "@/trpc/react";
import BentoCard from "@/components/bento/card";
import BentoLayout from "./bento-layout";
import { useParams } from "next/navigation";

export default function Bento() {
  const { link } = useParams() as { link: string };

  const [profileLink] = api.profileLink.getByLink.useSuspenseQuery({
    link,
  });

  if (!profileLink) return null;

  return (
    <BentoLayout>
      {profileLink.bento.map((b) => (
        <div key={b.id}>
          <BentoCard key={b.id} bento={b} editable={profileLink.isOwner} />
        </div>
      ))}
    </BentoLayout>
  );
}
