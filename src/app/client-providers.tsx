"use client";

import { Elements as StripeElements } from "@stripe/react-stripe-js";

import { getStripe } from "@/stripe/client";
import { ThemeProvider } from "@/components/theme-provider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <StripeElements stripe={getStripe()} options={{}}>
        {children}
      </StripeElements>
    </ThemeProvider>
  );
}
