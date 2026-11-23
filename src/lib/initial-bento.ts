import type { LinkBento } from '@/types';

/** Social handles collected on the create-profile screen, in display order. */
export const SOCIAL_KEYS = [
  'twitter',
  'github',
  'linkedin',
  'instagram',
  'telegram',
  'discord',
  'youtube',
  'twitch',
] as const;

export type SocialKey = (typeof SOCIAL_KEYS)[number];

const SOCIAL_URLS: Record<SocialKey, (handle: string) => string> = {
  twitter: (handle) => `https://x.com/${handle}`,
  github: (handle) => `https://github.com/${handle}`,
  linkedin: (handle) => `https://www.linkedin.com/in/${handle}`,
  instagram: (handle) => `https://instagram.com/${handle}`,
  telegram: (handle) => `https://t.me/${handle}`,
  // Discord has no public URL for a username; this resolves for user IDs.
  discord: (handle) => `https://discord.com/users/${handle}`,
  youtube: (handle) => `https://www.youtube.com/@${handle}`,
  twitch: (handle) => `https://www.twitch.tv/${handle}`,
};

const HTTP_URL_RE = /^https?:\/\//i;
const LEADING_AT_RE = /^@+/;

/**
 * Turn what someone typed into a social field into a profile URL. People
 * paste full URLs and `@handles` as often as bare usernames, so accept all
 * three. Returns null when nothing usable was entered.
 */
export function getSocialUrl(key: SocialKey, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (HTTP_URL_RE.test(trimmed)) {
    return URL.canParse(trimmed) ? trimmed : null;
  }

  const handle = trimmed.replace(LEADING_AT_RE, '');
  if (!handle) {
    return null;
  }

  return SOCIAL_URLS[key](encodeURIComponent(handle));
}

/**
 * Grid slot for the nth default-size (2x2) card: the mobile grid is two cards
 * wide and the desktop grid four, filled left to right, top to bottom.
 */
export function getGridPosition(index: number): LinkBento['position'] {
  return {
    sm: { x: index % 2, y: Math.floor(index / 2) },
    md: { x: index % 4, y: Math.floor(index / 4) },
  };
}

/** Starter link cards for a new profile, one per social handle provided. */
export function generateInitialBento(
  socials: Partial<Record<SocialKey, string | undefined>>
): LinkBento[] {
  const bento: LinkBento[] = [];

  for (const key of SOCIAL_KEYS) {
    const href = getSocialUrl(key, socials[key] ?? '');
    if (!href) {
      continue;
    }

    bento.push({
      id: crypto.randomUUID(),
      type: 'link',
      href,
      clicks: 0,
      size: { sm: '2x2', md: '2x2' },
      position: getGridPosition(bento.length),
    });
  }

  return bento;
}
