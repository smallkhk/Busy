import { beforeEach, describe, expect, it } from 'vitest';
import { decodeLook, encodeLook } from './fashion';
import { useGame } from '../store/game';

describe('fashion', () => {
  it('looks survive the trip through multiplayer, bad input falls back', () => {
    const l = { outfit: 'agbada' as const, hair: 'fila' as const, skin: 3 };
    expect(decodeLook(encodeLook(l))).toEqual(l);
    expect(decodeLook('hack.lol.99')).toEqual({ outfit: 'tee', hair: 'short', skin: 4 });
    expect(decodeLook(undefined).outfit).toBe('tee');
  });

  beforeEach(() => {
    useGame.getState().reset();
    useGame.setState({ started: true, money: 200000 });
  });

  it('buy an outfit once, wear it, and only wear what you own', () => {
    const g = useGame.getState;
    g().buyOutfit('kaftan');
    expect(g().wardrobe).toContain('kaftan');
    expect(g().look.outfit).toBe('kaftan');
    expect(g().money).toBe(160000);
    g().wearOutfit('agbada');
    expect(g().look.outfit).toBe('kaftan');
    g().wearOutfit('tee');
    expect(g().look.outfit).toBe('tee');
  });
});
