await import('./src/env.mjs');

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  serverExternalPackages: ['@neondatabase/serverless'],
  images: {
    // Only images we host may go through the optimizer. A wildcard here would
    // let anyone use /_next/image to fetch and resize arbitrary URLs on our
    // bill. Images from other hosts render through `RemoteImage`, which
    // skips the optimizer for them.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default config;
