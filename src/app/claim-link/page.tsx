import ClaimLinkForm from '@/components/forms/claim-link';
import { auth } from '@/lib/auth';
import OpenBioLogo from '@/public/openbio.png';
import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-up rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/">
            <Image src={OpenBioLogo} alt="OpenBio" width={48} height={48} />
          </Link>
          <h1 className="mt-4 font-cal text-3xl">Claim your page</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Pick a username for your OpenBio page
          </p>
        </div>
        <ClaimLinkForm />
        {!session && (
          <p className="mt-6 text-center text-muted-foreground text-sm">
            Already have an account?{' '}
            <Link
              href="/app/sign-in"
              className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
