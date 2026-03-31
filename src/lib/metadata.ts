import * as z from 'zod';

const metadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().url(),
});

export const getMetadata = async (url: string) => {
  try {
    const res = await fetch(`https://api.dub.co/metatags?url=${url}`, {
      next: { revalidate: 3600 },
    });
    const data = metadataSchema.parse(await res.json());
    return data;
  } catch {
    return null;
  }
};
