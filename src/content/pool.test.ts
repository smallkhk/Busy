import { describe, expect, it } from 'vitest';
import { cpuShot, groupOf, judge, L, moving, newLog, newMatch, R, rack, shoot, simulate, W, type Ball, type Match } from './pool';

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const ball = (n: number, x: number, y: number): Ball => ({ n, x, y, vx: 0, vy: 0, potted: false });

describe('8-ball pool', () => {
  it('racks 15 balls plus the white, with the 8 in the middle and nothing overlapping', () => {
    const b = rack(rand);
    expect(b).toHaveLength(16);
    expect(new Set(b.map((x) => x.n)).size).toBe(16);
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) expect(Math.hypot(b[i].x - b[j].x, b[i].y - b[j].y)).toBeGreaterThanOrEqual(2 * R - 1e-9);
    expect(b.find((x) => x.n === 8)!.x).toBeCloseTo(W / 2);
  });

  it('a hard break spreads the balls, everything stays on the table and stops', () => {
    const b = rack(rand);
    shoot(b, -Math.PI / 2, 1);
    simulate(b);
    expect(moving(b)).toBe(false);
    for (const x of b) if (!x.potted) {
      expect(x.x).toBeGreaterThanOrEqual(R - 1e-6);
      expect(x.x).toBeLessThanOrEqual(W - R + 1e-6);
      expect(x.y).toBeGreaterThanOrEqual(R - 1e-6);
      expect(x.y).toBeLessThanOrEqual(L - R + 1e-6);
    }
    const moved = b.filter((x) => x.n !== 0 && Math.abs(x.y - 0.54) > 0.2).length;
    expect(moved).toBeGreaterThan(3);
  });

  it('a straight shot pots the ball, and the first legal pot gives you that group', () => {
    const balls = [ball(0, 0.5, 1.6), ball(3, 0.5, 0.6), ball(8, 0.2, 1.0), ball(12, 0.8, 1.2)];
    // Ball 3 lined up for the top-middle? no: aim it into the top-left corner
    balls[1].x = 0.25;
    balls[1].y = 0.25;
    balls[0].x = 0.6;
    balls[0].y = 0.6;
    const ang = Math.atan2(0.25 - 0.6, 0.25 - 0.6);
    shoot(balls, ang, 0.6);
    const log = simulate(balls);
    expect(log.firstHit).toBe(3);
    expect(log.potted).toContain(3);
    const m: Match = { balls, turn: 'you', groups: { you: null, cpu: null }, winner: null, note: '' };
    judge(m, log);
    expect(m.groups.you).toBe('solids');
    expect(m.groups.cpu).toBe('stripes');
    expect(m.turn).toBe('you');
  });

  it('scratch is a foul: the white comes back and the turn passes', () => {
    const m = newMatch(rand);
    const log = { ...newLog(), firstHit: 1, potted: [0] };
    m.balls[0].potted = true;
    judge(m, log);
    expect(m.turn).toBe('cpu');
    expect(m.balls[0].potted).toBe(false);
  });

  it('potting the 8 early loses; after clearing your group it wins', () => {
    const m = newMatch(rand);
    m.groups = { you: 'solids', cpu: 'stripes' };
    judge(m, { firstHit: 8, potted: [8], cushion: false });
    expect(m.winner).toBe('cpu');
    const m2 = newMatch(rand);
    m2.groups = { you: 'solids', cpu: 'stripes' };
    for (const b of m2.balls) if (groupOf(b.n) === 'solids') b.potted = true;
    judge(m2, { firstHit: 8, potted: [8], cushion: false });
    expect(m2.winner).toBe('you');
  });

  it('the computer finds an easy pot', () => {
    const balls = [ball(0, 0.6, 0.6), ball(11, 0.25, 0.25), ball(8, 0.8, 1.6), ball(2, 0.9, 1.9)];
    const m: Match = { balls, turn: 'cpu', groups: { you: 'solids', cpu: 'stripes' }, winner: null, note: '' };
    const s = cpuShot(m, 1, () => 0.5);
    shoot(balls, s.angle, s.power);
    const log = simulate(balls);
    expect(log.potted).toContain(11);
  });
});
