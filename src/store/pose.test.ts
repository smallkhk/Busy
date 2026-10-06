import { beforeEach, describe, expect, it } from 'vitest';
import { activityById } from '../content/activities';
import { NPCS } from '../content/npcs';
import { GREET_REL, live, useGame } from './game';

describe('sit, dance, greet', () => {
  beforeEach(() => {
    useGame.getState().reset();
    useGame.getState().start('Ada', '#222');
    live.pos = null;
    useGame.setState({ place: 'street', pos: [0, 2], nextEventCheck: Infinity, active: null, target: null });
  });

  it('sitting brings energy back; walking stands you up', () => {
    useGame.setState({ needs: { ...useGame.getState().needs, energy: 40 } });
    useGame.getState().setPose('sit');
    expect(useGame.getState().pose).toBe('sit');
    useGame.getState().tick(0.25);
    expect(useGame.getState().needs.energy).toBeGreaterThan(40);
    useGame.getState().walkTo(3, 2);
    expect(useGame.getState().pose).toBeNull();
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
