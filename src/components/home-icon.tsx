import Image from "next/image";

import OpenBio from "@/public/openbio.png";
import Link from "next/link";

export default function HomeIcon() {
  return (
    <Link href="/" className="absolute left-10 top-10">
      <Image src={OpenBio} alt="OpenBio" width={50} height={50} />
    </Link>
  );
}
