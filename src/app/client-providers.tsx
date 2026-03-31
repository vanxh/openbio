'use client';

import type React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { getStripe } from '@/lib/stripe/client';
import { TRPCReactProvider } from '@/trpc/react';
import { Elements as StripeElements } from '@stripe/react-stripe-js';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCReactProvider>
      <ThemeProvider>
        <StripeElements stripe={getStripe()} options={{}}>
          {children}
        </StripeElements>
      </ThemeProvider>
    </TRPCReactProvider>
  );
}
