export const isUserPremium = ({
  plan,
  subscriptionEndsAt,
}: {
  plan: 'free' | 'pro';
  subscriptionEndsAt?: Date | null;
}) => {
  const isPremium =
    plan === 'pro' && !!subscriptionEndsAt && subscriptionEndsAt > new Date();

  return isPremium;
};
