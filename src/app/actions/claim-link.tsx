'use server';

import { auth } from '@/lib/auth';
import { withRedirect } from '@/lib/redirect';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const claimLink = async (link: string) => {
  const destination = `/create-link?link=${encodeURIComponent(link.toLowerCase())}`;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    // Carry the claimed name through sign-up so it is waiting on the other side.
    return redirect(withRedirect('/app/sign-up', destination));
  }
  redirect(destination);
};
