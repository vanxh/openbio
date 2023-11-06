"use client";

import { Link, Rocket } from "lucide-react";
import CreateLinkBentoModal from "@/components/modals/create-link-bento";
import { cn } from "@/lib/utils";

export default function ActionBar() {
  const btnClass =
    "inline-flex items-center bg-background justify-center rounded-md border border-border p-2 transition-transform duration-200 ease-in-out active:scale-95";

  return (
    <div className="container fixed bottom-6 left-1/2 z-20 mx-auto -translate-x-1/2 md:bottom-10">
      <div className="mx-auto flex w-max items-center gap-x-4 rounded-lg bg-background/80 px-3 py-3 backdrop-blur-xl backdrop-saturate-[20]">
        <CreateLinkBentoModal>
          <button className={btnClass}>
            <Link size={14} />
          </button>
        </CreateLinkBentoModal>

        <button
          className={cn(btnClass, "opacity-50 active:scale-100")}
          disabled
        >
          <Rocket size={14} />
        </button>

        <button
          className={cn(btnClass, "opacity-50 active:scale-100")}
          disabled
        >
          <Rocket size={14} />
        </button>

        <button
          className={cn(btnClass, "opacity-50 active:scale-100")}
          disabled
        >
          <Rocket size={14} />
        </button>
      </div>
    </div>
  );
}
