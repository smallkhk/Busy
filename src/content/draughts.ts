/**
 * Draughts (8×8). You play the dark pieces from the bottom and move first.
 * Pieces move one step forward on the dark squares; a piece that reaches the
 * far row becomes a king and moves both ways. Capturing is compulsory, and
 * you keep jumping while you can.
 */
export type Piece = { side: 0 | 1; king: boolean } | null;
export type Board = Piece[]; // 64 squares, row-major; row 0 is the top (opponent side)
export type Move = { from: number; path: number[]; caps: number[] };
export type Draughts = { board: Board; turn: 0 | 1; over: boolean; winner: 0 | 1 | null; note: string; moves: number };

const rc = (i: number) => [Math.floor(i / 8), i % 8] as const;
const at = (r: number, c: number) => (r >= 0 && r < 8 && c >= 0 && c < 8 ? r * 8 + c : -1);
export const dark = (i: number) => {
  const [r, c] = rc(i);
  return (r + c) % 2 === 1;
};

export function newDraughts(): Draughts {
  const board: Board = Array(64).fill(null);
  for (let i = 0; i < 64; i++) {
    if (!dark(i)) continue;
    const r = Math.floor(i / 8);
    if (r < 3) board[i] = { side: 1, king: false };
    if (r > 4) board[i] = { side: 0, king: false };
  }
  return { board, turn: 0, over: false, winner: null, note: 'Your turn: tap your piece, then where it go go.', moves: 0 };
}

const dirs = (p: NonNullable<Piece>) => {
  const fwd = p.side === 0 ? -1 : 1;
  const ds: [number, number][] = [[fwd, -1], [fwd, 1]];
  if (p.king) ds.push([-fwd, -1], [-fwd, 1]);
  return ds;
};

function jumps(board: Board, from: number, p: NonNullable<Piece>, taken: number[]): Move[] {
  const [r, c] = rc(from);
  const out: Move[] = [];
  for (const [dr, dc] of dirs(p)) {
    const mid = at(r + dr, c + dc);
    const to = at(r + 2 * dr, c + 2 * dc);
    if (mid < 0 || to < 0) continue;
    const m = board[mid];
    if (!m || m.side === p.side || taken.includes(mid) || board[to]) continue;
    // A man that reach the end becomes king and the turn stops there
    const crowned = !p.king && (to < 8 || to >= 56) && Math.floor(to / 8) === (p.side === 0 ? 0 : 7);
    const b2 = [...board];
    b2[to] = p;
    b2[from] = null;
    const more = crowned ? [] : jumps(b2, to, p, [...taken, mid]);
    if (more.length) for (const x of more) out.push({ from, path: [to, ...x.path], caps: [mid, ...x.caps] });
    else out.push({ from, path: [to], caps: [mid] });
  }
  return out;
}

export function movesFor(g: Draughts, side = g.turn): Move[] {
  const caps: Move[] = [];
  const steps: Move[] = [];
  g.board.forEach((p, i) => {
    if (!p || p.side !== side) return;
    caps.push(...jumps(g.board, i, p, []));
    const [r, c] = rc(i);
    for (const [dr, dc] of dirs(p)) {
      const to = at(r + dr, c + dc);
      if (to >= 0 && !g.board[to]) steps.push({ from: i, path: [to], caps: [] });
    }
  });
  return caps.length ? caps : steps;
}

export function apply(g: Draughts, m: Move): Draughts {
  const board = [...g.board];
  const p = board[m.from]!;
  board[m.from] = null;
  for (const c of m.caps) board[c] = null;
  const to = m.path[m.path.length - 1];
  const row = Math.floor(to / 8);
  board[to] = { side: p.side, king: p.king || row === (p.side === 0 ? 0 : 7) };
  const turn = (1 - g.turn) as 0 | 1;
  const next: Draughts = { board, turn, over: false, winner: null, moves: g.moves + 1, note: m.caps.length ? (g.turn === 0 ? `👏 You chop ${m.caps.length}!` : `Opponent chop ${m.caps.length} 😬`) : turn === 0 ? 'Your turn!' : 'Opponent turn…' };
  const left = (s: 0 | 1) => board.filter((x) => x?.side === s).length;
  if (!movesFor(next).length || left(turn) === 0) {
    next.over = true;
    next.winner = g.turn;
    next.note = g.turn === 0 ? '🏆 Opponent no fit move again. You win!' : '😭 You no fit move again. You lose';
  } else if (next.moves >= 160) {
    next.over = true;
    const a = left(0);
    const b = left(1);
    next.winner = a > b ? 0 : b > a ? 1 : null;
    next.note = `Game too long: you ${a}, opponent ${b} pieces. ${next.winner === 0 ? '🏆 You win!' : next.winner === 1 ? '😭 You lose' : '🤝 Draw'}`;
  }
  return next;
}

const evalBoard = (b: Board) => b.reduce((t, p) => (p ? t + (p.side === 1 ? 1 : -1) * (p.king ? 3 : 1) : t), 0);

function search(g: Draughts, depth: number): number {
  if (g.over) return g.winner === 1 ? 100 : g.winner === 0 ? -100 : 0;
  if (depth === 0) return evalBoard(g.board);
  const ms = movesFor(g);
  const vals = ms.map((m) => search(apply(g, m), depth - 1));
  return g.turn === 1 ? Math.max(...vals) : Math.min(...vals);
}

/** Opponent: three moves deep, counting pieces (kings worth three). */
export function draughtsCpu(g: Draughts, rand: () => number, depth = 3): Move {
  const ms = movesFor(g);
  let best = ms[0];
  let bv = -Infinity;
  for (const m of ms) {
    const v = search(apply(g, m), depth - 1) + rand() * 0.3;
    if (v > bv) {
      bv = v;
      best = m;
    }
  }
  return best;
}

export const draughtsScore = (g: Draughts) => (g.winner === 0 ? 1 : g.winner === 1 ? 0 : 0.5);
