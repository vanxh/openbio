"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

import AuthLayout from "@/components/layout/auth-layout";

export default function Page() {
  const { resolvedTheme } = useTheme();

  return (
    <AuthLayout>
      <SignIn
        appearance={{
          baseTheme: resolvedTheme === "dark" ? dark : undefined,
        }}
      />
    </AuthLayout>
  );
}
