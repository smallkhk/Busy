import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { activityById, activityPlace } from '../content/activities';
import { FARES, MY_SEAT } from '../content/flights';
import { blockReason, setClockSource, useGame } from './game';

let now = 0;

const done = (id: string) => {
  const a = activityById(id)!;
  useGame.setState({ place: activityPlace(id), pos: a.spot ?? [0, 0], target: null, route: [], active: null });
  useGame.getState().choose(id);
  for (let i = 0; i < 5 && useGame.getState().target; i++) useGame.getState().arrive(useGame.getState().target!);
  const act = useGame.getState().active;
  expect(act?.id, `${id}: ${blockReason(a, useGame.getState())}`).toBe(id);
  useGame.setState({ active: { ...act!, remaining: 0.01 } });
  useGame.getState().tick(0.1);
};

describe('flying Abuja ⇄ Lagos', () => {
  beforeEach(() => {
    now = Date.UTC(2026, 9, 6, 9, 0, 0); // 10am in Abuja
    setClockSource(() => now);
    useGame.getState().reset();
    useGame.getState().start('Ada', '#222');
    useGame.setState({ money: 1_000_000, nextEventCheck: Infinity, minigame: null });
  });
  afterEach(() => setClockSource(() => Date.now()));

  it('check in at Abuja airport, sit in your seat, land in Lagos', () => {
    done('fly-los-eco');
    let s = useGame.getState();
    expect(s.money).toBe(1_000_000 - FARES.economy);
    expect(s.place).toBe('cabin');
    expect(s.flight?.to).toBe('LOS');
    expect(s.pos).toEqual([MY_SEAT.economy.x, MY_SEAT.economy.z]);
    expect(s.pose).toBe('sit');
    // Still in the air halfway
    now += s.flight!.dur / 2;
    useGame.getState().tick(0.1);
    expect(useGame.getState().place).toBe('cabin');
    now += s.flight!.dur;
    useGame.getState().tick(0.1);
    s = useGame.getState();
    expect(s.place).toBe('lagos');
    expect(s.flight).toBeNull();
  });

  it('business class seats you in front', () => {
    done('fly-los-biz');
    expect(useGame.getState().pos).toEqual([MY_SEAT.business.x, MY_SEAT.business.z]);
    expect(useGame.getState().flight?.cls).toBe('business');
  });

  it('in Lagos you cannot take Abuja buses or go to Abuja jobs, but you can fly back', () => {
    useGame.setState({ place: 'lagos' });
    expect(blockReason(activityById('air-home')!, useGame.getState())).toMatch(/Lagos/);
    expect(blockReason(activityById('pos')!, useGame.getState())).toMatch(/Lagos/);
    expect(blockReason(activityById('mama')!, useGame.getState())).toBeNull();
    done('fly-abv-eco');
    expect(useGame.getState().flight?.to).toBe('ABV');
    now += useGame.getState().flight!.dur + 1000;
    useGame.getState().tick(0.1);
    expect(useGame.getState().place).toBe('airport');
  });

  it('you no fit comot plane mid-air, and the plane waits for your jollof before landing', () => {
    done('fly-los-eco');
    expect(blockReason(activityById('fly-los-eco')!, useGame.getState())).toMatch(/plane/);
    useGame.getState().choose('fly-jollof');
    for (let i = 0; i < 5 && useGame.getState().target; i++) useGame.getState().arrive(useGame.getState().target!);
    expect(useGame.getState().active?.id).toBe('fly-jollof');
    now += useGame.getState().flight!.dur + 1000;
    useGame.getState().tick(0.01);
    expect(useGame.getState().place).toBe('cabin');
  });

  it('a save stuck in the cabin with no flight lands you at Abuja airport', () => {
    useGame.setState({ place: 'cabin', flight: null });
    useGame.getState().tick(0.1);
    expect(useGame.getState().place).toBe('airport');
  });
});
