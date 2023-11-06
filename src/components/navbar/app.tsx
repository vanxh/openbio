"use client";

import Image from "next/image";
import Link from "next/link";
import { useClerk } from "@clerk/clerk-react";
import { LogOut } from "lucide-react";
import OpenBio from "@/public/openbio.png";
import { Button } from "@/components/ui/button";

export default function AppNavbar() {
  const { signOut } = useClerk();

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
        <Button
          size="icon"
          onClick={() => {
            void signOut();
          }}
        >
          <LogOut className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </Link>
    </div>
  );
}
