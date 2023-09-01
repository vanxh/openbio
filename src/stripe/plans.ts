import { env } from "@/env.mjs";

export const STRIPE_PLANS = [
  {
    name: "Pro",
    price: {
      monthy: {
        amount: 0,
        priceId: null,
      },
      yearly: {
        amount: 0,
        priceId: null,
      },
    },
  },
  {
    name: "Pro",
    price: {
      monthy: {
        amount: 9,
        priceId: env.STRIPE_PRO_MONTHLY_PRICE_ID,
      },
      yearly: {
        amount: 90,
        priceId: env.STRIPE_PRO_YEARLY_PRICE_ID,
      },
    },
  },
];
