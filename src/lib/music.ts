import { redis } from '@/lib/redis';

const APPLE_ID_RE = /^\d+$/;

export interface MusicMetadata {
  title: string;
  artist: string;
  artwork: string;
  provider: 'spotify' | 'apple';
  url: string;
}

export async function fetchMusicMetadata(
  url: string
): Promise<MusicMetadata | null> {
  const cacheKey = `music:${url}`;
  const cached = await redis.get<MusicMetadata>(cacheKey);
  if (cached) {
    return cached;
  }

  const metadata = await fetchFromProvider(url);
  if (metadata) {
    // Cache for 7 days — track metadata rarely changes
    await redis.set(cacheKey, metadata, { ex: 7 * 24 * 60 * 60 });
  }

  return metadata;
}

async function fetchFromProvider(url: string): Promise<MusicMetadata | null> {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === 'open.spotify.com') {
      return fetchSpotifyMetadata(url);
    }

    if (parsed.hostname === 'music.apple.com') {
      return fetchAppleMusicMetadata(url);
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchSpotifyMetadata(
  url: string
): Promise<MusicMetadata | null> {
  try {
    const res = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
    );
    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      title: string;
      thumbnail_url: string;
    };

    // oEmbed title format is "TrackName" or "TrackName - ArtistName" depending on type
    const parts = data.title.split(' - ');
    const title = parts[0] ?? data.title;
    const artist = parts[1] ?? '';

    return {
      title,
      artist,
      artwork: data.thumbnail_url,
      provider: 'spotify',
      url,
    };
  } catch {
    return null;
  }
}

async function fetchAppleMusicMetadata(
  url: string
): Promise<MusicMetadata | null> {
  try {
    // Extract the numeric ID from the URL (always the last path segment)
    // e.g., https://music.apple.com/us/song/lucid-dreams/1407165118 → 1407165118
    // e.g., https://music.apple.com/us/album/goodbye-good-riddance/1407165109 → 1407165109
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const id = segments.at(-1);

    if (!id || !APPLE_ID_RE.test(id)) {
      return null;
    }

    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      results: {
        trackName?: string;
        collectionName?: string;
        artistName: string;
        artworkUrl100: string;
      }[];
    };

    const track = data.results[0];
    if (!track) {
      return null;
    }

    // Get higher-res artwork (600x600 instead of 100x100)
    const artwork = track.artworkUrl100.replace('100x100', '600x600');

    return {
      title: track.trackName ?? track.collectionName ?? 'Unknown',
      artist: track.artistName,
      artwork,
      provider: 'apple',
      url,
    };
  } catch {
    return null;
  }
}
