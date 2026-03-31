import AppNavbar from '@/components/navbar/app';
import type React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col items-center px-4 pt-24 pb-20">
      <AppNavbar />

      <div className="flex w-full max-w-3xl flex-col">{children}</div>
    </div>
  );
}
