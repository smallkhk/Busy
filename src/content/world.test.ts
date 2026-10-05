import { describe, expect, it } from 'vitest';
import { activityById } from './activities';
import { combinedMods, nextWeather, priceOf, tripFactor, WEATHER, type Weather } from './world';
import { durationAt } from '../store/game';

const act = (id: string) => activityById(id)!;

describe('world news', () => {
  it('stories stop after their last day', () => {
    const news = [{ id: 'fuel-hike', until: 5 }];
    expect(combinedMods(news, 5).fuel).toBe(1.25);
    expect(combinedMods(news, 6).fuel).toBeUndefined();
  });

  it('fuel news moves driving cost, fare news moves bus fares, food news moves foodstuff', () => {
    const mods = combinedMods([{ id: 'fuel-hike', until: 9 }, { id: 'tomato-crash', until: 9 }], 1);
    const fill = act('nnpc-fill');
    expect(priceOf(fill, mods)).toBeGreaterThan(fill.cost!);
    expect(priceOf(act('to-wuse'), mods)).toBeGreaterThan(act('to-wuse').cost!);
    expect(priceOf(act('foodstuff-big'), mods)).toBeLessThan(act('foodstuff-big').cost!);
    expect(priceOf(act('zobo'), mods)).toBe(act('zobo').cost);
  });
});

describe('weather', () => {
  it('rain slows road trips and treks but not cooking', () => {
    expect(tripFactor(act('to-wuse'), 'rain', {})).toBeGreaterThan(1);
    expect(tripFactor(act('trek-street-wuse'), 'storm', {})).toBe(WEATHER.storm.trek);
    expect(tripFactor(act('indomie'), 'storm', {})).toBe(1);
    expect(durationAt(act('to-wuse'), 12 * 60, 'kubwa', { weather: 'storm' })).toBeGreaterThan(durationAt(act('to-wuse'), 12 * 60, 'kubwa', { weather: 'sunny' }));
  });

  it('always picks a real weather, and storms do not last forever', () => {
    let w: Weather = 'storm';
    const seen = new Set<Weather>();
    for (let i = 0; i < 500; i++) {
      w = nextWeather(w, Math.random);
      seen.add(w);
      expect(WEATHER[w]).toBeDefined();
    }
    expect(seen.size).toBeGreaterThan(2);
    for (let i = 0; i < 50; i++) expect(nextWeather('storm', Math.random)).not.toBe('storm');
  });
});
