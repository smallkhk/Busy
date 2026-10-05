import { describe, expect, it } from 'vitest';
import { cookScore, inZone, markerAt, matchResult, posCharge, posRound, RECIPES } from './minigames';

describe('mini-games', () => {
  it('POS charges ₦100 per ₦5,000 and the answer is always an option', () => {
    expect(posCharge(2500)).toBe(100);
    expect(posCharge(10000)).toBe(200);
    expect(posCharge(12500)).toBe(300);
    for (let i = 0; i < 50; i++) {
      const r = posRound(Math.random);
      expect(r.options).toContain(r.answer);
      expect(r.answer).toBe(r.amount + posCharge(r.amount));
    }
  });

  it('cooking rewards the right ingredients only', () => {
    const jollof = RECIPES[0];
    expect(cookScore(jollof, jollof.needs)).toBe(1);
    expect(cookScore(jollof, [...jollof.needs, '🍫 Milo'])).toBeLessThan(1);
    expect(cookScore(jollof, ['🍫 Milo', '🍦 Ice cream'])).toBe(0);
  });

  it('timing marker bounces between 0 and 1', () => {
    for (let t = 0; t < 10; t += 0.13) {
      const m = markerAt(t);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(1);
    }
    expect(inZone(0.5)).toBe(true);
    expect(inZone(0.1)).toBe(false);
  });

  it('match results agree with the score', () => {
    for (let i = 0; i < 50; i++) {
      const { result, score } = matchResult(Math.random);
      const [h, a] = score.split(' - ').map(Number);
      expect(result).toBe(h > a ? 'home' : h === a ? 'draw' : 'away');
    }
  });
});

describe('driving game', () => {
  it('clean driving saves the car, crashes cost it', async () => {
    const { driveScore, driveWear } = await import('./minigames');
    expect(driveWear(driveScore(0))).toBeLessThan(0);
    expect(driveWear(driveScore(4))).toBeGreaterThan(5);
  });
});
