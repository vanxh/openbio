import type { Metadata } from "next";

import {
  defaultMetadata,
  twitterMetadata,
  ogMetadata,
} from "@/app/shared-metadata";
import HomeIcon from "@/components/home-icon";

export const metadata: Metadata = {
  ...defaultMetadata,
  title: "Legal - OpenBio",
  twitter: {
    ...twitterMetadata,
    title: "Legal - OpenBio",
  },
  openGraph: {
    ...ogMetadata,
    title: "Legal - OpenBio",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="container mx-auto flex h-full w-full flex-col items-center justify-center pb-16 pt-24">
      <HomeIcon />

      <div className="w-full max-w-3xl rounded-lg border border-border bg-background px-3 py-4 md:px-6 md:py-8">
        <article className="prose dark:prose-invert prose-headings:font-cal prose-p:text-sm">
          {children}
        </article>
      </div>
    </section>
  );
}
