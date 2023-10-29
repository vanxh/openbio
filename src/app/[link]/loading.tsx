import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <div className="h-full w-full max-w-3xl">
      <div className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-4">
          <Skeleton className="h-[100px] w-[100px] rounded-full" />

          <Skeleton className="h-9 w-1/2" />

          <Skeleton className="h-6 w-1/4" />
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square h-full w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
