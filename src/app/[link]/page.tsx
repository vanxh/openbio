import { api } from "@/trpc/server";
import BentoCard from "@/components/bento/card";
import BentoLayout from "@/components/bento/layout";

export default async function Page({
  params,
}: {
  params: {
    link: string;
  };
}) {
  const profileLink = await api.profileLink.getProfileLink.query(params.link);

  return (
    <div className="mx-auto h-full w-full max-w-3xl pb-16 pt-16">
      <BentoLayout profileLink={profileLink}>
        {profileLink.Bento.map((b) => (
          <div key={b.id}>
            <BentoCard key={b.id} bento={b} editable={profileLink.isOwner} />
          </div>
        ))}
      </BentoLayout>
    </div>
  );
}
