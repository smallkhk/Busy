import { describe, expect, it } from 'vitest';
import { absOf, cellOf, HOME, ludoCpu, moveSeed, movable, newLudo, rollDie, START, TRACK, type Ludo } from './ludo';

let seed = 5;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('Ludo', () => {
  it('has a 52-square track of neighbouring squares that closes into a loop', () => {
    expect(TRACK).toHaveLength(52);
    expect(new Set(TRACK.map(([r, c]) => `${r},${c}`)).size).toBe(52);
    for (let i = 0; i < 52; i++) {
      const [a, b] = [TRACK[i], TRACK[(i + 1) % 52]];
      expect(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]), `step ${i}`).toBeLessThanOrEqual(2);
    }
    expect(TRACK[START[0]]).toEqual([13, 6]);
    expect(TRACK[START[1]]).toEqual([1, 8]);
  });

  it('you need a 6 to come out, and a 6 gives another throw', () => {
    let g = newLudo(0);
    g = rollDie(g, 3);
    expect(g.turn).toBe(1);
    g = { ...newLudo(0) };
    g = rollDie(g, 6);
    expect(movable(g)).toEqual([0, 1, 2, 3]);
    g = moveSeed(g, 0);
    expect(g.seeds[0][0]).toBe(0);
    expect(g.turn).toBe(0);
    expect(cellOf(0, 0)).toEqual([13, 6]);
  });

  it('landing on an opponent seed sends it home, but not on a safe square', () => {
    // Opponent seed 3 squares ahead of you, on a normal square
    const sq = absOf(0, 5);
    const theirStep = (sq - START[1] + 52) % 52;
    const g: Ludo = { seeds: [[2, -1, -1, -1], [theirStep, -1, -1, -1]], turn: 0, roll: null, over: false, winner: null, note: '', sixes: 0 };
    const a = moveSeed(rollDie(g, 3), 0);
    expect(a.seeds[1][0]).toBe(-1);
    expect(a.turn).toBe(0);
  });

  it('you need the exact number to enter home', () => {
    const g: Ludo = { seeds: [[54, HOME, HOME, HOME], [-1, -1, -1, -1]], turn: 0, roll: null, over: false, winner: null, note: '', sixes: 0 };
    expect(rollDie(g, 5).turn).toBe(1);
    const w = moveSeed(rollDie(g, 2), 0);
    expect(w.over).toBe(true);
    expect(w.winner).toBe(0);
  });

  it('two computers finish a whole game', () => {
    let g = newLudo(0);
    for (let i = 0; i < 4000 && !g.over; i++) {
      if (g.roll === null) g = rollDie(g, 1 + Math.floor(rand() * 6));
      else g = moveSeed(g, ludoCpu(g));
    }
    expect(g.over).toBe(true);
  });
});
