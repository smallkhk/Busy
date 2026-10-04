import { describe, expect, it } from 'vitest';
import { clockParts, daylight, formatClock, inHours } from './clock';
import { fullNeeds, mood, tickNeeds } from './needs';

describe('needs', () => {
  it('decays over time', () => {
    const n = tickNeeds(fullNeeds(), 60);
    expect(n.food).toBeCloseTo(80 - 4.5);
    expect(n.bladder).toBeCloseTo(70 - 6);
  });

  it('restores gained needs proportionally without decaying them', () => {
    const n = tickNeeds({ ...fullNeeds(), food: 10 }, 15, { gains: { food: 40 }, activityMinutes: 30 });
    expect(n.food).toBeCloseTo(30);
  });

  it('clamps between 0 and 100', () => {
    const n = tickNeeds({ ...fullNeeds(), bladder: 1 }, 600, { gains: { energy: 500 }, activityMinutes: 60 });
    expect(n.bladder).toBe(0);
    expect(n.energy).toBe(100);
  });

  it('slows decay while sleeping', () => {
    const awake = tickNeeds(fullNeeds(), 60);
    const asleep = tickNeeds(fullNeeds(), 60, { sleeping: true });
    expect(asleep.food).toBeGreaterThan(awake.food);
  });

  it('mood is dragged down by the worst need', () => {
    expect(mood({ ...fullNeeds(), food: 0 })).toBeLessThan(mood(fullNeeds()));
  });
});

describe('clock', () => {
  it('formats time and day', () => {
    expect(formatClock(7 * 60)).toBe('7:00 AM');
    expect(formatClock(13 * 60 + 5)).toBe('1:05 PM');
    expect(clockParts(24 * 60 + 30).day).toBe(2);
  });

  it('daylight is 0 at midnight and 1 at noon', () => {
    expect(daylight(0)).toBe(0);
    expect(daylight(12 * 60)).toBe(1);
  });

  it('checks open hours', () => {
    expect(inHours(9 * 60, [8, 15])).toBe(true);
    expect(inHours(16 * 60, [8, 15])).toBe(false);
  });
});
