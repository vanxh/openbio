export const isUserPremium = ({
  plan,
  subscriptionEndsAt,
  trialEndsAt,
}: {
  plan: 'free' | 'pro';
  subscriptionEndsAt?: Date | null;
  trialEndsAt?: Date | null;
}) => {
  const now = new Date();
  // Active subscription
  if (plan === 'pro' && subscriptionEndsAt && subscriptionEndsAt > now) {
    return true;
  }
  // Active trial
  if (trialEndsAt && trialEndsAt > now) {
    return true;
  }
  return false;
};
