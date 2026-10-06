import type { Place } from './common';
import type { AreaId } from './housing';
import { homePoint } from './homeLayout';
import { CAMPUS } from './campus';

/**
 * Every real thing you can sit on: benches, stools, chairs, lecture benches.
 * `x`/`z` is where your feet-origin goes, `y` the top of the seat, `rot` the
 * way you face (0 = +z, π = −z). You can only sit where a seat is.
 */
export type Seat = { x: number; z: number; y: number; rot: number };

/** Seat height the sitting pose is built for: a seat this high needs no lift. */
export const SEAT_BASE = 0.4;
/** How far the Sit button looks for a free seat, and how close an activity seat must be. */
export const SIT_REACH = 9;
export const ACTIVITY_SEAT_REACH = 3.5;

const BACK = Math.PI;
/** Sitting facing −z: your bottom sits a touch behind the seat centre. */
const facingBack = (x: number, z: number, y: number): Seat => ({ x, z: z + 0.05, y, rot: BACK });

// ---------------- Lecture theatre: four rows of benches, plus exam chairs ----------------
export const LT_ROWS = [-0.7, 0.8, 2.3, 3.8];
/** Bench top in row `i` (the rows step up toward the back). */
export const ltBenchTop = (i: number) => 0.48 + i * 0.12;
export const ltSeat = (row: number, x: number): Seat => facingBack(x, LT_ROWS[row] + 0.5, ltBenchTop(row));
const LT_XS = [-2.0, -1.2, -0.4, 0.4, 1.2, 3.4, 4.2, 5.0, 5.8, 6.6];
export const LT_EXAM_DESKS: [number, number][] = [-7.6, -6.2, -4.8].flatMap((x) => [0.4, 2, 3.6].map((z) => [x, z] as [number, number]));
export const EXAM_CHAIR_TOP = 0.45;

// ---------------- Library: chairs at the reading tables ----------------
export const LIB_TABLES: [number, number][] = [-0.5, 2.2].flatMap((z) => [-3, -0.6].map((x) => [x, z] as [number, number]));
export const LIB_CHAIR_TOP = 0.48;

// ---------------- Campus grounds: benches and cafeteria chairs ----------------
/** Benches along the avenue and by the buildings: [x, z, faces −z?]. */
export const CAMPUS_BENCHES: [number, number, boolean][] = [
  [-4.2, -0.5, false],
  [4.2, -0.5, false],
  [-4.2, 8.5, false],
  [4.2, 8.5, false],
  [CAMPUS.sub[0] - 3.5, CAMPUS.sub[1] + 5.5, true],
  [CAMPUS.library[0] + 4, CAMPUS.library[1] + 6, true],
];
export const CAMPUS_BENCH_TOP = 0.45;
/** Cafeteria tables (centres); a chair on each side. */
export const CAFE_TABLES: [number, number][] = [-2.5, 0, 2.5].map((dx) => [CAMPUS.cafeteria[0] + dx, CAMPUS.cafeteria[1] + 4]);
export const CAFE_CHAIR_TOP = 0.45;

/** Seats students already sit in: [row, x] in the LT, [x, z] at library tables. You no fit sit on them. */
export const LT_TAKEN: [number, number, string, boolean?][] = [
  [0, -1.2, '#2980b9'],
  [0, 0.4, '#e74c3c', true],
  [1, 4.2, '#27ae60'],
  [1, 5.8, '#f1c40f', true],
  [2, -0.4, '#9b59b6', true],
  [2, 3.4, '#34495e'],
  [3, 5.0, '#16a085'],
  [3, -2.0, '#e67e22', true],
];
export const LIB_TAKEN: [number, number, string, boolean?][] = [
  [-3.5, -0.5, '#2980b9'],
  [-0.1, -0.5, '#e74c3c', true],
  [-0.1, 2.2, '#27ae60'],
  [-3.5, 2.2, '#f1c40f', true],
];
const LT_FREE_XS = (row: number) => LT_XS.filter((x) => !LT_TAKEN.some(([r, tx]) => r === row && Math.abs(tx - x) < 0.3));

const benchSeats = ([x, z, back]: [number, number, boolean]): Seat[] =>
  [-0.45, 0.45].map((dx) => (back ? facingBack(x + dx, z, CAMPUS_BENCH_TOP) : { x: x + dx, z: z - 0.05, y: CAMPUS_BENCH_TOP, rot: 0 }));

const FIXED: Partial<Record<Place, Seat[]>> = {
  // Bus stop bench (two people already wait on it) and the viewing centre stools
  street: [facingBack(0.15, 3.8, 0.46), facingBack(1.85, 3.8, 0.46), ...[1.2, 1.8, 2.4].map((x) => facingBack(x, -2.25, 0.44)), ...[-4.1, -3.3].map((x) => facingBack(x, -1.6, 0.44))],
  lt: [
    ...LT_ROWS.flatMap((_, row) => LT_FREE_XS(row).map((x) => ltSeat(row, x))),
    ...LT_EXAM_DESKS.map(([x, z]) => facingBack(x, z + 0.55, EXAM_CHAIR_TOP)),
  ],
  unilib: LIB_TABLES.flatMap(([x, z]) => [-0.5, 0.5].map((dx) => [x + dx, z] as [number, number]))
    .filter(([x, z]) => !LIB_TAKEN.some(([tx, tz]) => Math.abs(tx - x) < 0.2 && Math.abs(tz - z) < 0.2))
    .map(([x, z]) => facingBack(x, z + 0.75, LIB_CHAIR_TOP)),
  campus: [...CAMPUS_BENCHES.flatMap(benchSeats), ...CAFE_TABLES.slice(1).flatMap(([x, z]) => [facingBack(x, z + 0.8, CAFE_CHAIR_TOP), { x, z: z - 0.85, y: CAFE_CHAIR_TOP, rot: 0 }])],
};

const homeSeats = new Map<AreaId, Seat[]>();

/** All the seats in a place (your compound bench moves with your house). */
export function seatsAt(place: Place, area: AreaId): Seat[] {
  if (place === 'home') {
    // Compound bench: the neighbour sits on the left end, you take the right.
    // Cached so the same seat object comes back each time (React selectors need that).
    let s = homeSeats.get(area);
    if (!s) {
      const [x, z] = homePoint(area, 'bench', 4.0, 3.3);
      homeSeats.set(area, (s = [facingBack(x, z, 0.39)]));
    }
    return s;
  }
  return FIXED[place] ?? [];
}

/** The nearest seat within `reach` of a point, or null. */
export function nearestSeat(place: Place, area: AreaId, p: [number, number], reach: number): Seat | null {
  let best: Seat | null = null;
  let bd = reach;
  for (const s of seatsAt(place, area)) {
    const d = Math.hypot(s.x - p[0], s.z - p[1]);
    if (d <= bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}
