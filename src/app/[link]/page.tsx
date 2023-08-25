import { api } from "@/trpc/server";
import LinkCard from "@/components/bento/link";

export default async function Page({
  params,
}: {
  params: {
    link: string;
  };
}) {
  const profileLink = await api.profileLink.getProfileLink.query(params.link);
  // console.log(profileLink.Bento);

  return (
    <div className="h-full w-full">
      <div className="mx-auto grid max-w-3xl grid-cols-6 gap-6 px-6 pb-16 pt-16">
        {profileLink.Bento.map((b) => (
          <LinkCard key={b.id} bento={b} />
        ))}
      </div>
    </div>
  );
}
