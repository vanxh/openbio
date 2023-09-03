"use server";

import Image from "next/image";
import Link from "next/link";
import { Github, Instagram, Linkedin, Twitch, Twitter } from "lucide-react";
import { BsDiscord } from "react-icons/bs";
import { BiLogoTelegram } from "react-icons/bi";
import type * as z from "zod";

import { type linkBentoSchema } from "@/server/db";
import { getMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import CardOverlay from "@/components/bento/overlay";

const getBackgroundColor = (url: string) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    return "bg-[#F6FAFE]";
  }

  if (hostname.includes("linkedin.com")) {
    return "bg-[#F1F6F9]";
  }

  if (hostname.includes("instagram.com")) {
    return "bg-[#FDEEEF]";
  }

  if (hostname.includes("discord.com")) {
    return "bg-[#E9EBF5]";
  }

  if (hostname.includes("telegram.com") || hostname.includes("t.me")) {
    return "bg-[#E8F1FF]";
  }

  return "bg-background";
};

const getIcon = (
  url: string,
  metadata: Awaited<ReturnType<typeof getMetadata>>
) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    return <Twitter size={24} className="text-blue-400" />;
  }

  if (hostname.includes("linkedin.com")) {
    return <Linkedin size={24} className="text-blue-600" />;
  }

  if (hostname.includes("github.com")) {
    return <Github size={24} className="text-gray-600" />;
  }

  if (hostname.includes("instagram.com")) {
    return <Instagram size={24} className="text-[#F56040]" />;
  }

  if (hostname.includes("twitch.tv")) {
    return <Twitch size={24} className="text-purple-600" />;
  }

  if (hostname.includes("t.me") || hostname.includes("telegram.com")) {
    return <BiLogoTelegram size={24} className="text-[#0088CC]" />;
  }

  if (hostname.includes("discord.com")) {
    return <BsDiscord size={24} className="text-[#5A65EA]" />;
  }

  return (
    <Image
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`}
      alt={metadata?.title ?? url}
      width={24}
      height={24}
      className="rounded-md"
    />
  );
};

const getTitle = (
  url: string,
  metadata: Awaited<ReturnType<typeof getMetadata>>
) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    return `@${urlObj.pathname.split("/")[1]}`;
  }

  if (hostname.includes("linkedin.com")) {
    return `@${urlObj.pathname.split("/").pop()}`;
  }

  if (hostname.includes("github.com")) {
    return `@${urlObj.pathname.split("/").pop()}`;
  }

  if (hostname.includes("instagram.com")) {
    return `@${urlObj.pathname.split("/").pop()}`;
  }

  if (hostname.includes("twitch.tv")) {
    return `@${urlObj.pathname.split("/").pop()}`;
  }

  if (hostname.includes("t.me") || hostname.includes("telegram.com")) {
    return `@${urlObj.pathname.split("/").pop()}`;
  }

  if (hostname.includes("discord.com")) {
    return `@${urlObj.pathname.split("/").pop()}`;
  }

  return metadata?.title;
};

const getDescription = (
  url: string,
  _metadata: Awaited<ReturnType<typeof getMetadata>>
) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    return `x.com/${urlObj.pathname.split("/")[1]}`;
  }

  if (hostname.includes("linkedin.com")) {
    return `linkedin.com/in/${urlObj.pathname.split("/").pop()}`;
  }

  if (hostname.includes("github.com")) {
    return `github.com/${urlObj.pathname.split("/").pop()}`;
  }

  if (hostname.includes("instagram.com")) {
    return `instagr.am/${urlObj.pathname.split("/").pop()}`;
  }

  if (hostname.includes("twitch.tv")) {
    return `twitch.tv/${urlObj.pathname.split("/").pop()}`;
  }

  if (hostname.includes("t.me") || hostname.includes("telegram.com")) {
    return `t.me/${urlObj.pathname.split("/").pop()}`;
  }

  if (hostname.includes("discord.com")) {
    return null;
  }

  return null;
};

const getAction = (url: string) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    return (
      <Button
        size="sm"
        className="rounded-full bg-blue-400 text-white hover:bg-blue-500"
      >
        Follow
      </Button>
    );
  }

  if (hostname.includes("github.com")) {
    return (
      <Button
        size="sm"
        className="border border-border bg-gray-100 font-medium text-black hover:bg-gray-200"
      >
        Follow
      </Button>
    );
  }

  if (hostname.includes("linkedin.com")) {
    return (
      <Button
        size="sm"
        className="rounded-full bg-blue-500 text-white hover:bg-blue-600"
      >
        Follow
      </Button>
    );
  }

  if (hostname.includes("instagram.com")) {
    return (
      <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600">
        Follow
      </Button>
    );
  }

  if (hostname.includes("t.me") || hostname.includes("telegram.com")) {
    return (
      <Button
        size="sm"
        className="border border-border bg-gray-100 font-medium text-black hover:bg-gray-200"
      >
        Message
      </Button>
    );
  }

  return null;
};

export default async function LinkCard({
  bento,
  editable,
}: {
  bento: z.infer<typeof linkBentoSchema>;
  editable?: boolean;
}) {
  if (!bento.href) return null;

  const metadata = await getMetadata(bento.href);

  const title = getTitle(bento.href, metadata);
  const description = getDescription(bento.href, metadata);

  const Wrapper = editable ? "div" : Link;

  return (
    <Wrapper
      href={bento.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative z-0 row-span-2 flex h-full w-full select-none flex-col rounded-md border border-border p-5",
        getBackgroundColor(bento.href),
        editable
          ? "md:cursor-move"
          : "cursor-pointer transition-all duration-200 ease-in-out hover:bg-opacity-80 active:scale-95"
      )}
    >
      {editable && <CardOverlay bento={bento} />}

      <div className={cn("flex items-center gap-x-4")}>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
          {getIcon(bento.href, metadata)}
        </div>

        <p
          className={cn(
            "mt-2 font-cal text-sm",
            bento.size.sm === "4x1" ? "" : "hidden",
            bento.size.md === "4x1" ? "" : "hidden"
          )}
        >
          {title}
        </p>
      </div>

      <p
        className={cn(
          "mt-2 font-cal text-sm",
          bento.size.sm === "4x1" ? "hidden" : "",
          bento.size.md === "4x1" ? "hidden" : ""
        )}
      >
        {title}
      </p>

      {description && (
        <p
          className={cn(
            "truncate text-xs",
            bento.size.sm === "4x1" ? "hidden" : "",
            bento.size.md === "4x1" ? "hidden" : ""
          )}
        >
          {description}
        </p>
      )}

      <div className="mt-auto">{getAction(bento.href)}</div>
    </Wrapper>
  );
}
