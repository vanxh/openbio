import { Elements as StripeElements } from "@stripe/react-stripe-js";

import { getStripe } from "@/stripe/client";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@/components/clerk-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ClerkProvider>
        <StripeElements stripe={getStripe()} options={{}}>
          {children}
        </StripeElements>
      </ClerkProvider>
    </ThemeProvider>
  );
}
