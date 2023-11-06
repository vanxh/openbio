"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";

export const claimLink = (link: string) => {
  const { userId } = auth();

  if (!userId) {
    return redirect(
      `/app/sign-up?redirectUrl=/create-link?link=${link.toLowerCase()}`,
    );
  }

  redirect(`/create-link?link=${link.toLowerCase()}`);
};
