"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const claimLink = async (link: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return redirect(
      `/app/sign-up?redirectUrl=/create-link?link=${link.toLowerCase()}`,
    );
  }
  redirect(`/create-link?link=${link.toLowerCase()}`);
};
