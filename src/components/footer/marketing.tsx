"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Eye } from "lucide-react";

import { api } from "@/trpc/client";

export default function MarketingFooter() {
  const { link } = useParams() as { link: string };

  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const getViews = async () => {
      const profileLink = await api.profileLink.getByLink.query({ link });
      if (!profileLink) return;

      const views = await api.profileLink.getViews.query({
        id: profileLink.id,
      });

      setViews(views);
    };

    void getViews();

    return () => {
      setViews(null);
    };
  }, [link]);

  return (
    <footer className="bottom-0 flex w-full max-w-3xl flex-col items-center justify-center gap-y-2 md:items-start">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-medium">
          Powered by{" "}
          <Link
            href="https://openbio.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            OpenBio
          </Link>
        </span>

        {views !== null && (
          <div className="flex flex-row items-center gap-x-2 text-muted-foreground">
            <Eye size={16} />
            <span className="text-sm">{views}</span>
          </div>
        )}
      </div>
    </footer>
  );
}
