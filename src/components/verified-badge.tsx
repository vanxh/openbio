import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BadgeCheck } from 'lucide-react';

export default function VerifiedBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <BadgeCheck className="inline-block h-5 w-5 fill-primary text-primary-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Pro member</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
