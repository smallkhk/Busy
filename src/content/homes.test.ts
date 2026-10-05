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
