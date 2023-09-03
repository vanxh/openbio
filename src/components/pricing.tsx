"use client";

import { useState, useTransition } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Confetti from "react-dom-confetti";
import { Check, HelpCircle, Loader, X } from "lucide-react";

import { PLANS } from "@/lib/stripe/plans";
import { getStripe } from "@/lib/stripe/client";
import { type RouterOutputs, api } from "@/trpc/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type Billing = "monthly" | "annually";

export const PricingCards = ({
  billing,
  user,
}: {
  billing: Billing;
  user?: RouterOutputs["user"]["me"];
}) => {
  const [isPending, startTransition] = useTransition();

  const handleCheckout = (plan: string) => {
    startTransition(async () => {
      switch (plan) {
        case "free":
          const billingPortal = await api.stripe.getBillingPortalUrl.mutate();

          void redirect(billingPortal);
          break;

        case "pro":
          const session = await api.stripe.getCheckoutSession.mutate({
            billing,
          });

          const stripe = await getStripe();

          void stripe?.redirectToCheckout({
            sessionId: session.id,
          });
          break;
      }
    });
  };

  return (
    <div
      id="pricing"
      className="flex w-full flex-col gap-6 md:grid md:grid-cols-2"
    >
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className="flex w-full flex-col rounded-lg border border-border bg-background px-6 py-3 md:px-8"
        >
          <p className="font-cal text-2xl">{plan.name}</p>

          <p className="mt-1 text-muted-foreground">{plan.description}</p>

          <p className="mt-3 font-cal text-6xl">
            $
            {plan.price[billing as keyof typeof plan.price]?.amount /
              (billing === "annually" ? 12 : 1)}
          </p>

          <p className="mt-2 text-muted-foreground">
            per month{billing === "annually" && <>, billed annually</>}
          </p>

          <div className="mt-4 flex w-full flex-col gap-2 text-left">
            {plan.features.map((f, idx) => (
              <span key={idx} className="inline-flex items-center">
                {f.notAvailable ? (
                  <X
                    className="mr-4 inline-block text-muted-foreground"
                    size={16}
                  />
                ) : (
                  <Check
                    className="mr-4 inline-block text-green-500"
                    size={16}
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

          {user && (
            <Button
              className="mt-4"
              disabled={
                user.plan.toLowerCase() === plan.name.toLowerCase() || isPending
              }
              onClick={() => {
                void handleCheckout(plan.name.toLowerCase());
              }}
            >
              {isPending && (
                <Loader className="mr-2 inline-block animate-spin" size={16} />
              )}
              {user.plan.toLowerCase() === plan.name.toLowerCase()
                ? "Current plan"
                : plan.name.toLowerCase() === "free"
                ? "Downgrade"
                : "Upgrade"}
            </Button>
          )}

          {plan.footer && (
            <p className="mt-4 text-xs text-muted-foreground">{plan.footer}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");

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
          active={billing === "annually"}
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

          <Link
            href="https://cal.com/vanxh/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5"
          >
            <Button>Schedule call</Button>
          </Link>
        </div>
      </Tabs>
    </div>
  );
}
