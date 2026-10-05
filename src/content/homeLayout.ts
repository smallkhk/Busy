import { ENTRY_SPOT, EXIT_SPOT, INTERACTABLES, type Place } from './activities';
import { homeTier, type AreaId, type HomeTier } from './housing';

/**
 * Houses are drawn from one base plan, then spread out so the rooms get space:
 * walls and floors stretch by HOME_SCALE, and each piece of furniture moves out
 * with its anchor without stretching. Activity spots and labels follow the same rule.
 */
export const HOME_SCALE: Record<HomeTier, number> = { room: 1.4, flat: 1.4, mansion: 1.35 };

/** Things in the compound move together, as if anchored at the front door corner. */
export const COMPOUND: [number, number] = [4, 2.9];
const OUTSIDE = new Set(['bench', 'maishayi', 'gate']);

const HOME_ITEMS = INTERACTABLES.filter((i) => i.place === 'home');
const ITEM_OF_ACTIVITY = new Map(HOME_ITEMS.flatMap((i) => i.activities.map((a) => [a.id, i.id] as const)));

/** Furniture that stands against the back or side wall stays against it. */
const WALL_ANCHORS: Record<string, [number, number]> = {
  bed: [-2.9, -3.0],
  cooler: [-0.7, -3.0],
  stove: [0.8, -3.0],
  bucket: [2.5, -3.0],
  toilet: [3.5, -3.0],
  tv: [-4.0, 1.0],
};

/** Where a piece of home furniture is anchored (its label on the floor, or the wall it stands on). */
export function anchorOf(id: string): [number, number] {
  if (OUTSIDE.has(id)) return COMPOUND;
  if (WALL_ANCHORS[id]) return WALL_ANCHORS[id];
  const item = HOME_ITEMS.find((i) => i.id === id);
  return item ? [item.label[0], item.label[2]] : [0, 0];
}

export const homeScale = (area: AreaId) => HOME_SCALE[homeTier(area)];

/** How far something anchored at `anchor` moves when the house spreads. */
export function shiftOf(area: AreaId, anchor: [number, number]): [number, number] {
  const k = homeScale(area) - 1;
  return [anchor[0] * k, anchor[1] * k];
}

/** A point that belongs to home item `id`, moved to the spread house. */
export function homePoint(area: AreaId, id: string, x: number, z: number): [number, number] {
  const [dx, dz] = shiftOf(area, anchorOf(id));
  return [x + dx, z + dz];
}

/** Where to stand for a home activity in this house. */
export function homeSpot(area: AreaId, activityId: string, spot: [number, number]): [number, number] {
  const item = ITEM_OF_ACTIVITY.get(activityId);
  return item ? homePoint(area, item, spot[0], spot[1]) : spot;
}

/** Leaving and arriving at home happen at the gate, which moves with the compound. */
export function exitSpot(place: Place, area: AreaId): [number, number] {
  const p = EXIT_SPOT[place];
  return place === 'home' ? homePoint(area, 'gate', p[0], p[1]) : p;
}

export function entrySpot(place: Place, area: AreaId): [number, number] {
  const p = ENTRY_SPOT[place];
  return place === 'home' ? homePoint(area, 'gate', p[0], p[1]) : p;
}

/** Label anchor for a home item, in world space. */
export function homeLabel(area: AreaId, id: string, label: [number, number, number]): [number, number, number] {
  const [x, z] = homePoint(area, id, label[0], label[2]);
  return [x, label[1], z];
}

/** Walkable box for the home: the spread house plus the compound. */
export function homeBounds(area: AreaId, base: { minX: number; maxX: number; minZ: number; maxZ: number }) {
  const tier = homeTier(area);
  const k = HOME_SCALE[tier];
  const west = tier === 'mansion' ? -8.2 : tier === 'flat' ? -6.2 : base.minX;
  return { minX: west * k, maxX: base.maxX + COMPOUND[0] * (k - 1), minZ: base.minZ * k, maxZ: base.maxZ + COMPOUND[1] * (k - 1) };
}
