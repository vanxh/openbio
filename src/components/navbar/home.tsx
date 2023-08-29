"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

import OpenBio from "@/public/openbio.png";
import { Button } from "@/components/ui/button";

export default function HomeNavbar() {
  const { isSignedIn } = useUser();

  return (
    <div className="container absolute top-6 flex md:top-10">
      <Link className="mr-auto" href="/">
        <Image
          src={OpenBio}
          alt="OpenBio"
          width={50}
          height={50}
          loading="eager"
        />
      </Link>

      <Link className="ml-auto" href="/app">
        <Button>{isSignedIn ? "Go to App" : "Get Started"}</Button>
      </Link>
    </div>
  );
}
