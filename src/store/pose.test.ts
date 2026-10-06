import { beforeEach, describe, expect, it } from 'vitest';
import { activityById } from '../content/activities';
import { NPCS } from '../content/npcs';
import { GREET_REL, live, useGame } from './game';
import { LT_TAKEN, ltSeat, nearestSeat, seatsAt } from '../content/seats';

describe('sit, dance, greet', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.getState().start('Ada', '#222');
    live.pos = null;
    useGame.setState({ place: 'street', pos: [0, 2], nextEventCheck: Infinity, active: null, target: null });
  });

  it('Sit walks you to a real seat first, then sitting brings energy back; walking stands you up', () => {
    useGame.setState({ needs: { ...useGame.getState().needs, energy: 40 }, pos: [0.5, 3] });
    useGame.getState().setPose('sit');
    // Not yet: you go to the bus stop bench first
    expect(useGame.getState().pose).toBeNull();
    const seat = useGame.getState().target!;
    expect(nearestSeat('street', 'kubwa', seat, 0.01)).not.toBeNull();
    useGame.getState().arrive(seat);
    expect(useGame.getState().pose).toBe('sit');
    useGame.getState().tick(0.25);
    expect(useGame.getState().needs.energy).toBeGreaterThan(40);
    useGame.getState().walkTo(3, 2);
    expect(useGame.getState().pose).toBeNull();
  });

  it('no chair, no sitting: you no fit sit for air', () => {
    useGame.setState({ place: 'secretariat', pos: [0, 2] });
    useGame.getState().setPose('sit');
    expect(useGame.getState().pose).toBeNull();
    expect(useGame.getState().target).toBeNull();
  });

  it('lectures take a real bench seat', () => {
    useGame.setState({ place: 'lt', pos: [7, 4.6], time: 3 * 1440 + 10 * 60 });
    useGame.getState().choose('lecture');
    const t = useGame.getState().target!;
    expect(nearestSeat('lt', 'kubwa', t, 0.01)).not.toBeNull();
  });

  it('nobody sits on top of a student: taken seats are not offered', () => {
    for (const s of seatsAt('lt', 'kubwa')) for (const [row, x] of LT_TAKEN) expect(Math.hypot(s.x - x, s.z - ltSeat(row, x).z) > 0.3).toBe(true);
  });

  it('tapping the same pose again stands you up', () => {
    useGame.getState().setPose('dance');
    useGame.getState().setPose('dance');
    expect(useGame.getState().pose).toBeNull();
  });

  it('no posing while busy', () => {
    useGame.setState({ active: { id: 'rice', remaining: 10, total: 30, gen: false } });
    useGame.getState().setPose('sit');
    expect(useGame.getState().pose).toBeNull();
  });

  it('class, reading and meals are done sitting down', () => {
    for (const id of ['uni-lecture', 'library-read', 'rice', 'epl']) expect(activityById(id)?.pose, id).toBe('sit');
    expect(activityById('pos')?.pose).toBeUndefined();
  });

  it('kneel to greet a contact near you: once a day', () => {
    const spot = NPCS.garba.spots[0];
    useGame.setState({ place: spot.place, pos: spot.pos, time: 7 * 1440 + 10 * 60 + 1440, contacts: { garba: { rel: 30 } } });
    useGame.getState().setPose('kneel');
    expect(useGame.getState().contacts.garba.rel).toBe(30 + GREET_REL);
    useGame.getState().setPose(null);
    useGame.getState().setPose('kneel');
    expect(useGame.getState().contacts.garba.rel).toBe(30 + GREET_REL);
  });
});
