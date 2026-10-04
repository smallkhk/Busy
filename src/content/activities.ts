import { ride, type Activity, type Interactable, type Place } from './common';
import { TRAVEL_INTERACTABLES } from './travel';

export * from './common';

export const GEN_COST = 1000;

/** Where away activities (jobs) leave from and come back to. */
export const EXIT_SPOT: Record<Place, [number, number]> = {
  home: [6.0, 2.9],
  street: [1.0, 2.6],
  wuse: [-5.0, 2.2],
  jabi: [4.4, 2.4],
  secretariat: [4.6, 2.6],
};
/** Where you appear when you arrive at a place. */
export const ENTRY_SPOT: Record<Place, [number, number]> = {
  home: [5.6, 2.6],
  street: [-7.1, -2.0],
  wuse: [-4.4, 1.6],
  jabi: [3.8, 1.8],
  secretariat: [4.0, 2.0],
};

const HOME_AND_STREET: Interactable[] = [
  {
    id: 'bed',
    place: 'home',
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
    place: 'home',
    name: 'Cooler',
    emoji: '🧊',
    label: [-0.7, 1.1, -2.5],
    activities: [
      { id: 'jollof', label: 'Chop leftover jollof', doing: 'Chopping jollof', emoji: '🍛', minutes: 20, cost: 0, gains: { food: 30, fun: 3 }, spot: [-0.7, -1.7] },
      { id: 'homefood', label: 'Chop home food (foodstuff)', doing: 'Chopping home food', emoji: '🍲', minutes: 20, usesPantry: 1, gains: { food: 45, fun: 5 }, spot: [-0.7, -1.7] },
      { id: 'water', label: 'Drink pure water', doing: 'Drinking pure water', emoji: '💧', minutes: 5, cost: 50, gains: { food: 5, bladder: -8 }, spot: [-0.7, -1.7] },
    ],
  },
  {
    id: 'stove',
    place: 'home',
    name: 'Gas cooker',
    emoji: '🔥',
    label: [0.8, 1.3, -2.5],
    activities: [
      { id: 'indomie', label: 'Cook indomie & egg', doing: 'Cooking indomie', emoji: '🍜', minutes: 30, cost: 1500, gains: { food: 45, fun: 5 }, spot: [0.8, -1.6] },
      { id: 'cookmarket', label: 'Cook with market foodstuff', doing: 'Cooking jollof rice', emoji: '🍚', minutes: 45, usesPantry: 1, gains: { food: 65, fun: 10 }, spot: [0.8, -1.6] },
      { id: 'soup', label: 'Cook pot of soup', doing: 'Cooking egusi soup', emoji: '🥘', minutes: 120, cost: 6500, gains: { food: 85, fun: 10, energy: -8 }, spot: [0.8, -1.6] },
    ],
  },
  {
    id: 'toilet',
    place: 'home',
    name: 'Toilet',
    emoji: '🚽',
    label: [3.5, 1.1, -2.5],
    activities: [
      { id: 'toilet', label: 'Use toilet', doing: 'Inside toilet', emoji: '🚽', minutes: 8, gains: { bladder: 100 }, spot: [3.2, -1.8] },
    ],
  },
  {
    id: 'bucket',
    place: 'home',
    name: 'Bathroom',
    emoji: '🪣',
    label: [2.5, 1.0, -2.5],
    activities: [
      { id: 'bath', label: 'Bucket bath', doing: 'Bathing (water no run again 😩)', emoji: '🪣', minutes: 20, gains: { hygiene: 80 }, spot: [2.4, -1.8] },
    ],
  },
  {
    id: 'tv',
    place: 'home',
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
    place: 'home',
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
    place: 'home',
    name: 'Compound bench',
    emoji: '🪑',
    label: [3.6, 1.0, 3.3],
    activities: [
      { id: 'neighbours', label: 'Gist with neighbours', doing: 'Gisting with neighbours', emoji: '🗣️', minutes: 45, gains: { social: 25, fun: 10 }, hours: [7, 22], spot: [3.6, 2.6] },
    ],
  },
  {
    id: 'gate',
    place: 'home',
    name: 'Compound gate',
    emoji: '🚪',
    label: [6.4, 1.9, 3.1],
    activities: [
      { id: 'go-street', label: 'Go outside (Kubwa street)', doing: 'Stepping out', emoji: '🚶', minutes: 2, gains: {}, travelTo: 'street', spot: [6.0, 2.9] },
    ],
  },
  {
    id: 'home-gate',
    place: 'street',
    name: 'Your compound',
    emoji: '🏠',
    label: [-7.2, 2.4, -2.9],
    activities: [
      { id: 'go-home', label: 'Go back inside', doing: 'Going home', emoji: '🏠', minutes: 2, gains: {}, travelTo: 'home', spot: [-7.1, -2.0] },
    ],
  },
  {
    id: 'mamaput',
    place: 'street',
    name: 'Mama Put',
    emoji: '🍲',
    label: [-4.2, 2.6, -3.4],
    activities: [
      { id: 'rice', label: 'Rice, stew & meat', doing: 'Chopping for Mama Put', emoji: '🍛', minutes: 30, cost: 2500, gains: { food: 60, social: 8 }, hours: [7, 21], spot: [-4.2, -2.0] },
      { id: 'tuwo', label: 'Tuwo shinkafa & miyan kuka', doing: 'Chopping tuwo', emoji: '🥣', minutes: 30, cost: 2000, gains: { food: 55, fun: 5 }, hours: [7, 21], spot: [-4.2, -2.0] },
    ],
  },
  {
    id: 'barber',
    place: 'street',
    name: 'Barber shop',
    emoji: '💈',
    label: [-1.2, 2.6, -3.4],
    activities: [
      { id: 'lowcut', label: 'Low cut + shave', doing: 'Barbing hair', emoji: '💈', minutes: 40, cost: 2000, gains: { hygiene: 20, fun: 10, social: 15 }, hours: [8, 21], spot: [-1.2, -2.0] },
    ],
  },
  {
    id: 'viewing',
    place: 'street',
    name: 'Viewing centre',
    emoji: '⚽',
    label: [1.8, 2.6, -3.4],
    activities: [
      { id: 'epl', label: 'Watch EPL match (dem get gen)', doing: 'Shouting for viewing centre', emoji: '⚽', minutes: 120, cost: 500, gains: { fun: 45, social: 25 }, hours: [12, 23], spot: [1.8, -2.0] },
    ],
  },
  {
    id: 'suya',
    place: 'street',
    name: 'Suya spot',
    emoji: '🍢',
    label: [4.8, 2.0, -2.6],
    activities: [
      { id: 'suya', label: 'Suya & onions', doing: 'Enjoying suya', emoji: '🍢', minutes: 20, cost: 1500, gains: { food: 25, fun: 15 }, hours: [16, 24], spot: [4.8, -1.8] },
    ],
  },
  {
    id: 'busstop',
    place: 'street',
    name: 'Kubwa bus stop',
    emoji: '🚏',
    label: [1.0, 2.6, 3.4],
    activities: [
      ride('to-wuse', 'Bus go Wuse Market', '🚌', 'wuse', 60, 700, [1.0, 2.6]),
      ride('to-jabi', 'Taxi go Jabi Lake Mall', '🚕', 'jabi', 45, 3500, [1.0, 2.6]),
      ride('to-sec', 'Bus go Federal Secretariat', '🏛️', 'secretariat', 75, 900, [1.0, 2.6]),
    ],
  },
];

export const INTERACTABLES: Interactable[] = [...HOME_AND_STREET, ...TRAVEL_INTERACTABLES];

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
