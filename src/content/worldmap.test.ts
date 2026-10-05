import { describe, expect, it } from 'vitest';
import { CELL_X, CELL_Z, HOME_CELLS, PLACE_CELLS, placeAt, ROAD_HALF, ROAD_Z, route, snapWalkable, type Rect } from './worldmap';
import type { Place } from './common';

const PLAZA: Rect = { minX: -13, maxX: 13, minZ: -1.8, maxZ: 3.6 };
const plaza = (p: Place) => (p === 'road' || p === 'home' ? null : PLAZA);
const onRoadGrid = ([x, z]: [number, number]) => {
  const ew = Math.abs(((z - ROAD_Z) % CELL_Z + CELL_Z) % CELL_Z) <= ROAD_HALF + 1e-6 || Math.abs((((z - ROAD_Z) % CELL_Z) + CELL_Z) % CELL_Z - CELL_Z) <= ROAD_HALF + 1e-6;
  const ns = Math.abs((((x + CELL_X / 2) % CELL_X) + CELL_X) % CELL_X) <= ROAD_HALF + 1e-6 || Math.abs((((x + CELL_X / 2) % CELL_X) + CELL_X) % CELL_X - CELL_X) <= ROAD_HALF + 1e-6;
  return ew || ns;
};

describe('connected Abuja', () => {
  it('no two places or home streets share a block', () => {
    const cells = [...Object.values(PLACE_CELLS), ...Object.values(HOME_CELLS)].map((c) => c!.join(','));
    expect(new Set(cells).size).toBe(cells.length);
  });

  it('your own street is in your area block', () => {
    expect(placeAt(HOME_CELLS.kubwa, 'kubwa')).toBe('street');
    expect(placeAt(HOME_CELLS.kubwa, 'maitama')).toBeNull();
    expect(placeAt(PLACE_CELLS.wuse!, 'kubwa')).toBe('wuse');
  });

  it('walks straight inside one plaza', () => {
    expect(route([0, 0], [5, 1], 'kubwa', plaza)).toEqual([[5, 1]]);
  });

  it('goes down to the road, along, and up into the next place on the same row', () => {
    const wuse = PLACE_CELLS.wuse!;
    const utako = PLACE_CELLS.utako!;
    const a: [number, number] = [utako[0] * CELL_X, utako[1] * CELL_Z];
    const b: [number, number] = [wuse[0] * CELL_X + 2, wuse[1] * CELL_Z];
    const path = route(a, b, 'kubwa', plaza);
    expect(path[0]).toEqual([a[0], utako[1] * CELL_Z + ROAD_Z]);
    expect(path[path.length - 1]).toEqual(b);
    // Every step between the first and last point runs on the road grid
    for (const p of path.slice(0, -1)) expect(onRoadGrid(p), String(p)).toBe(true);
  });

  it('changes rows on a cross road between blocks', () => {
    const from: [number, number] = [0, 0];
    const garki = PLACE_CELLS.garki!;
    const to: [number, number] = [garki[0] * CELL_X, garki[1] * CELL_Z];
    const path = route(from, to, 'kubwa', plaza);
    expect(path[path.length - 1]).toEqual(to);
    // Moves are only ever along x or along z
    let prev = from;
    for (const p of path) {
      expect(p[0] === prev[0] || p[1] === prev[1], `${prev} -> ${p}`).toBe(true);
      prev = p;
    }
  });

  it('a tap inside houses snaps onto the nearest road or plaza', () => {
    const p = snapWalkable([10, -15], 'kubwa', plaza);
    expect(onRoadGrid(p) || (p[0] >= -13 && p[0] <= 13 && p[1] >= -1.8)).toBe(true);
  });
});
