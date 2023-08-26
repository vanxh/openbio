"use client";

import { type Bento } from "@prisma/client";

import { api } from "@/trpc/client";
import { cn } from "@/lib/utils";
import Size2x2 from "@/components/icons/size_2x2";
import Size4x2 from "@/components/icons/size_4x2";
import Size2x4 from "@/components/icons/size_2x4";
import Size4x4 from "@/components/icons/size_4x4";

export default function ManageSize({ bento }: { bento: Bento }) {
  const size = window.outerWidth < 500 ? bento.mobileSize : bento.desktopSize;

  const sizeOptions = [
    {
      key: "SIZE_2x2",
      icon: Size2x2,
    },
    {
      key: "SIZE_4x2",
      icon: Size4x2,
    },
    {
      key: "SIZE_2x4",
      icon: Size2x4,
    },
    {
      key: "SIZE_4x4",
      icon: Size4x4,
    },
  ];

  return (
    <div className="absolute bottom-0 left-1/2 z-20 hidden -translate-x-1/2 translate-y-1/2 md:inline">
      <div className="flex items-center rounded-md bg-primary p-2 text-primary-foreground shadow">
        {sizeOptions.map((o) => (
          <button
            key={o.key}
            className={cn(
              "md:- inline-flex items-center justify-center p-2 transition-transform duration-200 ease-in-out active:scale-95",
              size === o.key &&
                "rounded-sm bg-secondary text-secondary-foreground"
            )}
            onClick={() => {
              void api.profileLink.updateProfileLinkBento.mutate({
                id: bento.id,
                [window.outerWidth < 500 ? "mobileSize" : "desktopSize"]: o.key,
              });
            }}
          >
            <o.icon />
          </button>
        ))}
      </div>
    </div>
  );
}
