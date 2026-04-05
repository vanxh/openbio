import { AI_CREDITS, LINK_LIMITS, type PlanName } from '@/lib/plans';

export const isUserPremium = ({
  plan,
  subscriptionEndsAt,
  trialEndsAt,
}: {
  plan: string;
  subscriptionEndsAt?: Date | null;
  trialEndsAt?: Date | null;
}) => {
  const now = new Date();
  // Active subscription (pro or business)
  if (
    (plan === 'pro' || plan === 'business') &&
    subscriptionEndsAt &&
    subscriptionEndsAt > now
  ) {
    return true;
  }
  // Active trial
  if (trialEndsAt && trialEndsAt > now) {
    return true;
  }
  return false;
};

export const isBusinessPlan = ({
  plan,
  subscriptionEndsAt,
}: {
  plan: string;
  subscriptionEndsAt?: Date | null;
}) => {
  const now = new Date();
  return (
    plan === 'business' && !!subscriptionEndsAt && subscriptionEndsAt > now
  );
};

export const getLinkLimit = (plan: string): number => {
  return LINK_LIMITS[(plan as PlanName) ?? 'free'] ?? 1;
};

export const getAiCreditLimit = (plan: string): number => {
  return AI_CREDITS[(plan as PlanName) ?? 'free'] ?? 0;
};
