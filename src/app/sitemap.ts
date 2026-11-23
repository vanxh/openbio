import { db } from '@/server/db/db';
import { link } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.openbio.app';

// Profiles are added all the time; rebuild the list hourly rather than
// freezing it at whatever existed when the app was last deployed.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '/',
    '/explore',
    '/legal/privacy',
    '/legal/terms',
    '/claim-link',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.5,
  }));

  // A database hiccup should cost the sitemap its profile entries until the
  // next revalidation, not fail the page or (at build time) the whole deploy.
  let profiles: { link: string; updatedAt: Date | null }[] = [];
  try {
    profiles = await db
      .select({
        link: link.link,
        updatedAt: link.updatedAt,
      })
      .from(link)
      .where(eq(link.isPublic, true));
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: surfaced in build and runtime logs
    console.error('sitemap: could not load public profiles', error);
  }

  const profileRoutes: MetadataRoute.Sitemap = profiles.map((p) => ({
    url: `${BASE_URL}/${p.link}`,
    lastModified: p.updatedAt ?? new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...profileRoutes];
}
