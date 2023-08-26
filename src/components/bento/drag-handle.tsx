import { Hand } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DragHandle() {
  return (
    <Button
      id="drag-handle"
      size="icon"
      className="drag-handle absolute bottom-0 left-1/2 z-20 -translate-x-1/2 translate-y-1/2 cursor-grab md:hidden"
    >
      <Hand className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
