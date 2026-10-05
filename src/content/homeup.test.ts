import { beforeEach, describe, expect, it } from 'vitest';
import { activityById } from './activities';
import { genCostFor } from './homeup';
import { blockReason, costAt, useGame } from '../store/game';

describe('house upgrades', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.setState({ started: true, money: 5000000, time: 2 * 24 * 60 + 20 * 60 });
  });

  it('big items need a bigger house', () => {
    useGame.getState().buyHomeItem('ps5');
    expect(useGame.getState().homeUps).not.toContain('ps5');
    useGame.setState({ area: 'wuse2' });
    useGame.getState().buyHomeItem('ps5');
    expect(useGame.getState().homeUps).toContain('ps5');
  });

  it('PS5 activity needs the PS5', () => {
    const ps5 = activityById('ps5')!;
    expect(blockReason(ps5, { ...useGame.getState(), homeUps: [] })).toMatch(/PS5/);
    expect(blockReason(ps5, { ...useGame.getState(), power: true, homeUps: ['ps5'] })).toBeNull();
  });

  it('gen and WiFi make life cheaper', () => {
    expect(genCostFor([])).toBe(1000);
    expect(genCostFor(['generator'])).toBe(500);
    expect(genCostFor(['generator', 'inverter'])).toBe(0);
    const skits = activityById('skits')!;
    expect(costAt(skits, { time: 0 })).toBeGreaterThan(0);
    expect(costAt(skits, { time: 0, homeUps: ['wifi'] })).toBe(0);
  });

  it('fridge adds a meal to every foodstuff run', () => {
    useGame.setState({ homeUps: ['fridge'], pantry: 0, place: 'wuse', time: 2 * 24 * 60 + 10 * 60 });
    useGame.setState({ active: { id: 'foodstuff-small', remaining: 0.5, total: 15, gen: false } });
    for (let i = 0; i < 20 && useGame.getState().active; i++) useGame.getState().tick(0.5);
    expect(useGame.getState().pantry).toBe(3);
  });
});
