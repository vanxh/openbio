'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { authClient } from '@/lib/auth-client';
import { getErrorMessage } from '@/lib/errors';
import { PLANS } from '@/lib/plans';
import { withRedirect } from '@/lib/redirect';
import type { RouterOutputs } from '@/trpc/react';
import { Check, HelpCircle, Loader, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import Confetti from 'react-dom-confetti';

type Billing = 'monthly' | 'annually';

const TIER_ORDER = ['free', 'pro', 'business'];

/** Price per month. Annual plans are shown as their true monthly cost. */
function formatMonthlyPrice(amount: number, billing: Billing): string {
  const monthly = billing === 'annually' ? amount / 12 : amount;
  // $90 a year is $7.50 a month; rounding it to $8 overstates the price.
  return Number.isInteger(monthly) ? String(monthly) : monthly.toFixed(2);
}

function getPlanAction(currentPlan: string, plan: string): string {
  if (currentPlan === plan) {
    return 'Current plan';
  }
  return TIER_ORDER.indexOf(plan) > TIER_ORDER.indexOf(currentPlan)
    ? 'Upgrade'
    : 'Downgrade';
}

export const PricingCards = ({
  billing,
  user,
}: {
  billing: Billing;
  user?: RouterOutputs['user']['me'];
}) => {
  const [isPending, startTransition] = useTransition();

  // Someone already paying changes or cancels their plan in Polar's portal.
  // Sending them through checkout again would start a second subscription
  // alongside the first and bill them for both.
  const hasSubscription = !!user && user.plan !== 'free';

  const handleCheckout = (plan: string) => {
    startTransition(async () => {
      try {
        if (hasSubscription || plan === 'free') {
          await authClient.customer.portal();
        } else {
          const slug = `${plan}-${billing === 'monthly' ? 'monthly' : 'yearly'}`;
          await authClient.checkoutEmbed({ slug });
        }
      } catch (err) {
        toast({
          title: "Couldn't open billing",
          description: getErrorMessage(err),
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div
      id="pricing"
      className="flex w-full flex-col gap-6 md:grid md:grid-cols-3"
    >
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className="flex w-full flex-col rounded-lg border border-border bg-background px-6 py-3 md:px-8"
        >
          <p className="font-cal text-lg">{plan.name}</p>

          <p className="mt-0.5 text-muted-foreground text-sm">
            {plan.description}
          </p>

          <p className="mt-3 font-cal text-4xl">
            ${formatMonthlyPrice(plan.price[billing].amount, billing)}
          </p>

          <p className="mt-1 text-muted-foreground text-xs">
            per month{billing === 'annually' && ', billed annually'}
          </p>

          <div className="mt-3 flex w-full flex-col gap-1.5 text-left">
            {plan.features.map((f, idx) => (
              <span key={idx} className="inline-flex items-center text-sm">
                {f.notAvailable ? (
                  <X
                    className="mr-2.5 inline-block shrink-0 text-muted-foreground"
                    size={14}
                  />
                ) : (
                  <Check
                    className="mr-2.5 inline-block shrink-0 text-green-500"
                    size={14}
                  />
                )}
                {f.text}
                {f.tooltip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="ml-2">
                        <HelpCircle
                          className="inline-block text-muted-foreground"
                          size={16}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{f.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
            ))}
          </div>

          <div className="my-auto" />

          {user ? (
            <Button
              className="mt-4"
              disabled={user.plan === plan.slug || isPending}
              onClick={() => {
                handleCheckout(plan.slug);
              }}
            >
              {isPending && (
                <Loader className="mr-2 inline-block animate-spin" size={16} />
              )}
              {getPlanAction(user.plan, plan.slug)}
            </Button>
          ) : (
            // Signed out (the landing page): every plan starts with an account.
            <Button
              asChild
              className="mt-4"
              variant={plan.slug === 'free' ? 'outline' : 'default'}
            >
              <Link
                href={
                  plan.slug === 'free'
                    ? '/claim-link'
                    : withRedirect('/app/sign-up', '/app?tab=settings')
                }
              >
                {plan.slug === 'free' ? 'Get started' : `Get ${plan.name}`}
              </Link>
            </Button>
          )}

          {plan.footer && (
            <p className="mt-4 text-muted-foreground text-xs">{plan.footer}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>('monthly');

  return (
    <div className="flex w-full flex-col">
      <h1 className="font-cal text-3xl md:text-5xl">
        Simple, transparent
        <br />
        pricing
      </h1>

      <p className="mt-4 text-lg md:text-xl">
        Start with a free plan and upgrade as you grow.
      </p>

      <Tabs
        defaultValue="monthly"
        value={billing}
        onValueChange={(v) => setBilling(v as Billing)}
        className="mt-8 flex w-full flex-col items-center"
      >
        <Confetti
          active={billing === 'annually'}
          config={{ elementCount: 250, spread: 100 }}
        />
        <TabsList className="w-max">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="annually" className="gap-x-2">
            Annually
            <Badge>2 months free</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-4 w-full">
          <PricingCards billing="monthly" />
        </TabsContent>

        <TabsContent value="annually" className="mt-4 w-full">
          <PricingCards billing="annually" />
        </TabsContent>

        <div className="mt-6 flex w-full flex-col rounded-lg border border-border bg-background px-3 py-3 text-center md:px-8">
          <p className="font-cal text-2xl">Enterprise</p>

          <p className="mt-1 text-muted-foreground">
            Need more? Contact us for a custom plan for your company.
          </p>

          <Button asChild className="mx-auto mt-5 w-max">
            <Link
              href="https://cal.com/vanxh/30min"
              target="_blank"
              rel="noopener noreferrer"
            >
              Schedule call
            </Link>
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
