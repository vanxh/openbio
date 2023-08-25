import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";

import OpenBio from "@/public/openbio.png";
import { api } from "@/trpc/server";
import { Button } from "@/components/ui/button";

export default async function Page({
  params,
}: {
  params: {
    link: string;
  };
}) {
  const profileLink = await api.profileLink.getProfileLink.query(params.link);
  console.log(profileLink);

  return (
    <div className="h-full w-full">
      <div className="mx-auto grid max-w-3xl grid-cols-6 gap-6 px-6 pb-16 pt-16">
        TODO
      </div>
    </div>
  );
}
