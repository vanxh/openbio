import { Skeleton } from "@/components/ui/skeleton";
import HomeIcon from "@/components/home-icon";

export default function Page() {
  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-y-8">
      <HomeIcon />

      <Skeleton className="h-9 w-56 md:w-[450px]" />

      <Skeleton className="h-[70vh] w-full md:w-[350px]" />
    </div>
  );
}
