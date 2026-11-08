import type { RouterOutputs } from '@/trpc/react';

export type AdminUser = RouterOutputs['admin']['users']['items'][number];
export type AdminProfile = RouterOutputs['admin']['profiles']['items'][number];
export type AdminOverview = RouterOutputs['admin']['overview'];
export type AdminView =
  | 'overview'
  | 'users'
  | 'profiles'
  | 'analytics'
  | 'subscriptions'
  | 'system';
export const adminViews: AdminView[] = [
  'overview',
  'users',
  'profiles',
  'analytics',
  'subscriptions',
  'system',
];

const people = [
  ['Olivia Rhye', 'olivia', 'pro'],
  ['Phoenix Baker', 'phoenix', 'free'],
  ['Lana Steiner', 'lana', 'business'],
  ['Demi Wilkinson', 'demi', 'pro'],
  ['Drew Cano', 'drew', 'free'],
  ['Natali Craig', 'natali', 'pro'],
  ['Orlando Diggs', 'orlando', 'free'],
  ['Andi Lane', 'andi', 'business'],
  ['Kate Morrison', 'kate', 'pro'],
  ['Noah Williams', 'noah', 'free'],
  ['Maya Chen', 'maya', 'pro'],
  ['Alex Morgan', 'alex', 'free'],
  ['Sienna Brooks', 'sienna', 'business'],
  ['Leo Martinez', 'leo', 'pro'],
  ['Avery James', 'avery', 'free'],
  ['Jules Park', 'jules', 'pro'],
  ['Ellis Gray', 'ellis', 'free'],
  ['Robin Bell', 'robin', 'pro'],
] as const;

export function previewUsers(): AdminUser[] {
  return people.map(([name, slug, plan], i) => ({
    id: `preview-user-${i}`,
    name,
    email: `${slug}@example.com`,
    emailVerified: i % 5 !== 1,
    image: null,
    plan,
    aiCredits: { free: 0, pro: 42, business: 450 }[plan],
    createdAt: new Date(Date.now() - (i * 7 + 1) * 3_600_000),
    subscriptionId: plan === 'free' ? null : `preview-sub-${i}`,
    subscriptionEndsAt:
      plan === 'free' ? null : new Date(Date.now() + 20 * 86_400_000),
    trialEndsAt: null,
    profileCount: { free: 1, pro: 3, business: 6 }[plan],
  }));
}

export function previewProfiles(): AdminProfile[] {
  return people.map(([name, slug], i) => ({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    name,
    slug,
    image: null,
    isPublic: i % 4 !== 3,
    customDomain: i % 3 === 0 ? `${slug}.example.com` : null,
    createdAt: new Date(Date.now() - (i * 7 + 1) * 3_600_000),
    owner: `${slug}@example.com`,
    cards: 4 + (i % 8),
  }));
}

export function previewOverview(days: 7 | 30 | 90): AdminOverview {
  const daily = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days + i + 1);
    return {
      day: date.toISOString().slice(0, 10),
      views: Math.round(
        2100 + i * 26 + Math.sin(i * 0.9) * 700 + Math.cos(i * 1.8) * 320
      ),
      clicks: Math.round(580 + i * 9 + Math.sin(i * 0.9) * 240),
      users: 21 + (i % 11) * 3,
    };
  });
  const views = daily.reduce((sum, day) => sum + day.views, 0);
  const clicks = daily.reduce((sum, day) => sum + day.clicks, 0);
  return {
    users: {
      total: 12846,
      current: days * 39,
      previous: days * 32,
      unverified: 186,
    },
    profiles: { total: 18432, listed: 16728, domains: 247 },
    views: {
      current: views,
      previous: Math.round(views / 1.184),
      unique: Math.round(views * 0.72),
    },
    clicks: { current: clicks, previous: Math.round(clicks / 1.123) },
    daily,
    plans: [
      { plan: 'free', count: 9864, subscribed: 0 },
      { plan: 'pro', count: 2416, subscribed: 2416 },
      { plan: 'business', count: 566, subscribed: 566 },
    ],
    recent: previewUsers().slice(0, 5),
    topProfiles: people.slice(0, 5).map(([name, slug], i) => ({
      id: `top-${i}`,
      name,
      slug,
      views: Math.round(views * (0.16 - i * 0.025)),
    })),
    countries: [
      { country: 'US', count: Math.round(views * 0.42) },
      { country: 'GB', count: Math.round(views * 0.18) },
      { country: 'IN', count: Math.round(views * 0.14) },
      { country: 'DE', count: Math.round(views * 0.09) },
      { country: 'CA', count: Math.round(views * 0.06) },
      { country: null, count: Math.round(views * 0.11) },
    ],
    referrers: [
      { referrer: 'https://instagram.com', count: Math.round(views * 0.38) },
      { referrer: null, count: Math.round(views * 0.27) },
      { referrer: 'https://google.com', count: Math.round(views * 0.18) },
      { referrer: 'https://linkedin.com', count: Math.round(views * 0.1) },
      { referrer: 'https://t.co', count: Math.round(views * 0.07) },
    ],
    generatedAt: new Date(),
  };
}
