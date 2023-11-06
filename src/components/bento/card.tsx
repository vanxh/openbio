import type * as z from "zod";
import { type BentoSchema } from "@/server/db";
import LinkCard from "./link";

export default function BentoCard({
  bento,
  editable,
}: {
  bento: z.infer<typeof BentoSchema>;
  editable?: boolean;
}) {
  if (bento.type === "link") {
    return <LinkCard bento={bento} editable={editable} />;
  }

  return <div>TODO</div>;
}
