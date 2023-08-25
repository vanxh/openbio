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

  const layouts = {
    sm: profileLink.Bento.map((b) => ({
      i: b.id,
      x: b.mobilePosition?.x ?? 0,
      y: b.mobilePosition?.y ?? 0,
      w: {
        SIZE_1x4: 2,
        SIZE_2x2: 1,
        SIZE_2x4: 1,
        SIZE_4x2: 2,
        SIZE_4x4: 2,
      }[b.mobileSize],
      h: {
        SIZE_1x4: 0.5,
        SIZE_2x2: 1,
        SIZE_2x4: 1,
        SIZE_4x2: 2,
        SIZE_4x4: 2,
      }[b.mobileSize],
    })),
    lg: profileLink.Bento.map((b, index) => ({
      i: b.id,
      // x: b.desktopPosition?.x ?? 0,
      // y: b.desktopPosition?.y ?? 0,
      x: index % 3, // Initial x position in steps of 1 grid cell
      y: Math.floor(index / 3), // Initial y position in steps of 1 grid cell
      w: {
        SIZE_1x4: 2,
        SIZE_2x2: 1,
        SIZE_2x4: 1,
        SIZE_4x2: 2,
        SIZE_4x4: 2,
      }[b.desktopSize],
      h: {
        SIZE_1x4: 0.5,
        SIZE_2x2: 1,
        SIZE_2x4: 1,
        SIZE_4x2: 2,
        SIZE_4x4: 2,
      }[b.desktopSize],
    })),
  };

  return (
    <div className="mx-auto h-full w-full max-w-3xl pb-16 pt-16">
      <BentoLayout layouts={layouts}>
        {profileLink.Bento.map((b) => (
          <div key={b.id}>
            <BentoCard key={b.id} bento={b} editable={profileLink.isOwner} />
          </div>
        ))}
      </BentoLayout>
    </div>
  );
}
