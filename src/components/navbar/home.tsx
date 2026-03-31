'use client';

import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import OpenBio from '@/public/openbio.png';
import Image from 'next/image';
import Link from 'next/link';

export default function HomeNavbar() {
  const { data: session } = useSession();

  return (
    <div className="container absolute top-6 flex md:top-10">
      <Link className="mr-auto" href="/">
        <Image
          src={OpenBio}
          alt="OpenBio"
          width={50}
          height={50}
          loading="eager"
        />
      </Link>

      <Link className="ml-auto" href="/app">
        <Button>{session ? 'Go to App' : 'Get Started'}</Button>
      </Link>
    </div>
  );
}
