"use client";

import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import type * as z from "zod";

import { type bentoSchema } from "@/server/db";
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
  bento: z.infer<typeof bentoSchema>;
  close: () => void;
}) {
  const router = useRouter();
  const { link } = useParams() as { link: string };

  const size = window.outerWidth < 500 ? bento.size.sm : bento.size.md;

  const sizeOptions = [
    {
      key: "2x2",
      icon: Size2x2,
    },
    {
      key: "4x2",
      icon: Size4x2,
    },
    {
      key: "2x4",
      icon: Size2x4,
    },
    {
      key: "4x4",
      icon: Size4x4,
    },
  ];

  return (
    <ResponsivePortal>
      <div className="container fixed bottom-6 left-1/2 z-20 mx-auto -translate-x-1/2 md:absolute md:bottom-0 md:w-max md:translate-y-1/2">
        <div className="flex items-center gap-x-4 rounded-lg bg-primary px-4 py-4 text-primary-foreground shadow md:gap-x-0 md:px-2 md:py-2">
          {sizeOptions.map((o) => (
            <button
              key={o.key}
              className={cn(
                "inline-flex items-center justify-center p-2 transition-transform duration-200 ease-in-out active:scale-95",
                size === o.key &&
                  "rounded-sm bg-secondary text-secondary-foreground"
              )}
              onClick={() => {
                void api.profileLink.updateBento
                  .mutate({
                    link,
                    bento: {
                      ...bento,
                      size: {
                        ...bento.size,
                        [window.outerWidth < 500 ? "sm" : "md"]: o.key,
                      },
                    },
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
