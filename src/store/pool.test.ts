import { beforeEach, describe, expect, it } from 'vitest';
import { activityById } from '../content/activities';
import { useGame } from './game';

const play = (score: number | null) => {
  const a = activityById('pool-lounge')!;
  useGame.setState({ place: 'lounge', pos: a.spot!, target: null, route: [], active: null, time: 2 * 1440 + 20 * 60 });
  useGame.getState().choose('pool-lounge');
  for (let i = 0; i < 5 && useGame.getState().target; i++) useGame.getState().arrive(useGame.getState().target!);
  expect(useGame.getState().minigame?.kind).toBe('pool');
  useGame.getState().playMinigame(score);
  const act = useGame.getState().active;
  if (!act) return;
  useGame.setState({ active: { ...act, remaining: 0.01, eventAt: undefined } });
  useGame.getState().tick(0.1);
};

describe('pool for money', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.getState().start('Musa', '#222');
    useGame.setState({ money: 50000, nextEventCheck: Infinity, time: 2 * 1440 + 20 * 60 });
  });

  it('win and you take the pot (twice your stake)', () => {
    play(1);
    expect(useGame.getState().money).toBe(50000 - 2000 + 4000);
  });

  it('lose and your stake is gone', () => {
    play(0);
    expect(useGame.getState().money).toBe(48000);
  });

  it('leave the table and nobody collects your money', () => {
    play(null);
    expect(useGame.getState().money).toBe(50000);
    expect(useGame.getState().active).toBeNull();
  });
});
