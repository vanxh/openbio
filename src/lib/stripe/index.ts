import Stripe from "stripe";
import { env } from "@/env.mjs";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
  appInfo: {
    name: "OpenBio",
    version: "0.1.0",
  },
});
