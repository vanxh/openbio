import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
      {/* Logo + heading */}
      <div className="mb-8 flex flex-col items-center gap-y-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Form fields */}
      <div className="flex flex-col gap-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <Skeleton className="mt-1 h-10 w-full rounded-full" />
      </div>

      {/* Divider */}
      <div className="my-6 flex items-center gap-x-3">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-px flex-1" />
      </div>

      {/* Social buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>

      {/* Footer link */}
      <Skeleton className="mx-auto mt-6 h-4 w-48" />
    </div>
  );
}
