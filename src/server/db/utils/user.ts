import { db } from "../db";

export const getUserByProviderId = async (
  providerId: string,
  columns?: {
    id?: boolean | undefined;
    providerId?: boolean | undefined;
    email?: boolean | undefined;
    firstName?: boolean | undefined;
    lastName?: boolean | undefined;
    plan?: boolean | undefined;
    stripeCustomerId?: boolean | undefined;
    subscriptionId?: boolean | undefined;
    subscriptionEndsAt?: boolean | undefined;
    createdAt?: boolean | undefined;
    updatedAt?: boolean | undefined;
  },
) => {
  const result = await db.query.user.findFirst({
    where: (_user, { eq }) => eq(_user.providerId, providerId),
    columns,
  });

  return result;
};

export const isUserPremium = ({
  plan,
  subscriptionEndsAt,
}: {
  plan: "free" | "pro";
  subscriptionEndsAt?: Date | null;
}) => {
  const isPremium =
    plan === "pro" && !!subscriptionEndsAt && subscriptionEndsAt > new Date();

  return isPremium;
};
