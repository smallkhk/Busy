import { describe, expect, it } from 'vitest';
import { activityById, INTERACTABLES } from '../content/activities';
import { CONTACTS, longLeg } from '../content/contacts';
import { EVENTS } from '../content/events';
import { followersGain, packagingGap, POSTS, realWealth } from '../content/gram';
import { moveCost, rentOwed } from '../content/housing';
import { CHOP_ITEMS, ridesFrom } from '../content/phoneapps';
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

describe('long leg', () => {
  it('scores contacts by relationship and influence', () => {
    expect(longLeg({})).toBe(0);
    const all = Object.fromEntries(CONTACTS.map((c) => [c.id, { rel: 100 }]));
    expect(longLeg(all)).toBe(100);
    expect(longLeg({ alhaji: { rel: 100 } })).toBeGreaterThan(longLeg({ garba: { rel: 100 } }));
  });

  it('a referral waives the packaging requirement', () => {
    expect(blockReason(act('phoneshop'), { ...base, time: 10 * 60, unlocks: ['phoneshop'] })).toBeNull();
  });

  it('every contact can be met somewhere', () => {
    const meets = new Set([
      ...INTERACTABLES.flatMap((i) => i.activities).map((a) => a.effects?.meet),
      ...EVENTS.flatMap((e) => e.choices.flatMap((c) => c.outcomes.map((o) => o.effect?.meet))),
    ]);
    for (const c of CONTACTS) expect(meets.has(c.id), c.id).toBe(true);
  });
});

describe('abujagram', () => {
  it('real wealth comes from money and address', () => {
    expect(realWealth(0, 'kubwa')).toBe(0);
    expect(realWealth(1_000_000, 'kubwa')).toBe(50);
    expect(realWealth(-50000, 'wuse2')).toBe(25);
    expect(packagingGap(60, 200_000, 'kubwa')).toBe(50);
  });

  it('more packaging brings more followers', () => {
    const benz = POSTS.find((p) => p.id === 'benz')!;
    expect(followersGain(benz, 80, 0.5)).toBeGreaterThan(followersGain(benz, 10, 0.5));
  });

  it('exposure only hits people forming pass their pocket', () => {
    const ctx = { place: 'home' as const, hour: 12, day: 3, money: 0, power: true, followers: 100 };
    const exposed = EVENTS.find((e) => e.id === 'exposed')!;
    expect(exposed.when!({ ...ctx, gap: 40 })).toBe(true);
    expect(exposed.when!({ ...ctx, gap: 10 })).toBe(false);
  });
});

describe('phone apps', () => {
  it('every ride goes somewhere else and costs more than the bus', () => {
    for (const p of ['street', 'wuse', 'jabi', 'secretariat', 'lounge'] as const) {
      const rides = ridesFrom(p);
      expect(rides.length).toBe(4);
      expect(rides.every((r) => r.travelTo !== p)).toBe(true);
    }
    expect(act('hail-street-wuse').cost!).toBeGreaterThan(act('to-wuse').cost!);
    expect(durationAt(act('hail-street-wuse'), 12 * 60)).toBeLessThan(durationAt(act('to-wuse'), 12 * 60));
    expect(ridesFrom('home')).toEqual(ridesFrom('street'));
  });

  it('food delivery items are registered activities', () => {
    for (const c of CHOP_ITEMS) expect(act(c.id)).toBeDefined();
  });
});
