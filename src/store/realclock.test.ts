import { afterEach, describe, expect, it } from 'vitest';
import { activityRealSeconds, clockParts, watMidnight } from '../engine/clock';
import { setClockSource, useGame } from './game';

// 2026-03-10 09:30 in Abuja (08:30 UTC)
const T0 = Date.UTC(2026, 2, 10, 8, 30);

function at(ms: number) {
  let now = ms;
  setClockSource(() => now);
  return (addMs: number) => (now += addMs);
}

describe('real Abuja time', () => {
  afterEach(() => setClockSource(() => Date.now()));

  it('a new life starts on the real clock', () => {
    at(T0);
    useGame.getState().start('Ada', '#222');
    const { day, hour, minute } = clockParts(useGame.getState().time);
    expect([day, hour, minute]).toEqual([1, 9, 30]);
    expect(useGame.getState().epoch).toBe(watMidnight(T0));
  });

  it('time passes one real minute per minute, and the day changes at real midnight', () => {
    const advance = at(T0);
    useGame.getState().start('Ada', '#222');
    useGame.setState({ nextEventCheck: Infinity });
    advance(60_000);
    useGame.getState().tick(0.016);
    expect(clockParts(useGame.getState().time).minute).toBe(31);
    advance(15 * 60 * 60_000); // past midnight while the phone dey pocket
    useGame.getState().tick(0.016);
    const s = useGame.getState();
    expect(clockParts(s.time).day).toBe(2);
    // Away time drains needs, but never below 25
    for (const v of Object.values(s.needs)) expect(v).toBeGreaterThanOrEqual(25);
  });

  it('sleep takes real minutes and keeps going while you are away', () => {
    const advance = at(T0);
    useGame.getState().start('Ada', '#222');
    useGame.setState({ nextEventCheck: Infinity, needs: { ...useGame.getState().needs, energy: 10 } });
    useGame.setState({ active: { id: 'sleep', remaining: 480, total: 480, gen: false } });
    const wait = activityRealSeconds(480);
    expect(wait).toBeGreaterThan(10 * 60);
    advance(1000);
    useGame.getState().tick(1);
    expect(useGame.getState().active).not.toBeNull();
    advance(wait * 1000);
    useGame.getState().tick(0.016);
    expect(useGame.getState().active).toBeNull();
    expect(useGame.getState().needs.energy).toBeGreaterThan(80);
  });

  it('old saves keep their day number and move to the real clock', () => {
    at(T0);
    useGame.getState().reset();
    useGame.setState({ started: true, time: 4 * 1440 + 22 * 60, lastDay: 5 });
    useGame.getState().syncClock();
    const s = useGame.getState();
    const { day, hour } = clockParts(s.time);
    expect(day).toBe(5);
    expect(hour).toBe(9);
    expect(s.lastDay).toBe(5);
  });
});
