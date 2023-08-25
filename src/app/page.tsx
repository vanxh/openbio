import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";
import { currentUser } from "@clerk/nextjs";

import OpenBio from "@/public/openbio.png";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const user = await currentUser();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center text-center">
      {!!user && (
        <div className="container absolute top-10 flex">
          <Link className="ml-auto" href="/app">
            <Button>Go to App</Button>
          </Link>
        </div>
      )}

      <Image src={OpenBio} alt="OpenBio" width={75} height={75} />
      <h2 className="font-cal text-xl md:text-2xl">OpenBio</h2>

      <h1 className="mt-8 font-cal text-3xl md:text-5xl">
        Create beautiful
        <br />
        link in bio pages for free.
      </h1>

      <p className="mt-4 text-xl md:text-2xl">
        OpenBio is open source link in bio page builder.
      </p>

      <div className="mt-12 flex items-center gap-x-4">
        <Link href="/claim" passHref>
          <Button className="">Create your page</Button>
        </Link>

        <Link href="https://github.com/vanxh/openbio" passHref>
          <Button>
            <Github size={24} className="mr-2" />
            Star on Github
          </Button>
        </Link>
      </div>
    </div>
  );
}
