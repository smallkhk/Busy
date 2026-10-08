/**
 * Ludo, you (red, bottom-left) against the computer (yellow, top-right).
 * One die. A 6 brings a seed out and gives you another throw; so does
 * knocking an opponent seed back home. Start squares and stars are safe.
 * Bring all four seeds home first to win (you need the exact number).
 */
export type Side = 0 | 1;
export type Ludo = { seeds: [number[], number[]]; turn: Side; roll: number | null; over: boolean; winner: Side | null; note: string; sixes: number };

/** The 52-square track on a 15×15 board, as [row, col], going clockwise. */
export const TRACK: [number, number][] = (() => {
  const t: [number, number][] = [];
  const run = (r0: number, c0: number, dr: number, dc: number, n: number) => {
    for (let i = 0; i < n; i++) t.push([r0 + dr * i, c0 + dc * i]);
  };
  run(6, 1, 0, 1, 5);
  run(5, 6, -1, 0, 6);
  t.push([0, 7]);
  run(0, 8, 1, 0, 6);
  run(6, 9, 0, 1, 6);
  t.push([7, 14]);
  run(8, 14, 0, -1, 6);
  run(9, 8, 1, 0, 6);
  t.push([14, 7]);
  run(14, 6, -1, 0, 6);
  run(8, 5, 0, -1, 6);
  t.push([7, 0]);
  t.push([6, 0]);
  return t;
})();

/** Where each side comes onto the track, and its home column (5 squares, then the middle). */
export const START: Record<Side, number> = { 0: 39, 1: 13 };
export const HOME_COL: Record<Side, [number, number][]> = {
  0: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  1: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
};
export const SAFE = new Set([0, 13, 26, 39, 8, 21, 34, 47]);
/** Steps: −1 yard, 0..50 on the track, 51..55 home column, 56 home. */
export const HOME = 56;

export const absOf = (side: Side, step: number) => (START[side] + step) % 52;

export function newLudo(first: Side = 0): Ludo {
  return { seeds: [[-1, -1, -1, -1], [-1, -1, -1, -1]], turn: first, roll: null, over: false, winner: null, note: first === 0 ? 'Your turn: roll the die 🎲' : 'Opponent dey roll…', sixes: 0 };
}

/** Which of the side's seeds can move with the current throw. */
export function movable(g: Ludo): number[] {
  if (g.roll === null) return [];
  const d = g.roll;
  return g.seeds[g.turn].map((s, i) => ((s === -1 && d === 6) || (s >= 0 && s + d <= HOME) ? i : -1)).filter((i) => i >= 0);
}

export function rollDie(g: Ludo, d: number): Ludo {
  if (g.over || g.roll !== null) return g;
  const next: Ludo = { ...g, roll: d, sixes: d === 6 ? g.sixes + 1 : 0, note: `${g.turn === 0 ? 'You' : 'Opponent'} roll ${d}` };
  // Three sixes in a row: you lose the turn
  if (next.sixes >= 3) return pass({ ...next, note: `${next.note}. Three sixes! Turn don pass.` });
  if (!movable(next).length) return pass({ ...next, note: `${next.note}. No move.` });
  return next;
}

function pass(g: Ludo): Ludo {
  const turn = (1 - g.turn) as Side;
  return { ...g, roll: null, sixes: 0, turn, note: `${g.note} ${turn === 0 ? 'Your turn!' : 'Opponent turn…'}` };
}

export function moveSeed(g: Ludo, i: number): Ludo {
  if (g.over || !movable(g).includes(i)) return g;
  const me = g.turn;
  const them = (1 - me) as Side;
  const d = g.roll!;
  const seeds: [number[], number[]] = [[...g.seeds[0]], [...g.seeds[1]]];
  const from = seeds[me][i];
  const to = from === -1 ? 0 : from + d;
  seeds[me][i] = to;
  let killed = 0;
  if (to <= 50) {
    const sq = absOf(me, to);
    if (!SAFE.has(sq)) {
      seeds[them] = seeds[them].map((s) => {
        if (s >= 0 && s <= 50 && absOf(them, s) === sq) {
          killed++;
          return -1;
        }
        return s;
      });
    }
  }
  const who = me === 0 ? 'You' : 'Opponent';
  let note = from === -1 ? `${who} bring out a seed.` : to === HOME ? `${who} carry one seed reach home! 🏠` : `${who} move ${d}.`;
  if (killed) note = me === 0 ? `💥 You knock their seed back home!` : `💥 Opponent knock your seed back home 😭`;
  const out: Ludo = { ...g, seeds, roll: null, note };
  if (seeds[me].every((s) => s === HOME)) return { ...out, over: true, winner: me, note: me === 0 ? '🏆 All your seeds reach home. You win!' : '😭 Opponent carry all their seeds home. Dem win.' };
  // Another throw for a 6, a knock or a seed reaching home
  if (d === 6 || killed || to === HOME) return { ...out, note: `${note} ${who} throw again.` };
  return pass(out);
}

/** Where a seed sits on the board as [row, col] (null in the yard). */
export function cellOf(side: Side, step: number): [number, number] | null {
  if (step < 0) return null;
  if (step <= 50) return TRACK[absOf(side, step)];
  if (step < HOME) return HOME_COL[side][step - 51];
  return [7, 7];
}

/** Computer: finish > knock > come out > run from danger > push the leader. */
export function ludoCpu(g: Ludo): number {
  const me = g.turn;
  const them = (1 - me) as Side;
  const d = g.roll!;
  const enemyAt = new Set(g.seeds[them].filter((s) => s >= 0 && s <= 50).map((s) => absOf(them, s)));
  const danger = (sq: number) => !SAFE.has(sq) && g.seeds[them].some((s) => s >= 0 && s <= 50 && ((sq - absOf(them, s) + 52) % 52) >= 1 && ((sq - absOf(them, s) + 52) % 52) <= 6);
  let best = movable(g)[0];
  let bv = -Infinity;
  for (const i of movable(g)) {
    const s = g.seeds[me][i];
    const to = s === -1 ? 0 : s + d;
    let v = to / 10;
    if (to === HOME) v += 50;
    else if (to <= 50 && !SAFE.has(absOf(me, to)) && enemyAt.has(absOf(me, to))) v += 40;
    if (s === -1) v += 25;
    if (s >= 0 && s <= 50 && danger(absOf(me, s))) v += 12;
    if (to <= 50 && danger(absOf(me, to))) v -= 10;
    if (to > 50) v += 8;
    if (v > bv) {
      bv = v;
      best = i;
    }
  }
  return best;
}

export const ludoScore = (g: Ludo) => (g.winner === 0 ? 1 : g.winner === 1 ? 0 : 0.5);
