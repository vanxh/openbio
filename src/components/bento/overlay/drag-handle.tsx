import { Button } from '@/components/ui/button';
import { Hand } from 'lucide-react';

export default function DragHandle() {
  return (
    <Button
      id="drag-handle"
      size="icon"
      className="drag-handle -translate-x-1/2 absolute bottom-0 left-1/2 z-30 translate-y-1/2 cursor-grab rounded-full md:hidden"
    >
      <Hand className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
