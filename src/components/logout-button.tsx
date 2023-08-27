"use client";

import Link from "next/link";
import { useClerk } from "@clerk/clerk-react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const { signOut } = useClerk();

  return (
    <div className="container absolute top-6 flex md:top-10">
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
