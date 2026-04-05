import { Polar } from '@polar-sh/sdk';

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
  server: (process.env.POLAR_SERVER as 'sandbox' | 'production') ?? 'sandbox',
});
