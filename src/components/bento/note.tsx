'use client';

import CardOverlay from '@/components/bento/overlay';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import type { NoteBentoSchema } from '@/types';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Eye,
  Heading2,
  Italic,
  List,
  PenLine,
  Pencil,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import type * as z from 'zod';

type BentoData = z.infer<typeof NoteBentoSchema>;

export const NOTE_CARD_SIZES = ['2x2', '4x1', '4x2', '2x4', '4x4'] as const;

function NoteContent({ html }: { html: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: html,
    editable: false,
  });

  return (
    <EditorContent
      editor={editor}
      className="prose prose-sm dark:prose-invert prose-p:m-0 h-full w-full max-w-none overflow-hidden prose-headings:font-cal prose-headings:text-sm prose-p:text-xs"
    />
  );
}

function NoteEditor({
  initialContent,
  onSave,
  isSaving,
}: {
  initialContent: string;
  onSave: (html: string) => void;
  isSaving?: boolean;
}) {
  const [preview, setPreview] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write something...' }),
    ],
    content: initialContent,
    editable: true,
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert max-w-none min-h-[200px] prose-p:m-0 prose-headings:font-cal',
      },
    },
  });

  const btnClass = 'h-7 w-7 p-0';

  return (
    <div className="space-y-3">
      {/* Toolbar + Preview toggle */}
      <div className="flex items-center justify-between">
        {!preview && editor && (
          <div className="flex items-center gap-0.5 rounded-md border border-border/50 bg-muted/50 px-1 py-0.5">
            <Button
              type="button"
              variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
              size="sm"
              className={btnClass}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
              size="sm"
              className={btnClass}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant={
                editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'
              }
              size="sm"
              className={btnClass}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
              size="sm"
              className={btnClass}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-3 w-3" />
            </Button>
          </div>
        )}
        {preview && <div />}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setPreview(!preview)}
        >
          {preview ? (
            <>
              <PenLine className="h-3 w-3" />
              Edit
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              Preview
            </>
          )}
        </Button>
      </div>

      {/* Editor or Preview */}
      {preview ? (
        <div className="min-h-[200px] rounded-xl border border-border bg-card p-4">
          <div className="prose dark:prose-invert prose-p:m-0 max-w-none prose-headings:font-cal">
            <NoteContent html={editor?.getHTML() ?? ''} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 focus-within:ring-1 focus-within:ring-ring">
          <EditorContent editor={editor} />
        </div>
      )}

      <Button
        className="w-full rounded-xl"
        disabled={isSaving}
        onClick={() => {
          if (editor) {
            onSave(editor.getHTML());
          }
        }}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}

export default function NoteCard({
  bento,
  editable,
}: {
  bento: BentoData;
  editable?: boolean;
}) {
  const params = useParams<{ link: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = api.useContext();
  const { mutateAsync: updateBento, isPending } =
    api.profileLink.updateBento.useMutation();

  const mdSize = bento.size.md ?? '2x2';
  const isBanner = mdSize === '4x1';
  const hasContent = bento.text && bento.text !== '<p></p>';

  const handleSave = (html: string) => {
    queryClient.profileLink.getByLink.cancel({ link: params.link });

    queryClient.profileLink.getByLink.setData({ link: params.link }, (old) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        bento: old.bento.map((b) =>
          b.id === bento.id ? { ...b, text: html } : b
        ),
      };
    });

    updateBento({
      link: params.link,
      bento: { ...bento, text: html },
    });
    setEditOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          'group relative z-0 flex h-full w-full select-none flex-col rounded-2xl border border-border bg-card shadow-sm',
          editable
            ? 'transition-transform duration-200 ease-in-out md:cursor-move'
            : 'cursor-pointer transition-all duration-200 hover:shadow-md',
          isBanner ? 'px-4 py-2' : 'p-5'
        )}
      >
        {editable && (
          <CardOverlay bento={bento} allowedSizes={NOTE_CARD_SIZES} />
        )}

        {hasContent ? (
          <NoteContent key={bento.text} html={bento.text} />
        ) : (
          <p className="text-muted-foreground text-xs">
            {editable ? 'Empty note' : ''}
          </p>
        )}

        {editable && (
          <button
            type="button"
            className="absolute right-3 bottom-3 z-50 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cal">Edit Note</DialogTitle>
          </DialogHeader>
          {editOpen && (
            <NoteEditor initialContent={bento.text || ''} onSave={handleSave} isSaving={isPending} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
