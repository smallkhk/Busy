import { describe, expect, it } from 'vitest';
import { EVENTS } from '../content/events';
import { effectChips, heatLevel, pickEvent, resolveChoice, visibleChoices, type EventContext } from './events';

const ctx: EventContext = { place: 'home', hour: 10, day: 1, money: 50000, power: true };

describe('police', () => {
  const stop = EVENTS.find((e) => e.id === 'police-stop')!;

  it('hides "call somebody" until you get Long Leg', () => {
    const labels = (c: EventContext) => visibleChoices(stop, c).map(({ c: ch }) => ch.label);
    expect(labels({ ...ctx, longLeg: 0 }).some((l) => l.startsWith('Call somebody'))).toBe(false);
    expect(labels({ ...ctx, longLeg: 40 }).some((l) => l.startsWith('Call somebody'))).toBe(true);
    // Original indices survive the filter, so answerEvent gets the right choice
    const vis = visibleChoices(stop, { ...ctx, longLeg: 0 });
    for (const { c, i } of vis) expect(stop.choices[i]).toBe(c);
  });

  it('wanted people get detained more often', () => {
    const refuse = stop.choices.find((c) => c.label.startsWith('Refuse'))!;
    const detained = (heat: number) => {
      let n = 0;
      for (let k = 0; k < 400; k++) if ((resolveChoice(refuse, Math.random, { ...ctx, heat }).effect?.heat ?? 0) > 5) n++;
      return n;
    };
    expect(detained(90)).toBeGreaterThan(detained(0));
  });

  it('raid only comes when you dey wanted', () => {
    for (let i = 0; i < 30; i++) expect(pickEvent(EVENTS, 'idle', { ...ctx, heat: 10 }, {}, 0)?.id).not.toBe('raid');
    expect(EVENTS.find((e) => e.id === 'raid')!.when!({ ...ctx, heat: 85 })).toBe(true);
  });

  it('names heat levels', () => {
    expect(heatLevel(0).name).toBe('Normal');
    expect(heatLevel(25).name).toBe('Suspicious');
    expect(heatLevel(60).name).toBe('Known');
    expect(heatLevel(95).name).toBe('Wanted');
  });
});

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
