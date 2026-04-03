import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex w-full flex-col gap-y-6">
      {/* Header: back button + title */}
      <div className="flex items-center gap-x-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>

      {/* Views chart card */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
        <Skeleton className="mb-1 h-6 w-16" />
        <Skeleton className="mb-6 h-4 w-48" />
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </div>

      {/* Clicks chart card */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
        <Skeleton className="mb-1 h-6 w-16" />
        <Skeleton className="mb-6 h-4 w-48" />
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </div>

      {/* Top links + top referrers */}
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
          >
            <Skeleton className="mb-1 h-6 w-24" />
            <Skeleton className="mb-6 h-4 w-36" />
            <div className="space-y-4">
              {[0, 1, 2].map((j) => (
                <div key={j} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
