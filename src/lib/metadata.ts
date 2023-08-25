import * as z from "zod";

const metadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().optional(),
});

export const getMetadata = async (url: string) => {
  const res = await fetch(`https://api.dub.co/metatags?url=${url}`, {
    headers: {
      "Cache-Control": "max-age=86400",
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data = await res.json();

  return metadataSchema.parse(data);
};
