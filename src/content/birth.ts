import type { Outfit } from './fashion';
import type { AreaId } from './housing';

/** Where you come from. Na your choice; it gives you clothes from home. */
export type Origin = 'north' | 'southwest' | 'southeast' | 'southsouth' | 'middlebelt';
export type Education = 'none' | 'ssce' | 'degree' | 'masters';
export type Dream = 'work' | 'business' | 'hustle' | 'politics';

export const ORIGINS: { id: Origin; name: string; emoji: string; outfit: Outfit; greet: string }[] = [
  { id: 'north', name: 'North (Hausa/Fulani)', emoji: '🐪', outfit: 'kaftan', greet: 'Sannu da zuwa' },
  { id: 'southwest', name: 'South-West (Yoruba)', emoji: '🥁', outfit: 'native', greet: 'Ẹ kú àbọ̀' },
  { id: 'southeast', name: 'South-East (Igbo)', emoji: '🦅', outfit: 'native', greet: 'Nnọọ' },
  { id: 'southsouth', name: 'South-South', emoji: '🛢️', outfit: 'jersey', greet: 'Welcome my broda' },
  { id: 'middlebelt', name: 'Middle Belt', emoji: '⛰️', outfit: 'jersey', greet: 'Welcome o' },
];

export const EDUCATIONS: { id: Education; name: string; emoji: string; perk: string; cv: number; fitness: number }[] = [
  { id: 'none', name: 'I no go school', emoji: '💪🏾', perk: 'Hard life don make you strong: +15 fitness', cv: 0, fitness: 15 },
  { id: 'ssce', name: 'SSCE / WAEC', emoji: '📘', perk: 'Normal start', cv: 0, fitness: 0 },
  { id: 'degree', name: 'University degree', emoji: '🎓', perk: 'Your CV don already move one step', cv: 1, fitness: 0 },
  { id: 'masters', name: 'Masters', emoji: '📜', perk: 'Your CV don move two steps', cv: 2, fitness: -5 },
];

export const DREAMS: { id: Dream; name: string; emoji: string }[] = [
  { id: 'work', name: 'Find better work', emoji: '💼' },
  { id: 'business', name: 'Start my own business', emoji: '🏪' },
  { id: 'hustle', name: 'Hustle anyhow, make money', emoji: '💸' },
  { id: 'politics', name: 'Enter politics', emoji: '🗳️' },
];

export type FamilyId = 'poor' | 'struggling' | 'comfortable' | 'rich' | 'oilmoney';

/** Family you born into. Nobody choose am: e na luck. */
export type Family = {
  id: FamilyId;
  name: string;
  /** Headline on the birth card. */
  born: string;
  emoji: string;
  /** Out of 100: how often people born into this. */
  weight: number;
  money: number;
  /** One of these, at random. */
  areas: AreaId[];
  packaging: number;
  car?: string;
  /** Rent already paid for this many 30-day cycles. */
  rentPaidCycles: number;
  story: string;
};

export const FAMILIES: Family[] = [
  {
    id: 'poor',
    name: 'Poor family',
    born: 'You born poor',
    emoji: '🪣',
    weight: 35,
    money: 8000,
    areas: ['mararaba', 'nyanya'],
    packaging: 0,
    rentPaidCycles: 1,
    story: 'Your papa na farmer for village and your mama dey sell pepper. Dem gather ₦8,000 give you. Na you be the family hope o.',
  },
  {
    id: 'struggling',
    name: 'Struggling family',
    born: 'You born for struggling family',
    emoji: '🎒',
    weight: 35,
    money: 45000,
    areas: ['kubwa', 'nyanya'],
    packaging: 5,
    rentPaidCycles: 1,
    story: 'Your people dey try, but salary no dey reach. You land with ₦45,000 and one bag. Your cousin help you find room.',
  },
  {
    id: 'comfortable',
    name: 'Comfortable family',
    born: 'You born comfortable',
    emoji: '🏘️',
    weight: 20,
    money: 600000,
    areas: ['gwarinpa', 'garki'],
    packaging: 15,
    rentPaidCycles: 2,
    story: 'Your parents na civil servants wey retire well. Dem pay your rent and drop ₦600,000 for you. No waste am o.',
  },
  {
    id: 'rich',
    name: 'Rich family',
    born: 'You born rich',
    emoji: '💰',
    weight: 8,
    money: 8000000,
    areas: ['wuse2', 'maitama'],
    packaging: 35,
    car: 'corolla',
    rentPaidCycles: 2,
    story: 'Your papa na big contractor. Dem buy you motor, pay your rent, and send ₦8m. Abuja go feel your presence.',
  },
  {
    id: 'oilmoney',
    name: 'Old money (Alhaji/Senator pikin)',
    born: 'You born into OLD MONEY',
    emoji: '👑',
    weight: 2,
    money: 60000000,
    areas: ['asokoro', 'maitama'],
    packaging: 60,
    car: 'benz',
    rentPaidCycles: 3,
    story: 'Your papa get oil block and your uncle na Senator. Mansion paid, Benz for compound, ₦60m for account. But money fit finish o.',
  },
];

export const familyById = (id: FamilyId) => FAMILIES.find((f) => f.id === id) ?? FAMILIES[1];

/** Roll the family you born into. `rand` gives 0–1. */
export function rollFamily(rand: () => number): Family {
  const total = FAMILIES.reduce((n, f) => n + f.weight, 0);
  let r = rand() * total;
  for (const f of FAMILIES) {
    r -= f.weight;
    if (r < 0) return f;
  }
  return FAMILIES[1];
}

export type Birth = { family: FamilyId; origin: Origin; education: Education; dream: Dream; area: AreaId };

/** Roll a whole new life from your answers. */
export function rollBirth(answers: { origin: Origin; education: Education; dream: Dream }, rand: () => number = Math.random): Birth {
  const family = rollFamily(rand);
  const area = family.areas[Math.floor(rand() * family.areas.length)] ?? family.areas[0];
  return { ...answers, family: family.id, area };
}
