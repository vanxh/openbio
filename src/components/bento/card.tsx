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
const CalendarCard = dynamic(() => import('./calendar'), { ssr: false });
const CountdownCard = dynamic(() => import('./countdown'), { ssr: false });
const WeatherCard = dynamic(() => import('./weather'), { ssr: false });
const TwitterCard = dynamic(() => import('./twitter'), { ssr: false });
const ViewsCard = dynamic(() => import('./views'), { ssr: false });

export default function BentoCard({
  bento,
  editable,
  linkId,
}: {
  bento: z.infer<typeof BentoSchema>;
  editable?: boolean;
  linkId?: string;
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

  if (bento.type === 'countdown') {
    return <CountdownCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'weather') {
    return <WeatherCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'twitter') {
    return <TwitterCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'calendar') {
    return <CalendarCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'views') {
    return <ViewsCard bento={bento} editable={editable} linkId={linkId} />;
  }

  return null;
}
