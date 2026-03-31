import { Github, Twitter } from 'lucide-react';
import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="border-border/50 border-t py-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
        <p className="text-muted-foreground text-sm">
          Built by{' '}
          <Link
            href="https://twitter.com/vanxhh"
            target="_blank"
            className="underline underline-offset-4 hover:text-foreground"
          >
            @vanxh
          </Link>
        </p>
        <div className="flex items-center gap-x-3">
          <Link
            href="/github"
            target="_blank"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </Link>
          <Link
            href="/twitter"
            target="_blank"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Twitter className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
