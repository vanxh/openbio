import Image from "next/image";

import OpenBio from "@/public/openbio.png";
import Link from "next/link";

export default function HomeIcon() {
  return (
    <div className="container absolute top-6 flex md:top-10">
      <Link className="mr-auto" href="/">
        <Image
          src={OpenBio}
          alt="OpenBio"
          width={50}
          height={50}
          loading="eager"
        />
      </Link>
    </div>
  );
}
