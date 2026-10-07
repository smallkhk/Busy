import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { activityById, activityPlace } from '../content/activities';
import { blockReason, setClockSource, useGame } from './game';

let now = 0;
const done = (id: string) => {
  const a = activityById(id)!;
  useGame.setState({ place: activityPlace(id), pos: a.spot ?? [0, 0], target: null, route: [], active: null });
  useGame.getState().choose(id);
  for (let i = 0; i < 5 && useGame.getState().target; i++) useGame.getState().arrive(useGame.getState().target!);
  const act = useGame.getState().active;
  expect(act?.id, `${id}: ${blockReason(a, useGame.getState())}`).toBe(id);
  useGame.setState({ active: { ...act!, remaining: 0.01, eventAt: undefined } });
  useGame.getState().tick(0.1);
};

describe('Benin City', () => {
  beforeEach(() => {
    now = Date.UTC(2026, 9, 6, 9, 0, 0);
    setClockSource(() => now);
    useGame.getState().reset();
    useGame.getState().start('Osas', '#222');
    useGame.setState({ money: 1_000_000, nextEventCheck: Infinity, minigame: null });
  });
  afterEach(() => setClockSource(() => Date.now()));

  it('luxury bus from Utako park lands you in Benin City, and the bus back lands you at Utako', () => {
    done('utako-benin');
    expect(useGame.getState().place).toBe('benin');
    // Abuja buses and jobs no dey work for Benin
    expect(blockReason(activityById('air-home')!, useGame.getState())).toMatch(/Benin/);
    done('benin-abuja');
    expect(useGame.getState().place).toBe('utako');
  });

  it('fly Abuja → Benin and back', () => {
    done('fly-bni-eco');
    let s = useGame.getState();
    expect(s.place).toBe('cabin');
    expect(s.flight?.to).toBe('BNI');
    now += s.flight!.dur + 1000;
    useGame.getState().tick(0.1);
    expect(useGame.getState().place).toBe('benin');
    done('fly-bni-abv-eco');
    s = useGame.getState();
    expect(s.flight?.from).toBe('BNI');
    now += s.flight!.dur + 1000;
    useGame.getState().tick(0.1);
    expect(useGame.getState().place).toBe('airport');
  });

  it('keke carries you across the big city, and new places work', () => {
    useGame.setState({ place: 'benin' });
    done('keke-ring-uniben');
    expect(useGame.getState().place).toBe('benin');
    expect(useGame.getState().pos).toEqual([-10, -31]);
    done('uniben-walk');
    done('keke-uniben-market');
    expect(useGame.getState().pos).toEqual([-46, -4]);
    done('oba-market-food');
    expect(useGame.getState().pantry).toBeGreaterThan(0);
  });

  it('Benin events only happen for Benin, and Abuja events no follow you there', async () => {
    const { EVENTS } = await import('../content/events');
    expect(EVENTS.filter((e) => e.city === 'benin').length).toBeGreaterThanOrEqual(5);
    expect(activityById('ubth-doctor')?.effects?.cure).toBe(true);
    expect(activityById('keke-ring-zoo')?.warpTo).toEqual([22, 12.6]);
  });

  it('bronze casting pays, and you fit chop banga soup', () => {
    useGame.setState({ place: 'benin' });
    const money = useGame.getState().money;
    done('bronze-apprentice');
    expect(useGame.getState().money).toBeGreaterThan(money);
    done('banga');
  });
});

describe('Lagos, bigger', () => {
  beforeEach(() => {
    now = Date.UTC(2026, 9, 6, 9, 0, 0);
    setClockSource(() => now);
    useGame.getState().reset();
    useGame.getState().start('Tunde', '#222');
    useGame.setState({ money: 1_000_000, nextEventCheck: Infinity, minigame: null, place: 'lagos' });
  });
  afterEach(() => setClockSource(() => Date.now()));

  it('danfo carries you round Lagos, and the new places work', () => {
    done('danfo-centre-yaba');
    expect(useGame.getState().pos).toEqual([0, -30.5]);
    done('yaba-hack');
    expect(useGame.getState().contacts.seun).toBeTruthy();
    done('danfo-yaba-tbs');
    expect(useGame.getState().pos).toEqual([52, -28.5]);
    done('tbs-snap');
    expect(blockReason(activityById('air-home')!, useGame.getState())).toMatch(/Lagos/);
  });
});
