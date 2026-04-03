import type { BentoSchema } from '@/server/db';
import dynamic from 'next/dynamic';
import type * as z from 'zod';
import CountdownCard from './countdown';
import EmailCollectCard from './email-collect';
import ImageCard from './image';
import LinkCard from './link';
import NoteCard from './note';
import ViewsCard from './views';

// Lazy-load heavy cards (external APIs, maps, iframes)
const MapCard = dynamic(() => import('./map'), { ssr: false });
const GitHubCard = dynamic(() => import('./github'), { ssr: false });
const CalendarCard = dynamic(() => import('./calendar'), { ssr: false });
const MusicCard = dynamic(() => import('./music'), { ssr: false });
const WeatherCard = dynamic(() => import('./weather'), { ssr: false });
const TwitterCard = dynamic(() => import('./twitter'), { ssr: false });

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

  if (bento.type === 'music') {
    return <MusicCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'calendar') {
    return <CalendarCard bento={bento} editable={editable} />;
  }

  if (bento.type === 'views') {
    return <ViewsCard bento={bento} editable={editable} linkId={linkId} />;
  }

  return null;
}
