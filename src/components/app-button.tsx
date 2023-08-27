"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export default function AppButton() {
  const { isSignedIn } = useUser();

  return (
    <div className="container absolute top-6 flex md:top-10">
      <Link className="ml-auto" href="/app">
        <Button>{isSignedIn ? "Go to App" : "Get Started"}</Button>
      </Link>
    </div>
  );
}
