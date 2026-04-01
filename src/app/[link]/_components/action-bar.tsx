'use client';

import CreateLinkBentoModal from '@/components/modals/create-link-bento';
import ThemeSettingsModal from '@/components/modals/theme-settings';
import { api } from '@/trpc/react';
import { ImagePlus, Link, Palette, Type } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function ActionBar() {
  const router = useRouter();
  const { link } = useParams<{ link: string }>();
  const queryClient = api.useContext();
  const [profileLink] = api.profileLink.getByLink.useSuspenseQuery({ link });

  const { mutateAsync: createBento } = api.profileLink.createBento.useMutation({
    onSuccess: () => {
      queryClient.profileLink.getByLink.invalidate({ link });
      router.refresh();
    },
  });

  const btnClass =
    'inline-flex items-center bg-background justify-center rounded-md border border-border p-2 transition-transform duration-200 ease-in-out active:scale-95';

  return (
    <div className="-translate-x-1/2 container fixed bottom-6 left-1/2 z-20 mx-auto md:bottom-10">
      <div className="mx-auto flex w-max items-center gap-x-4 rounded-lg bg-background/80 px-3 py-3 backdrop-blur-xl backdrop-saturate-[20]">
        <CreateLinkBentoModal>
          <button type="button" className={btnClass}>
            <Link size={14} />
          </button>
        </CreateLinkBentoModal>

        <button
          type="button"
          className={btnClass}
          onClick={() => {
            createBento({
              link,
              bento: { id: crypto.randomUUID(), type: 'note', text: '' },
            });
          }}
        >
          <Type size={14} />
        </button>

        <button
          type="button"
          className={btnClass}
          onClick={() => {
            createBento({
              link,
              bento: { id: crypto.randomUUID(), type: 'image', url: '' },
            });
          }}
        >
          <ImagePlus size={14} />
        </button>

        <ThemeSettingsModal isPremium={!!profileLink?.isPremium}>
          <button type="button" className={btnClass}>
            <Palette size={14} />
          </button>
        </ThemeSettingsModal>
      </div>
    </div>
  );
}
