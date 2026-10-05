import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from './game';

const at = (day: number, h: number) => (day - 1) * 1440 + h * 60;

describe('day rollover', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.setState({ started: true, money: 100000, time: at(3, 23.9), lastDay: 3, businesses: { pos: { level: 1 } }, nextEventCheck: 1e9, nextWeatherChange: 1e9, nextPowerChange: 1e9 });
  });

  it('runs even when an action jumps the clock past midnight', () => {
    // A late date pushes the clock to 2am next day, outside of tick
    useGame.setState({ time: at(4, 2) });
    useGame.getState().tick(0.01);
    expect(useGame.getState().lastDay).toBe(4);
    expect(useGame.getState().txns.some((t) => t.label.startsWith('Business'))).toBe(true);
  });

  it('runs once per day, not twice', () => {
    useGame.setState({ time: at(4, 2) });
    useGame.getState().tick(0.01);
    const n = useGame.getState().txns.filter((t) => t.label.startsWith('Business')).length;
    useGame.getState().tick(0.01);
    expect(useGame.getState().txns.filter((t) => t.label.startsWith('Business')).length).toBe(n);
  });
});
