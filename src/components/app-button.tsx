"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export default function AppButton() {
  const { isSignedIn } = useUser();

  if (!isSignedIn) return null;

  return (
    <div className="container absolute top-6 flex md:top-10">
      <Link className="ml-auto" href="/app">
        <Button>Go to App</Button>
      </Link>
    </div>
  );
}
