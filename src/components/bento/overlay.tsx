"use client";

import { useState } from "react";
import { type Bento } from "@prisma/client";

import { cn } from "@/lib/utils";
import DeleteButton from "@/components/bento/delete-button";
import DragHandle from "@/components/bento/drag-handle";
import ManageSize from "@/components/bento/manage-size";

export default function CardOverlay({ bento }: { bento: Bento }) {
  const [active, setActive] = useState(false);

  return (
    <div
      className={cn(
        "absolute left-0 top-0 z-20 h-full w-full",
        active && "rounded-md border-2 border-border md:border-0"
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
          <ManageSize bento={bento} />
        </div>
      )}
    </div>
  );
}
