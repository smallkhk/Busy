import { beforeEach, describe, expect, it } from 'vitest';
import { canRun, electionWon, NO_POLITICS } from './politics';
import { useGame } from '../store/game';

describe('politics', () => {
  it('climb one step at a time, with enough Long Leg, Packaging and money', () => {
    const ok = { longLeg: 80, packaging: 80, money: 1e9 };
    expect(canRun(0, NO_POLITICS, ok)).toBeNull();
    expect(canRun(2, NO_POLITICS, ok)).toMatch(/First win/);
    expect(canRun(0, NO_POLITICS, { ...ok, longLeg: 5 })).toMatch(/Long Leg/);
    expect(canRun(1, { office: 0 }, ok)).toBeNull();
  });

  it('elections: strong support wins, weak support loses', () => {
    expect(electionWon(75, 0)).toBe(true);
    expect(electionWon(30, 1)).toBe(false);
  });

  beforeEach(() => {
    useGame.getState().reset();
    useGame.setState({ started: true, money: 5000000, packaging: 40, time: 2 * 1440 + 10 * 60, contacts: { alhaji: { rel: 80 }, hon: { rel: 80 }, chinedu: { rel: 80 } } });
  });

  it('declare, then each campaign move once a day raises support', () => {
    const g = useGame.getState;
    g().declare(0);
    expect(g().politics.campaign?.target).toBe(0);
    const start = g().politics.campaign!.support;
    g().campaign('door');
    g().campaign('door');
    expect(g().politics.campaign!.support).toBe(start + 3);
    g().campaign('rice');
    expect(g().politics.votesBought).toBe(true);
    expect(g().heat).toBeGreaterThan(0);
  });
});
