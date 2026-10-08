/**
 * Naija Whot, two players. Match the shape or the number on top. Specials:
 * 1 hold on (play again), 2 pick two, 8 suspension (play again in a 2-player
 * game), 14 general market (the other person picks one), 20 Whot (wild: you
 * call the shape). First to finish their cards wins. If the market finishes,
 * the lowest count of card numbers (stars count double) wins.
 */
export type Shape = 'circle' | 'triangle' | 'cross' | 'square' | 'star' | 'whot';
export type Card = { s: Shape; n: number; id: number };
export type Whot = { hands: [Card[], Card[]]; market: Card[]; pile: Card[]; call: Shape | null; turn: 0 | 1; over: boolean; winner: 0 | 1 | null; note: string };

export const SHAPES: Shape[] = ['circle', 'triangle', 'cross', 'square', 'star'];
export const SHAPE_EMOJI: Record<Shape, string> = { circle: '⚪', triangle: '🔺', cross: '➕', square: '🟥', star: '⭐', whot: '🃏' };

export function deck(): Card[] {
  const out: Card[] = [];
  let id = 0;
  const add = (s: Shape, ns: number[]) => ns.forEach((n) => out.push({ s, n, id: id++ }));
  add('circle', [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14]);
  add('triangle', [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14]);
  add('cross', [1, 2, 3, 5, 7, 10, 11, 13, 14]);
  add('square', [1, 2, 3, 5, 7, 10, 11, 13, 14]);
  add('star', [1, 2, 3, 4, 5, 7, 8]);
  add('whot', [20, 20, 20, 20, 20]);
  return out;
}

export function newWhot(rand: () => number, first: 0 | 1 = 0): Whot {
  const d = deck();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  const hands: [Card[], Card[]] = [d.splice(0, 5), d.splice(0, 5)];
  // Start with a plain card on top
  const k = d.findIndex((c) => ![1, 2, 8, 14, 20].includes(c.n));
  const top = d.splice(k, 1)[0];
  return { hands, market: d, pile: [top], call: null, turn: first, over: false, winner: null, note: first === 0 ? 'Your turn: play a card wey match.' : 'Opponent dey play…' };
}

export const top = (g: Whot) => g.pile[g.pile.length - 1];

export function canPlay(g: Whot, c: Card): boolean {
  if (c.s === 'whot') return true;
  const t = top(g);
  if (t.s === 'whot') return !g.call || c.s === g.call;
  return c.s === t.s || c.n === t.n;
}

function draw(g: Whot, p: 0 | 1, n: number): number {
  let got = 0;
  for (let i = 0; i < n; i++) {
    const c = g.market.pop();
    if (!c) break;
    g.hands[p].push(c);
    got++;
  }
  return got;
}

const value = (h: Card[]) => h.reduce((t, c) => t + (c.s === 'star' ? c.n * 2 : c.n), 0);

function endIfMarketDone(g: Whot) {
  if (g.market.length > 0 || g.over) return;
  const a = value(g.hands[0]);
  const b = value(g.hands[1]);
  g.over = true;
  g.winner = a < b ? 0 : b < a ? 1 : null;
  g.note = `Market don finish! Count: you ${a}, opponent ${b}. ${g.winner === 0 ? '🏆 You win!' : g.winner === 1 ? '😭 You lose' : '🤝 Draw'}`;
}

const clone = (g: Whot): Whot => ({ ...g, hands: [[...g.hands[0]], [...g.hands[1]]], market: [...g.market], pile: [...g.pile] });

/** Play a card from the hand of the side to move. `call` is the shape asked for with a Whot. */
export function playCard(g0: Whot, id: number, call?: Shape): Whot {
  if (g0.over) return g0;
  const me = g0.turn;
  const c = g0.hands[me].find((x) => x.id === id);
  if (!c || !canPlay(g0, c)) return g0;
  const g = clone(g0);
  const them = (1 - me) as 0 | 1;
  g.hands[me] = g.hands[me].filter((x) => x.id !== id);
  g.pile.push(c);
  g.call = c.s === 'whot' ? (call ?? 'circle') : null;
  const who = me === 0 ? 'You' : 'Opponent';
  if (g.hands[me].length === 0) {
    g.over = true;
    g.winner = me;
    g.note = me === 0 ? '🏆 Check up! You finish your cards. You win!' : '😭 Opponent check up. Dem win.';
    return g;
  }
  let again = false;
  if (c.n === 1) {
    again = true;
    g.note = `${who} play 1: hold on! ${who} go again.`;
  } else if (c.n === 8) {
    again = true;
    g.note = `${who} play 8: suspension! ${who} go again.`;
  } else if (c.n === 2) {
    const got = draw(g, them, 2);
    again = true;
    g.note = `${who} play 2: ${them === 0 ? 'you' : 'opponent'} pick ${got}!`;
  } else if (c.n === 14) {
    draw(g, them, 1);
    again = true;
    g.note = `${who} play 14: general market! ${them === 0 ? 'You' : 'Opponent'} pick one.`;
  } else if (c.s === 'whot') {
    g.note = `${who} play Whot and call ${SHAPE_EMOJI[g.call!]} ${g.call}!`;
  } else {
    g.note = me === 0 ? 'Opponent turn…' : 'Your turn!';
  }
  g.turn = again ? me : them;
  endIfMarketDone(g);
  return g;
}

/** Go to market: pick one card and the turn passes. */
export function goMarket(g0: Whot): Whot {
  if (g0.over) return g0;
  const g = clone(g0);
  const me = g.turn;
  draw(g, me, 1);
  g.turn = (1 - me) as 0 | 1;
  g.note = me === 0 ? 'You go market. Opponent turn…' : 'Opponent go market. Your turn!';
  endIfMarketDone(g);
  return g;
}

/** Opponent: specials first, then a matching card, Whot last; call its most common shape. */
export function whotCpu(g: Whot): { id: number | null; call?: Shape } {
  const hand = g.hands[1];
  const ok = hand.filter((c) => canPlay(g, c));
  if (!ok.length) return { id: null };
  const rank = (c: Card) => (c.s === 'whot' ? 0 : c.n === 2 || c.n === 14 ? 4 : c.n === 1 || c.n === 8 ? 3 : 2);
  ok.sort((a, b) => rank(b) - rank(a) || b.n - a.n);
  const pick = ok[0];
  if (pick.s !== 'whot') return { id: pick.id };
  const counts = SHAPES.map((s) => [s, hand.filter((c) => c.s === s).length] as const).sort((a, b) => b[1] - a[1]);
  return { id: pick.id, call: counts[0][1] ? counts[0][0] : 'circle' };
}

export const whotScore = (g: Whot) => (g.winner === 0 ? 1 : g.winner === 1 ? 0 : 0.5);
