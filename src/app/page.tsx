import { currentUser } from "@clerk/nextjs";

import Home from "@/components/home";

export default async function Page() {
  const user = await currentUser();

  return <Home loggedIn={!!user} />;
}
