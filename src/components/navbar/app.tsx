"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import OpenBio from "@/public/openbio.png";
import { Button } from "@/components/ui/button";

export default function AppNavbar() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

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

      <Button size="icon" className="ml-auto" onClick={handleSignOut}>
        <LogOut className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    </div>
  );
}
