"use client";

import { useState } from "react";
import { Check, Loader, X } from "lucide-react";
import { claimLink } from "@/app/actions/claim-link";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export default function ClaimLinkForm({ className }: { className?: string }) {
  const [link, setLink] = useState("");

  const debouncedLink = useDebounce(link, 500);

  const { data: available, isFetching } =
    api.profileLink.linkAvailable.useQuery(
      {
        link: debouncedLink,
      },
      {
        enabled: !!debouncedLink,
        staleTime: Infinity,
      },
    );

  return (
    <form
      className={cn("w-full space-y-4 md:w-[300px]", className)}
      action={() => {
        if (!debouncedLink || isFetching || !available) return;
        void claimLink(link);
      }}
    >
      <div className="flex h-9 w-full items-center gap-x-1 rounded-md border border-input px-3 py-1 text-sm shadow-sm">
        <span className="text-sm text-muted-foreground">openbio.app/</span>
        <input
          className="bg-transparent outline-none placeholder:text-muted-foreground"
          autoFocus
          placeholder="vanxh"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        {debouncedLink && (
          <div className="ml-auto">
            {isFetching ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : available ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
          </div>
        )}
      </div>

      {debouncedLink && !isFetching && available && (
        <Button className="w-full">Claim my link</Button>
      )}
    </form>
  );
}
