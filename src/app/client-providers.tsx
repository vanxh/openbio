'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { TRPCReactProvider } from '@/trpc/react';
import type React from 'react';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCReactProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </TRPCReactProvider>
  );
}
