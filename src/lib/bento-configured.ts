import { htmlToText } from '@/lib/html';
import type { BentoSchema } from '@/types';
import type * as z from 'zod';

type Bento = z.infer<typeof BentoSchema>;

/**
 * Whether a card has been set up enough to show to visitors.
 *
 * New cards are created empty and filled in afterwards. Until then they have
 * nothing to display: without this, visitors see blank tiles, a "Loading…"
 * that never resolves, or the owner's own setup prompt.
 */
export function isBentoConfigured(bento: Bento): boolean {
  switch (bento.type) {
    case 'link':
      return !!bento.href;
    case 'note':
      return htmlToText(bento.text) !== '';
    case 'image':
    case 'video':
    case 'music':
    case 'calendar':
      return !!bento.url;
    case 'github':
      return !!bento.username.trim();
    case 'twitter':
      return !!bento.tweetId;
    case 'countdown':
      return !Number.isNaN(new Date(bento.targetDate).getTime());
    case 'map':
    case 'weather':
      // New cards start at 0°, 0° (open ocean), which stands for "not set".
      return !(bento.latitude === 0 && bento.longitude === 0);
    default:
      return true;
  }
}
