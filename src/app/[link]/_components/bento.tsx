"use client";

import { useParams } from "next/navigation";
import BentoCard from "@/components/bento/card";
import { api } from "@/trpc/react";
import BentoLayout from "./bento-layout";

export default function Bento() {
  const { link } = useParams<{ link: string }>();

  const [profileLink] = api.profileLink.getByLink.useSuspenseQuery({
    link,
  });

  if (!profileLink) return null;

  return (
    <BentoLayout>
      {profileLink.bento.map((b) => (
        <div key={b.id}>
          <BentoCard bento={b} editable={profileLink.isOwner} />
        </div>
      ))}
    </BentoLayout>
  );
}
