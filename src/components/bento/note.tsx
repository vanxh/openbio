'use client';

import CardOverlay from '@/components/bento/overlay';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { NoteBentoSchema } from '@/types';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useParams } from 'next/navigation';
import type * as z from 'zod';

type BentoData = z.infer<typeof NoteBentoSchema>;

export const NOTE_CARD_SIZES = ['2x2', '4x1', '4x2'] as const;

export default function NoteCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const { mutateAsync: updateBento } =
    api.profileLink.updateBento.useMutation();

  const mdSize = bento.size.md ?? '2x2';
  const isBanner = mdSize === '4x1';

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write something…',
      }),
    ],
    content: bento.text || '',
    editable: editable ?? false,
    onBlur: ({ editor: ed }) => {
      if (editable) {
        const html = ed.getHTML();
        updateBento({
          link: params.link,
          bento: { ...bento, text: html },
        });
      }
    },
  });

  return (
    <div
      className={cn(
        'group relative z-0 flex h-full w-full select-none flex-col rounded-2xl border border-border/50 bg-card shadow-sm',
        editable
          ? 'transition-transform duration-200 ease-in-out md:cursor-move'
          : 'cursor-pointer transition-all duration-200 hover:shadow-md',
        isBanner ? 'px-4 py-2' : 'p-5'
      )}
    >
      {editable && <CardOverlay bento={bento} allowedSizes={NOTE_CARD_SIZES} />}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert prose-p:m-0 h-full w-full max-w-none overflow-hidden prose-headings:font-cal prose-headings:text-sm prose-p:text-xs"
      />
    </div>
  );
}
