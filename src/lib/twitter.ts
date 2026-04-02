import { redis } from '@/lib/redis';

export type TweetData = {
  id: string;
  text: string;
  createdAt: string;
  user: {
    name: string;
    screenName: string;
    profileImageUrl: string;
    isVerified: boolean;
  };
  favoriteCount: number;
  retweetCount: number;
  replyCount: number;
  photos: { url: string; width: number; height: number }[];
};

const TWEET_URL_RE = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;

function generateToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
}

export async function fetchTweet(tweetId: string): Promise<TweetData | null> {
  const cached = await redis.get<TweetData | null>(`tweet:${tweetId}`);
  if (cached) {
    return cached;
  }

  const token = generateToken(tweetId);
  const params = new URLSearchParams({
    id: tweetId,
    lang: 'en',
    token,
  });

  const res = await fetch(
    `https://cdn.syndication.twimg.com/tweet-result?${params.toString()}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OpenBio/1.0)',
      },
    }
  );

  if (!res.ok) {
    return null;
  }

  const raw = await res.json();

  if (!raw || raw.__typename === 'TweetTombstone' || !raw.user) {
    return null;
  }

  const tweet: TweetData = {
    id: raw.id_str ?? tweetId,
    text: raw.text ?? '',
    createdAt: raw.created_at ?? '',
    user: {
      name: raw.user.name ?? '',
      screenName: raw.user.screen_name ?? '',
      profileImageUrl: raw.user.profile_image_url_https ?? '',
      isVerified: raw.user.is_blue_verified ?? false,
    },
    favoriteCount: raw.favorite_count ?? 0,
    retweetCount: raw.retweet_count ?? 0,
    replyCount: raw.conversation_count ?? raw.reply_count ?? 0,
    photos: (raw.mediaDetails ?? [])
      .filter((m: { type: string }) => m.type === 'photo')
      .map(
        (m: {
          media_url_https: string;
          original_info: { width: number; height: number };
        }) => ({
          url: m.media_url_https,
          width: m.original_info?.width ?? 0,
          height: m.original_info?.height ?? 0,
        })
      ),
  };

  await redis.set(`tweet:${tweetId}`, tweet, { ex: 60 * 60 });

  return tweet;
}

export function extractTweetId(url: string): string | null {
  const match = url.match(TWEET_URL_RE);
  return match?.[1] ?? null;
}
