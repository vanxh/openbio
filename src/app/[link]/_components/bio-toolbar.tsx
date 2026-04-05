'use client';

import BioWriter from '@/components/ai/bio-writer';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Heading2,
  Highlighter,
  Italic,
  LinkIcon,
  List,
  Palette,
  Sparkles,
  Underline as UnderlineIcon,
} from 'lucide-react';

export default function BioToolbar({
  editor,
  isPremium,
  name,
  links,
}: {
  editor: Editor;
  isPremium: boolean;
  name: string;
  links?: string[];
}) {
  const proAction = (action: () => void) => {
    if (!isPremium) {
      toast({
        title: 'Pro feature',
        description: 'Upgrade to Pro to unlock advanced bio styling.',
      });
      return;
    }
    action();
  };

  const btnClass = 'h-6 w-6 p-0';
  const proBtnClass = isPremium ? btnClass : `${btnClass} opacity-40`;

  return (
    <div className="inline-flex w-auto items-center gap-0.5 rounded-md border border-border/50 bg-card/80 px-0.5 py-0.5 backdrop-blur-sm">
      <Button
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        size="sm"
        className={btnClass}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-3 w-3" />
      </Button>
      <Button
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        size="sm"
        className={btnClass}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-3 w-3" />
      </Button>
      <Button
        variant={
          editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'
        }
        size="sm"
        className={btnClass}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-3 w-3" />
      </Button>
      <Button
        variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
        size="sm"
        className={btnClass}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-3 w-3" />
      </Button>

      <div className="mx-0.5 h-4 w-px bg-border" />

      <Button
        variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
        size="sm"
        className={proBtnClass}
        onClick={() =>
          proAction(() => editor.chain().focus().toggleUnderline().run())
        }
      >
        <UnderlineIcon className="h-3 w-3" />
      </Button>
      <Button
        variant={editor.isActive('link') ? 'secondary' : 'ghost'}
        size="sm"
        className={proBtnClass}
        onClick={() =>
          proAction(() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          })
        }
      >
        <LinkIcon className="h-3 w-3" />
      </Button>
      <Button
        variant={editor.isActive('highlight') ? 'secondary' : 'ghost'}
        size="sm"
        className={proBtnClass}
        onClick={() =>
          proAction(() => editor.chain().focus().toggleHighlight().run())
        }
      >
        <Highlighter className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={proBtnClass}
        onClick={() =>
          proAction(() => {
            const color = window.prompt('Enter color hex (e.g. #ff0000):');
            if (color) {
              editor.chain().focus().setColor(color).run();
            }
          })
        }
      >
        <Palette className="h-3 w-3" />
      </Button>

      <div className="mx-0.5 h-4 w-px bg-border" />

      <BioWriter
        name={name}
        links={links}
        onGenerated={(bio) => {
          editor.commands.setContent(`<p>${bio}</p>`);
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          className={`${btnClass} text-violet-500`}
        >
          <Sparkles className="h-3 w-3" />
        </Button>
      </BioWriter>
    </div>
  );
}
