import { kv } from "@vercel/kv";
import * as z from "zod";

const metadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().url(),
});

export const getMetadata = async (url: string) => {
  let cached = await kv.get<z.infer<typeof metadataSchema> | null>(url);

  if (!cached) {
    try {
      const res = await fetch(`https://api.dub.co/metatags?url=${url}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = metadataSchema.parse(await res.json());

      await kv.set(url, data, {
        ex: 60 * 60,
      });
      cached = data;

      return data;
    } catch (e) {
      await kv.set(url, null, {
        ex: 60 * 60,
      });
      return null;
    }
  }

  return cached;
};
