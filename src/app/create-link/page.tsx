import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";
import SetupLink from "@/components/forms/setup-link";
import HomeNavbar from "@/components/navbar/home";

export default async function Page({
  searchParams,
}: {
  searchParams: {
    link: string;
  };
}) {
  const { link } = searchParams;

  if (!link) {
    return redirect("/claim-link");
  }

  const user = await currentUser();

  if (!user) {
    return redirect(`/app/sign-up?redirectUrl=/create-link?link=${link}`);
  }

  return (
    <div className="container mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-y-8 pt-[75px]">
      <HomeNavbar />

      <h1 className="font-cal text-3xl md:text-5xl">
        Let&apos;s setup your profile page for {link}
      </h1>

      <SetupLink />
    </div>
  );
}
