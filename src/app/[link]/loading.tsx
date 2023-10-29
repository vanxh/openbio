import { Skeleton } from "@/components/ui/skeleton";
import Bento from "./_components/bento";

export default function Page() {
  return (
    <div className="h-full w-full max-w-3xl">
      <div className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-4">
          <Skeleton className="h-[100px] w-[100px] rounded-full" />

          <Skeleton className="h-9 w-1/2" />

          <Skeleton className="h-6 w-1/4" />
        </div>

        <Bento.Skeleton />
      </div>
    </div>
  );
}
