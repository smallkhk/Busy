import { describe, expect, it } from 'vitest';
import { BUSINESSES, dailyNet, MAX_STAFF, wageOf } from './business';

describe('businesses', () => {
  it('has small, medium and big businesses with unique ids', () => {
    const ids = BUSINESSES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of ['small', 'medium', 'big'] as const) expect(BUSINESSES.filter((b) => b.tier === t).length).toBeGreaterThanOrEqual(5);
  });

  it('staff cost wages but sell more, so net goes up small', () => {
    for (const b of BUSINESSES) {
      const none = dailyNet(b, { level: 1, staff: 0 }, 0.5, false);
      const full = dailyNet(b, { level: 1, staff: MAX_STAFF[b.tier] }, 0.5, false);
      expect(full, b.id).toBeGreaterThan(none);
      expect(wageOf(b)).toBeGreaterThan(0);
    }
  });

  it('a bad day is a loss', () => {
    const b = BUSINESSES[0];
    expect(dailyNet(b, { level: 1, staff: 1 }, 0.9, true)).toBeLessThan(0);
  });
});
