import { CAMPUS_PLACES } from './campus';
import { describe, expect, it } from 'vitest';
import { ALL_ACTIVITIES, INTERACTABLES, PLACE_NAMES, type Place } from './activities';
import { RIDE_PLACES, rideKm } from './phoneapps';

describe('districts', () => {
  it('every activity id is unique', () => {
    const ids = ALL_ACTIVITIES.map((a) => a.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('every interactable id is unique', () => {
    const ids = INTERACTABLES.map((i) => i.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('every away-from-home place has a public route back home', () => {
    for (const place of Object.keys(PLACE_NAMES) as Place[]) {
      // Campus buildings lead back to the UniAbuja gate, which has the buses
      if (place === 'home' || place === 'street' || place === 'road' || CAMPUS_PLACES.includes(place)) continue;
      const home = INTERACTABLES.filter((i) => i.place === place).flatMap((i) => i.activities).some((a) => a.travelTo === 'street');
      expect(home, place).toBe(true);
    }
  });

  it('every pair of ride places has a real distance', () => {
    for (const a of RIDE_PLACES) for (const b of RIDE_PLACES) if (a !== b) expect(rideKm(a, b), `${a}-${b}`).not.toBe(10);
  });
});
