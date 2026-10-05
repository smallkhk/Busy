import { describe, expect, it } from 'vitest';
import { formatCode, netWorth, newCode, normaliseCode, weekStart } from './cloud';

describe('cloud save', () => {
  it('recovery codes are 8 easy-to-read characters', () => {
    for (let i = 0; i < 50; i++) expect(newCode()).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(formatCode('ABCD2345')).toBe('ABCD-2345');
    expect(normaliseCode(' abcd-2345 ')).toBe('ABCD2345');
  });

  it('net worth counts what you own minus what you owe', () => {
    const base = { money: 100000, savings: 50000, loan: { owed: 30000, dueDay: 9 }, car: null, businesses: {}, properties: {}, time: 0 };
    expect(netWorth(base)).toBe(120000);
    expect(netWorth({ ...base, car: { id: 'corolla', condition: 100 } })).toBeGreaterThan(120000);
  });

  it('the week starts on Monday', () => {
    const wed = new Date(2026, 9, 7, 15, 0); // Wed 7 Oct 2026
    const mon = weekStart(wed);
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(5);
    expect(mon.getHours()).toBe(0);
  });
});
