/**
 * 8-ball pool: table physics, the rules and the computer opponent, as pure
 * functions so they can be tested. The table is portrait: x across (0..W),
 * y down its length (0..L). The cue ball starts near the bottom; the rack
 * sits near the top.
 */
export const W = 1;
export const L = 2;
export const R = 0.028;
export const POCKET_R = 0.058;
/** Most speed a shot can have (table units per second). */
export const MAX_SPEED = 5.4;
const ROLL_FRICTION = 0.75;
const CUSHION = 0.78;
const BALL_BOUNCE = 0.96;
const STOP = 0.01;

export type Ball = { n: number; x: number; y: number; vx: number; vy: number; potted: boolean };
export type Group = 'solids' | 'stripes';
export type Side = 'you' | 'cpu';

export const POCKETS: [number, number][] = [
  [0, 0], [W, 0],
  [0, L / 2], [W, L / 2],
  [0, L], [W, L],
];
export const HEAD_SPOT: [number, number] = [W / 2, L * 0.75];
const FOOT_SPOT: [number, number] = [W / 2, L * 0.27];

export const groupOf = (n: number): Group | 'eight' | 'cue' => (n === 0 ? 'cue' : n === 8 ? 'eight' : n < 8 ? 'solids' : 'stripes');

/** Rack: 15 balls in a triangle pointing at the cue ball, the 8 in the middle. */
export function rack(rand: () => number): Ball[] {
  const others = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  // The two back corners: one solid, one stripe (house rules)
  const balls: Ball[] = [{ n: 0, x: HEAD_SPOT[0], y: HEAD_SPOT[1], vx: 0, vy: 0, potted: false }];
  const gap = R * 2.02;
  let k = 0;
  for (let row = 0; row < 5; row++) {
    for (let i = 0; i <= row; i++) {
      const x = FOOT_SPOT[0] + (i - row / 2) * gap;
      const y = FOOT_SPOT[1] - row * gap * 0.866;
      const n = row === 2 && i === 1 ? 8 : others[k++];
      balls.push({ n, x, y, vx: 0, vy: 0, potted: false });
    }
  }
  return balls;
}

export const moving = (balls: Ball[]) => balls.some((b) => !b.potted && (b.vx !== 0 || b.vy !== 0));

/** What happened during one shot (filled in while the balls roll). */
export type ShotLog = { firstHit: number | null; potted: number[]; cushion: boolean };
export const newLog = (): ShotLog => ({ firstHit: null, potted: [], cushion: false });

/** Advance the table by dt seconds (use small steps, about 1/240 s). */
export function step(balls: Ball[], dt: number, log: ShotLog) {
  for (const b of balls) {
    if (b.potted || (b.vx === 0 && b.vy === 0)) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // Rolling friction slows every ball, then it stops
    const sp = Math.hypot(b.vx, b.vy);
    const ns = Math.max(0, sp - ROLL_FRICTION * dt);
    if (ns < STOP) {
      b.vx = 0;
      b.vy = 0;
    } else {
      b.vx *= ns / sp;
      b.vy *= ns / sp;
    }
    // Pockets
    for (const [px, py] of POCKETS) {
      if (Math.hypot(b.x - px, b.y - py) < POCKET_R) {
        b.potted = true;
        b.vx = 0;
        b.vy = 0;
        log.potted.push(b.n);
        break;
      }
    }
    if (b.potted) continue;
    // Cushions
    if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * CUSHION; log.cushion = true; }
    if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx) * CUSHION; log.cushion = true; }
    if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy) * CUSHION; log.cushion = true; }
    if (b.y > L - R) { b.y = L - R; b.vy = -Math.abs(b.vy) * CUSHION; log.cushion = true; }
  }
  // Ball against ball: equal masses, so swap the speed along the line between them
  for (let i = 0; i < balls.length; i++) {
    const a = balls[i];
    if (a.potted) continue;
    for (let j = i + 1; j < balls.length; j++) {
      const b = balls[j];
      if (b.potted) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d >= 2 * R || d === 0) continue;
      const nx = dx / d;
      const ny = dy / d;
      // Push them apart so they no stick
      const overlap = (2 * R - d) / 2;
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (rel <= 0) continue;
      const imp = rel * (1 + BALL_BOUNCE) / 2;
      a.vx -= imp * nx;
      a.vy -= imp * ny;
      b.vx += imp * nx;
      b.vy += imp * ny;
      if (log.firstHit === null) {
        if (a.n === 0) log.firstHit = b.n;
        else if (b.n === 0) log.firstHit = a.n;
      }
    }
  }
}

/** Roll the table until every ball stops (for tests and the computer's thinking). */
export function simulate(balls: Ball[], log = newLog(), maxSeconds = 20): ShotLog {
  const dt = 1 / 240;
  for (let t = 0; t < maxSeconds && moving(balls); t += dt) step(balls, dt, log);
  return log;
}

export function shoot(balls: Ball[], angle: number, power: number) {
  const cue = balls[0];
  const sp = Math.max(0.05, Math.min(1, power)) * MAX_SPEED;
  cue.vx = Math.cos(angle) * sp;
  cue.vy = Math.sin(angle) * sp;
}

// ---------------- Rules ----------------
export type Match = {
  balls: Ball[];
  turn: Side;
  /** Who has which group (null while the table is open). */
  groups: Record<Side, Group | null>;
  winner: Side | null;
  /** What the last shot did, for the message line. */
  note: string;
};

export function newMatch(rand: () => number, breaker: Side = 'you'): Match {
  return { balls: rack(rand), turn: breaker, groups: { you: null, cpu: null }, winner: null, note: breaker === 'you' ? 'Your break! Drag back from the white ball and let go.' : 'Opponent dey break…' };
}

const other = (s: Side): Side => (s === 'you' ? 'cpu' : 'you');
export const left = (balls: Ball[], g: Group) => balls.filter((b) => !b.potted && groupOf(b.n) === g).length;

/** Apply the 8-ball rules after the balls stop. Mutates and returns the match. */
export function judge(m: Match, log: ShotLog): Match {
  const me = m.turn;
  const them = other(me);
  const mine = m.groups[me];
  const cue = m.balls[0];
  const scratch = log.potted.includes(0);
  const eight = log.potted.includes(8);
  // Before this shot, did I still have balls of my own to clear?
  const potNow = log.potted.filter((n) => n !== 0 && n !== 8);
  const mineBefore = mine ? left(m.balls, mine) + potNow.filter((n) => groupOf(n) === mine).length : 7;
  let foul = scratch || log.firstHit === null;
  if (!foul && mine && log.firstHit !== null) {
    const hit = groupOf(log.firstHit);
    foul = mineBefore > 0 ? hit !== mine : hit !== 'eight';
  }
  if (eight) {
    const legal = !!mine && mineBefore === 0 && !scratch && !foul;
    m.winner = legal ? me : them;
    m.note = legal ? (me === 'you' ? '🎱 You sink the 8! You win!' : '🎱 Opponent sink the 8. Dem win.') : me === 'you' ? '😭 You pot the 8 too early. You lose!' : '😅 Opponent pot the 8 too early. You win!';
    return m;
  }
  // Open table: first legal pot decides the groups
  if (!mine && !foul) {
    const first = potNow[0];
    if (first !== undefined) {
      const g = groupOf(first) as Group;
      m.groups[me] = g;
      m.groups[them] = g === 'solids' ? 'stripes' : 'solids';
    }
  }
  const myGroup = m.groups[me];
  const pottedMine = potNow.some((n) => !myGroup || groupOf(n) === myGroup);
  if (scratch) {
    cue.potted = false;
    cue.x = HEAD_SPOT[0];
    cue.y = HEAD_SPOT[1];
    // Move the white ball if something dey on the spot
    while (m.balls.some((b) => b.n !== 0 && !b.potted && Math.hypot(b.x - cue.x, b.y - cue.y) < 2.2 * R)) cue.y += 2.5 * R;
  }
  if (foul) {
    m.turn = them;
    m.note = scratch ? (me === 'you' ? '❌ Scratch! White ball enter pocket.' : '✅ Opponent scratch! Your turn.') : me === 'you' ? '❌ Foul: you no hit your own ball first.' : '✅ Opponent foul. Your turn.';
  } else if (pottedMine) {
    m.note = me === 'you' ? `👌 Nice one! Shoot again${m.groups.you ? ` (you get ${m.groups.you})` : ''}.` : 'Opponent pot one, dem dey shoot again…';
  } else {
    m.turn = them;
    m.note = me === 'you' ? 'Opponent turn…' : 'Your turn!';
  }
  return m;
}

// ---------------- Computer opponent ----------------
const clone = (balls: Ball[]) => balls.map((b) => ({ ...b }));

/** Distance from point p to segment a–b. */
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function clear(balls: Ball[], ax: number, ay: number, bx: number, by: number, skip: number[]) {
  return balls.every((b) => b.potted || skip.includes(b.n) || segDist(b.x, b.y, ax, ay, bx, by) > 2 * R);
}

/** Balls the side to play may aim at. */
export function targets(m: Match, side: Side): Ball[] {
  const g = m.groups[side];
  const live = m.balls.filter((b) => !b.potted && b.n !== 0);
  if (!g) return live.filter((b) => b.n !== 8);
  const own = live.filter((b) => groupOf(b.n) === g);
  return own.length ? own : live.filter((b) => b.n === 8);
}

/**
 * The computer picks a shot: for every ball and pocket, aim at the "ghost ball"
 * spot, keep shots with a clear path and a gentle cut, and choose the easiest.
 * `skill` 0..1: how steady its hand is.
 */
export function cpuShot(m: Match, skill: number, rand: () => number): { angle: number; power: number } {
  const cue = m.balls[0];
  let best: { angle: number; power: number; score: number } | null = null;
  for (const t of targets(m, 'cpu')) {
    for (const [px, py] of POCKETS) {
      const dx = px - t.x;
      const dy = py - t.y;
      const dp = Math.hypot(dx, dy);
      const gx = t.x - (dx / dp) * 2 * R;
      const gy = t.y - (dy / dp) * 2 * R;
      const ax = gx - cue.x;
      const ay = gy - cue.y;
      const da = Math.hypot(ax, ay);
      const cut = (ax * dx + ay * dy) / (da * dp);
      if (cut < 0.3) continue;
      if (!clear(m.balls, cue.x, cue.y, gx, gy, [0, t.n]) || !clear(m.balls, t.x, t.y, px, py, [t.n])) continue;
      const score = cut / (0.4 + da + dp);
      if (!best || score > best.score) best = { angle: Math.atan2(ay, ax), power: Math.min(1, 0.35 + (da + dp) * 0.32), score };
    }
  }
  if (!best) {
    // No clean pot: just hit the nearest ball of its own firmly
    const t = targets(m, 'cpu').sort((a, b) => Math.hypot(a.x - cue.x, a.y - cue.y) - Math.hypot(b.x - cue.x, b.y - cue.y))[0];
    best = { angle: t ? Math.atan2(t.y - cue.y, t.x - cue.x) : rand() * Math.PI * 2, power: 0.6, score: 0 };
  }
  const wobble = (1 - skill) * 0.09;
  return { angle: best.angle + (rand() - 0.5) * 2 * wobble, power: best.power };
}

/** Where the white ball go first touch another ball (for the aim guide). */
export function aimGuide(balls: Ball[], angle: number): { x: number; y: number; hit: Ball | null } {
  const cue = balls[0];
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let tBest = Infinity;
  let hit: Ball | null = null;
  for (const b of balls) {
    if (b.potted || b.n === 0) continue;
    // Solve |cue + t*d - b| = 2R
    const fx = cue.x - b.x;
    const fy = cue.y - b.y;
    const bq = fx * dx + fy * dy;
    const c = fx * fx + fy * fy - 4 * R * R;
    const disc = bq * bq - c;
    if (disc < 0) continue;
    const t = -bq - Math.sqrt(disc);
    if (t > 0 && t < tBest) {
      tBest = t;
      hit = b;
    }
  }
  // Or the cushion
  const tx = dx > 0 ? (W - R - cue.x) / dx : dx < 0 ? (R - cue.x) / dx : Infinity;
  const ty = dy > 0 ? (L - R - cue.y) / dy : dy < 0 ? (R - cue.y) / dy : Infinity;
  const tWall = Math.min(tx, ty);
  if (tWall < tBest) return { x: cue.x + dx * tWall, y: cue.y + dy * tWall, hit: null };
  return { x: cue.x + dx * tBest, y: cue.y + dy * tBest, hit };
}

export { clone as cloneBalls };
