import CancelledEmail from '@/components/emails/cancelled';
import UpgradedEmail from '@/components/emails/upgraded';
import { stripe } from '@/lib/stripe';
import { db, eq } from '@/server/db';
import { user } from '@/server/db/schema';
import { sendEmail } from '@/server/emails';
import { type NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  if (typeof session.subscription !== 'string') {
    throw new Error('Missing subscription');
  }
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription
  );
  const stripeCustomerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
  const existingUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.stripeCustomerId, stripeCustomerId),
  });
  if (!existingUser) {
    throw new Error('User not found');
  }
  await db
    .update(user)
    .set({
      plan: 'pro',
      subscriptionId: subscription.id,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
    })
    .where(eq(user.id, existingUser.id));
  await sendEmail({
    subject: 'Thank you for upgrading!',
    to: [existingUser.email],
    react: UpgradedEmail(),
  });
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
  const existingUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.stripeCustomerId, customerId),
  });
  if (!existingUser) {
    throw new Error('User not found');
  }
  await db
    .update(user)
    .set({ plan: 'free', subscriptionId: null, subscriptionEndsAt: null })
    .where(eq(user.id, existingUser.id));
  await sendEmail({
    subject: 'Sad to see you go',
    to: [existingUser.email],
    react: CancelledEmail(),
  });
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ''
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event);
        break;
      }
      default:
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
