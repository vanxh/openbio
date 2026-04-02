import type { BentoSchema } from '@/server/db';
import dynamic from 'next/dynamic';
import type * as z from 'zod';
import LinkCard from './link';

const NoteCard = dynamic(() => import('./note'), { ssr: false });
const ImageCard = dynamic(() => import('./image'), { ssr: false });
const MapCard = dynamic(() => import('./map'), { ssr: false });
const GitHubCard = dynamic(() => import('./github'), { ssr: false });
const EmailCollectCard = dynamic(() => import('./email-collect'), {
  ssr: false,
});

export default function BentoCard({
  bento,
  editable,
}: {
  bento: z.infer<typeof BentoSchema>;
  editable?: boolean;
}) {
  if (bento.type === 'link') {
    return <LinkCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'note') {
    return <NoteCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'image') {
    return <ImageCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'map') {
    return <MapCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'github') {
    return <GitHubCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'email-collect') {
    return <EmailCollectCard bento={bento} editable={editable} />;
  }

  return null;
}
