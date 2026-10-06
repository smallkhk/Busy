import type { Place } from './common';
import type { AreaId } from './housing';

/**
 * One connected Abuja. Every place sits in a block on a city grid, laid out
 * roughly like the real map (north = row 0). Blocks are CELL_X wide (east-west)
 * and CELL_Z deep. A road runs east-west in front of every block (local
 * z = ROAD_Z) and north-south roads run between the blocks (local x = ±CELL_X/2).
 *
 * Positions in the game stay local to the block you are in, so every place keeps
 * its own coordinates; walking across a block edge shifts the origin.
 */
export const CELL_X = 36;
export const CELL_Z = 32;
export const COLS = 7;
export const ROWS = 5;
/** Local z of the east-west road in front of every block. */
export const ROAD_Z = 7;
/** Half the width of the walkable strip along a road. */
export const ROAD_HALF = 1.3;

export type Cell = [number, number];

/**
 * Where each place stands on the grid ([column west→east, row north→south]).
 * Every block holds a place, an area's street or a landmark:
 *
 *   Zuma Rock   Kubwa st     Gwarinpa st  Jabi Lake    Maitama st   Maitama      Millennium Park
 *   Stadium     Utako        Wuse Market  Banex        Wuse 2       Hilton       Unity Fountain
 *   Kuje st     Hospital     Nat. Mosque  Secretariat  Christ. Ctr  Wuse 2 st    Aso Rock
 *   UniAbuja    Garki st     Eagle Sq.    CBN          Garki        Asokoro      Asokoro st
 *   Airport     City Gate    Guzape st    Nyanya st    Nyanya       Mararaba     Mararaba st
 */
export const PLACE_CELLS: Partial<Record<Place, Cell>> = {
  jabi: [3, 0],
  maitama: [5, 0],
  park: [6, 0],
  stadium: [0, 1],
  utako: [1, 1],
  wuse: [2, 1],
  lounge: [4, 1],
  hospital: [1, 2],
  secretariat: [3, 2],
  uniabuja: [0, 3],
  garki: [4, 3],
  asokoro: [5, 3],
  airport: [0, 4],
  nyanya: [4, 4],
  mararaba: [5, 4],
};

/** Your own street (the "street" place) is the block of the area you live in. */
export const HOME_CELLS: Record<AreaId, Cell> = {
  kubwa: [1, 0],
  gwarinpa: [2, 0],
  maitama: [4, 0],
  kuje: [0, 2],
  wuse2: [5, 2],
  garki: [1, 3],
  asokoro: [6, 3],
  guzape: [2, 4],
  nyanya: [3, 4],
  mararaba: [6, 4],
};

/** Abuja landmarks: blocks to see (and walk through) on the way. */
export type Landmark = 'zuma' | 'banex' | 'hilton' | 'fountain' | 'mosque' | 'church' | 'asorock' | 'eagle' | 'cbn' | 'citygate';
export const LANDMARK_CELLS: Record<Landmark, Cell> = {
  zuma: [0, 0],
  banex: [3, 1],
  hilton: [5, 1],
  fountain: [6, 1],
  mosque: [2, 2],
  church: [4, 2],
  asorock: [6, 2],
  eagle: [2, 3],
  cbn: [3, 3],
  citygate: [1, 4],
};
export const LANDMARK_NAMES: Record<Landmark, string> = {
  zuma: 'Zuma Rock',
  banex: 'Banex Plaza',
  hilton: 'Transcorp Hilton',
  fountain: 'Unity Fountain',
  mosque: 'National Mosque',
  church: 'National Christian Centre',
  asorock: 'Aso Rock (Villa)',
  eagle: 'Eagle Square',
  cbn: 'Central Bank (CBN)',
  citygate: 'Abuja City Gate',
};

export function landmarkAt(cell: Cell): Landmark | null {
  for (const [l, c] of Object.entries(LANDMARK_CELLS)) if (c[0] === cell[0] && c[1] === cell[1]) return l as Landmark;
  return null;
}

/** Forecourts you can walk onto (the rocks and the Villa are off limits). */
const LANDMARK_WALK: Partial<Record<Landmark, { minX: number; maxX: number; minZ: number; maxZ: number }>> = {
  banex: { minX: -9, maxX: 9, minZ: -2.5, maxZ: 7 },
  hilton: { minX: -8, maxX: 8, minZ: -1, maxZ: 7 },
  fountain: { minX: -8, maxX: 8, minZ: -7, maxZ: 7 },
  mosque: { minX: -9, maxX: 9, minZ: -0.5, maxZ: 7 },
  church: { minX: -8, maxX: 8, minZ: -0.5, maxZ: 7 },
  eagle: { minX: -11, maxX: 11, minZ: -3.5, maxZ: 7 },
  cbn: { minX: -7, maxX: 7, minZ: -0.5, maxZ: 7 },
};

/** Names for the blocks between places, so the HUD can say where you are. */
export const AREA_OF_CELL: Record<string, string> = Object.fromEntries(
  Object.entries(HOME_CELLS).map(([a, c]) => [`${c[0]},${c[1]}`, a]),
);

export const sameCell = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
export const inGrid = (c: Cell) => c[0] >= 0 && c[0] < COLS && c[1] >= 0 && c[1] < ROWS;

/** The grid block of a place, or null for places off the grid (inside your house). */
export function cellOfPlace(place: Place, area: AreaId): Cell | null {
  if (place === 'street') return HOME_CELLS[area];
  return PLACE_CELLS[place] ?? null;
}

/** What stands in a block for this player: a place, or just road and houses. */
export function placeAt(cell: Cell, area: AreaId): Place | null {
  if (sameCell(cell, HOME_CELLS[area])) return 'street';
  for (const [p, c] of Object.entries(PLACE_CELLS)) if (c && sameCell(c, cell)) return p as Place;
  return null;
}

/** The block you are in: your place's block, or the one you walked into on the road. */
export function currentCell(s: { place: Place; area: AreaId; cell?: Cell | null }): Cell | null {
  if (s.place === 'road') return s.cell ?? null;
  return cellOfPlace(s.place, s.area);
}

// ---------------- Walking on the roads ----------------

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
type P = [number, number];

/** Walkable areas as world rectangles: plazas (open down to their road), and the road grid. */
function walkables(area: AreaId, plaza: (p: Place) => Rect | null): Rect[] {
  const out: Rect[] = [];
  for (let r = 0; r < ROWS; r++) {
    const z = r * CELL_Z + ROAD_Z;
    out.push({ minX: -CELL_X / 2, maxX: (COLS - 0.5) * CELL_X, minZ: z - ROAD_HALF, maxZ: z + ROAD_HALF });
  }
  for (let c = 0; c <= COLS; c++) {
    const x = (c - 0.5) * CELL_X;
    out.push({ minX: x - ROAD_HALF, maxX: x + ROAD_HALF, minZ: -CELL_Z / 2 + 2, maxZ: (ROWS - 1) * CELL_Z + ROAD_Z + ROAD_HALF });
  }
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r < ROWS; r++) {
      const p = placeAt([c, r], area);
      const b = p && plaza(p);
      if (!b) continue;
      const ox = c * CELL_X;
      const oz = r * CELL_Z;
      out.push({ minX: ox + b.minX, maxX: ox + b.maxX, minZ: oz + b.minZ, maxZ: oz + ROAD_Z });
    }
  for (const [l, [c, r]] of Object.entries(LANDMARK_CELLS)) {
    const b = LANDMARK_WALK[l as Landmark];
    if (b) out.push({ minX: c * CELL_X + b.minX, maxX: c * CELL_X + b.maxX, minZ: r * CELL_Z + b.minZ, maxZ: r * CELL_Z + b.maxZ });
  }
  return out;
}

const clampTo = (p: P, b: Rect): P => [Math.min(b.maxX, Math.max(b.minX, p[0])), Math.min(b.maxZ, Math.max(b.minZ, p[1]))];
const inside = (p: P, b: Rect) => p[0] >= b.minX - 1e-6 && p[0] <= b.maxX + 1e-6 && p[1] >= b.minZ - 1e-6 && p[1] <= b.maxZ + 1e-6;

/** Nearest point you can actually walk to. */
export function snapWalkable(p: P, area: AreaId, plaza: (p: Place) => Rect | null): P {
  let best: P = p;
  let bd = Infinity;
  for (const b of walkables(area, plaza)) {
    const q = clampTo(p, b);
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) {
      bd = d;
      best = q;
    }
  }
  return best;
}

const rowOf = (z: number) => Math.min(ROWS - 1, Math.max(0, Math.round((z - ROAD_Z) / CELL_Z)));
const roadZ = (row: number) => row * CELL_Z + ROAD_Z;

/** Is this point on the north-south road between blocks (and not on an east-west road)? */
function onCrossRoad(p: P) {
  const k = Math.round(p[0] / CELL_X - 0.5);
  return Math.abs(p[0] - (k + 0.5) * CELL_X) <= ROAD_HALF + 1e-6;
}

/** Steps from a point to the east-west road of its row. */
function toRoad(p: P): P[] {
  const z = roadZ(rowOf(p[1]));
  return Math.abs(p[1] - z) <= ROAD_HALF ? [] : [[p[0], z]];
}

/**
 * Waypoints (world coordinates) to walk from `a` to `b` along the roads:
 * down to the road in front, along it to a cross road, up or down to the right
 * row, along again, then into the place. `b` is snapped onto walkable ground.
 */
export function route(a: P, bRaw: P, area: AreaId, plaza: (p: Place) => Rect | null): P[] {
  const b = snapWalkable(bRaw, area, plaza);
  // Same plaza, or same stretch of road: walk straight
  for (const w of walkables(area, plaza)) if (inside(a, w) && inside(b, w)) return [b];
  const ra = rowOf(a[1]);
  const rb = rowOf(b[1]);
  const pts: P[] = [];
  // Out of the plaza (or off the cross road) onto the east-west road
  const startOnCross = onCrossRoad(a) && Math.abs(a[1] - roadZ(ra)) > ROAD_HALF;
  if (!startOnCross) pts.push(...toRoad(a));
  const cur = (): P => pts[pts.length - 1] ?? a;
  if (ra !== rb || startOnCross) {
    // Pick the cross road between the two that makes the shortest trip
    const xs = Array.from({ length: COLS + 1 }, (_, c) => (c - 0.5) * CELL_X);
    const x = startOnCross ? cur()[0] : xs.reduce((best, x) => (Math.abs(cur()[0] - x) + Math.abs(x - b[0]) < Math.abs(cur()[0] - best) + Math.abs(best - b[0]) ? x : best));
    if (!startOnCross) pts.push([x, roadZ(ra)]);
    pts.push([x, roadZ(rb)]);
  }
  // Along the road to below the target, then in
  const end = toRoad(b);
  if (end.length) pts.push([b[0], roadZ(rb)]);
  pts.push(b);
  // Drop steps that go nowhere
  return pts.filter((p, i) => {
    const prev = i === 0 ? a : pts[i - 1];
    return Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 0.01;
  });
}
