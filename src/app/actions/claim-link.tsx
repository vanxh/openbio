'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const claimLink = async (link: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return redirect(
      `/app/sign-up?redirectUrl=/create-link?link=${link.toLowerCase()}`
    );
  }
  redirect(`/create-link?link=${link.toLowerCase()}`);
};
