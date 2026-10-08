import { poolMatch, ride, type Interactable, tableGame } from './common';
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
  // The rest of the city, round the roads
  market: [-46, -11] as [number, number],
  cathedral: [-46, 13] as [number, number],
  moat: [-56, 0] as [number, number],
  uniben: [-10, -38] as [number, number],
  stadium: [24, -38] as [number, number],
  govt: [48, -13] as [number, number],
  gra: [48, 14] as [number, number],
  ubth: [-20, 17] as [number, number],
  zoo: [16, 18] as [number, number],
  faith: [-46, -38] as [number, number],
  lounge: [46, -37] as [number, number],
};
/** City roads: east–west at these z, north–south at these x. */
export const BENIN_ROADS = { ew: [1.6, -27, 26], ns: [-32, 34] };
/** Where you land, from the bus or the plane: by the bus park. */
export const BENIN_ENTRY: [number, number] = [17, 3.6];

export const BUKA_TABLE_BENCHES: [number, number][] = [-9.2, -6.8].map((x) => [x, 8.8]);
export const BENIN_SEATS: Seat[] = BUKA_TABLE_BENCHES.flatMap(([x, z]) => [-0.45, 0.45].map((dx) => ({ x: x + dx, z: z - 0.05, y: 0.45, rot: 0 })));

/** Keke round the city: [id, name, where you land]. */
const KEKE_STOPS: [string, string, [number, number]][] = [
  ['ring', "King's Square", [8, 3.8]],
  ['uniben', 'UNIBEN', [-10, -31]],
  ['market', 'Oba Market', [-46, -4]],
  ['stadium', 'Ogbemudia Stadium', [24, -31]],
  ['gra', 'GRA & Government House', [48, -4.5]],
  ['cathedral', 'Holy Cross Cathedral', [-46, 7.5]],
  ['ubth', 'UBTH (teaching hospital)', [-14, 12.6]],
  ['zoo', 'Ogba Zoo', [22, 12.6]],
  ['faith', 'Faith Arena', [-40, -31]],
  ['lounge', 'Airport Road lounge', [52, -31]],
];
export const KEKE_AT: [number, number][] = KEKE_STOPS.map(([, , at]) => at);
const kekeRides = (from: string) =>
  KEKE_STOPS.filter(([id]) => id !== from).map(([id, name, at]) => ({
    id: `keke-${from}-${id}`,
    label: `Keke go ${name}`,
    doing: `Inside keke to ${name} 🛺`,
    emoji: '🛺',
    minutes: 15,
    cost: 300,
    gains: { fun: 2 },
    away: true,
    warpTo: at,
  }));
const kekeStand = (from: string, name: string, at: [number, number]): Interactable => ({
  id: `keke-stand-${from}`,
  place: 'benin',
  name: `Keke stand (${name})`,
  emoji: '🛺',
  label: [at[0] + 1.6, 2.2, at[1]],
  activities: kekeRides(from).map((a) => ({ ...a, spot: [at[0] + 1.6, at[1] + 0.6] as [number, number] })),
});

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
      { id: 'palace-greet', label: "Greet the Oba's chiefs (Oba gha to kpere! 🙏🏾)", doing: 'Kneeling to greet the palace chiefs 🙏🏾', emoji: '🙏🏾', minutes: 30, gains: { social: 15, fun: 5 }, effects: { packaging: 2, meet: 'osagie' }, hours: [9, 17], spot: north(BENIN.palace) },
    ],
  },
  {
    id: 'igun-street',
    place: 'benin',
    name: 'Igun Street bronze casters',
    emoji: '🗿',
    label: label(BENIN.igun, 3.6),
    activities: [
      { id: 'watch-casting', label: 'Watch them pour bronze', doing: 'Watching hot bronze enter the mould 🔥', emoji: '🔥', minutes: 30, gains: { fun: 12 }, effects: { meet: 'ize' }, hours: [8, 18], spot: north(BENIN.igun, 3.5) },
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
      { id: 'banga', label: 'Banga soup & starch', doing: 'Swallowing starch with banga 🍲', emoji: '🍲', minutes: 30, cost: 2500, gains: { food: 45 }, effects: { meet: 'mamaosas' }, pose: 'sit', hours: [7, 21], spot: [BENIN.buka[0], BENIN.buka[1] + 1.8] },
      tableGame('ayo', 'ayo-benin', 1000, [BENIN.buka[0], BENIN.buka[1] + 1.8]),
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
      { id: 'benin-sleep', label: 'Book room & sleep (8 hrs)', doing: 'Sleeping for hotel ❄️', emoji: '🏨', minutes: 480, cost: 25000, gains: { energy: 95, hygiene: 30 }, sleep: true, spot: [BENIN.hotel[0], 3.9] },
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
  // ---------------- The rest of the city ----------------
  {
    id: 'oba-market',
    place: 'benin',
    name: 'Oba Market',
    emoji: '🧺',
    label: label(BENIN.market, 3.6),
    activities: [
      { id: 'oba-market-food', label: 'Buy foodstuff (6 meals, Benin price)', doing: 'Pricing garri, plantain and pepper 🧺', emoji: '🧺', minutes: 30, cost: 7000, gains: { social: 8 }, effects: { pantry: 6 }, hours: [7, 18], spot: north(BENIN.market, 6) },
      { id: 'oba-market-akara', label: 'Akara & pap', doing: 'Chopping hot akara 🫓', emoji: '🫓', minutes: 15, cost: 600, gains: { food: 25 }, hours: [6, 12], spot: north(BENIN.market, 6) },
      { id: 'oba-market-sell', label: 'Sell for market stall (5 hrs)', doing: '"Customer! Come buy, e cheap!" 🗣️', emoji: '🗣️', minutes: 300, pay: 10000, gains: { energy: -22, social: 15 }, hours: [7, 18], spot: north(BENIN.market, 6) },
    ],
  },
  {
    id: 'cathedral',
    place: 'benin',
    name: 'Holy Cross Cathedral',
    emoji: '⛪',
    label: label(BENIN.cathedral, 7),
    activities: [
      { id: 'benin-mass', label: 'Attend Mass', doing: 'Singing in the choir loft 🙏🏾', emoji: '⛪', minutes: 90, gains: { social: 15, fun: 10 }, hours: [7, 12], spot: south(BENIN.cathedral, 5.5) },
    ],
  },
  {
    id: 'moat',
    place: 'benin',
    name: 'Ancient Benin moat (Iya)',
    emoji: '🏞️',
    label: label(BENIN.moat, 2.6),
    activities: [
      { id: 'moat-walk', label: 'Walk by the ancient moat', doing: 'Seeing the walls the Benin Kingdom dig long ago 🏞️', emoji: '🏞️', minutes: 45, gains: { fun: 15, energy: -5 }, hours: [7, 18], spot: [BENIN.moat[0] + 3, BENIN.moat[1]] },
    ],
  },
  {
    id: 'uniben',
    place: 'benin',
    name: 'UNIBEN (Ugbowo campus)',
    emoji: '🎓',
    label: label(BENIN.uniben, 6),
    activities: [
      { id: 'uniben-walk', label: 'Waka round Ugbowo campus', doing: 'Touring UNIBEN with the students 🎓', emoji: '🎓', minutes: 60, gains: { fun: 12, social: 12 }, hours: [8, 19], spot: north(BENIN.uniben, 6.5) },
      { id: 'uniben-gist', label: 'Gist with UNIBEN students at the buka', doing: 'Gisting about lecturers and SUG 😂', emoji: '💬', minutes: 45, cost: 1200, gains: { social: 20, food: 20 }, effects: { meet: 'efe' }, hours: [9, 20], spot: north(BENIN.uniben, 6.5) },
    ],
  },
  {
    id: 'ogbemudia',
    place: 'benin',
    name: 'Samuel Ogbemudia Stadium',
    emoji: '🏟️',
    label: label(BENIN.stadium, 7),
    activities: [
      { id: 'bendel-match', minigame: 'predict', label: 'Watch Bendel Insurance match', doing: 'Shouting "Bendel! Bendel!" ⚽', emoji: '⚽', minutes: 120, cost: 1500, gains: { fun: 30, social: 15, energy: -8 }, hours: [14, 19], spot: north(BENIN.stadium, 7) },
      { id: 'stadium-jog-benin', label: 'Jog round the stadium', doing: 'Running laps 🏃🏾', emoji: '🏃🏾', minutes: 45, gains: { fun: 10, energy: -15, hygiene: -10 }, effects: { fitness: 3 }, hours: [6, 19], spot: north(BENIN.stadium, 7) },
    ],
  },
  {
    id: 'govt-house',
    place: 'benin',
    name: 'Edo Government House',
    emoji: '🏛️',
    label: label(BENIN.govt, 6),
    activities: [
      { id: 'govt-proposal', label: 'Submit business proposal', doing: 'Waiting for protocol officer with your file 📁', emoji: '📁', minutes: 120, gains: { energy: -10, social: 5 }, effects: { cv: 1 }, hours: [9, 15], spot: north(BENIN.govt, 5) },
    ],
  },
  {
    id: 'gra-shortlet',
    place: 'benin',
    name: 'GRA shortlet',
    emoji: '🏡',
    label: label(BENIN.gra, 5),
    activities: [
      { id: 'gra-sleep', label: 'Shortlet for GRA (sleep 8 hrs)', doing: 'Sleeping for GRA shortlet with AC ❄️', emoji: '🏡', minutes: 480, cost: 40000, gains: { energy: 95, hygiene: 35, fun: 10 }, sleep: true, spot: [BENIN.gra[0], 9.6] },
    ],
  },
  kekeStand('ring', "King's Square", [8, 3.8]),
  kekeStand('uniben', 'UNIBEN', [-10, -31]),
  kekeStand('market', 'Oba Market', [-46, -4]),
  kekeStand('stadium', 'Stadium', [24, -31]),
  kekeStand('gra', 'GRA', [48, -4.5]),
  kekeStand('cathedral', 'Cathedral', [-46, 7.5]),
  kekeStand('ubth', 'UBTH', [-14, 12.6]),
  kekeStand('zoo', 'Ogba Zoo', [22, 12.6]),
  kekeStand('faith', 'Faith Arena', [-40, -31]),
  kekeStand('lounge', 'Airport Road', [52, -31]),
  {
    id: 'ubth',
    place: 'benin',
    name: 'UBTH (University of Benin Teaching Hospital)',
    emoji: '🏥',
    label: label(BENIN.ubth, 6),
    activities: [
      { id: 'ubth-doctor', label: 'See doctor', doing: 'Waiting for UBTH clinic 🩺', emoji: '🩺', minutes: 150, cost: 12000, gains: { energy: 10, fun: -5 }, effects: { cure: true, meet: 'ehi' }, hours: [8, 16], spot: south(BENIN.ubth, 4.4) },
      { id: 'ubth-emergency', label: 'Emergency treatment', doing: 'Doctors dey work on you 🚑', emoji: '🚑', minutes: 120, cost: 30000, gains: { energy: 40 }, effects: { cure: true }, spot: south(BENIN.ubth, 4.4) },
    ],
  },
  {
    id: 'ogba-zoo',
    place: 'benin',
    name: 'Ogba Zoo & Nature Park',
    emoji: '🦁',
    label: label(BENIN.zoo, 4),
    activities: [
      { id: 'zoo-visit', label: 'See the animals', doing: 'Watching lion, monkey and ostrich 🦁', emoji: '🦁', minutes: 90, cost: 1500, gains: { fun: 25, social: 10 }, hours: [9, 18], spot: south(BENIN.zoo, 5.4) },
      { id: 'zoo-picnic', label: 'Picnic under the trees', doing: 'Chopping jollof under shade 🧺', emoji: '🧺', minutes: 60, cost: 3000, gains: { food: 20, fun: 15 }, hours: [9, 18], spot: south(BENIN.zoo, 5.4) },
    ],
  },
  {
    id: 'faith-arena',
    place: 'benin',
    name: 'Faith Arena (Church of God Mission)',
    emoji: '🙌🏾',
    label: label(BENIN.faith, 7),
    activities: [
      { id: 'faith-service', label: 'Attend Sunday service', doing: 'Clapping and dancing for praise 🙌🏾', emoji: '🙌🏾', minutes: 120, gains: { social: 20, fun: 15 }, hours: [7, 13], spot: north(BENIN.faith, 6.5) },
      { id: 'faith-crusade', label: 'Night crusade', doing: 'Shouting "Amen!" for crusade ground 🔥', emoji: '🔥', minutes: 120, gains: { fun: 20, social: 15, energy: -10 }, hours: [18, 23], spot: north(BENIN.faith, 6.5) },
    ],
  },
  {
    id: 'airport-rd-lounge',
    place: 'benin',
    name: 'Airport Road lounge',
    emoji: '🎶',
    label: label(BENIN.lounge, 4.6),
    activities: [
      { id: 'benin-club', label: 'Enjoy for the lounge', doing: 'Dancing to Edo highlife and Afrobeats 🎶', emoji: '🎶', minutes: 120, cost: 10000, gains: { fun: 35, social: 20, energy: -15 }, hours: [19, 24], requires: { packaging: 15 }, spot: north(BENIN.lounge, 5.5) },
      poolMatch('pool-benin', 3000, north(BENIN.lounge, 5.5)),
      { id: 'benin-hypeman', label: 'Hype man for the lounge (5 hrs)', doing: '"Make some noise for Benin!" 🎤', emoji: '🎤', minutes: 300, pay: 12000, gains: { energy: -25, social: 20, fun: 10 }, hours: [19, 24], spot: north(BENIN.lounge, 5.5) },
    ],
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
