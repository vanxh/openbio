import { Skeleton } from "@/components/ui/skeleton";
import { ProfileLinkCardSkeleton } from "@/components/profile-link-card";

export default function Page() {
  return (
    <div className="flex h-full w-full flex-col items-center">
      <div className="flex w-full flex-col items-center">
        <div className="flex w-max items-center gap-x-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="mt-4 w-full">
          <div className="flex flex-col gap-y-8">
            <div className="flex w-full items-center justify-between">
              <Skeleton className="h-9 w-36 md:h-12" />

              <Skeleton className="h-9 w-32" />
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProfileLinkCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
