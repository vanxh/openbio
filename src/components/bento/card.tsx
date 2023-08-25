"use server";

import { type Bento } from "@prisma/client";

import LinkCard from "./link";

// eslint-disable-next-line @typescript-eslint/require-await
export default async function BentoCard({ bento }: { bento: Bento }) {
  if (bento.href) return <LinkCard bento={bento} />;

  return <div>TODO</div>;
}
