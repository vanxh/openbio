import type { PlanName } from '@/lib/plans';

/** The parts of a Polar subscription that decide what a user has access to. */
export type SubscriptionSnapshot = {
  id: string;
  status: string;
  productId: string;
  currentPeriodEnd: Date | null;
};

/** The billing columns on the `user` row. */
export type BillingState = {
  plan: PlanName;
  subscriptionId: string | null;
  subscriptionEndsAt: Date | null;
};

export function getPlanFromProductId(
  productId: string,
  env: Record<string, string | undefined> = process.env
): 'pro' | 'business' {
  const businessIds = [
    env.POLAR_BUSINESS_MONTHLY_PRODUCT_ID,
    env.POLAR_BUSINESS_YEARLY_PRODUCT_ID,
  ];
  return businessIds.includes(productId) ? 'business' : 'pro';
}

// Polar statuses that mean the customer is entitled to their plan right now.
// A subscription cancelled "at period end" stays `active` until it lapses.
const ENTITLED_STATUSES = new Set(['active', 'trialing']);

// Statuses that mean access is over. `past_due` is deliberately absent: Polar
// is still retrying the payment, and access simply runs out at the period end
// already stored if it never succeeds.
const ENDED_STATUSES = new Set(['canceled', 'unpaid', 'incomplete_expired']);

/**
 * What a user's billing columns should become after a subscription event, or
 * null to leave them alone.
 *
 * Every subscription webhook is funnelled through this, because the state of
 * the subscription, not the name of the event, is what matters: renewals
 * arrive as `subscription.updated`, and `subscription.canceled` fires while
 * the customer still has paid time left.
 */
export function getBillingState(
  subscription: SubscriptionSnapshot,
  current: BillingState,
  env: Record<string, string | undefined> = process.env
): BillingState | null {
  const sameSubscription = current.subscriptionId === subscription.id;

  if (ENTITLED_STATUSES.has(subscription.status)) {
    let subscriptionEndsAt = subscription.currentPeriodEnd;

    // Webhooks can arrive out of order. An older event for the subscription
    // already on file must not pull the paid-through date backwards.
    if (
      sameSubscription &&
      current.subscriptionEndsAt &&
      (!subscriptionEndsAt || current.subscriptionEndsAt > subscriptionEndsAt)
    ) {
      subscriptionEndsAt = current.subscriptionEndsAt;
    }

    return {
      plan: getPlanFromProductId(subscription.productId, env),
      subscriptionId: subscription.id,
      subscriptionEndsAt,
    };
  }

  if (ENDED_STATUSES.has(subscription.status)) {
    // Only the subscription on file can end the user's access. A late event
    // about one they replaced must not downgrade the new one.
    if (current.subscriptionId && !sameSubscription) {
      return null;
    }
    return { plan: 'free', subscriptionId: null, subscriptionEndsAt: null };
  }

  return null;
}
