"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

import AuthLayout from "@/components/layout/auth-layout";

export default function Page() {
  const { resolvedTheme } = useTheme();

  return (
    <AuthLayout>
      <SignUp
        appearance={{
          baseTheme: resolvedTheme === "dark" ? dark : undefined,
        }}
      />
    </AuthLayout>
  );
}
