import type { Place } from './common';

export type AreaId = 'kubwa' | 'gwarinpa' | 'wuse2';

export type Area = {
  id: AreaId;
  name: string;
  home: string;
  emoji: string;
  /** Rent per 30-day cycle. */
  rent: number;
  /** Packaging you get just from your address. */
  packaging: number;
  /** Multiplier on trips to and from your area. */
  commute: number;
  blurb: string;
  theme: { wall: string; wall2: string; floor: string; rug: string; bed: string };
};

export const AREAS: Record<AreaId, Area> = {
  kubwa: {
    id: 'kubwa',
    name: 'Kubwa',
    home: 'Self-con, Kubwa',
    emoji: '🏠',
    rent: 70000,
    packaging: 0,
    commute: 1,
    blurb: 'Cheap, but expressway traffic go finish you.',
    theme: { wall: '#efe4cf', wall2: '#e8dcc3', floor: '#d9cbb0', rug: '#8c2f39', bed: '#2d6a8a' },
  },
  gwarinpa: {
    id: 'gwarinpa',
    name: 'Gwarinpa',
    home: 'Mini flat, Gwarinpa',
    emoji: '🏘️',
    rent: 180000,
    packaging: 10,
    commute: 0.65,
    blurb: 'Estate life. Closer to town, people go respect you small.',
    theme: { wall: '#e3ece6', wall2: '#d8e4dc', floor: '#c9b79c', rug: '#2f5d8a', bed: '#6b3fa0' },
  },
  wuse2: {
    id: 'wuse2',
    name: 'Wuse 2',
    home: '1-bedroom, Wuse 2',
    emoji: '🏙️',
    rent: 450000,
    packaging: 25,
    commute: 0.35,
    blurb: 'Big girl/big boy address. Everywhere near, but rent no be joke.',
    theme: { wall: '#f4f1ec', wall2: '#ebe6de', floor: '#8a6a4f', rug: '#e8b04b', bed: '#1f2a36' },
  },
};

export const RENT_CYCLE_DAYS = 30;
export const RENT_GRACE_DAYS = 5;
export const LATE_PENALTY = 0.1;
/** Moving costs this many cycles of rent upfront, plus agent fee. */
export const MOVE_UPFRONT_CYCLES = 2;
export const AGENT_FEE = 0.1;

export const moveCost = (area: AreaId) => Math.round(AREAS[area].rent * MOVE_UPFRONT_CYCLES * (1 + AGENT_FEE));

/** Rent owed right now: late rent attracts a penalty. */
export const rentOwed = (area: AreaId, day: number, dueDay: number) =>
  Math.round(AREAS[area].rent * (day > dueDay ? 1 + LATE_PENALTY : 1));

/** Display name of a place, given where you live. */
export function placeLabel(place: Place, area: AreaId, names: Record<Place, string>): string {
  if (place === 'home') return AREAS[area].home;
  if (place === 'street') return `${AREAS[area].name} street`;
  return names[place];
}
