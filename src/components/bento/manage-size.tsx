"use client";

import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { type Bento } from "@prisma/client";

import { api } from "@/trpc/client";
import { cn } from "@/lib/utils";
import Size2x2 from "@/components/icons/size_2x2";
import Size4x2 from "@/components/icons/size_4x2";
import Size2x4 from "@/components/icons/size_2x4";
import Size4x4 from "@/components/icons/size_4x4";
import { Button } from "@/components/ui/button";

function ResponsivePortal({ children }: { children: React.ReactNode }) {
  if (window.outerWidth > 500) {
    return children;
  }

  return createPortal(children, document.body);
}

export default function ManageSize({
  bento,
  close,
}: {
  bento: Bento;
  close: () => void;
}) {
  const router = useRouter();

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
    <ResponsivePortal>
      <div className="container fixed bottom-6 left-1/2 z-20 mx-auto -translate-x-1/2 md:absolute md:bottom-0 md:w-max md:translate-y-1/2">
        <div className="flex items-center rounded-lg bg-primary px-4 py-4 text-primary-foreground shadow md:px-2 md:py-2">
          {sizeOptions.map((o) => (
            <button
              key={o.key}
              className={cn(
                "md:- inline-flex items-center justify-center p-2 transition-transform duration-200 ease-in-out active:scale-95",
                size === o.key &&
                  "rounded-sm bg-secondary text-secondary-foreground"
              )}
              onClick={() => {
                void api.profileLink.updateProfileLinkBento
                  .mutate({
                    id: bento.id,
                    [window.outerWidth < 500 ? "mobileSize" : "desktopSize"]:
                      o.key,
                  })
                  .then(() => {
                    void router.refresh();
                  });
              }}
            >
              <o.icon />
            </button>
          ))}

          <Button
            variant="secondary"
            onClick={close}
            className="ml-auto md:hidden"
          >
            Done
          </Button>
        </div>
      </div>
    </ResponsivePortal>
  );
}
