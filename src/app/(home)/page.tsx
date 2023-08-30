import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";

import OpenBio from "@/public/openbio.png";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center">
      <Image src={OpenBio} alt="OpenBio" width={75} height={75} priority />
      <h2 className="font-cal text-xl md:text-2xl">OpenBio</h2>

      <h1 className="mt-8 font-cal text-3xl md:text-5xl">
        Create beautiful
        <br />
        link in bio pages for free.
      </h1>

      <p className="mt-4 text-xl md:text-2xl">
        OpenBio is an open source link in bio page builder.
      </p>

      <div className="mt-12 flex items-center gap-x-4">
        <Link href="/claim-link" passHref>
          <Button className="min-w-full whitespace-nowrap">
            Create your page
          </Button>
        </Link>

        <Link
          href="https://github.com/vanxh/openbio"
          target="_blank"
          rel="noopener noreferrer"
          passHref
        >
          <Button className="whitespace-nowrap">
            <Github size={24} className="mr-2" />
            Star on Github
          </Button>
        </Link>
      </div>
    </div>
  );
}
