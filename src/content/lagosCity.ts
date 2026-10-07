import type { GameEvent } from '../engine/events';
import type { Activity, Interactable } from './common';

/**
 * Lagos, bigger: the mainland to the west (Oshodi, Computer Village, the
 * Shrine, Yaba, UNILAG, National Theatre), the lagoon in the middle with
 * Third Mainland Bridge and the Lekki-Ikoyi Link Bridge across it, and the
 * Island to the east (Tafawa Balewa Square, Lekki Conservation Centre).
 * The old centre (airport, danfo park, Balogun, buka, VI hotel, beach) stays.
 */
export const LAGOS_CITY = {
  oshodi: [-52, -12] as [number, number],
  cv: [-52, -38] as [number, number],
  shrine: [-20, -38] as [number, number],
  yaba: [0, -38] as [number, number],
  unilag: [18, -38] as [number, number],
  theatre: [10, -19] as [number, number],
  tbs: [52, -36] as [number, number],
  lcc: [52, -12] as [number, number],
};
/** Lagoon between mainland and Island (x range), and the city roads. */
export const LAGOON: [number, number] = [34, 42];
export const LAGOS_ROADS = { ew: -26, nsMain: -44, nsIsland: 47 };
export const THIRD_MAINLAND_Z = -42;
export const LINK_BRIDGE_Z = -24;

/** Danfo stops round Lagos: [id, name, where you land]. */
const STOPS: [string, string, [number, number]][] = [
  ['centre', 'Danfo park (Balogun side)', [0, 3.8]],
  ['oshodi', 'Oshodi', [-52, -4.5]],
  ['cv', 'Computer Village (Ikeja)', [-52, -30.5]],
  ['shrine', 'New Afrika Shrine', [-20, -30.5]],
  ['yaba', 'Yaba', [0, -30.5]],
  ['unilag', 'UNILAG (Akoka)', [18, -30.5]],
  ['theatre', 'National Theatre', [1, -13]],
  ['tbs', 'Tafawa Balewa Square', [52, -28.5]],
  ['lcc', 'Lekki Conservation Centre', [52, -5]],
];
export const DANFO_AT: [number, number][] = STOPS.map(([, , at]) => at);

const rides = (from: string, at: [number, number]): Activity[] =>
  STOPS.filter(([id]) => id !== from).map(([id, name, to]) => ({
    id: `danfo-${from}-${id}`,
    label: `Danfo go ${name}`,
    doing: `"${name}! Enter with your change!" 🚐`,
    emoji: '🚐',
    minutes: 25,
    cost: 400,
    gains: { fun: 2, energy: -2 },
    away: true,
    warpTo: to,
    spot: [at[0] + 1.6, at[1] + 0.6] as [number, number],
  }));

const north = (p: [number, number], d: number): [number, number] => [p[0], p[1] + d];
const label = (p: [number, number], h: number): [number, number, number] => [p[0], h, p[1]];

export const LAGOS_CITY_INTERACTABLES: Interactable[] = [
  ...STOPS.map(([id, name, at]): Interactable => ({ id: `danfo-stop-${id}`, place: 'lagos', name: `Danfo stop (${name})`, emoji: '🚐', label: [at[0] + 1.6, 2.2, at[1]], activities: rides(id, at) })),
  {
    id: 'oshodi',
    place: 'lagos',
    name: 'Oshodi',
    emoji: '🚏',
    label: label(LAGOS_CITY.oshodi, 4),
    activities: [
      { id: 'oshodi-buy', label: 'Buy under-bridge bargain (shirt, belt, wristwatch)', doing: 'Pricing things for Oshodi 🛍️', emoji: '🛍️', minutes: 30, cost: 3000, gains: { fun: 10 }, effects: { packaging: 3 }, hours: [7, 20], spot: north(LAGOS_CITY.oshodi, 7.5) },
      { id: 'brt-conductor', label: 'BRT bus conductor (5 hrs)', doing: '"Oshodi! CMS! Obalende!" 🚌', emoji: '🚌', minutes: 300, pay: 11000, gains: { energy: -25, social: 15, hygiene: -10 }, hours: [6, 20], away: true, spot: north(LAGOS_CITY.oshodi, 7.5) },
    ],
  },
  {
    id: 'computer-village',
    place: 'lagos',
    name: 'Computer Village (Ikeja)',
    emoji: '📱',
    label: label(LAGOS_CITY.cv, 4),
    activities: [
      { id: 'cv-phone', label: 'Buy UK-used iPhone', doing: '"Original o! Check the battery health!" 📱', emoji: '📱', minutes: 45, cost: 60000, gains: { fun: 15 }, effects: { packaging: 8 }, hours: [8, 19], spot: north(LAGOS_CITY.cv, 7.5) },
      { id: 'cv-repair', label: 'Phone repair apprentice (5 hrs)', doing: 'Changing screens and charging ports 🔧', emoji: '🔧', minutes: 300, pay: 12000, gains: { energy: -20, social: 10 }, hours: [8, 19], spot: north(LAGOS_CITY.cv, 7.5) },
    ],
  },
  {
    id: 'shrine',
    place: 'lagos',
    name: 'New Afrika Shrine',
    emoji: '🎷',
    label: label(LAGOS_CITY.shrine, 5),
    activities: [
      { id: 'shrine-night', label: 'Afrobeat night at the Shrine', doing: 'Dancing to live Afrobeat horns 🎷', emoji: '🎷', minutes: 150, cost: 3000, gains: { fun: 40, social: 25, energy: -15 }, hours: [19, 24], spot: north(LAGOS_CITY.shrine, 7.5) },
    ],
  },
  {
    id: 'yaba-hub',
    place: 'lagos',
    name: 'Yaba tech hub',
    emoji: '💻',
    label: label(LAGOS_CITY.yaba, 7),
    activities: [
      { id: 'yaba-hack', label: 'Hackathon (6 hrs)', doing: 'Coding all day with Yaba techies 💻', emoji: '💻', minutes: 360, pay: 20000, gains: { energy: -25, social: 20, fun: 10 }, effects: { meet: 'seun' }, hours: [9, 20], spot: north(LAGOS_CITY.yaba, 7.5) },
    ],
  },
  {
    id: 'unilag',
    place: 'lagos',
    name: 'UNILAG (Akoka)',
    emoji: '🎓',
    label: label(LAGOS_CITY.unilag, 6),
    activities: [
      { id: 'unilag-walk', label: 'Waka round UNILAG', doing: 'Touring the University of First Choice 🎓', emoji: '🎓', minutes: 60, gains: { fun: 12, social: 12 }, hours: [8, 19], spot: north(LAGOS_CITY.unilag, 7.5) },
      { id: 'unilag-lagoon', label: 'Chill by the lagoon front', doing: 'Enjoying lagoon breeze 🌊', emoji: '🌊', minutes: 45, gains: { fun: 18, energy: 5 }, hours: [8, 20], spot: north(LAGOS_CITY.unilag, 7.5) },
    ],
  },
  {
    id: 'national-theatre',
    place: 'lagos',
    name: 'National Theatre (Iganmu)',
    emoji: '🎭',
    label: label(LAGOS_CITY.theatre, 7),
    activities: [
      { id: 'theatre-play', label: 'Watch stage play', doing: 'Laughing at Yoruba stage comedy 🎭', emoji: '🎭', minutes: 120, cost: 4000, gains: { fun: 30, social: 10 }, hours: [14, 22], spot: [LAGOS_CITY.theatre[0] - 7, LAGOS_CITY.theatre[1] + 6] },
    ],
  },
  {
    id: 'tbs',
    place: 'lagos',
    name: 'Tafawa Balewa Square',
    emoji: '🏟️',
    label: label(LAGOS_CITY.tbs, 6),
    activities: [
      { id: 'tbs-concert', label: 'Concert at TBS', doing: 'Shouting for your favourite artiste 🎤', emoji: '🎤', minutes: 180, cost: 5000, gains: { fun: 45, social: 25, energy: -20 }, hours: [16, 23], spot: north(LAGOS_CITY.tbs, 7.5) },
      { id: 'tbs-snap', label: 'Snap with the horses statue', doing: 'Posing at the big arches 📸', emoji: '📸', minutes: 10, gains: { fun: 8, social: 5 }, spot: north(LAGOS_CITY.tbs, 7.5) },
    ],
  },
  {
    id: 'lcc',
    place: 'lagos',
    name: 'Lekki Conservation Centre',
    emoji: '🌳',
    label: label(LAGOS_CITY.lcc, 5),
    activities: [
      { id: 'lcc-canopy', label: 'Canopy walkway (high up!)', doing: 'Walking on the swinging walkway 😱🌳', emoji: '🌳', minutes: 90, cost: 3000, gains: { fun: 30, energy: -10 }, hours: [9, 17], spot: north(LAGOS_CITY.lcc, 7) },
    ],
  },
];

/** Things wey fit happen to you for Lagos (they only fire there). */
const day = (h: number) => h >= 7 && h < 20;
export const LAGOS_EVENTS: GameEvent[] = [
  {
    id: 'lagos-owo-ile',
    emoji: '🧍🏾‍♂️',
    title: 'Area boys don block you',
    text: '"Bros, you no fit just pass like that. Owo ile! Drop something for the boys."',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 72,
    city: 'lagos',
    when: (c) => day(c.hour),
    choices: [
      { label: 'Drop ₦1,000', cost: 1000, outcomes: [{ text: '"Correct guy! Waka well o!" 😅', effect: {} }] },
      {
        label: 'Form tough guy',
        outcomes: [
          { weight: 1, text: 'Dem look you, laugh, let you go. Lagos don train you 😎', effect: { needs: { fun: 5 } } },
          { weight: 1, text: 'Dem collect ₦3,000 from your pocket and your mood 😭', effect: { money: -3000, needs: { fun: -15 } } },
        ],
      },
    ],
  },
  {
    id: 'lagos-third-mainland-goslow',
    emoji: '🚗',
    title: 'Third Mainland go-slow',
    text: 'Traffic don hold for Third Mainland Bridge. Hawkers dey sell everything: plantain chips, phone charger, even dog 😂',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 72,
    city: 'lagos',
    choices: [
      { label: 'Buy plantain chips & Fanta', cost: 700, outcomes: [{ text: 'Go-slow sweet small with chips 😋', effect: { needs: { food: 15, fun: 5 } } }] },
      { label: 'Wait it out', outcomes: [{ text: 'Two hours later, you reach. Na Lagos 😮‍💨', effect: { minutes: 90, needs: { fun: -10, energy: -5 } } }] },
    ],
  },
  {
    id: 'lagos-flood',
    emoji: '🌊',
    title: 'Lagos flood',
    text: 'Rain fall for 30 minutes and water don cover the road reach knee. Canoe man dey carry people pass for ₦500.',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 96,
    city: 'lagos',
    choices: [
      { label: 'Enter canoe', cost: 500, outcomes: [{ text: 'You cross like Venice 😂 Dry and clean.', effect: { needs: { fun: 10 } } }] },
      { label: 'Wade through', outcomes: [{ text: 'Gutter water reach your waist 🤢', effect: { needs: { hygiene: -25 } } }] },
    ],
  },
  {
    id: 'lagos-celebrity',
    emoji: '🌟',
    title: 'Celebrity sighting!',
    text: 'One big Afrobeats star just come down from G-Wagon in front of you. Bodyguards everywhere.',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 120,
    city: 'lagos',
    when: (c) => c.hour >= 12,
    choices: [
      {
        label: 'Beg for selfie',
        outcomes: [
          { weight: 1, text: 'E smile, snap with you! Your Gram go crazy 📈', effect: { followersPct: 12, needs: { fun: 25 } } },
          { weight: 1, text: 'Bodyguard push you comot. Small shame 😬', effect: { needs: { fun: -5 } } },
        ],
      },
      { label: 'Act unbothered', outcomes: [{ text: 'You waka pass like say na your guy. Big vibes 😎', effect: { needs: { fun: 5 } } }] },
    ],
  },
  {
    id: 'lagos-danfo-change',
    emoji: '🚐',
    title: 'Conductor no get change',
    text: '"Oga, I no get change. Wait for next bus stop." Your ₦600 change dey im hand.',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 72,
    city: 'lagos',
    choices: [
      {
        label: 'Wait for the change',
        outcomes: [
          { weight: 2, text: 'E give you your change for Obalende. Honest conductor 🙏🏾', effect: {} },
          { weight: 1, text: 'You forget, comot. ₦600 don go 😩', effect: { money: -600 } },
        ],
      },
      { label: '"Keep am"', outcomes: [{ text: '"God bless you, Oga!" 😄', effect: { money: -600, needs: { social: 5 } } }] },
    ],
  },
];
