import { CAMPUS_PLACES } from './campus';
import { describe, expect, it } from 'vitest';
import { pickEvent, type EventContext } from '../engine/events';
import { EVENTS } from './events';
import { NPCS, npcsAt } from './npcs';
import { contactById } from './contacts';

const ctx: EventContext = { place: 'street', hour: 10, day: 10, money: 50000, power: true, met: ['chinedu', 'garba'], flags: {} };
const ev = (id: string) => EVENTS.find((e) => e.id === id)!;

describe('storylines', () => {
  it('Chinedu story continues only after the delay', () => {
    expect(ev('chinedu-excuse').when!({ ...ctx, flags: { 'lent-chinedu': 9 } })).toBe(false);
    expect(ev('chinedu-excuse').when!({ ...ctx, flags: { 'lent-chinedu': 7 } })).toBe(true);
    expect(ev('chinedu-borrow').when!({ ...ctx, flags: { 'lent-chinedu': 7 } })).toBe(false);
  });

  it('payback offers the connection only if you trusted him twice', () => {
    const e = ev('chinedu-payback');
    const labels = (flags: Record<string, number>) => e.choices.filter((c) => !c.when || c.when({ ...ctx, flags })).map((c) => c.label);
    expect(labels({ 'chinedu-again': 5, 'chinedu-trust': 5 })).toEqual(['Collect money + the connection']);
    expect(labels({ 'chinedu-again': 5 })).toEqual(['Collect your ₦20,000']);
  });

  it('Garba interview only happens the next morning at the Secretariat', () => {
    const e = ev('garba-interview');
    expect(e.when!({ ...ctx, place: 'secretariat', flags: { 'garba-appt': 9 } })).toBe(true);
    expect(e.when!({ ...ctx, place: 'secretariat', hour: 14, flags: { 'garba-appt': 9 } })).toBe(false);
    expect(e.when!({ ...ctx, place: 'wuse', flags: { 'garba-appt': 9 } })).toBe(false);
    expect(ev('garba-missed').when!({ ...ctx, flags: { 'garba-appt': 8 } })).toBe(true);
  });

  it('a finished story never fires again', () => {
    const flags = { 'chinedu-done': 1, 'mama-done': 1, 'garba-done': 1, 'mama-helped': 1, 'lent-chinedu': 1, 'chinedu-excuse': 1, 'chinedu-again': 1 };
    for (let i = 0; i < 100; i++) {
      const e = pickEvent(EVENTS, 'idle', { ...ctx, flags }, {}, 0);
      expect(e?.id ?? '').not.toMatch(/^(chinedu-(borrow|excuse|again|payback)|mama|garba)/);
    }
  });
});

describe('people in the world', () => {
  it('every NPC is a real contact standing inside the scene', () => {
    for (const [id, npc] of Object.entries(NPCS)) {
      expect(contactById(id), id).toBeDefined();
      for (const s of npc.spots) {
        // The campus is a big compound: just stay inside its fence
        if (CAMPUS_PLACES.includes(s.place)) {
          expect(Math.abs(s.pos[0])).toBeLessThan(30);
          expect(s.pos[1]).toBeGreaterThan(-25);
          expect(s.pos[1]).toBeLessThan(13);
          continue;
        }
        // Benin City is one big map: stay inside its streets
        if (s.place === 'benin') {
          expect(Math.abs(s.pos[0])).toBeLessThan(60);
          expect(s.pos[1]).toBeGreaterThan(-46);
          expect(s.pos[1]).toBeLessThan(32);
          continue;
        }
        expect(Math.abs(s.pos[0])).toBeLessThan(6.5);
        expect(s.pos[1]).toBeGreaterThan(-1.8);
        expect(s.pos[1]).toBeLessThan(3.4);
      }
    }
  });

  it('Garba is at the Secretariat on a weekday morning, not on Sunday', () => {
    expect(npcsAt('secretariat', 10, 8).map((n) => n.id)).toContain('garba'); // day 8 = Monday
    expect(npcsAt('secretariat', 10, 7).map((n) => n.id)).not.toContain('garba'); // day 7 = Sunday
  });
});

describe('phone calls', () => {
  it('call events show who is calling, and every call has a free answer', () => {
    const calls = EVENTS.filter((e) => e.caller);
    expect(calls.length).toBeGreaterThanOrEqual(15);
    for (const e of calls) expect(e.choices.some((c) => !c.cost), e.id).toBe(true);
  });

  it('Chinedu mission pays off only if you show up next day', () => {
    const show = EVENTS.find((e) => e.id === 'chinedu-meet-show')!;
    expect(show.when!({ ...ctx, place: 'secretariat', flags: { 'chinedu-meet': 9 } })).toBe(true);
    expect(show.when!({ ...ctx, place: 'secretariat', flags: { 'chinedu-meet': 8 } })).toBe(false);
  });
});
