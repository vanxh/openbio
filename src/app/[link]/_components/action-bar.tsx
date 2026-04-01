'use client';

import CreateLinkBentoModal from '@/components/modals/create-link-bento';
import ThemeSettingsModal from '@/components/modals/theme-settings';
import { api } from '@/trpc/react';
import { ImagePlus, Link, Palette, Type } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function ActionBar() {
  const { link } = useParams<{ link: string }>();
  const queryClient = api.useContext();
  const { data: profileLink } = api.profileLink.getByLink.useQuery({ link });

  const { mutateAsync: createBento } = api.profileLink.createBento.useMutation({
    onMutate: (input) => {
      queryClient.profileLink.getByLink.setData({ link }, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          bento: [
            ...old.bento,
            {
              ...input.bento,
              size: { sm: '2x2', md: '2x2' },
              position: { sm: { x: 0, y: 0 }, md: { x: 0, y: 0 } },
            },
          ],
        };
      });
    },
    onSettled: () => {
      queryClient.profileLink.getByLink.invalidate({ link });
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
