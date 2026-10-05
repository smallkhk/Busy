import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activityById } from './activities';
import { sickDodge, workEnergyFactor } from './learning';
import { blockReason, useGame } from '../store/game';

const day = (d: number, h = 10) => (d - 1) * 1440 + h * 60;

describe('school and gym', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.setState({ started: true, money: 1000000, time: day(3), nextEventCheck: Infinity });
    // No surprise storm, sickness or event to cancel class halfway
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
  });
  afterEach(() => vi.restoreAllMocks());

  it('enroll, attend every class, graduate, unlock the job', () => {
    const g = useGame.getState;
    const job = activityById('mechanic-job')!;
    expect(blockReason(job, g())).toMatch(/Mechanic training/);
    expect(blockReason(activityById('class-mechanic')!, g())).toMatch(/Enroll/);
    g().enroll('mechanic');
    expect(g().money).toBe(960000);
    for (let i = 0; i < 5; i++) {
      useGame.setState({ active: { id: 'class-mechanic', remaining: 0.5, total: 180, gen: false } });
      for (let k = 0; k < 20 && g().active; k++) g().tick(0.5);
    }
    expect(g().skills).toContain('mechanic');
    expect(blockReason(job, { ...g(), active: null })).toBeNull();
  });

  it('gym needs a membership; fitness helps at work and against sickness', () => {
    const g = useGame.getState;
    expect(blockReason(activityById('gym-workout')!, g())).toMatch(/gym/);
    g().joinGym();
    expect(blockReason(activityById('gym-workout')!, g())).toBeNull();
    expect(workEnergyFactor(100)).toBeCloseTo(0.7);
    expect(workEnergyFactor(0)).toBe(1);
    expect(sickDodge(100)).toBeCloseTo(0.6);
  });
});
