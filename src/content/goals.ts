import { longLeg, type ContactState } from './contacts';
import type { AreaId } from './housing';

/** What goal checks can see. */
export type GoalState = {
  stats: Record<string, number>;
  day: number;
  money: number;
  savings: number;
  cv: number;
  followers: number;
  area: AreaId;
  contacts: Record<string, ContactState>;
  eventHistory: Record<string, number>;
  grade?: number;
  businesses?: Record<string, unknown>;
  car?: { id: string } | null;
  wardrobe?: string[];
  skills?: string[];
  fitness?: number;
  loves?: Record<string, { married?: boolean; official?: boolean }>;
  properties?: Partial<Record<string, { status: string }>>;
  politics?: { office: number };
  homeUps?: string[];
  adBoostUntil?: number;
};

export type Goal = {
  id: string;
  emoji: string;
  title: string;
  hint: string;
  reward: number;
  done: (s: GoalState) => boolean;
};

const n = (s: GoalState, k: string) => s.stats[k] ?? 0;

/** Done in order: a short tutorial that teaches the basics. */
export const TUTORIAL: Goal[] = [
  { id: 't-eat', emoji: '🍛', title: 'Chop something', hint: 'Tap the 🧊 cooler or 🔥 gas cooker for your room', reward: 1000, done: (s) => n(s, 'meals') >= 1 },
  { id: 't-street', emoji: '🚪', title: 'Comot go the street', hint: 'Tap the 🚪 gate for your compound', reward: 1000, done: (s) => n(s, 'visit-street') >= 1 },
  { id: 't-work', emoji: '💼', title: 'Do your first work', hint: 'Open 📱 Phone → 💼 Jobs', reward: 2000, done: (s) => n(s, 'jobs') >= 1 },
  { id: 't-travel', emoji: '🗺️', title: 'Go another part of Abuja', hint: 'Open 🗺️ Map, tap a place, then trek, bus or ride', reward: 2000, done: (s) => n(s, 'trips') >= 1 },
  { id: 't-sleep', emoji: '😴', title: 'Sleep for your bed', hint: 'Tap the 🛏️ bed when night reach', reward: 2000, done: (s) => n(s, 'sleeps') >= 1 },
];

export const ACHIEVEMENTS: Goal[] = [
  { id: 'a-week', emoji: '📅', title: 'One week for Abuja', hint: 'Survive 7 days', reward: 5000, done: (s) => s.day >= 8 },
  { id: 'a-month', emoji: '🗓️', title: 'Abuja don accept you', hint: 'Survive 30 days', reward: 20000, done: (s) => s.day >= 31 },
  { id: 'a-rent', emoji: '🏠', title: 'Landlord no fit vex', hint: 'Pay your rent', reward: 5000, done: (s) => n(s, 'rentPaid') >= 1 },
  { id: 'a-trek', emoji: '🚶', title: 'Leg na transport', hint: 'Trek go somewhere', reward: 2000, done: (s) => n(s, 'treks') >= 1 },
  { id: 'a-cv', emoji: '📞', title: 'Dem don call me!', hint: 'Get the ministry contract job', reward: 5000, done: (s) => s.cv >= 3 },
  { id: 'a-hustler', emoji: '💪', title: 'Hustler', hint: 'Finish 10 jobs', reward: 10000, done: (s) => n(s, 'jobs') >= 10 },
  { id: 'a-gram', emoji: '📸', title: 'Small celebrity', hint: 'Reach 1,000 followers', reward: 10000, done: (s) => s.followers >= 1000 },
  { id: 'a-longleg', emoji: '🦵', title: 'Long Leg', hint: 'Reach 50 Long Leg', reward: 10000, done: (s) => longLeg(s.contacts) >= 50 },
  { id: 'a-saver', emoji: '🐷', title: 'Saver', hint: 'Get ₦100,000 for Ego Save', reward: 5000, done: (s) => s.savings >= 100000 },
  { id: 'a-move', emoji: '📦', title: 'I don move up', hint: 'Move comot Kubwa', reward: 10000, done: (s) => s.area !== 'kubwa' },
  { id: 'a-wuse2', emoji: '🏙️', title: 'Wuse 2 big boy/big girl', hint: 'Live for Wuse 2', reward: 20000, done: (s) => s.area === 'wuse2' },
  { id: 'a-lounge', emoji: '🍾', title: 'Enjoyment minister', hint: 'Pop bottle for the lounge', reward: 5000, done: (s) => n(s, 'bottles') >= 1 },
  { id: 'a-survivor', emoji: '🚑', title: 'God dey', hint: 'Survive a serious accident', reward: 5000, done: (s) => s.eventHistory['accident-major'] !== undefined },
  { id: 'a-promo', emoji: '📈', title: 'Oga for office', hint: 'Get your first promotion', reward: 10000, done: (s) => (s.grade ?? 0) >= 1 },
  { id: 'a-director', emoji: '🏛️', title: 'Director', hint: 'Reach Director', reward: 100000, done: (s) => (s.grade ?? 0) >= 4 },
  { id: 'a-biz', emoji: '🏪', title: 'Business owner', hint: 'Start your first business', reward: 10000, done: (s) => Object.keys(s.businesses ?? {}).length >= 1 },
  { id: 'a-mogul', emoji: '🤑', title: 'Mogul', hint: 'Own 5 businesses', reward: 200000, done: (s) => Object.keys(s.businesses ?? {}).length >= 5 },
  { id: 'a-car', emoji: '🚗', title: 'I don buy motor', hint: 'Buy your first car', reward: 20000, done: (s) => !!s.car },
  { id: 'a-benz', emoji: '🚘', title: 'Benz owner (real one)', hint: 'Own the Benz SUV', reward: 100000, done: (s) => s.car?.id === 'benz' },
  { id: 'a-cured', emoji: '💪', title: 'Malaria no fit me', hint: 'Recover from sickness', reward: 5000, done: (s) => (s.stats.cured ?? 0) >= 1 },
  { id: 'a-drip', emoji: '👗', title: 'Drip don land', hint: 'Buy new outfit for 👗 Drip', reward: 5000, done: (s) => (s.wardrobe?.length ?? 1) >= 2 },
  { id: 'a-agbada', emoji: '👑', title: 'Owambe king', hint: 'Own an agbada', reward: 20000, done: (s) => !!s.wardrobe?.includes('agbada') },
  { id: 'a-grad', emoji: '🎓', title: 'Graduate', hint: 'Finish any course for 📚 Learn', reward: 15000, done: (s) => (s.skills?.length ?? 0) >= 1 },
  { id: 'a-degree', emoji: '📜', title: 'B.Sc holder', hint: 'Finish the part-time degree', reward: 50000, done: (s) => !!s.skills?.includes('degree') },
  { id: 'a-fit', emoji: '💪🏾', title: 'Fit fam', hint: 'Reach 60 fitness', reward: 10000, done: (s) => (s.fitness ?? 0) >= 60 },
  { id: 'a-love', emoji: '❤️', title: 'Love don land', hint: 'Get official partner for 💕 Abuja Love', reward: 10000, done: (s) => Object.values(s.loves ?? {}).some((l) => l.official) },
  { id: 'a-wedding', emoji: '💒', title: 'Happily married', hint: 'Do your wedding', reward: 100000, done: (s) => Object.values(s.loves ?? {}).some((l) => l.married) },
  { id: 'a-land', emoji: '📜', title: 'Landlord in training', hint: 'Buy land or house', reward: 20000, done: (s) => Object.keys(s.properties ?? {}).length >= 1 },
  { id: 'a-ownhouse', emoji: '🏡', title: 'My own house', hint: 'Finish building or buy a house', reward: 100000, done: (s) => Object.values(s.properties ?? {}).some((p) => p?.status === 'built') },
  { id: 'a-ps5', emoji: '🎮', title: 'Gamer', hint: 'Buy PS5 for your house', reward: 10000, done: (s) => !!s.homeUps?.includes('ps5') },
  { id: 'a-billboard', emoji: '📢', title: 'Billboard money', hint: 'Rent billboard for the 🗺️ Map', reward: 10000, done: (s) => (s.adBoostUntil ?? 0) > 0 },
  { id: 'a-politics', emoji: '🗳️', title: 'Elected!', hint: 'Win any election for 🗳️ Politics', reward: 50000, done: (s) => (s.politics?.office ?? -1) >= 0 },
  { id: 'a-senator', emoji: '🦅', title: 'Distinguished Senator', hint: 'Become Senator', reward: 500000, done: (s) => (s.politics?.office ?? -1) >= 3 },
  { id: 'a-minister', emoji: '👑', title: 'Honourable Minister', hint: 'Become FCT Minister', reward: 1000000, done: (s) => (s.politics?.office ?? -1) >= 4 },
  { id: 'a-million', emoji: '💰', title: 'Millionaire', hint: 'Get ₦1,000,000 for your account', reward: 0, done: (s) => s.money >= 1_000_000 },
];

export const ALL_GOALS = [...TUTORIAL, ...ACHIEVEMENTS];
