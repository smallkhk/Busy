import { describe, expect, it } from 'vitest';
import { FAMILIES, rollBirth, rollFamily } from './birth';
import { AREAS } from './housing';
import { useGame } from '../store/game';

describe('birth', () => {
  it('poor is common and old money is rare', () => {
    const seq = (v: number) => () => v;
    expect(rollFamily(seq(0)).id).toBe('poor');
    expect(rollFamily(seq(0.999)).id).toBe('oilmoney');
    const total = FAMILIES.reduce((n, f) => n + f.weight, 0);
    expect(FAMILIES.find((f) => f.id === 'oilmoney')!.weight / total).toBeLessThan(0.05);
  });

  it('every family lives somewhere real', () => {
    for (const f of FAMILIES) for (const a of f.areas) expect(AREAS[a]).toBeDefined();
  });

  it('starting a life uses the family money, home and car', () => {
    const birth = { family: 'oilmoney' as const, origin: 'north' as const, education: 'degree' as const, dream: 'business' as const, area: 'asokoro' as const };
    useGame.getState().start('Musa', '#222', undefined, birth);
    const s = useGame.getState();
    expect(s.money).toBe(60000000);
    expect(s.area).toBe('asokoro');
    expect(s.car?.id).toBe('benz');
    expect(s.cv).toBe(1);
    expect(s.wardrobe).toContain('kaftan');
    expect(s.rentDueDay).toBe(91);
  });

  it('rollBirth keeps the answers', () => {
    const b = rollBirth({ origin: 'southeast', education: 'none', dream: 'hustle' }, () => 0.1);
    expect(b.origin).toBe('southeast');
    expect(FAMILIES.find((f) => f.id === b.family)!.areas).toContain(b.area);
  });

  it('Maitama and Asokoro cost pass ₦40m a year', () => {
    expect(AREAS.maitama.rent * 12).toBeGreaterThanOrEqual(40000000);
    expect(AREAS.asokoro.rent).toBeGreaterThan(AREAS.maitama.rent);
  });
});
