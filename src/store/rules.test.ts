import { litresFor } from '../content/cars';
import { describe, expect, it } from 'vitest';
import { activityById, INTERACTABLES } from '../content/activities';
import { CONTACTS, longLeg } from '../content/contacts';
import { EVENTS } from '../content/events';
import { rollSickness } from '../content/health';
import { BUSINESSES, dailyProfit, upgradeCost } from '../content/business';
import { payFor, promotionBlock } from '../content/career';
import { ACHIEVEMENTS, TUTORIAL } from '../content/goals';
import { followersGain, packagingGap, POSTS, realWealth } from '../content/gram';
import { moveCost, rentOwed } from '../content/housing';
import { CHOP_ITEMS, RIDE_PLACES, ridesFrom } from '../content/phoneapps';
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
    for (const p of RIDE_PLACES) {
      const rides = ridesFrom(p);
      expect(rides.length).toBe(RIDE_PLACES.length - 1);
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

describe('trekking', () => {
  it('trekking is free but slow and tiring', () => {
    const trek = act('trek-street-wuse');
    expect(trek.cost ?? 0).toBe(0);
    expect(durationAt(trek, 8 * 60)).toBe(durationAt(trek, 12 * 60)); // no rush-hour penalty on foot
    expect(durationAt(trek, 12 * 60)).toBeGreaterThan(durationAt(act('to-wuse'), 12 * 60));
    expect(trek.gains.energy!).toBeLessThan(-30);
  });

  it('living closer to town shortens the trek', () => {
    expect(durationAt(act('trek-street-wuse'), 12 * 60, 'wuse2')).toBeLessThan(durationAt(act('trek-street-wuse'), 12 * 60, 'kubwa'));
  });
});

describe('goals', () => {
  const gs = { stats: {}, day: 1, money: 0, savings: 0, cv: 0, followers: 0, area: 'kubwa' as const, contacts: {}, eventHistory: {} };
  it('tutorial steps check stats', () => {
    expect(TUTORIAL[0].done(gs)).toBe(false);
    expect(TUTORIAL[0].done({ ...gs, stats: { meals: 1 } })).toBe(true);
  });
  it('achievements check life progress', () => {
    const week = ACHIEVEMENTS.find((g) => g.id === 'a-week')!;
    expect(week.done({ ...gs, day: 7 })).toBe(false);
    expect(week.done({ ...gs, day: 8 })).toBe(true);
    expect(ACHIEVEMENTS.find((g) => g.id === 'a-survivor')!.done({ ...gs, eventHistory: { 'accident-major': 10 } })).toBe(true);
  });
  it('goal ids are unique', () => {
    const ids = [...TUTORIAL, ...ACHIEVEMENTS].map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('career & business', () => {
  it('office shift pays by grade', () => {
    expect(payFor(act('contract'), 0)).toBe(18000);
    expect(payFor(act('contract'), 4)).toBe(120000);
    expect(payFor(act('pos'), 4)).toBe(9000);
  });

  it('promotion needs shifts, long leg and packaging', () => {
    expect(promotionBlock(0, 3, 50, 50)).toMatch(/more office shift/);
    expect(promotionBlock(0, 8, 10, 50)).toMatch(/Long Leg/);
    expect(promotionBlock(0, 8, 20, 5)).toMatch(/Packaging/);
    expect(promotionBlock(0, 8, 20, 15)).toBeNull();
    expect(promotionBlock(4, 99, 99, 99)).toMatch(/top/);
  });

  it('business profit grows with level', () => {
    const pos = BUSINESSES.find((b) => b.id === 'pos')!;
    expect(dailyProfit(pos, 1, 0)).toBe(3000);
    expect(dailyProfit(pos, 3, 1)).toBeGreaterThan(dailyProfit(pos, 1, 1));
    expect(upgradeCost(pos, 2)).toBe(300000);
  });
});

describe('cars', () => {
  it('driving needs a car and only costs fuel', () => {
    expect(blockReason(act('drive-street-wuse'), base)).toMatch(/car/);
    expect(blockReason(act('drive-street-wuse'), { ...base, hasCar: true })).toBeNull();
    expect(blockReason(act('drive-street-wuse'), { ...base, car: { id: 'corolla', condition: 90 } })).toBeNull();
    expect(act('drive-street-wuse').cost ?? 0).toBe(0);
    expect(act('drive-street-wuse').minutes).toBe(act('hail-street-wuse').minutes);
  });

  it('driving burns fuel from the tank, bigger cars burn more', () => {
    const drive = act('drive-street-airport');
    expect(litresFor(drive, 'benz')).toBeGreaterThan(litresFor(drive, 'corolla'));
    expect(blockReason(drive, { ...base, car: { id: 'benz', fuel: 1 } })).toMatch(/Fuel no reach/);
    expect(blockReason(drive, { ...base, car: { id: 'benz', fuel: 40 } })).toBeNull();
    expect(blockReason(act('hailing'), { ...base, time: 10 * 60, car: { id: 'corolla', fuel: 2 } })).toMatch(/Fuel/);
  });

  it('ride-app job needs a car', () => {
    expect(blockReason(act('hailing'), base)).toMatch(/car/);
  });
});

describe('health', () => {
  const healthy = { food: 80, energy: 80, fun: 80, social: 80, hygiene: 80, bladder: 80 };
  it('a net cuts malaria risk', () => {
    expect(rollSickness(healthy, false, () => 0.05)).toBe('malaria');
    expect(rollSickness(healthy, true, () => 0.05)).toBeNull();
  });
  it('dirty and hungry people catch typhoid or food poisoning', () => {
    expect(rollSickness({ ...healthy, hygiene: 10 }, true, () => 0.1)).toBe('typhoid');
    expect(rollSickness({ ...healthy, food: 10 }, true, () => 0.1)).toBe('food');
  });
  it('sick people no fit work', () => {
    expect(blockReason(act('pos'), { ...base, time: 10 * 60, sick: 'malaria' })).toMatch(/sick/);
    expect(blockReason(act('malaria-drugs'), { ...base, time: 10 * 60, sick: 'malaria' })).toBeNull();
  });
});
