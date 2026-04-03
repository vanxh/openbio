import { db } from '@/server/db/db';
import { link } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.openbio.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '/',
    '/explore',
    '/legal/privacy',
    '/legal/terms',
    '/claim-link',
    '/app/sign-in',
    '/app/sign-up',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.5,
  }));

  const profiles = await db
    .select({
      link: link.link,
      updatedAt: link.updatedAt,
    })
    .from(link)
    .where(eq(link.isPublic, true));

  const profileRoutes: MetadataRoute.Sitemap = profiles.map((p) => ({
    url: `${BASE_URL}/${p.link}`,
    lastModified: p.updatedAt ?? new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...profileRoutes];
}
