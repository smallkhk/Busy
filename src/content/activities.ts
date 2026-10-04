import type { Needs } from '../engine/needs';

export type Activity = {
  id: string;
  label: string;
  /** Shown while it runs, e.g. "Cooking indomie". */
  doing: string;
  emoji: string;
  minutes: number;
  cost?: number;
  pay?: number;
  gains: Partial<Needs>;
  requiresPower?: boolean;
  /** Allowed hours [start, end) on the 24h clock. */
  hours?: [number, number];
  /** Player leaves the room (walks out the door) while it runs. */
  away?: boolean;
  sleep?: boolean;
  /** Where the player stands to do it. Phone activities have none. */
  spot?: [number, number];
};

export type Interactable = {
  id: string;
  name: string;
  emoji: string;
  /** Label anchor in the world. */
  label: [number, number, number];
  activities: Activity[];
};

export const GEN_COST = 1000;

export const DOOR_SPOT: [number, number] = [4.3, 1.8];

export const INTERACTABLES: Interactable[] = [
  {
    id: 'bed',
    name: 'Bed',
    emoji: '🛏️',
    label: [-2.9, 1.3, -1.9],
    activities: [
      { id: 'sleep', label: 'Sleep (8 hrs)', doing: 'Sleeping', emoji: '😴', minutes: 480, gains: { energy: 95 }, sleep: true, spot: [-1.8, -1.6] },
      { id: 'nap', label: 'Small nap (1 hr)', doing: 'Napping', emoji: '💤', minutes: 60, gains: { energy: 15 }, sleep: true, spot: [-1.8, -1.6] },
    ],
  },
  {
    id: 'cooler',
    name: 'Cooler',
    emoji: '🧊',
    label: [-0.7, 1.1, -2.5],
    activities: [
      { id: 'jollof', label: 'Chop leftover jollof', doing: 'Chopping jollof', emoji: '🍛', minutes: 20, cost: 0, gains: { food: 30, fun: 3 }, spot: [-0.7, -1.7] },
      { id: 'water', label: 'Drink pure water', doing: 'Drinking pure water', emoji: '💧', minutes: 5, cost: 50, gains: { food: 5, bladder: -8 }, spot: [-0.7, -1.7] },
    ],
  },
  {
    id: 'stove',
    name: 'Gas cooker',
    emoji: '🔥',
    label: [0.8, 1.3, -2.5],
    activities: [
      { id: 'indomie', label: 'Cook indomie & egg', doing: 'Cooking indomie', emoji: '🍜', minutes: 30, cost: 1500, gains: { food: 45, fun: 5 }, spot: [0.8, -1.6] },
      { id: 'soup', label: 'Cook pot of soup', doing: 'Cooking egusi soup', emoji: '🥘', minutes: 120, cost: 6500, gains: { food: 85, fun: 10, energy: -8 }, spot: [0.8, -1.6] },
    ],
  },
  {
    id: 'toilet',
    name: 'Toilet',
    emoji: '🚽',
    label: [3.5, 1.1, -2.5],
    activities: [
      { id: 'toilet', label: 'Use toilet', doing: 'Inside toilet', emoji: '🚽', minutes: 8, gains: { bladder: 100 }, spot: [3.2, -1.8] },
    ],
  },
  {
    id: 'bucket',
    name: 'Bathroom',
    emoji: '🪣',
    label: [2.5, 1.0, -2.5],
    activities: [
      { id: 'bath', label: 'Bucket bath', doing: 'Bathing (water no run again 😩)', emoji: '🪣', minutes: 20, gains: { hygiene: 80 }, spot: [2.4, -1.8] },
    ],
  },
  {
    id: 'tv',
    name: 'TV',
    emoji: '📺',
    label: [-3.6, 1.6, 1.0],
    activities: [
      { id: 'nollywood', label: 'Watch Nollywood', doing: 'Watching Nollywood', emoji: '🎬', minutes: 90, gains: { fun: 35 }, requiresPower: true, spot: [-1.7, 1.0] },
      { id: 'football', label: 'Watch football', doing: 'Watching Super Eagles', emoji: '⚽', minutes: 120, gains: { fun: 45, social: 5 }, requiresPower: true, spot: [-1.7, 1.0] },
    ],
  },
  {
    id: 'maishayi',
    name: 'Mai Shayi',
    emoji: '☕',
    label: [5.6, 1.6, 0.0],
    activities: [
      { id: 'tea', label: 'Tea & bread', doing: 'Gisting with Mai Shayi', emoji: '🍞', minutes: 25, cost: 800, gains: { food: 30, social: 15 }, hours: [6, 23], spot: [5.0, 0.7] },
      { id: 'spag', label: 'Indomie & egg special', doing: 'Chopping Mai Shayi special', emoji: '🍳', minutes: 30, cost: 1800, gains: { food: 55, social: 15, fun: 5 }, hours: [6, 23], spot: [5.0, 0.7] },
    ],
  },
  {
    id: 'bench',
    name: 'Compound bench',
    emoji: '🪑',
    label: [3.6, 1.0, 3.3],
    activities: [
      { id: 'neighbours', label: 'Gist with neighbours', doing: 'Gisting with neighbours', emoji: '🗣️', minutes: 45, gains: { social: 25, fun: 10 }, hours: [7, 22], spot: [3.6, 2.6] },
    ],
  },
];

export const JOBS: Activity[] = [
  { id: 'pos', label: 'POS attendant, Kubwa Village Market', doing: 'Working POS for Kubwa market', emoji: '💳', minutes: 360, pay: 9000, gains: { energy: -25, fun: -10, social: 10 }, hours: [8, 15], away: true },
  { id: 'delivery', label: 'Dispatch rider (borrowed bike)', doing: 'Delivering packages for Gwarinpa', emoji: '🛵', minutes: 240, pay: 7000, gains: { energy: -30, hygiene: -20 }, hours: [7, 19], away: true },
  { id: 'cyber', label: 'Typing & printing at cyber café', doing: 'Typing CVs for corpers', emoji: '🖨️', minutes: 180, pay: 4500, gains: { energy: -12, fun: -8 }, hours: [8, 18], away: true },
];

export const PHONE_ACTIVITIES: Activity[] = [
  { id: 'mama', label: 'Call your mama', doing: 'On the phone with mama', emoji: '📞', minutes: 20, cost: 300, gains: { social: 30, fun: 5 } },
  { id: 'groupchat', label: 'Gist for group chat', doing: 'Gisting for group chat', emoji: '💬', minutes: 15, cost: 100, gains: { social: 15, fun: 8 } },
  { id: 'skits', label: 'Watch skits', doing: 'Laughing at skits', emoji: '🤣', minutes: 30, cost: 200, gains: { fun: 20 } },
];

export const ALL_ACTIVITIES: Activity[] = [
  ...INTERACTABLES.flatMap((i) => i.activities),
  ...JOBS,
  ...PHONE_ACTIVITIES,
];

export const activityById = (id: string) => ALL_ACTIVITIES.find((a) => a.id === id);
