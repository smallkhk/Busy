import type { Needs } from '../engine/needs';

export type Sickness = 'malaria' | 'typhoid' | 'food';

export const SICKNESS: Record<Sickness, { name: string; emoji: string; text: string; cure: string }> = {
  malaria: {
    name: 'Malaria',
    emoji: '🦟',
    text: 'Your body dey hot, cold dey catch you for sun, and bitter taste don enter your mouth. Na malaria be this 🤒',
    cure: 'Buy malaria drugs for chemist, or see doctor for hospital',
  },
  typhoid: {
    name: 'Typhoid',
    emoji: '🤢',
    text: 'Belle dey pain you, headache no gree stop. That water wey you drink no clean. Na typhoid 😩',
    cure: 'Buy antibiotics for chemist, or see doctor for hospital',
  },
  food: {
    name: 'Food poisoning',
    emoji: '🤮',
    text: 'That food no follow your belle at all. You don run toilet 6 times this morning 😭',
    cure: 'Buy antibiotics for chemist, or see doctor for hospital',
  },
};

/** Extra points lost per in-game hour while sick. */
export const SICK_DRAIN: Partial<Needs> = { energy: 3, fun: 3 };

/** Roll for a new sickness at the start of a day. */
export function rollSickness(needs: Needs, hasNet: boolean, rand: () => number): Sickness | null {
  if (rand() < (hasNet ? 0.02 : 0.08)) return 'malaria';
  if (needs.hygiene < 25 && rand() < 0.3) return 'typhoid';
  if (needs.food < 20 && rand() < 0.25) return 'food';
  return null;
}
