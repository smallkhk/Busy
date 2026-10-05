import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dateInterest, matchChance, stageOf } from './dating';
import { useGame } from '../store/game';

describe('Abuja Love rules', () => {
  it('packaging gets you the match', () => {
    expect(matchChance(60, 55)).toBeGreaterThan(matchChance(10, 55));
    expect(matchChance(0, 100)).toBeGreaterThan(0);
  });

  it('cheap dates please simple people, not big boy babes', () => {
    expect(dateInterest('simple', 'cheap')).toBeGreaterThan(0);
    expect(dateInterest('bigboy', 'cheap')).toBeLessThan(0);
    expect(dateInterest('bigboy', 'fakelife')).toBeGreaterThan(dateInterest('bigboy', 'normal'));
  });

  it('stages follow interest and what you ask', () => {
    expect(stageOf({ interest: 10 })).toBe('match');
    expect(stageOf({ interest: 40 })).toBe('talking');
    expect(stageOf({ interest: 70 })).toBe('dating');
    expect(stageOf({ interest: 70, official: true })).toBe('relationship');
    expect(stageOf({ interest: 90, official: true, engaged: true, married: true })).toBe('married');
  });
});

describe('Abuja Love in the game', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.setState({ started: true, money: 500000, packaging: 60, time: 10 * 24 * 60 + 12 * 60 });
  });

  it('match, date, ask out, then one partner only', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const g = useGame.getState;
    g().swipe('amina', true);
    g().swipe('tobi', true);
    expect(Object.keys(g().loves)).toEqual(['amina', 'tobi']);
    useGame.setState({ loves: { ...g().loves, amina: { interest: 70 } } });
    g().dateLove('amina', 'cheap');
    expect(g().loves.amina.interest).toBe(88);
    expect(g().money).toBe(496000);
    g().askOut('amina');
    expect(g().loves.amina.official).toBe(true);
    useGame.setState({ loves: { ...g().loves, tobi: { interest: 90 } } });
    g().askOut('tobi');
    expect(g().loves.tobi.official).toBeFalsy();
    vi.restoreAllMocks();
  });

  it('cannot propose before a week of being official', () => {
    const g = useGame.getState;
    useGame.setState({ loves: { amina: { interest: 95, official: true, sinceDay: 9 } } });
    g().propose('amina');
    expect(g().loves.amina.engaged).toBeFalsy();
    useGame.setState({ loves: { amina: { interest: 95, official: true, sinceDay: 1 } } });
    g().propose('amina');
    expect(g().loves.amina.engaged).toBe(true);
  });

  it('gifts raise love, but not every day', () => {
    const g = useGame.getState;
    useGame.setState({ loves: { amina: { interest: 40 } } });
    g().giftLove('amina');
    expect(g().loves.amina.interest).toBe(48);
    g().giftLove('amina');
    expect(g().loves.amina.interest).toBe(48);
  });
});
