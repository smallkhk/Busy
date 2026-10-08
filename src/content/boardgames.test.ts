import { describe, expect, it } from 'vitest';
import { ayoCpu, legal, newAyo, play, type Ayo } from './ayo';
import { apply, draughtsCpu, movesFor, newDraughts, type Draughts } from './draughts';
import { canPlay, deck, goMarket, newWhot, playCard, top, whotCpu, type Whot } from './whot';

let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('Ayo', () => {
  it('sows round and captures 2s and 3s on the other side', () => {
    const g: Ayo = { pits: [0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 4, 0], store: [0, 0], turn: 0, over: false, note: '', moves: 0 };
    const a = play(g, 5);
    // 2 seeds from hole 5 land in 6 and 7: 6 has 2, 7 has 3 -> both captured
    expect(a.store[0]).toBe(5);
    expect(a.pits[6]).toBe(0);
    expect(a.pits[7]).toBe(0);
  });

  it('you must feed an opponent wey no get seed', () => {
    const g: Ayo = { pits: [3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], store: [20, 24], turn: 0, over: false, note: '', moves: 0 };
    expect(legal(g)).toEqual([5]);
  });

  it('a whole game between two computers ends with 48 seeds counted', () => {
    let g = newAyo(0);
    for (let i = 0; i < 400 && !g.over; i++) g = play(g, ayoCpu(g, rand));
    expect(g.over).toBe(true);
    expect(g.store[0] + g.store[1]).toBe(48);
  });
});

describe('Whot', () => {
  it('has the 54-card Naija deck', () => {
    expect(deck()).toHaveLength(54);
  });

  it('pick two makes the other person pick, and you play again', () => {
    const g = newWhot(rand, 0);
    const two = { s: top(g).s, n: 2, id: 999 };
    g.hands[0].push(two);
    const before = g.hands[1].length;
    const a = playCard(g, 999);
    expect(a.hands[1].length).toBe(before + 2);
    expect(a.turn).toBe(0);
  });

  it('Whot calls a shape, and only that shape (or Whot) can follow', () => {
    const g = newWhot(rand, 0);
    g.hands[0].push({ s: 'whot', n: 20, id: 998 });
    const a = playCard(g, 998, 'star');
    expect(a.call).toBe('star');
    expect(canPlay(a, { s: 'star', n: 3, id: 1 })).toBe(true);
    expect(canPlay(a, { s: 'circle', n: 3, id: 2 })).toBe(false);
  });

  it('a whole game between two computers ends', () => {
    let g: Whot = newWhot(rand, 0);
    for (let i = 0; i < 600 && !g.over; i++) {
      const h = g.hands[g.turn];
      const mine = g.turn === 1 ? whotCpu(g) : { id: h.find((c) => canPlay(g, c))?.id ?? null, call: 'circle' as const };
      g = mine.id === null ? goMarket(g) : playCard(g, mine.id, mine.call);
    }
    expect(g.over).toBe(true);
  });
});

describe('Draughts', () => {
  it('starts with 12 pieces each and 7 opening moves', () => {
    const g = newDraughts();
    expect(g.board.filter((p) => p?.side === 0)).toHaveLength(12);
    expect(movesFor(g)).toHaveLength(7);
  });

  it('capturing is compulsory and double jumps are one move', () => {
    const g: Draughts = { board: Array(64).fill(null), turn: 0, over: false, winner: null, note: '', moves: 0 };
    g.board[7 * 8 + 0] = { side: 0, king: false };
    g.board[6 * 8 + 1] = { side: 1, king: false };
    g.board[4 * 8 + 3] = { side: 1, king: false };
    g.board[0 * 8 + 1] = { side: 1, king: false };
    const ms = movesFor(g);
    expect(ms).toHaveLength(1);
    expect(ms[0].caps).toHaveLength(2);
    const a = apply(g, ms[0]);
    expect(a.board.filter((p) => p?.side === 1)).toHaveLength(1);
  });

  it('a whole game between two computers ends', () => {
    let g = newDraughts();
    for (let i = 0; i < 300 && !g.over; i++) g = apply(g, draughtsCpu(g, rand, 2));
    expect(g.over).toBe(true);
  });
});
