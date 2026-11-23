import * as z from 'zod';

// Pages routinely lack one of these, so each is optional: a card with a title
// and no preview image is still better than no metadata at all.
const metadataSchema = z.object({
  title: z.string().nullish(),
  description: z.string().nullish(),
  image: z.string().url().nullish().catch(null),
});

const HTTP_URL_RE = /^https?:\/\//i;

export const getMetadata = async (url: string) => {
  if (!(HTTP_URL_RE.test(url) && URL.canParse(url))) {
    return null;
  }

  try {
    const res = await fetch(
      `https://api.dub.co/metatags?url=${encodeURIComponent(url)}`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) {
      return null;
    }
    return metadataSchema.parse(await res.json());
  } catch {
    return null;
  }
};
