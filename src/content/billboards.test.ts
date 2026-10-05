import { describe, expect, it } from 'vitest';
import { BOARD_SLOTS } from './billboards';
import { isLive } from '../net/billboards';

describe('billboards', () => {
  it('has roadside boards plus 4 LED screens, all with unique slots', () => {
    expect(BOARD_SLOTS.filter((b) => b.big)).toHaveLength(4);
    expect(BOARD_SLOTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(BOARD_SLOTS.map((b) => b.slot)).size).toBe(BOARD_SLOTS.length);
    for (const b of BOARD_SLOTS) expect(b.slot).toBeLessThanOrEqual(200);
  });

  it('boards near town cost more, LED most', () => {
    const road = BOARD_SLOTS.filter((b) => !b.big).map((b) => b.pricePerDay);
    expect(Math.max(...road)).toBeGreaterThan(Math.min(...road));
    for (const b of BOARD_SLOTS.filter((x) => x.big)) expect(b.pricePerDay).toBeGreaterThan(Math.max(...road));
  });

  it('an ad stops showing once it expires', () => {
    const ad = { slot: 1, owner: 'a', owner_name: 'A', body: 'Hi', emoji: '📢', color: '#000000', expires_at: new Date(1000).toISOString() };
    expect(isLive(ad, 500)).toBe(true);
    expect(isLive(ad, 2000)).toBe(false);
    expect(isLive(undefined)).toBe(false);
  });
});
