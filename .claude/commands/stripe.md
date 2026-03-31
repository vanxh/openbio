# Stripe Integration

## Files
- Config: `src/lib/stripe/` (server + client)
- Webhook: `src/app/api/webhook/stripe/route.ts`

## Flow
1. User clicks upgrade -> Stripe Checkout session
2. Payment -> checkout.session.completed webhook -> plan: "pro"
3. Cancel -> customer.subscription.deleted -> plan: "free"

## Gating: isUserPremium({ plan, subscriptionEndsAt })
## Free: max 1 link, Pro: unlimited
## Webhook security: stripe.webhooks.constructEvent()
