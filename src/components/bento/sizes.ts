export type BentoSize = '4x1' | '2x2' | '2x4' | '4x2' | '4x4';

const SIZE_TO_GRID: Record<BentoSize, { w: number; h: number }> = {
  '4x1': { w: 2, h: 0.5 },
  '2x2': { w: 1, h: 1 },
  '2x4': { w: 1, h: 2 },
  '4x2': { w: 2, h: 1 },
  '4x4': { w: 2, h: 2 },
};

export function sizeToGrid(size: string | undefined) {
  return SIZE_TO_GRID[(size ?? '2x2') as BentoSize] ?? SIZE_TO_GRID['2x2'];
}
