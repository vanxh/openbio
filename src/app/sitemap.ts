import type { MetadataRoute } from "next";

const addPathToBaseURL = (path: string) => `https://www.openbio.app${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/legal/privacy",
    "/legal/terms",
    "/create-link",
    "/claim-link",
    "/sign-in",
    "/sign-up",
  ].map((route) => ({
    url: addPathToBaseURL(route),
    lastModified: new Date(),
  }));

  return [...routes];
}
