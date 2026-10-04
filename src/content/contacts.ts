import type { Effect } from '../engine/events';

export type Favour = {
  label: string;
  /** Relationship needed before they go help you. */
  minRel: number;
  cooldownDays: number;
  text: string;
  effect: Effect & { unlock?: string };
};

export type Contact = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  /** 1–5: how much doors this person fit open. */
  influence: number;
  /** Hint shown before you meet them. */
  where: string;
  favour: Favour;
};

export const CONTACTS: Contact[] = [
  {
    id: 'garba',
    name: 'Mallam Garba',
    emoji: '👳🏾‍♂️',
    role: 'Messenger for Secretariat. E know everybody.',
    influence: 2,
    where: 'Chop for the Secretariat buka',
    favour: { label: 'Show me shortcut', minRel: 40, cooldownDays: 7, text: 'E carry your CV pass back door 😏', effect: { cv: 1 } },
  },
  {
    id: 'chinedu',
    name: 'Chinedu',
    emoji: '🧑🏾‍💼',
    role: 'Your old classmate, now admin officer for ministry',
    influence: 3,
    where: 'Old friends dey show face for street',
    favour: { label: 'Push my CV', minRel: 50, cooldownDays: 30, text: '"I don drop your name for director table." Ministry don dey call you 📞', effect: { cv: 3 } },
  },
  {
    id: 'okafor',
    name: 'Mrs. Okafor',
    emoji: '👩🏾‍💼',
    role: 'HR manager for the mall phone shop',
    influence: 3,
    where: 'She like to shop for Jabi Lake Mall',
    favour: { label: 'Recommend me for the phone shop', minRel: 50, cooldownDays: 60, text: '"Come resume Monday. Tell them say na me send you." No packaging needed 🙌', effect: { unlock: 'phoneshop' } },
  },
  {
    id: 'ade',
    name: 'Barrister Ade',
    emoji: '⚖️',
    role: 'Lawyer wey dey your compound',
    influence: 3,
    where: 'Neighbours wey dey gist for compound',
    favour: { label: 'Talk to my landlord', minRel: 45, cooldownDays: 30, text: 'E write landlord letter with big grammar. Landlord give you 2 more weeks 📜', effect: { rentGraceDays: 14 } },
  },
  {
    id: 'alhaji',
    name: 'Alhaji Sani',
    emoji: '🧔🏾',
    role: 'Big contractor. Im phone no dey stop ring.',
    influence: 5,
    where: 'Big men dey owambe',
    favour: { label: 'Give me small contract', minRel: 60, cooldownDays: 14, text: '"Supply 20 office chairs for ministry." You deliver am, collect your cut 💰', effect: { money: 80000 } },
  },
];

export const contactById = (id: string) => CONTACTS.find((c) => c.id === id);

export type ContactState = { rel: number; lastFavourDay?: number; lastCallDay?: number; lastGiftDay?: number };

export const FIRST_MEET_REL = 30;
export const CALL_COST = 200;
export const GIFT_COST = 5000;

const MAX_LONG_LEG = CONTACTS.reduce((sum, c) => sum + 100 * c.influence, 0);

/** 0–100: weighted by how much each person can open doors for you. */
export function longLeg(contacts: Record<string, ContactState>): number {
  const total = CONTACTS.reduce((sum, c) => sum + (contacts[c.id]?.rel ?? 0) * c.influence, 0);
  return Math.round((total / MAX_LONG_LEG) * 100);
}
