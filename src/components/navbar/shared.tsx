import { cn } from '@/lib/utils';
import OpenBioLogo from '@/public/openbio.png';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function NavbarShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={cn(
          'flex h-14 w-full max-w-3xl items-center rounded-full border border-border/50 bg-background/80 px-5 shadow-sm backdrop-blur-lg',
          className
        )}
      >
        <Link href="/" className="flex items-center gap-x-2">
          <Image src={OpenBioLogo} alt="OpenBio" width={28} height={28} />
          <span className="font-cal text-base">OpenBio</span>
        </Link>
        <div className="ml-auto flex items-center gap-x-3">{children}</div>
      </nav>
    </div>
  );
}
