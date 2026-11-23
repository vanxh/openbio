import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // `/api/og` renders every page's social preview image; crawlers that
        // honour robots.txt would otherwise show link previews without one.
        allow: ['/', '/api/og'],
        disallow: ['/app/', '/api/', '/admin', '/create-link'],
      },
    ],
    sitemap: 'https://www.openbio.app/sitemap.xml',
  };
}
