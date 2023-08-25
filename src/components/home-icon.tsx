import Image from "next/image";

import OpenBio from "@/public/openbio.png";
import Link from "next/link";

export default function HomeIcon() {
  return (
    <div className="container absolute top-10 flex">
      <Link className="mr-auto" href="/">
        <Image src={OpenBio} alt="OpenBio" width={50} height={50} />
      </Link>
    </div>
  );
}
