import type { Metadata } from "next";

import {
  defaultMetadata,
  twitterMetadata,
  ogMetadata,
} from "@/app/shared-metadata";
import HomeButton from "@/components/home-button";
import AppButton from "@/components/app-button";
import Footer from "@/components/footer";

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
    <section className="container mx-auto flex h-full w-full flex-col items-center justify-center gap-y-6 pb-4 pt-24 md:pb-8">
      <HomeButton />
      <AppButton />

      <div className="w-full max-w-3xl rounded-lg border border-border bg-background px-3 py-4 md:px-6 md:py-8">
        <article className="prose dark:prose-invert prose-headings:font-cal prose-p:text-sm">
          {children}
        </article>
      </div>

      <Footer />
    </section>
  );
}
