"use client";

import { GradientButton } from "@/components/ui/gradient-button";
import { NavbarShell } from "@/components/navbar/shared";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

export default function HomeNavbar() {
  const { data: session } = useSession();

  return (
    <NavbarShell>
      {!session && (
        <Link href="/app/sign-in" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Sign in
        </Link>
      )}
      <Link href={session ? "/app" : "/claim-link"}>
        <GradientButton size="sm">
          {session ? "Go to App" : "Get Started"}
        </GradientButton>
      </Link>
    </NavbarShell>
  );
}
