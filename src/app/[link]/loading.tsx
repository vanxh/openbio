import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <div className="h-full w-full max-w-3xl">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square h-full w-full" />
        ))}
      </div>
    </div>
  );
}
