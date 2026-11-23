'use client';

import type { BentoSize } from '@/components/bento/sizes';
import { createContext, useContext } from 'react';

export type BentoBreakpoint = 'sm' | 'md';

/**
 * Which grid is on screen: `sm` (two columns, phones) or `md` (four columns).
 * Provided by the bento grid; anything rendered outside one sees `md`.
 */
export const BentoBreakpointContext = createContext<BentoBreakpoint>('md');

/**
 * The size a card currently occupies. Cards store a size per breakpoint, and
 * must lay themselves out for the one being shown: a card that is 4x4 on
 * desktop but 2x2 on a phone has to render its compact variant there.
 */
export function useCardSize(bento: {
  size: Partial<Record<BentoBreakpoint, BentoSize>>;
}): BentoSize {
  const breakpoint = useContext(BentoBreakpointContext);
  return bento.size[breakpoint] ?? bento.size.md ?? '2x2';
}
