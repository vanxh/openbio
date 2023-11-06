"use client";

import { useState } from "react";
import type * as z from "zod";
import DeleteButton from "@/components/bento/overlay/delete-button";
import DragHandle from "@/components/bento/overlay/drag-handle";
import ManageSize from "@/components/bento/overlay/manage-size";
import { cn } from "@/lib/utils";
import { type BentoSchema } from "@/server/db";

export default function CardOverlay({
  bento,
}: {
  bento: z.infer<typeof BentoSchema>;
}) {
  const [active, setActive] = useState(false);

  return (
    <div
      className={cn(
        "absolute left-0 top-0 z-20 h-full w-full",
        active && "rounded-md border-2 border-border md:border-0",
      )}
      onClick={() => {
        if (window.outerWidth < 500) {
          setActive(!active);
        }
      }}
      onMouseEnter={() => {
        setActive(true);
      }}
      onMouseLeave={() => {
        setActive(false);
      }}
    >
      {active && (
        <div>
          <DeleteButton bento={bento} />
          <DragHandle />
          <ManageSize bento={bento} close={() => setActive(false)} />
        </div>
      )}
    </div>
  );
}
