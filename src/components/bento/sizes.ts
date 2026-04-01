export type BentoSize = '4x1' | '2x2' | '2x4' | '4x2' | '4x4';

const SIZE_TO_GRID: Record<BentoSize, { w: number; h: number }> = {
  '4x1': { w: 2, h: 0.5 },
  '2x2': { w: 1, h: 1 },
  '2x4': { w: 1, h: 2 },
  '4x2': { w: 2, h: 1 },
  '4x4': { w: 2, h: 2 },
};

// Mobile: 4x1 needs more height since it spans full width on 2-col grid
const SIZE_TO_GRID_SM: Record<BentoSize, { w: number; h: number }> = {
  '4x1': { w: 2, h: 1 },
  '2x2': { w: 1, h: 1 },
  '2x4': { w: 1, h: 2 },
  '4x2': { w: 2, h: 1 },
  '4x4': { w: 2, h: 2 },
};

export function sizeToGrid(
  size: string | undefined,
  breakpoint: 'sm' | 'md' = 'md'
) {
  const map = breakpoint === 'sm' ? SIZE_TO_GRID_SM : SIZE_TO_GRID;
  return map[(size ?? '2x2') as BentoSize] ?? SIZE_TO_GRID['2x2'];
}
