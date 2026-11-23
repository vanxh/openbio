import { isHostOf } from '@/lib/url';

export type PlatformKey =
  | 'twitter'
  | 'linkedin'
  | 'github'
  | 'instagram'
  | 'twitch'
  | 'telegram'
  | 'discord'
  | 'youtube';

const PLATFORM_DOMAINS: [PlatformKey, string[]][] = [
  ['twitter', ['twitter.com', 'x.com']],
  ['linkedin', ['linkedin.com']],
  ['github', ['github.com']],
  ['instagram', ['instagram.com']],
  ['twitch', ['twitch.tv']],
  ['telegram', ['t.me', 'telegram.me']],
  ['discord', ['discord.com', 'discord.gg']],
  ['youtube', ['youtube.com', 'youtu.be']],
];

/** How each platform's profile URL is shown under the handle. */
const PLATFORM_DISPLAY: Record<PlatformKey, string> = {
  twitter: 'x.com',
  linkedin: 'linkedin.com/in',
  github: 'github.com',
  instagram: 'instagram.com',
  twitch: 'twitch.tv',
  telegram: 't.me',
  discord: 'discord.com',
  youtube: 'youtube.com',
};

const YOUTUBE_CHANNEL_PREFIXES = new Set(['c', 'channel', 'user']);
const LEADING_AT_RE = /^@+/;
const LEADING_WWW_RE = /^www\./;

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/** The social platform a URL belongs to, matched on its real hostname. */
export function getPlatformKey(url: string): PlatformKey | null {
  const parsed = parse(url);
  if (!parsed) {
    return null;
  }
  const match = PLATFORM_DOMAINS.find(([, domains]) =>
    domains.some((domain) => isHostOf(parsed.hostname, domain))
  );
  return match?.[0] ?? null;
}

/** The path segment naming the account, if this is a profile URL. */
function findHandleSegment(
  platform: PlatformKey,
  segments: string[]
): string | undefined {
  const [first, second] = segments;
  if (!first || platform === 'discord') {
    return;
  }
  if (platform === 'linkedin') {
    return first === 'in' && segments.length === 2 ? second : undefined;
  }
  if (platform === 'youtube') {
    if (segments.length === 1 && first.startsWith('@')) {
      return first;
    }
    return segments.length === 2 && YOUTUBE_CHANNEL_PREFIXES.has(first)
      ? second
      : undefined;
  }
  return segments.length === 1 ? first : undefined;
}

/**
 * The account a platform URL points at, or null when it points at something
 * else on that platform (a video, a repository, a single post), which should
 * not be presented as "@handle" with a Follow button.
 */
export function getProfileHandle(url: string): string | null {
  const platform = getPlatformKey(url);
  const parsed = parse(url);
  if (!(platform && parsed)) {
    return null;
  }

  const handle = findHandleSegment(
    platform,
    parsed.pathname.split('/').filter(Boolean)
  );
  if (!handle) {
    return null;
  }

  try {
    return decodeURIComponent(handle).replace(LEADING_AT_RE, '');
  } catch {
    return handle.replace(LEADING_AT_RE, '');
  }
}

/** Title and subtitle for a link card, before any fetched page metadata. */
export function describeLink(url: string): {
  platform: PlatformKey | null;
  handle: string | null;
  /** `@handle` for profile links, otherwise null (use the page title). */
  title: string | null;
  /** `x.com/handle`-style caption for profile links, otherwise null. */
  caption: string | null;
  /** Bare hostname, the last-resort label for any link. */
  host: string;
} {
  const platform = getPlatformKey(url);
  const handle = getProfileHandle(url);
  const host = parse(url)?.hostname.replace(LEADING_WWW_RE, '') ?? url;

  if (platform === 'discord') {
    return {
      platform,
      handle: null,
      title: null,
      caption: 'discord.com',
      host,
    };
  }

  return {
    platform,
    handle,
    title: handle ? `@${handle}` : null,
    caption:
      platform && handle ? `${PLATFORM_DISPLAY[platform]}/${handle}` : null,
    host,
  };
}

/** Whether a link is to an account that can be followed/joined/subscribed. */
export function isFollowable(url: string): boolean {
  const { platform, handle } = describeLink(url);
  return platform === 'discord' || (!!platform && !!handle);
}
