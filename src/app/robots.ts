import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/', '/api/', '/admin'],
      },
    ],
    sitemap: 'https://www.openbio.app/sitemap.xml',
  };
}
