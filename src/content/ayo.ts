/**
 * Ayo (Ayoayo / Oware, abapa rules). 12 pits: 0–5 are yours (bottom row,
 * left to right), 6–11 the opponent's (top row, right to left), so sowing
 * goes up the index: pit i feeds pit i + 1. 4 seeds in each pit to start.
 */
export type Ayo = { pits: number[]; store: [number, number]; turn: 0 | 1; over: boolean; note: string; moves: number };

export const SEEDS = 4;
export const sideOf = (pit: number): 0 | 1 => (pit < 6 ? 0 : 1);
const own = (p: 0 | 1) => (p === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11]);
const sum = (pits: number[], p: 0 | 1) => own(p).reduce((n, i) => n + pits[i], 0);

export function newAyo(first: 0 | 1 = 0): Ayo {
  return { pits: Array(12).fill(SEEDS), store: [0, 0], turn: first, over: false, note: first === 0 ? 'Your turn: pick one of your holes.' : 'Opponent dey think…', moves: 0 };
}

/** Sow from `pit`; returns the new pits and what the mover captured (no rules about feeding here). */
function sow(pits: number[], pit: number, mover: 0 | 1): { pits: number[]; got: number } {
  const p = [...pits];
  let seeds = p[pit];
  p[pit] = 0;
  let i = pit;
  while (seeds > 0) {
    i = (i + 1) % 12;
    if (i === pit) continue; // skip the hole you took from when you go round
    p[i]++;
    seeds--;
  }
  // Capture backwards from the last hole while it sits on the other side with 2 or 3
  let got = 0;
  const before = [...p];
  let j = i;
  while (sideOf(j) !== mover && (p[j] === 2 || p[j] === 3)) {
    got += p[j];
    p[j] = 0;
    j = (j + 11) % 12;
  }
  // Grand slam (taking everything the other side get): no capture
  if (got && sum(p, (1 - mover) as 0 | 1) === 0) return { pits: before, got: 0 };
  return { pits: p, got };
}

/** Holes the side to move may play: not empty, and must give seeds to an empty opponent if possible. */
export function legal(g: Ayo): number[] {
  const me = g.turn;
  const them = (1 - me) as 0 | 1;
  const mine = own(me).filter((i) => g.pits[i] > 0);
  if (sum(g.pits, them) > 0) return mine;
  return mine.filter((i) => sum(sow(g.pits, i, me).pits, them) > 0);
}

/** Play a hole. Returns a new game state. */
export function play(g: Ayo, pit: number): Ayo {
  if (g.over || !legal(g).includes(pit)) return g;
  const me = g.turn;
  const { pits, got } = sow(g.pits, pit, me);
  const store: [number, number] = [...g.store];
  store[me] += got;
  const next: Ayo = { pits, store, turn: (1 - me) as 0 | 1, over: false, moves: g.moves + 1, note: got ? (me === 0 ? `👏 You chop ${got} seeds!` : `Opponent chop ${got} seeds 😬`) : me === 0 ? 'Opponent turn…' : 'Your turn!' };
  return settle(next);
}

/** End the game when somebody pass 24, nobody fit move, or it drag too long. */
function settle(g: Ayo): Ayo {
  const end = g.store[0] > 24 || g.store[1] > 24 || legal(g).length === 0 || g.moves >= 200;
  if (!end) return g;
  // Seeds still for the board go to the side they sit on
  const store: [number, number] = [g.store[0] + sum(g.pits, 0), g.store[1] + sum(g.pits, 1)];
  const note = store[0] > store[1] ? `🏆 You win ${store[0]}–${store[1]}!` : store[0] < store[1] ? `😭 You lose ${store[0]}–${store[1]}` : '🤝 Draw, 24–24';
  return { ...g, pits: Array(12).fill(0), store, over: true, note };
}

export const ayoScore = (g: Ayo) => (g.store[0] > g.store[1] ? 1 : g.store[0] < g.store[1] ? 0 : 0.5);

/** Opponent: look two moves ahead and pick the hole that leaves it furthest ahead. */
export function ayoCpu(g: Ayo, rand: () => number): number {
  const moves = legal(g);
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const a = play(g, m);
    let worst = Infinity;
    if (a.over || a.turn === 1) worst = a.store[1] - a.store[0];
    else for (const r of legal(a)) {
      const b = play(a, r);
      worst = Math.min(worst, b.store[1] - b.store[0]);
    }
    if (worst === Infinity) worst = a.store[1] - a.store[0];
    const score = worst + rand() * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
