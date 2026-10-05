/** Abuja Love: match, gist, date, and maybe marry. Packaging gets you the match; money keeps the love. */

export type Taste = 'simple' | 'regular' | 'bigboy';

export type Match = {
  id: string;
  name: string;
  emoji: string;
  age: number;
  job: string;
  bio: string;
  taste: Taste;
  /** Packaging they expect before they go like you back. */
  standard: number;
};

export const MATCHES: Match[] = [
  { id: 'amina', name: 'Amina', emoji: '👩🏾', age: 26, job: 'Nurse, General Hospital', bio: 'God-fearing. I like suya and long gist. No time for fake life.', taste: 'simple', standard: 10 },
  { id: 'tobi', name: 'Tobi', emoji: '🧑🏾', age: 28, job: 'Software developer', bio: 'Remote work, Netflix, and pepper soup on Fridays. Make we vibe.', taste: 'regular', standard: 20 },
  { id: 'zainab', name: 'Zainab', emoji: '🧕🏾', age: 25, job: 'Fashion designer', bio: 'If your shoe no clean, swipe left. 💅🏾', taste: 'bigboy', standard: 45 },
  { id: 'emeka', name: 'Emeka', emoji: '👨🏾', age: 30, job: 'Civil servant', bio: 'Stable job, small house for Gwarinpa. Looking for something serious.', taste: 'regular', standard: 25 },
  { id: 'chioma', name: 'Chioma', emoji: '👩🏾‍🦱', age: 27, job: 'Banker', bio: 'Brunch girl. Maitama vibes only. Prove me wrong 🥂', taste: 'bigboy', standard: 55 },
  { id: 'musa', name: 'Musa', emoji: '🧔🏾', age: 29, job: 'Teacher', bio: 'Simple person. Football, books, and kunu. Honesty first.', taste: 'simple', standard: 5 },
];

export const matchById = (id: string) => MATCHES.find((m) => m.id === id);

/** Chance they like you back. Below their standard is a long shot. */
export function matchChance(packaging: number, standard: number): number {
  if (packaging >= standard) return 0.8;
  return Math.max(0.08, 0.8 - (standard - packaging) * 0.03);
}

export type DateTier = { id: 'cheap' | 'normal' | 'bigboy' | 'fakelife'; label: string; emoji: string; cost: number; minutes: number; where: string };

export const DATE_TIERS: DateTier[] = [
  { id: 'cheap', label: 'Mama Put & waka for park', emoji: '🍲', cost: 4000, minutes: 120, where: 'Mama Put and the park' },
  { id: 'normal', label: 'Cinema & shawarma, Jabi', emoji: '🎬', cost: 18000, minutes: 180, where: 'Jabi Lake Mall' },
  { id: 'bigboy', label: 'Fine dining, Maitama', emoji: '🍷', cost: 60000, minutes: 150, where: 'Maitama' },
  { id: 'fakelife', label: 'VIP table for the lounge 🍾', emoji: '🍾', cost: 150000, minutes: 240, where: 'Wuse 2 lounge' },
];

/** How much they enjoy a date, by what they like. */
const FIT: Record<Taste, Record<DateTier['id'], number>> = {
  simple: { cheap: 18, normal: 14, bigboy: 8, fakelife: 2 },
  regular: { cheap: 6, normal: 16, bigboy: 14, fakelife: 10 },
  bigboy: { cheap: -10, normal: 6, bigboy: 18, fakelife: 24 },
};

export const dateInterest = (taste: Taste, tier: DateTier['id']) => FIT[taste][tier];

export type Stage = 'match' | 'talking' | 'dating' | 'relationship' | 'engaged' | 'married';

export const STAGE_NAMES: Record<Stage, string> = {
  match: 'New match',
  talking: 'Talking stage 💬',
  dating: 'Dating 💕',
  relationship: 'Relationship ❤️',
  engaged: 'Engaged 💍',
  married: 'Married 👰🏾🤵🏾',
};

export type Love = {
  interest: number;
  /** Stages you unlock by asking, on top of interest. */
  official?: boolean;
  engaged?: boolean;
  married?: boolean;
  lastTextDay?: number;
  lastDateDay?: number;
  /** Day you became official, for "meet parents". */
  sinceDay?: number;
  /** You took them on a date you can't really afford. */
  fakeLife?: boolean;
};

export function stageOf(l: Love): Stage {
  if (l.married) return 'married';
  if (l.engaged) return 'engaged';
  if (l.official) return 'relationship';
  if (l.interest >= 55) return 'dating';
  if (l.interest >= 25) return 'talking';
  return 'match';
}

export const TEXT_INTEREST = 6;
export const DAILY_COOL = 3;
/** Interest needed to ask them out officially. */
export const ASK_OUT_AT = 75;
/** Days official before you fit meet their parents / propose. */
export const PROPOSE_AFTER_DAYS = 7;
export const RING_COST = 250000;
export const WEDDING_COST = 1500000;
export const WEDDING_PACKAGING = 15;

/** One person at a time once una don dey official. */
export const officialPartner = (loves: Record<string, Love>) => Object.entries(loves).find(([, l]) => l.official)?.[0];
