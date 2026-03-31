import type { BentoSchema } from '@/server/db';
import type * as z from 'zod';
import ImageCard from './image';
import LinkCard from './link';
import NoteCard from './note';

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

  return null;
}
