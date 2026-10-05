import { describe, expect, it } from 'vitest';
import { cleanText } from './filter';

describe('chat filter', () => {
  it('masks insults, trims and caps length', () => {
    expect(cleanText('  you be mumu  ')).toBe('you be ****');
    expect(cleanText('Shit happen')).toBe('**** happen');
    expect(cleanText('a'.repeat(200)).length).toBe(120);
    expect(cleanText('Abuja dey sweet')).toBe('Abuja dey sweet');
  });
});
