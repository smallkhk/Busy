import { describe, expect, it } from 'vitest';
import { activityById, INTERACTABLES } from '../content/activities';
import { moveCost, rentOwed } from '../content/housing';
import { blockReason, durationAt, type BlockState } from './game';

const base: BlockState = { time: 12 * 60, money: 100000, power: true, active: null, packaging: 5, pantry: 0, cv: 0, area: 'kubwa', rentLocked: false };
const act = (id: string) => activityById(id)!;

describe('travel', () => {
  it('rush hour makes road trips longer, not other activities', () => {
    expect(durationAt(act('to-wuse'), 12 * 60)).toBe(60);
    expect(durationAt(act('to-wuse'), 8 * 60)).toBe(96);
    expect(durationAt(act('indomie'), 8 * 60)).toBe(30);
  });

  it('every place can be left by road', () => {
    for (const place of ['street', 'wuse', 'jabi', 'secretariat'] as const) {
      const rides = INTERACTABLES.filter((i) => i.place === place).flatMap((i) => i.activities).filter((a) => a.travelTo);
      expect(rides.length, place).toBeGreaterThan(0);
    }
  });

  it('activity ids are unique', () => {
    const ids = INTERACTABLES.flatMap((i) => i.activities.map((a) => a.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('requirements', () => {
  it('phone shop job needs packaging', () => {
    expect(blockReason(act('phoneshop'), { ...base, time: 10 * 60 })).toMatch(/Packaging/);
    expect(blockReason(act('phoneshop'), { ...base, time: 10 * 60, packaging: 30 })).toBeNull();
  });

  it('contract job opens after three CVs', () => {
    expect(blockReason(act('contract'), { ...base, time: 9 * 60, cv: 2 })).toMatch(/CV/);
    expect(blockReason(act('contract'), { ...base, time: 9 * 60, cv: 3 })).toBeNull();
  });

  it('home cooking needs foodstuff', () => {
    expect(blockReason(act('homefood'), base)).toMatch(/foodstuff/);
    expect(blockReason(act('homefood'), { ...base, pantry: 1 })).toBeNull();
  });
});

describe('housing', () => {
  it('living closer to town shortens trips to and from your area only', () => {
    expect(durationAt(act('to-wuse'), 12 * 60, 'gwarinpa')).toBe(39);
    expect(durationAt(act('wuse-kubwa'), 12 * 60, 'wuse2')).toBe(21);
    expect(durationAt(act('wuse-jabi'), 12 * 60, 'wuse2')).toBe(25);
  });

  it('a locked room blocks home activities but not leaving', () => {
    const locked = { ...base, rentLocked: true };
    expect(blockReason(act('indomie'), locked)).toMatch(/lock/);
    expect(blockReason(act('go-street'), locked)).toBeNull();
    expect(blockReason(act('rice'), { ...locked, time: 12 * 60 })).toBeNull();
  });

  it('late rent attracts a penalty; moving costs two cycles plus agent fee', () => {
    expect(rentOwed('kubwa', 31, 31)).toBe(70000);
    expect(rentOwed('kubwa', 33, 31)).toBe(77000);
    expect(moveCost('gwarinpa')).toBe(396000);
  });
});
