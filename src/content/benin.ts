import { ride, type Interactable } from './common';
import { fly } from './flights';
import type { Seat } from './seats';

/**
 * Benin City: a trip out of Abuja by luxury bus from Utako park (8 hours) or a
 * Zuma Air flight. One map (`benin`): the main road through the middle, Oba's
 * Palace, Igun Street's bronze casters and the National Museum to the north;
 * King's Square (Ring Road), the banga soup buka, the hotel, the bus park and
 * the airport desk to the south.
 */
export const BENIN = {
  palace: [-17, -8] as [number, number],
  igun: [2, -9] as [number, number],
  museum: [17, -9] as [number, number],
  ring: [2, 7] as [number, number],
  buka: [-8, 7] as [number, number],
  hotel: [-21, 6.5] as [number, number],
  park: [14, 6] as [number, number],
  airport: [24, 6.5] as [number, number],
};
/** Where you land, from the bus or the plane: by the bus park. */
export const BENIN_ENTRY: [number, number] = [14, 3.6];

export const BUKA_TABLE_BENCHES: [number, number][] = [-9.2, -6.8].map((x) => [x, 8.8]);
export const BENIN_SEATS: Seat[] = BUKA_TABLE_BENCHES.flatMap(([x, z]) => [-0.45, 0.45].map((dx) => ({ x: x + dx, z: z - 0.05, y: 0.45, rot: 0 })));

/** In front of a building north of the road (toward the road), or south of it. */
const north = (p: [number, number], d = 4.5): [number, number] => [p[0], p[1] + d];
const south = (p: [number, number], d = 3): [number, number] => [p[0], p[1] - d];
const label = (p: [number, number], h = 4.5): [number, number, number] => [p[0], h, p[1]];

export const BENIN_INTERACTABLES: Interactable[] = [
  {
    id: 'oba-palace',
    place: 'benin',
    name: "Oba's Palace",
    emoji: '👑',
    label: label(BENIN.palace, 5.5),
    activities: [
      { id: 'palace-tour', label: "Tour the palace courtyards", doing: 'Learning 800 years of Benin Kingdom history 👑', emoji: '🏛️', minutes: 90, cost: 3000, gains: { fun: 20, social: 5 }, hours: [10, 17], spot: north(BENIN.palace) },
      { id: 'palace-greet', label: "Greet the Oba's chiefs (Oba gha to kpere! 🙏🏾)", doing: 'Kneeling to greet the palace chiefs 🙏🏾', emoji: '🙏🏾', minutes: 30, gains: { social: 15, fun: 5 }, effects: { packaging: 2 }, hours: [9, 17], spot: north(BENIN.palace) },
    ],
  },
  {
    id: 'igun-street',
    place: 'benin',
    name: 'Igun Street bronze casters',
    emoji: '🗿',
    label: label(BENIN.igun, 3.6),
    activities: [
      { id: 'watch-casting', label: 'Watch them pour bronze', doing: 'Watching hot bronze enter the mould 🔥', emoji: '🔥', minutes: 30, gains: { fun: 12 }, hours: [8, 18], spot: north(BENIN.igun, 3.5) },
      { id: 'buy-bronze', label: 'Buy bronze head for your parlour', doing: 'Pricing bronze head with the caster 🗿', emoji: '🗿', minutes: 30, cost: 25000, gains: { fun: 10 }, effects: { packaging: 8 }, hours: [8, 18], spot: north(BENIN.igun, 3.5) },
      { id: 'bronze-apprentice', label: 'Bronze casting apprentice (5 hrs)', doing: 'Shaping wax and blowing the furnace 🗿', emoji: '⚒️', minutes: 300, pay: 9000, gains: { energy: -25, hygiene: -15, fun: 5 }, hours: [8, 17], spot: north(BENIN.igun, 3.5) },
    ],
  },
  {
    id: 'benin-museum',
    place: 'benin',
    name: 'National Museum',
    emoji: '🏺',
    label: label(BENIN.museum, 5),
    activities: [
      { id: 'museum-tour', label: 'Tour the museum (Benin bronzes)', doing: 'Looking at the old bronze plaques 🏺', emoji: '🏺', minutes: 60, cost: 1000, gains: { fun: 15, social: 5 }, hours: [9, 17], spot: north(BENIN.museum) },
    ],
  },
  {
    id: 'ring-road',
    place: 'benin',
    name: "King's Square (Ring Road)",
    emoji: '⭕',
    label: label(BENIN.ring, 4.2),
    activities: [
      { id: 'ring-snap', label: "Snap picture for King's Square", doing: 'Posing in front of the statue 📸', emoji: '📸', minutes: 10, gains: { fun: 8, social: 5 }, spot: south(BENIN.ring, -4.6) },
      { id: 'ring-hawk', label: 'Sell gala for Ring Road go-slow (3 hrs)', doing: 'Running between cars for Ring Road 🥤', emoji: '🥤', minutes: 180, pay: 5000, gains: { energy: -20, hygiene: -10 }, hours: [7, 19], away: true, spot: south(BENIN.ring, -4.6) },
    ],
  },
  {
    id: 'banga-buka',
    place: 'benin',
    name: 'Mama Osas buka',
    emoji: '🍲',
    label: label(BENIN.buka, 3),
    activities: [
      { id: 'banga', label: 'Banga soup & starch', doing: 'Swallowing starch with banga 🍲', emoji: '🍲', minutes: 30, cost: 2500, gains: { food: 45 }, pose: 'sit', hours: [7, 21], spot: [BENIN.buka[0], BENIN.buka[1] + 1.8] },
      { id: 'owo-soup', label: 'Owo soup & yam', doing: 'Enjoying owo soup 🍠', emoji: '🍠', minutes: 30, cost: 2000, gains: { food: 40 }, pose: 'sit', hours: [7, 21], spot: [BENIN.buka[0], BENIN.buka[1] + 1.8] },
      { id: 'palm-wine', label: 'Fresh palm wine', doing: 'Drinking palm wine from calabash 🥥', emoji: '🥥', minutes: 30, cost: 800, gains: { fun: 15, social: 10 }, pose: 'sit', hours: [10, 22], spot: [BENIN.buka[0], BENIN.buka[1] + 1.8] },
    ],
  },
  {
    id: 'benin-hotel',
    place: 'benin',
    name: 'Hotel',
    emoji: '🏨',
    label: label(BENIN.hotel, 6),
    activities: [
      { id: 'benin-sleep', label: 'Book room & sleep (8 hrs)', doing: 'Sleeping for hotel ❄️', emoji: '🏨', minutes: 480, cost: 25000, gains: { energy: 95, hygiene: 30 }, sleep: true, spot: south(BENIN.hotel, -3.4) },
    ],
  },
  {
    id: 'benin-park',
    place: 'benin',
    name: 'Luxury bus park',
    emoji: '🚌',
    label: label(BENIN.park, 3.4),
    activities: [ride('benin-abuja', 'Luxury bus go Abuja (Utako park, 8 hrs)', '🚌', 'utako', 480, 12000, south(BENIN.park, 2.2))],
  },
  {
    id: 'benin-airport',
    place: 'benin',
    name: 'Benin Airport desk',
    emoji: '🛫',
    label: label(BENIN.airport, 4),
    activities: [
      fly('fly-bni-abv-eco', 'BNI', 'ABV', 'economy', south(BENIN.airport, 2.6), 75000),
      fly('fly-bni-abv-biz', 'BNI', 'ABV', 'business', south(BENIN.airport, 2.6), 250000),
    ],
  },
];
