import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto flex h-full min-h-screen w-full max-w-3xl flex-col items-center justify-center py-20 text-center">
      <p className="font-cal text-xl md:text-2xl">404</p>

      <h1 className="mt-8 font-cal text-3xl md:text-5xl">
        This page does not exist.
      </h1>

      <Button className="mt-8">
        <Link href="/" passHref>
          Go to homepage
        </Link>
      </Button>
    </div>
  );
}
