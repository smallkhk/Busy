import type { Place } from './common';
import { CELL_X, CELL_Z, HOME_CELLS, LANDMARK_CELLS, LANDMARK_NAMES, PLACE_CELLS, ROAD_Z, type Cell, type Landmark } from './worldmap';
import { AREAS, type AreaId } from './housing';
import { PLACE_NAMES } from './common';

/**
 * Hustle missions: real jobs you do on the city map. Start a shift, a job
 * comes in, you go to the pickup, then race to the drop-off before the timer
 * runs out. Pay grows with distance, speed and your rider level.
 */
export type HustleKind = 'okada' | 'chopnow' | 'keke' | 'hailing';
/** What you ride: a hired bike or keke, or your own car. */
export type Vehicle = 'okada' | 'keke' | 'car';

export type HustleJob = {
  id: HustleKind;
  name: string;
  emoji: string;
  blurb: string;
  vehicle: Vehicle;
  /** Paid at the start of a shift for the hired vehicle. */
  rent: number;
  /** Rider level you need. */
  level: number;
  /** Fare: flat start plus per km. */
  base: number;
  perKm: number;
  /** What you pick up. */
  cargo: 'passenger' | 'food';
};

export const HUSTLES: HustleJob[] = [
  { id: 'okada', name: 'Okada rider', emoji: '🏍️', blurb: 'Hire bike, carry passengers anywhere for Abuja. Fast but the police go dey stop you.', vehicle: 'okada', rent: 1000, level: 1, base: 300, perKm: 90, cargo: 'passenger' },
  { id: 'chopnow', name: 'ChopNow delivery', emoji: '🛵', blurb: 'Collect food from the buka, deliver am hot to customer gate. Late food = small pay.', vehicle: 'okada', rent: 1000, level: 1, base: 450, perKm: 70, cargo: 'food' },
  { id: 'keke', name: 'Keke NAPEP driver', emoji: '🛺', blurb: 'Three passengers, bigger money. Unlocks at rider level 3.', vehicle: 'keke', rent: 2500, level: 3, base: 600, perKm: 140, cargo: 'passenger' },
  { id: 'hailing', name: 'Ride-hailing (your car)', emoji: '🚘', blurb: 'Bolt-style trips with your own motor. Best pay, but na your fuel.', vehicle: 'car', rent: 0, level: 2, base: 900, perKm: 200, cargo: 'passenger' },
];
export const hustleById = (id: string | undefined) => HUSTLES.find((h) => h.id === id);

/** XP per trip, and XP per level. */
export const TRIP_XP = 10;
export const LEVEL_XP = 50;
export const riderLevel = (xp: number) => Math.floor(xp / LEVEL_XP) + 1;
/** Each level above 1 pays this much more. */
export const LEVEL_BONUS = 0.1;

/** World units to km for fares (matches driving fuel). */
export const KM_PER_UNIT = 0.1;
/** Seconds you get: a flat start plus this many per world unit. */
export const TIME_BASE = 25;
export const TIME_PER_UNIT = 0.32;
/** How close you must get to pick up or drop off. */
export const ARRIVE_RANGE = 3.2;
/** Chance per block you cross that police stop you, and what "settling" costs. */
export const CHECKPOINT_CHANCE = 0.12;
export const CHECKPOINT_BRIBE = 500;
export const CHECKPOINT_DELAY = 15;

/** A spot on the road in front of a block, in world coordinates. */
export type Stop = { name: string; at: [number, number] };

const PASSENGERS = [
  { name: 'Mr Emeka', emoji: '👨🏾‍💼' },
  { name: 'Aunty Bisi', emoji: '👩🏾' },
  { name: 'Corper Tolu', emoji: '🧑🏾‍🎓' },
  { name: 'Alhaji Musa', emoji: '👳🏾‍♂️' },
  { name: 'Mama Ngozi', emoji: '👵🏾' },
  { name: 'Hajia Fati', emoji: '🧕🏾' },
  { name: 'Pastor James', emoji: '🙏🏾' },
  { name: 'Baby girl Ada', emoji: '💅🏾' },
];
const FOODS = ['Jollof & chicken', 'Pounded yam & egusi', 'Suya (2 sticks)', 'Amala & ewedu', 'Shawarma combo', 'Fried rice & plantain', 'Pepper soup'];
/** Places that cook food for delivery. */
const KITCHENS: Place[] = ['wuse', 'utako', 'jabi', 'garki', 'lounge', 'secretariat', 'nyanya', 'mararaba'];

/** Every named stop on the grid: places, other areas' streets and landmarks. */
export function allStops(area: AreaId): Stop[] {
  const out: Stop[] = [];
  const at = ([c, r]: Cell, dx: number): [number, number] => [c * CELL_X + dx, r * CELL_Z + ROAD_Z];
  for (const [p, cell] of Object.entries(PLACE_CELLS)) if (cell) out.push({ name: PLACE_NAMES[p as Place], at: at(cell, 4) });
  for (const [a, cell] of Object.entries(HOME_CELLS)) out.push({ name: a === area ? 'Your street' : `${AREAS[a as AreaId].name} street`, at: at(cell, -6) });
  for (const [l, cell] of Object.entries(LANDMARK_CELLS)) out.push({ name: LANDMARK_NAMES[l as Landmark], at: at(cell, 0) });
  return out;
}

export type Mission = {
  kind: HustleKind;
  stage: 'pickup' | 'dropoff';
  who: { name: string; emoji: string };
  /** Food you carry (deliveries). */
  food?: string;
  pickup: Stop;
  dropoff: Stop;
  /** Agreed fare for an on-time trip. */
  fare: number;
  /** Seconds allowed for the ride from pickup to drop-off. */
  time: number;
  /** Real-time ms deadline once the passenger or food is on board. */
  deadline?: number;
};

const roadDist = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

/** Pick a fresh job near you: pickup within a few blocks, drop-off further on. */
export function newMission(kind: HustleKind, area: AreaId, me: [number, number], level: number, rand: () => number): Mission {
  const job = hustleById(kind)!;
  const stops = allStops(area);
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
  // Pickup: one of the closer stops (but not right where you stand)
  const byNear = stops.filter((s) => roadDist(s.at, me) > 8).sort((a, b) => roadDist(a.at, me) - roadDist(b.at, me));
  let pickup: Stop;
  if (job.cargo === 'food') {
    const kitchens = byNear.filter((s) => KITCHENS.some((k) => PLACE_NAMES[k] === s.name));
    pickup = pick(kitchens.slice(0, 3).length ? kitchens.slice(0, 3) : byNear.slice(0, 4));
  } else pickup = pick(byNear.slice(0, 5));
  // Drop-off: somewhere 1–4 blocks away from the pickup
  const far = stops.filter((s) => s !== pickup && roadDist(s.at, pickup.at) > CELL_X * 0.9 && roadDist(s.at, pickup.at) < CELL_X * 4.5);
  const dropoff = pick(far.length ? far : stops.filter((s) => s !== pickup));
  const units = roadDist(pickup.at, dropoff.at);
  const fare = Math.round(((job.base + units * KM_PER_UNIT * job.perKm) * (1 + (level - 1) * LEVEL_BONUS)) / 50) * 50;
  return {
    kind,
    stage: 'pickup',
    who: pick(PASSENGERS),
    food: job.cargo === 'food' ? pick(FOODS) : undefined,
    pickup,
    dropoff,
    fare,
    time: Math.round(TIME_BASE + units * TIME_PER_UNIT),
  };
}

/** What you get paid at the drop-off: on time pays full plus maybe a tip; late pays less. */
export function tripPay(m: Mission, secondsLeft: number, rand: () => number): { pay: number; stars: number; tip: number } {
  if (secondsLeft >= 0) {
    const quick = secondsLeft / m.time;
    const stars = quick > 0.35 ? 5 : 4;
    const tip = stars === 5 && rand() < 0.5 ? Math.round((200 + rand() * 600) / 50) * 50 : 0;
    return { pay: m.fare, stars, tip };
  }
  // Late: the later you are, the less they pay (never below 40%)
  const late = Math.min(1, -secondsLeft / m.time);
  return { pay: Math.round((m.fare * Math.max(0.4, 0.8 - late)) / 50) * 50, stars: late > 0.5 ? 1 : 2, tip: 0 };
}

/** Grid block of a world point (for rendering markers). */
export const cellOfWorld = ([x, z]: [number, number]): Cell => [Math.round(x / CELL_X), Math.round((z - ROAD_Z) / CELL_Z)];
