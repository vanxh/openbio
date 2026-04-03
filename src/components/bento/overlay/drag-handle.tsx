import { GripVertical } from 'lucide-react';

export default function DragHandle() {
  return (
    <div
      id="drag-handle"
      className="drag-handle -translate-x-1/2 absolute bottom-0 left-1/2 z-30 flex h-8 w-8 translate-y-1/2 cursor-grab items-center justify-center rounded-full border border-border/50 bg-background/90 shadow-md backdrop-blur-sm transition-colors hover:bg-accent active:cursor-grabbing md:hidden"
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}
