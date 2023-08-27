"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function Page({
  searchParams,
}: {
  searchParams: {
    redirectUrl?: string;
  };
}) {
  const { theme } = useTheme();

  return (
    <SignIn
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined,
      }}
      afterSignUpUrl={searchParams.redirectUrl}
      afterSignInUrl={searchParams.redirectUrl}
    />
  );
}
