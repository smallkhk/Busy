import { beforeEach, describe, expect, it } from 'vitest';
import { AREAS, propertyValue } from './housing';
import { useGame } from '../store/game';

const day = (d: number) => d * 24 * 60 + 10 * 60;

describe('owning property', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.setState({ started: true, money: 200_000_000, time: day(2) });
  });

  it('Kuje: buy land, build, wait, move in, no rent again', () => {
    const g = useGame.getState;
    g().buyProperty('kuje');
    expect(g().properties.kuje?.status).toBe('land');
    g().moveTo('kuje');
    expect(g().area).toBe('kubwa'); // house never ready
    g().buildHouse('kuje');
    expect(g().properties.kuje?.status).toBe('building');
    useGame.setState({ properties: { kuje: { ...g().properties.kuje!, status: 'built' } } });
    g().moveTo('kuje');
    expect(g().area).toBe('kuje');
    expect(g().rentDueDay).toBeGreaterThan(10000);
    expect(AREAS.kuje.rent).toBe(0);
  });

  it('cannot rent out or sell the house you live in', () => {
    const g = useGame.getState;
    g().buyProperty('guzape');
    g().moveTo('guzape');
    g().toggleRentOut('guzape');
    expect(g().properties.guzape?.rentedOut).toBeFalsy();
    g().sellProperty('guzape');
    expect(g().properties.guzape).toBeDefined();
  });

  it('property value grows, capped at +60%', () => {
    const p = { status: 'built' as const, boughtDay: 0, spent: 1000000 };
    expect(propertyValue(p, 0)).toBe(1000000);
    expect(propertyValue(p, 50)).toBe(1200000);
    expect(propertyValue(p, 1000)).toBe(1600000);
  });
});
