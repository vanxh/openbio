import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero section */}
      <section className="flex w-full max-w-5xl flex-col items-center px-4 pt-32 pb-20 text-center">
        {/* PillBadge */}
        <Skeleton className="h-7 w-52 rounded-full" />

        {/* Heading */}
        <Skeleton className="mt-6 h-14 w-3/4 md:h-20" />
        <Skeleton className="mt-2 h-14 w-1/2 md:h-20" />

        {/* Subheading */}
        <Skeleton className="mt-4 h-6 w-80 max-w-lg" />

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Skeleton className="h-11 w-40 rounded-full" />
          <Skeleton className="h-11 w-40 rounded-full" />
        </div>
      </section>

      {/* Features section */}
      <section className="w-full max-w-5xl px-4 py-20">
        <Skeleton className="mx-auto h-9 w-56" />
        <Skeleton className="mx-auto mt-2 h-5 w-40" />

        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card p-6 shadow-md"
            >
              <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-3/4" />
            </div>
          ))}
        </div>
      </section>

      {/* Pricing section placeholder */}
      <section className="w-full max-w-5xl px-4 py-20">
        <Skeleton className="mx-auto h-9 w-32" />
        <Skeleton className="mx-auto mt-2 h-5 w-48" />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card p-8 shadow-md"
            >
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-4 h-10 w-24" />
              <div className="mt-6 space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <Skeleton className="mt-8 h-11 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
