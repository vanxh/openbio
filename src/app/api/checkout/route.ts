import { Checkout } from '@polar-sh/nextjs';

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
  successUrl: '/app',
  server:
    (process.env.POLAR_SERVER as 'sandbox' | 'production') ?? 'sandbox',
});
