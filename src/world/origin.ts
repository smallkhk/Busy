import { createContext } from 'react';

/**
 * Floating origin for the connected city: the block you are in sits at (0, 0).
 * When you walk into the next block everything local moves by one block, and
 * whoever holds world positions (camera, avatar) listens here to follow.
 */
type Shift = (dx: number, dz: number) => void;
const listeners = new Set<Shift>();
export const onOriginShift = (f: Shift) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};
export const shiftOrigin = (dx: number, dz: number) => listeners.forEach((f) => f(dx, dz));

/** Inside the connected city: which block a scene is drawn in, and whether it is the one you stand in. */
export type CellInfo = { current: boolean; ground: [number, number] };
export const CellCtx = createContext<CellInfo | null>(null);
