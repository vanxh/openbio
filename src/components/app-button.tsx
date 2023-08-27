// "use client";

import Link from "next/link";
// import { useUser } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";

export default async function AppButton() {
  const user = await currentUser();

  if (!user) return null;

  return (
    <div className="container absolute top-6 flex md:top-10">
      <Link className="ml-auto" href="/app">
        <Button>Go to App</Button>
      </Link>
    </div>
  );
}
