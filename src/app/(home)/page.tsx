import Pricing from '@/components/pricing';
import { GradientButton } from '@/components/ui/gradient-button';
import { PillBadge } from '@/components/ui/pill-badge';
import {
  BarChart3,
  Code2,
  Github,
  Link2,
  Moon,
  Share2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Link2,
    title: 'Bento Grid',
    description: 'Drag-and-drop cards to build your perfect layout',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track views and clicks on your profile',
  },
  {
    icon: Share2,
    title: 'Social Links',
    description: 'Connect all your platforms in one place',
  },
  {
    icon: Sparkles,
    title: 'Customizable',
    description: 'Notes, images, videos, and link cards',
  },
  {
    icon: Moon,
    title: 'Dark Mode',
    description: 'Beautiful in light and dark themes',
  },
  {
    icon: Code2,
    title: 'Open Source',
    description: 'Free forever. Contribute on GitHub',
  },
];

export default function Page() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="flex w-full max-w-5xl flex-col items-center px-4 pt-32 pb-20 text-center">
        <PillBadge className="animate-fade-up">
          <Sparkles className="h-3.5 w-3.5" />
          Open source & free forever
        </PillBadge>

        <h1
          className="mt-6 animate-fade-up font-cal text-5xl leading-tight md:text-7xl"
          style={{ animationDelay: '0.1s' }}
        >
          Create your
          <br />
          internet home page
        </h1>

        <p
          className="mt-4 max-w-lg animate-fade-up text-lg text-muted-foreground"
          style={{ animationDelay: '0.2s' }}
        >
          The prettiest link-in-bio. Free, open source, and takes 2 minutes.
        </p>

        <div
          className="mt-8 flex w-full max-w-sm animate-fade-up flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: '0.3s' }}
        >
          <Link href="/claim-link">
            <GradientButton size="lg">Claim your page</GradientButton>
          </Link>
          <Link href="/github" target="_blank" rel="noopener noreferrer">
            <button
              className="inline-flex items-center gap-x-2 rounded-full border border-border bg-background px-6 py-3 font-medium text-base shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
              type="button"
            >
              <Github className="h-5 w-5" />
              Star on GitHub
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="w-full max-w-5xl px-4 py-20">
        <h2 className="text-center font-cal text-3xl md:text-4xl">
          Everything you need
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Simple, powerful, and free
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border/50 bg-card p-6 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              <div className="mb-3 inline-flex rounded-xl bg-muted p-2.5">
                <feature.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="font-cal text-lg">{feature.title}</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="w-full max-w-5xl px-4 py-20">
        <Pricing />
      </section>
    </div>
  );
}
