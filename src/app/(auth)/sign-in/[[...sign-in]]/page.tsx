"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

import AuthLayout from "@/components/layout/auth-layout";

export default function Page({
  searchParams,
}: {
  searchParams: {
    redirectUrl?: string;
  };
}) {
  const { theme } = useTheme();

  return (
    <AuthLayout>
      <SignIn
        appearance={{
          baseTheme: theme === "dark" ? dark : undefined,
        }}
        afterSignUpUrl={searchParams.redirectUrl}
        afterSignInUrl={searchParams.redirectUrl}
      />
    </AuthLayout>
  );
}
