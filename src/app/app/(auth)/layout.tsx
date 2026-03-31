import AuthNavbar from '@/components/navbar/auth';
import type React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-screen w-full items-center justify-center px-4">
      <div className="flex w-full flex-col items-center justify-center">
        <AuthNavbar />

        {children}
      </div>
    </div>
  );
}
