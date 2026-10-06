import { describe, expect, it } from 'vitest';
import { CONTACTS, contactById, longLeg } from './contacts';
import { NPCS, npcsAt } from './npcs';
import { EVENTS } from './events';
import { activityById } from './activities';

describe('Abuja people and events', () => {
  it('every person on the map is a contact you can meet', () => {
    for (const id of Object.keys(NPCS)) expect(contactById(id), id).toBeTruthy();
  });

  it('places that were empty now have somebody to meet', () => {
    const at = (place: Parameters<typeof npcsAt>[0], hour: number, day = 2) => npcsAt(place, hour, day).map((n) => n.id);
    expect(at('wuse', 10)).toContain('iyabo');
    expect(at('hospital', 10)).toContain('nkechi');
    expect(at('garki', 10)).toContain('yakubu');
    expect(at('airport', 10)).toContain('ifeanyi');
    expect(at('stadium', 8)).toContain('bala');
    expect(at('park', 10, 0)).toContain('zainab');
  });

  it('knowing neighbourhood people adds Long Leg but it never pass 100', () => {
    const everyone = Object.fromEntries(CONTACTS.map((c) => [c.id, { rel: 100 }]));
    expect(longLeg(everyone)).toBe(100);
    const big = Object.fromEntries(CONTACTS.filter((c) => !c.local).map((c) => [c.id, { rel: 100 }]));
    expect(longLeg(big)).toBe(100);
    expect(longLeg({ iyabo: { rel: 50 } })).toBeGreaterThan(0);
  });

  it('event ids are unique and the new jobs exist', () => {
    const ids = EVENTS.map((e) => e.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    expect(activityById('bartender')?.pay).toBeGreaterThan(0);
    expect(activityById('hospital-porter')?.pay).toBeGreaterThan(0);
  });
});
