import { describe, expect, it } from 'vitest';
import { EVENTS } from '../content/events';
import { effectChips, pickEvent, resolveChoice, type EventContext } from './events';

const ctx: EventContext = { place: 'home', hour: 10, day: 1, money: 50000, power: true };

describe('events', () => {
  it('only picks events whose conditions match', () => {
    for (let i = 0; i < 50; i++) {
      const e = pickEvent(EVENTS, 'idle', { ...ctx, place: 'secretariat' }, {}, 0);
      expect(e?.id).not.toBe('borehole-levy');
      expect(e?.trigger).toBe('idle');
    }
  });

  it('respects cooldowns', () => {
    const history = Object.fromEntries(EVENTS.map((e) => [e.id, 1000]));
    expect(pickEvent(EVENTS, 'commute', ctx, history, 1001)).toBeUndefined();
    expect(pickEvent(EVENTS, 'commute', ctx, history, 1000 + 400 * 60)).toBeDefined();
  });

  it('resolves weighted outcomes', () => {
    const choice = { label: 'x', outcomes: [{ weight: 1, text: 'a' }, { weight: 3, text: 'b' }] };
    expect(resolveChoice(choice, () => 0.1).text).toBe('a');
    expect(resolveChoice(choice, () => 0.9).text).toBe('b');
  });

  it('every event has a choice you can take with no money', () => {
    for (const e of EVENTS) expect(e.choices.some((c) => !c.cost), e.id).toBe(true);
  });

  it('event ids are unique', () => {
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
  });

  it('summarises effects', () => {
    expect(effectChips({ money: -2500, minutes: 30 }, 0)).toEqual(['-₦2,500', '30m lost ⏳']);
    expect(effectChips({ money: 5000 }, 1000)).toEqual(['+₦4,000']);
  });
});
