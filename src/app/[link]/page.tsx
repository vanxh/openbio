import { api } from "@/trpc/server";
import BentoCard from "@/components/bento/card";
import BentoLayout from "@/components/bento/layout";
import ProfileLinkEditor from "@/components/profile-link-editor";
import ActionBar from "@/components/bento/action-bar";

export default async function Page({
  params,
}: {
  params: {
    link: string;
  };
}) {
  const profileLink = await api.profileLink.getByLink.query({
    link: params.link,
  });

  if (!profileLink) {
    return (
      <div className="mx-auto h-full w-full pb-16 pt-16 text-center">
        <p>This link does not exist. Please check the link and try again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto h-full w-full max-w-3xl pb-16 pt-16">
      <div className="flex flex-col gap-y-6">
        <ProfileLinkEditor profileLink={profileLink} />

        <BentoLayout profileLink={profileLink}>
          {profileLink.Bento.map((b) => (
            <div key={b.id}>
              <BentoCard key={b.id} bento={b} editable={profileLink.isOwner} />
            </div>
          ))}
        </BentoLayout>

        {profileLink.isOwner && <ActionBar />}
      </div>
    </div>
  );
}
