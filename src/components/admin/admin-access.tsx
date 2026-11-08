import { NavbarShell } from '@/components/navbar/shared';
import { Badge } from '@/components/ui/badge';
import OpenBioLogo from '@/public/openbio.png';
import { ArrowLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import s from './admin.module.css';

export function AdminAccess({
  signedIn,
  preview,
}: { signedIn: boolean; preview: boolean }) {
  return (
    <main className={s.accessPage}>
      <NavbarShell>
        <Badge variant="secondary" className="rounded-full">
          Admin
        </Badge>
      </NavbarShell>
      <div className={s.accessCard}>
        <Link href="/" className={s.accessLogo}>
          <Image src={OpenBioLogo} alt="OpenBio" width={40} height={40} />
        </Link>
        <div className={s.accessIcon}>
          <ShieldCheck size={30} />
        </div>
        <h1>
          {signedIn ? 'Admin access required' : 'Sign in to OpenBio admin'}
        </h1>
        <p>
          {signedIn
            ? 'Your account does not have administrator access. Ask the workspace owner to add your user ID to ADMIN_USER_IDS on the server.'
            : 'Sign in with an administrator account to manage the OpenBio community, profiles, and platform.'}
        </p>
        <Link
          className={s.primaryButton}
          href={signedIn ? '/app' : '/app/sign-in'}
        >
          {signedIn ? 'Back to your dashboard' : 'Sign in to OpenBio'}
          <ArrowUpRight size={16} />
        </Link>
        {preview ? (
          <Link className={s.textButton} href="/admin/preview">
            Explore the development preview <ArrowUpRight size={15} />
          </Link>
        ) : null}
        <Link className={s.backLink} href="/">
          <ArrowLeft size={14} /> Back to OpenBio
        </Link>
      </div>
    </main>
  );
}
