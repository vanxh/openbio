import { api } from "@/trpc/server";
import BentoCard from "@/components/bento/card";

export default async function Page({
  params,
}: {
  params: {
    link: string;
  };
}) {
  const profileLink = await api.profileLink.getProfileLink.query(params.link);

  return (
    <div className="h-full w-full">
      <div className="mx-auto grid max-w-3xl grid-cols-6 gap-6 px-6 pb-16 pt-16 xl:max-w-4xl xl:grid-cols-8">
        {profileLink.Bento.map((b) => (
          <BentoCard key={b.id} bento={b} />
        ))}
      </div>
    </div>
  );
}
