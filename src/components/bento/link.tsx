"use server";

import { type Bento } from "@prisma/client";

import { getMetadata } from "@/lib/metadata";

export default async function LinkCard({ bento }: { bento: Bento }) {
  if (!bento.href) return null;

  const metadata = await getMetadata(bento.href);
  console.log(metadata);

  return <div>link</div>;
}
