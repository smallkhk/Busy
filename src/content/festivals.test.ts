import { describe, expect, it } from 'vitest';
import { festivalOn, nextFestival, YEAR_DAYS } from './festivals';
import { combinedMods } from './world';
import { EVENTS } from './events';

describe('festivals', () => {
  it('fall on the same day every year', () => {
    expect(festivalOn(15)?.id).toBe('sallah');
    expect(festivalOn(15 + YEAR_DAYS)?.id).toBe('sallah');
    expect(festivalOn(45)?.id).toBe('christmas');
    expect(festivalOn(30)?.id).toBe('monthend');
    expect(festivalOn(3)).toBeUndefined();
  });

  it('Christmas makes food and transport costlier', () => {
    const m = combinedMods([], 45);
    expect(m.food).toBeGreaterThan(1);
    expect(m.fares).toBeGreaterThan(1);
    expect(combinedMods([], 44).food).toBeUndefined();
  });

  it('counts down to the next festival', () => {
    expect(nextFestival(10)).toMatchObject({ festival: { id: 'sallah' }, inDays: 5 });
  });

  it('each festival has an event that only fires that day', () => {
    for (const id of ['sallah-ram', 'christmas-family', 'crossover']) {
      const e = EVENTS.find((x) => x.id === id)!;
      expect(e.when!({ place: 'street', hour: 20, day: 3, money: 100000, power: true })).toBe(false);
    }
  });
});
