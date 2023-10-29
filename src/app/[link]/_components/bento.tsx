"use client";

import { api } from "@/trpc/react";
import BentoCard from "@/components/bento/card";
import BentoLayout from "./bento-layout";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

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
          <BentoCard key={b.id} bento={b} editable={profileLink.isOwner} />
        </div>
      ))}
    </BentoLayout>
  );
}

const BentoSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {Array.from({ length: 24 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square h-full w-full" />
      ))}
    </div>
  );
};

Bento.Skeleton = BentoSkeleton;
