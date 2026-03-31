import { cn } from "@/lib/utils";
import OpenBioLogo from "@/public/openbio.png";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function NavbarShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
        <Link href="/" className="flex items-center gap-x-2">
          <Image src={OpenBioLogo} alt="OpenBio" width={32} height={32} />
          <span className="font-cal text-lg">OpenBio</span>
        </Link>
        <div className="ml-auto flex items-center gap-x-3">{children}</div>
      </div>
    </nav>
  );
}
