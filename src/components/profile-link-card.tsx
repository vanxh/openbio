import Link from "next/link";
import { type ProfileLink } from "@prisma/client";
import { Eye } from "lucide-react";

export default function ProfileLinkCard({ link }: { link: ProfileLink }) {
  return (
    <Link
      href={`/${link.link}`}
      className="flex flex-col rounded-md border border-border bg-background px-4 py-2 transition-transform active:scale-95"
    >
      <span className="font-cal text-lg">{link.name}</span>
      <span className="text-sm text-muted-foreground">
        openbio.app/{link.link}
      </span>

      <div className="mt-4 flex items-center gap-x-4 text-muted-foreground">
        <span className="inline-flex items-center gap-x-2">
          <Eye size={16} />
          <span className="text-xs">
            {link.views || "0"} {link.views === 1 ? "view" : "views"}
          </span>
        </span>
      </div>
    </Link>
  );
}
