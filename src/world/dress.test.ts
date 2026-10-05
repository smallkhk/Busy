import { describe, expect, it } from 'vitest';
import { dressFor } from './dress';

describe('dressFor', () => {
  it('dresses matching top and trousers as a kaftan', () => {
    const d = dressFor({ shirt: '#6f9cc4', trousers: '#6f9cc4' });
    expect(d.kind).toBe('suit');
    expect(d.tint.Suit).toBe('#6f9cc4');
    expect(d.tint.White).toBe('#6f9cc4');
  });

  it('keeps an explicit hat (Mai Shayi cap)', () => {
    const hat = { type: 'hula' as const, color: '#8b1e3f' };
    expect(dressFor({ shirt: '#fff', trousers: '#fff', hat }).hat).toEqual(hat);
  });

  it('puts women without trousers in a dress', () => {
    const d = dressFor({ shirt: '#e67e22', woman: true });
    expect(d.kind).toBe('w_formal');
    expect(d.tint.LimeGreen).toBe('#e67e22');
  });

  it('gives the player shirt colour to the T-shirt', () => {
    const d = dressFor({ shirt: '#118a4c', outfit: 'tee', trousers: '#24324a' });
    expect(['casual_2', 'casual_hoodie']).toContain(d.kind);
    expect(Object.values(d.tint)).toContain('#118a4c');
  });

  it('agbada comes with a cap and kaftan with a hula', () => {
    expect(dressFor({ shirt: '#fff', outfit: 'agbada' }).hat?.type).toBe('hula');
    expect(dressFor({ shirt: '#fff', outfit: 'kaftan' }).hat?.type).toBe('hula');
  });
});
