import { describe, expect, it } from 'vitest';
import { activityById } from './activities';
import { homeTier } from './housing';
import { blockReason, useGame } from '../store/game';

describe('house sizes', () => {
  it('poor areas get one room, middle areas a flat, big-money areas a mansion', () => {
    expect(homeTier('mararaba')).toBe('room');
    expect(homeTier('kubwa')).toBe('room');
    expect(homeTier('gwarinpa')).toBe('flat');
    expect(homeTier('wuse2')).toBe('flat');
    expect(homeTier('maitama')).toBe('mansion');
    expect(homeTier('asokoro')).toBe('mansion');
  });

  it('jacuzzi, piano and snooker only work in a mansion', () => {
    useGame.getState().reset();
    useGame.setState({ started: true, area: 'kubwa' });
    const soak = activityById('jacuzzi-soak')!;
    expect(blockReason(soak, useGame.getState())).toMatch(/mansion/);
    useGame.setState({ area: 'asokoro' });
    expect(blockReason(soak, useGame.getState())).toBeNull();
    expect(activityById('snooker')).toBeDefined();
    expect(activityById('piano-play')).toBeDefined();
  });
});

describe('spread-out houses', () => {
  it('furniture, its activity spot and the walk area all move out together', async () => {
    const { homeSpot, homePoint, homeBounds, HOME_SCALE } = await import('./homeLayout');
    const k = HOME_SCALE.room;
    // Sleeping spot follows the bed, which stays against the back wall
    const [sx, sz] = homeSpot('kubwa', 'sleep', [-1.8, -1.6]);
    const [bx, bz] = homePoint('kubwa', 'bed', -1.8, -1.6);
    expect([sx, sz]).toEqual([bx, bz]);
    expect(sz).toBeCloseTo(-1.6 - 3.0 * (k - 1));
    // Mansion walk area reaches the garage
    expect(homeBounds('asokoro', { minX: -3.6, maxX: 6.4, minZ: -2.6, maxZ: 3.6 }).minX).toBeLessThan(-10);
  });
});
