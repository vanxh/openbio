import '@/styles/globals.css';
import ClientProviders from '@/app/client-providers';
import {
  defaultMetadata,
  ogMetadata,
  twitterMetadata,
} from '@/app/shared-metadata';
import Background from '@/components/background';
import { TailwindIndicator } from '@/components/tailwind-indicator';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/react';
import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import LocalFont from 'next/font/local';
import type { ReactNode } from 'react';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const calSans = LocalFont({
  src: '../../public/fonts/CalSans-SemiBold.ttf',
  variable: '--font-calsans',
});

export const metadata: Metadata = {
  ...defaultMetadata,
  twitter: {
    ...twitterMetadata,
  },
  openGraph: {
    ...ogMetadata,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${calSans.variable} font-sans`}>
        <Background />

        <ClientProviders>{children}</ClientProviders>

        <Toaster />
        <TailwindIndicator />
        <Analytics />
      </body>
    </html>
  );
}
