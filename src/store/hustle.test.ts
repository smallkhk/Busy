import { beforeEach, describe, expect, it } from 'vitest';
import { CELL_X, CELL_Z, HOME_CELLS } from '../content/worldmap';
import { CHECKPOINT_BRIBE, hustleById, newMission, tripPay } from '../content/missions';
import { live, useGame } from './game';

/** Put yourself (in world coordinates) right on a stop, then let the game tick. */
function standAt([x, z]: [number, number]) {
  const [c, r] = HOME_CELLS.kubwa;
  live.pos = null;
  useGame.setState({ pos: [x - c * CELL_X, z - r * CELL_Z] });
  useGame.getState().tick(0.1);
}

describe('hustle missions', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.getState().start('Ada', '#222');
    live.pos = null;
    useGame.setState({ area: 'kubwa', place: 'street', pos: [0, 7], money: 5000, nextEventCheck: Infinity, active: null });
  });

  it('starting an okada shift pays the bike rent and gives you a job', () => {
    useGame.getState().startShift('okada');
    const s = useGame.getState();
    expect(s.money).toBe(5000 - hustleById('okada')!.rent);
    expect(s.shift?.kind).toBe('okada');
    expect(s.driving).toBe(true);
    expect(s.mission?.stage).toBe('pickup');
    expect(s.mission!.fare).toBeGreaterThan(0);
  });

  it('keke is locked until rider level 3', () => {
    useGame.getState().startShift('keke');
    expect(useGame.getState().shift).toBeNull();
    useGame.setState({ hustle: { xp: 100, trips: 10, earned: 0 } });
    useGame.getState().startShift('keke');
    expect(useGame.getState().shift?.kind).toBe('keke');
  });

  it('you cannot start a shift inside a building', () => {
    useGame.setState({ place: 'home' });
    useGame.getState().startShift('okada');
    expect(useGame.getState().shift).toBeNull();
  });

  it('pickup then drop-off pays the fare, XP and the next job', () => {
    useGame.getState().startShift('chopnow');
    const m = useGame.getState().mission!;
    expect(m.food).toBeTruthy();
    standAt(m.pickup.at);
    const m2 = useGame.getState().mission!;
    expect(m2.stage).toBe('dropoff');
    expect(m2.deadline).toBeGreaterThan(0);
    const money = useGame.getState().money;
    standAt(m.dropoff.at);
    const s = useGame.getState();
    expect(s.money).toBeGreaterThanOrEqual(money + m.fare);
    expect(s.hustle.trips).toBe(1);
    expect(s.hustle.xp).toBe(10);
    expect(s.mission?.stage).toBe('pickup');
  });

  it('late trips pay less and never below 40%', () => {
    const m = newMission('okada', 'kubwa', [0, 7], 1, () => 0.5);
    expect(tripPay(m, 5, () => 0.9).pay).toBe(m.fare);
    const late = tripPay(m, -m.time * 0.2, () => 0);
    expect(late.pay).toBeLessThan(m.fare);
    expect(tripPay(m, -m.time * 5, () => 0).pay).toBeGreaterThanOrEqual(Math.floor(m.fare * 0.4 / 50) * 50);
  });

  it('police checkpoint: settle costs money, papers cost time', () => {
    useGame.getState().startShift('okada');
    useGame.setState({ checkpoint: true });
    const money = useGame.getState().money;
    useGame.getState().answerCheckpoint(true);
    expect(useGame.getState().money).toBe(money - CHECKPOINT_BRIBE);
    expect(useGame.getState().checkpoint).toBe(false);
    const m = useGame.getState().mission!;
    useGame.setState({ checkpoint: true, mission: { ...m, stage: 'dropoff', deadline: 100000 } });
    useGame.getState().answerCheckpoint(false);
    expect(useGame.getState().mission!.deadline).toBe(85000);
  });

  it('ending a hired-bike shift gets you off the bike', () => {
    useGame.getState().startShift('okada');
    useGame.getState().endShift();
    const s = useGame.getState();
    expect(s.shift).toBeNull();
    expect(s.mission).toBeNull();
    expect(s.driving).toBe(false);
  });
});
