"use server";

import { type Bento } from "@prisma/client";

import LinkCard from "./link";

// eslint-disable-next-line @typescript-eslint/require-await
export default async function BentoCard({
  bento,
  editable,
}: {
  bento: Bento;
  editable?: boolean;
}) {
  if (bento.href) return <LinkCard bento={bento} editable={editable} />;

  return <div>TODO</div>;
}
