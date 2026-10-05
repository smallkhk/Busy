import { ride, type Interactable } from './common';

/**
 * The newer districts. Every scene in src/world/places/Districts.tsx shares one layout:
 * three spots along the back (x ≈ -4.2, -0.6, 2.8) and a motor park front right.
 */
const A: [number, number] = [-4.2, -1.3];
const B: [number, number] = [-0.6, -1.3];
const C: [number, number] = [2.8, -1.2];
const PARK: [number, number] = [4.4, 2.6];
const PARK_LABEL: [number, number, number] = [5.0, 2.4, 3.0];

export const DISTRICT_INTERACTABLES: Interactable[] = [
  // ---------------- Maitama: embassies and big money ----------------
  {
    id: 'embassy',
    place: 'maitama',
    name: 'Embassy',
    emoji: '🛂',
    label: [-4.2, 3.2, -2.6],
    activities: [
      { id: 'visa-interview', label: 'Visa interview (japa attempt)', doing: 'Answering "Why you wan travel?"', emoji: '🛂', minutes: 240, cost: 85000, gains: { energy: -10, fun: -10 }, effects: { packaging: 8, meet: 'aisha' }, hours: [8, 12], requires: { packaging: 35 }, spot: A },
      { id: 'embassy-queue', label: 'Hold space for visa queue (pay)', doing: 'Holding place for queue since 5am', emoji: '🧍🏾', minutes: 300, pay: 8000, gains: { energy: -20, fun: -10, social: 10 }, hours: [5, 9], spot: A },
    ],
  },
  {
    id: 'finedine',
    place: 'maitama',
    name: 'Fine dining',
    emoji: '🍽️',
    label: [-0.6, 3.0, -2.6],
    activities: [
      { id: 'continental', label: 'Continental dinner (big boy)', doing: 'Cutting steak with knife and fork', emoji: '🥩', minutes: 90, cost: 40000, gains: { food: 70, fun: 30, social: 20 }, effects: { packaging: 3 }, hours: [12, 23], requires: { packaging: 35 }, spot: B },
      { id: 'pastry', label: 'Coffee & croissant', doing: 'Sipping ₦6,000 coffee', emoji: '☕', minutes: 30, cost: 6000, gains: { food: 15, fun: 15 }, hours: [7, 20], spot: B },
    ],
  },
  {
    id: 'villa-gate',
    place: 'maitama',
    name: 'Mansion gate',
    emoji: '🏰',
    label: [2.8, 2.6, -2.4],
    activities: [
      { id: 'gateman', label: 'Night security for mansion (8 hrs)', doing: 'Guarding big man house', emoji: '🔦', minutes: 480, pay: 12000, gains: { energy: -30, fun: -10 }, hours: [18, 21], away: true, spot: C },
      { id: 'gardener', label: 'Cut grass for mansion (4 hrs)', doing: 'Cutting grass under sun', emoji: '🌿', minutes: 240, pay: 7000, gains: { energy: -20, hygiene: -15 }, hours: [7, 12], away: true, spot: C },
    ],
  },
  {
    id: 'maitama-park',
    place: 'maitama',
    name: 'Taxi rank',
    emoji: '🚕',
    label: PARK_LABEL,
    activities: [
      ride('mai-home', 'Taxi go your area (home)', '🚕', 'street', 45, 5000, PARK),
      ride('mai-wuse', 'Taxi go Wuse Market', '🚕', 'wuse', 15, 1500, PARK),
      ride('mai-lounge', 'Taxi go Wuse 2 lounge', '🍾', 'lounge', 10, 1200, PARK),
      ride('mai-sec', 'Taxi go Federal Secretariat', '🏛️', 'secretariat', 15, 1500, PARK),
    ],
  },

  {
    id: 'maitama-fuel',
    place: 'maitama',
    name: 'Filling station',
    emoji: '⛽',
    label: [-4.6, 2.6, 3.0],
    activities: [
      { id: 'indie-fill', label: 'Fill 20 litres (no queue)', doing: 'Attendant dey pump fuel', emoji: '⛽', minutes: 15, cost: 23000, gains: {}, effects: { fuel: 20 }, spot: [-3.4, 2.4] },
      { id: 'indie-top', label: 'Top up 5 litres', doing: 'Attendant dey pump fuel', emoji: '⛽', minutes: 10, cost: 5800, gains: {}, effects: { fuel: 5 }, spot: [-3.4, 2.4] },
    ],
  },

  // ---------------- Asokoro: government and VIPs ----------------
  {
    id: 'golf',
    place: 'asokoro',
    name: 'Golf club',
    emoji: '⛳',
    label: [-4.2, 2.4, -2.6],
    activities: [
      { id: 'golf', label: 'Play golf with big men', doing: 'Swinging club, laughing at Oga jokes', emoji: '⛳', minutes: 180, cost: 30000, gains: { fun: 30, social: 30, energy: -10 }, effects: { meet: 'hon' }, hours: [7, 17], requires: { packaging: 45 }, spot: A },
      { id: 'caddie', label: 'Caddie: carry golf bag (5 hrs)', doing: 'Carrying golf bag for Oga', emoji: '🏌🏾', minutes: 300, pay: 9000, gains: { energy: -25, social: 10 }, hours: [7, 13], away: true, spot: A },
    ],
  },
  {
    id: 'agency',
    place: 'asokoro',
    name: 'Federal agency',
    emoji: '🏢',
    label: [-0.6, 3.4, -2.8],
    activities: [
      { id: 'contract-bid', label: 'Submit contract bid', doing: 'Waiting for Director to sign', emoji: '📑', minutes: 240, pay: 120000, gains: { energy: -20, fun: -10, social: 10 }, hours: [8, 14], requires: { longLeg: 30 }, spot: B },
      { id: 'agency-cv', label: 'Drop CV for agency', doing: 'Dropping CV for reception', emoji: '📄', minutes: 60, gains: { energy: -5 }, effects: { cv: 1 }, hours: [8, 15], spot: B },
    ],
  },
  {
    id: 'aso-suya',
    place: 'asokoro',
    name: 'Mallam suya',
    emoji: '🍢',
    label: [2.8, 2.2, -2.2],
    activities: [
      { id: 'aso-suya', label: 'Suya & onions', doing: 'Enjoying hot suya', emoji: '🍢', minutes: 20, cost: 2500, gains: { food: 35, fun: 15 }, hours: [17, 24], spot: C },
    ],
  },
  {
    id: 'asokoro-park',
    place: 'asokoro',
    name: 'Bus stop',
    emoji: '🚏',
    label: PARK_LABEL,
    activities: [
      ride('aso-home', 'Bus go your area (home)', '🚌', 'street', 85, 1100, PARK),
      ride('aso-sec', 'Bus go Federal Secretariat', '🏛️', 'secretariat', 15, 300, PARK),
      ride('aso-garki', 'Taxi go Garki Area 1', '🚕', 'garki', 12, 1000, PARK),
      ride('aso-nyanya', 'Bus go Nyanya', '🚌', 'nyanya', 30, 400, PARK),
    ],
  },

  // ---------------- Garki Area 1: market, POS, mechanics ----------------
  {
    id: 'area1',
    place: 'garki',
    name: 'Area 1 market',
    emoji: '🧺',
    label: [-4.2, 2.4, -2.6],
    activities: [
      { id: 'a1-foodstuff', label: 'Buy foodstuff (6 meals), cheaper than Wuse', doing: 'Haggling for Area 1', emoji: '🧺', minutes: 40, cost: 7500, gains: { social: 8 }, effects: { pantry: 6 }, hours: [7, 18], spot: A },
      { id: 'a1-shirt', label: 'Okrika shirt (second grade)', doing: 'Digging okrika bale', emoji: '👕', minutes: 20, cost: 4500, gains: { fun: 3 }, effects: { packaging: 4 }, hours: [8, 18], spot: A },
    ],
  },
  {
    id: 'pos-stand',
    place: 'garki',
    name: 'POS stand',
    emoji: '🏧',
    label: [-0.6, 2.0, -2.2],
    activities: [
      { id: 'pos-agent', minigame: 'pos', label: 'Run POS stand (5 hrs)', doing: 'Counting cash, "network no dey"', emoji: '🏧', minutes: 300, pay: 7500, gains: { energy: -15, social: 12, fun: -5 }, hours: [8, 18], spot: B },
    ],
  },
  {
    id: 'mechanic',
    place: 'garki',
    name: 'Mechanic village',
    emoji: '🔧',
    label: [2.8, 2.2, -2.4],
    activities: [
      { id: 'car-service', label: 'Service your car (+40 condition)', doing: 'Mechanic dey "check am well"', emoji: '🔧', minutes: 120, cost: 35000, gains: { fun: -5 }, effects: { carFix: 40 }, hours: [8, 18], requires: { car: true }, spot: C },
      { id: 'washcars', minigame: 'wash', label: 'Wash cars for mechanic village (3 hrs)', doing: 'Washing dusty cars', emoji: '🧽', minutes: 180, pay: 5500, gains: { energy: -18, hygiene: -15 }, hours: [8, 17], spot: C },
      { id: 'apprentice', label: 'Help mechanic (6 hrs)', doing: 'Holding spanner, learning work', emoji: '🪛', minutes: 360, pay: 6000, gains: { energy: -25, hygiene: -35, social: 10 }, hours: [8, 14], away: true, spot: C },
    ],
  },
  {
    id: 'garki-park',
    place: 'garki',
    name: 'Area 1 motor park',
    emoji: '🚌',
    label: PARK_LABEL,
    activities: [
      ride('garki-home', 'Bus go your area (home)', '🚌', 'street', 75, 900, PARK),
      ride('garki-wuse', 'Bus go Wuse Market', '🚌', 'wuse', 20, 300, PARK),
      ride('garki-sec', 'Bus go Federal Secretariat', '🏛️', 'secretariat', 12, 200, PARK),
      ride('garki-nyanya', 'Bus go Nyanya', '🚌', 'nyanya', 40, 500, PARK),
      ride('garki-airport', 'Airport shuttle', '✈️', 'airport', 70, 3000, PARK),
      ride('garki-hosp', 'Taxi go General Hospital', '🏥', 'hospital', 8, 700, PARK),
    ],
  },

  {
    id: 'nnpc',
    place: 'garki',
    name: 'NNPC mega station',
    emoji: '⛽',
    label: [-4.6, 2.6, 3.0],
    activities: [
      { id: 'nnpc-fill', label: 'Join queue, fill 20 litres (cheapest)', doing: 'Waiting for fuel queue 😮‍💨', emoji: '⛽', minutes: 90, cost: 19000, gains: { fun: -10 }, effects: { fuel: 20 }, hours: [7, 19], spot: [-3.4, 2.4] },
    ],
  },

  // ---------------- Nyanya: where Abuja workers sleep ----------------
  {
    id: 'nyanya-mamaput',
    place: 'nyanya',
    name: 'Mama Put',
    emoji: '🍲',
    label: [-4.2, 2.2, -2.4],
    activities: [
      { id: 'mamaput', label: 'Eba & egusi', doing: 'Chopping with hand', emoji: '🍲', minutes: 25, cost: 1200, gains: { food: 50, social: 8 }, hours: [7, 21], spot: A },
    ],
  },
  {
    id: 'nyanya-barber',
    place: 'nyanya',
    name: 'Barbing salon',
    emoji: '💈',
    label: [-0.6, 2.4, -2.6],
    activities: [
      { id: 'haircut', label: 'Haircut & beard trim', doing: 'Barber dey line you up', emoji: '💈', minutes: 30, cost: 1500, gains: { hygiene: 10, fun: 5 }, effects: { packaging: 2 }, hours: [8, 21], spot: B },
    ],
  },
  {
    id: 'crusade',
    place: 'nyanya',
    name: 'Crusade ground',
    emoji: '⛪',
    label: [2.8, 2.6, -2.4],
    activities: [
      { id: 'crusade', label: 'Attend evening crusade', doing: 'Singing and dancing for crusade', emoji: '🙌🏾', minutes: 120, gains: { fun: 15, social: 25, energy: -5 }, hours: [17, 22], spot: C },
    ],
  },
  {
    id: 'nyanya-park',
    place: 'nyanya',
    name: 'Nyanya motor park',
    emoji: '🚌',
    label: PARK_LABEL,
    activities: [
      { id: 'conductor', minigame: 'timing', label: 'Bus conductor: "Nyanya! Mararaba!" (5 hrs)', doing: 'Hanging for bus door, shouting route', emoji: '📢', minutes: 300, pay: 6500, gains: { energy: -30, hygiene: -20, social: 10 }, hours: [5, 10], away: true, spot: PARK },
      ride('nyanya-home', 'Bus go your area (home)', '🚌', 'street', 110, 1200, PARK),
      ride('nyanya-garki', 'Bus go Garki Area 1', '🚌', 'garki', 40, 500, PARK),
      ride('nyanya-sec', 'Bus go Federal Secretariat', '🏛️', 'secretariat', 45, 500, PARK),
      ride('nyanya-aso', 'Bus go Asokoro', '🚌', 'asokoro', 30, 400, PARK),
    ],
  },

  {
    id: 'jerrycan',
    place: 'nyanya',
    name: 'Black market fuel',
    emoji: '🛢️',
    label: [-1.6, 2.0, 3.0],
    activities: [
      { id: 'jerrycan-10', label: '10 litres from jerrycan boys (risky)', doing: 'Boys dey siphon fuel into your tank', emoji: '🛢️', minutes: 5, cost: 15000, gains: {}, effects: { fuel: 10, badFuel: 0.25 }, spot: [-1.6, 2.4] },
    ],
  },

  // ---------------- Airport ----------------
  {
    id: 'terminal',
    place: 'airport',
    name: 'Departure hall',
    emoji: '✈️',
    label: [-4.2, 3.2, -2.6],
    activities: [
      { id: 'planespot', label: 'Watch planes, dream of japa', doing: 'Watching planes take off ✈️', emoji: '🛫', minutes: 45, gains: { fun: 12 }, hours: [6, 22], spot: A },
      { id: 'porter', label: 'Help travellers carry bags (4 hrs)', doing: 'Pushing luggage trolley', emoji: '🧳', minutes: 240, pay: 6000, gains: { energy: -20, social: 10 }, hours: [6, 22], spot: A },
    ],
  },
  {
    id: 'airport-cafe',
    place: 'airport',
    name: 'Airport café',
    emoji: '☕',
    label: [-0.6, 2.6, -2.6],
    activities: [
      { id: 'airport-coffee', label: 'Coffee & sandwich (airport price 😭)', doing: 'Paying airport price', emoji: '🥪', minutes: 30, cost: 9000, gains: { food: 25, fun: 10 }, effects: { packaging: 2 }, hours: [5, 23], spot: B },
    ],
  },
  {
    id: 'airport-rank',
    place: 'airport',
    name: 'Airport taxi rank',
    emoji: '🚖',
    label: PARK_LABEL,
    activities: [
      { id: 'airport-shift', label: 'Airport taxi shift (needs car)', doing: 'Carrying travellers to town', emoji: '🚖', minutes: 360, pay: 30000, gains: { energy: -25, social: 10 }, hours: [6, 22], away: true, requires: { car: true }, spot: PARK },
      ride('air-home', 'Airport taxi go your area (home)', '🚖', 'street', 70, 12000, PARK),
      ride('air-garki', 'Shuttle go Garki Area 1', '🚐', 'garki', 70, 3000, PARK),
      ride('air-sec', 'Taxi go Federal Secretariat', '🏛️', 'secretariat', 55, 9000, PARK),
    ],
  },

  // ---------------- Utako: interstate park and tech ----------------
  {
    id: 'utako-market',
    place: 'utako',
    name: 'Electronics market',
    emoji: '🔌',
    label: [-4.2, 2.6, -2.6],
    activities: [
      { id: 'laptop', label: 'Buy tokunbo laptop (look serious)', doing: 'Testing keyboard and battery', emoji: '💻', minutes: 45, cost: 280000, gains: { fun: 10 }, effects: { packaging: 6 }, hours: [9, 18], spot: A },
      { id: 'phone-repair', label: 'Fix phones for the stand (5 hrs)', doing: 'Changing screen with small screwdriver', emoji: '📱', minutes: 300, pay: 8500, gains: { energy: -15, fun: -5, social: 8 }, hours: [9, 17], spot: A },
    ],
  },
  {
    id: 'hub',
    place: 'utako',
    name: 'Tech hub',
    emoji: '💻',
    label: [-0.6, 3.2, -2.8],
    activities: [
      { id: 'freelance', label: 'Freelance gig for foreign client (6 hrs)', doing: 'Coding with hub WiFi', emoji: '💻', minutes: 360, pay: 26000, gains: { energy: -25, fun: -5, social: 5 }, hours: [8, 20], requires: { packaging: 20 }, spot: B },
      { id: 'meetup', label: 'Tech meetup (free pizza 🍕)', doing: 'Networking with founders', emoji: '🍕', minutes: 120, gains: { food: 25, fun: 15, social: 25 }, effects: { packaging: 1 }, hours: [17, 21], spot: B },
    ],
  },
  {
    id: 'utako-food',
    place: 'utako',
    name: 'Bole & fish spot',
    emoji: '🐟',
    label: [2.8, 2.2, -2.4],
    activities: [
      { id: 'bole', label: 'Bole & fish with pepper sauce', doing: 'Enjoying roasted plantain', emoji: '🐟', minutes: 25, cost: 2500, gains: { food: 45, fun: 12 }, hours: [11, 22], spot: C },
    ],
  },
  {
    id: 'utako-park',
    place: 'utako',
    name: 'Utako interstate park',
    emoji: '🚍',
    label: PARK_LABEL,
    activities: [
      { id: 'village', label: 'Travel go village for weekend (2 days)', doing: 'Enjoying village life 🌴', emoji: '🌴', minutes: 2880, cost: 30000, gains: { fun: 70, social: 60, energy: 30, food: 50 }, hours: [6, 12], away: true, spot: PARK },
      { id: 'loader', label: 'Load luggage for interstate buses (4 hrs)', doing: 'Lifting bags onto bus roof', emoji: '🧳', minutes: 240, pay: 6000, gains: { energy: -28, hygiene: -15, social: 5 }, hours: [5, 12], away: true, spot: PARK },
      ride('utako-home', 'Bus go your area (home)', '🚌', 'street', 45, 600, PARK),
      ride('utako-wuse', 'Taxi go Wuse Market', '🚕', 'wuse', 12, 1000, PARK),
      ride('utako-jabi', 'Taxi go Jabi Lake Mall', '🚕', 'jabi', 10, 1000, PARK),
      ride('utako-sec', 'Bus go Federal Secretariat', '🏛️', 'secretariat', 25, 300, PARK),
    ],
  },

  // ---------------- Mararaba: across the border in Nasarawa ----------------
  {
    id: 'mararaba-market',
    place: 'mararaba',
    name: 'Mararaba market',
    emoji: '🧺',
    label: [-4.2, 2.4, -2.6],
    activities: [
      { id: 'mr-foodstuff', label: 'Buy foodstuff (6 meals), cheapest for town', doing: 'Pricing for Mararaba market', emoji: '🧺', minutes: 50, cost: 6000, gains: { social: 10 }, effects: { pantry: 6 }, hours: [7, 18], spot: A },
      { id: 'mr-trader', label: 'Help trader sell (5 hrs)', doing: 'Shouting "Buy am, e cheap!"', emoji: '📣', minutes: 300, pay: 5000, gains: { energy: -20, social: 15 }, hours: [7, 13], spot: A },
    ],
  },
  {
    id: 'peppersoup',
    place: 'mararaba',
    name: 'Pepper soup joint',
    emoji: '🍲',
    label: [-0.6, 2.4, -2.6],
    activities: [
      { id: 'peppersoup', label: 'Goat meat pepper soup & cold drink', doing: 'Sweating from pepper soup 🥵', emoji: '🍲', minutes: 40, cost: 1800, gains: { food: 40, fun: 18, social: 10 }, hours: [12, 24], spot: B },
    ],
  },
  {
    id: 'okada-stand',
    place: 'mararaba',
    name: 'Okada stand',
    emoji: '🏍️',
    label: [2.8, 2.2, -2.4],
    activities: [
      { id: 'okada', label: 'Ride okada (banned for FCT, allowed here) (5 hrs)', doing: 'Carrying passengers on okada', emoji: '🏍️', minutes: 300, pay: 7500, gains: { energy: -25, hygiene: -15, fun: 5 }, hours: [6, 19], away: true, spot: C },
    ],
  },
  {
    id: 'mararaba-park',
    place: 'mararaba',
    name: 'Mararaba park',
    emoji: '🚌',
    label: PARK_LABEL,
    activities: [
      ride('mr-nyanya', 'Bus go Nyanya', '🚌', 'nyanya', 15, 200, PARK),
      ride('mr-garki', 'Bus go Garki Area 1', '🚌', 'garki', 50, 600, PARK),
      ride('mr-home', 'Bus go your area (home)', '🚌', 'street', 120, 1300, PARK),
    ],
  },
];

/** Extra public routes from the older parks to the new districts. */
export const NEW_ROUTES: Record<string, ReturnType<typeof ride>[]> = {
  'nyanya-park': [ride('nyanya-mr', 'Bus go Mararaba', '🚌', 'mararaba', 15, 200, [4.4, 2.6])],
  'jabi-park': [ride('jabi-utako', 'Taxi go Utako', '🚕', 'utako', 10, 1000, [4.4, 2.4])],
  'wuse-park': [
    ride('wuse-utako', 'Taxi go Utako', '🚕', 'utako', 12, 1000, [-5.0, 2.2]),
    ride('wuse-mai', 'Taxi go Maitama', '🚕', 'maitama', 15, 1500, [-5.0, 2.2]),
    ride('wuse-garki', 'Bus go Garki Area 1', '🚌', 'garki', 20, 300, [-5.0, 2.2]),
  ],
  'sec-bus': [
    ride('sec-aso', 'Bus go Asokoro', '🚌', 'asokoro', 15, 300, [4.6, 2.6]),
    ride('sec-garki', 'Bus go Garki Area 1', '🚌', 'garki', 12, 200, [4.6, 2.6]),
    ride('sec-nyanya', 'Bus go Nyanya', '🚌', 'nyanya', 45, 500, [4.6, 2.6]),
  ],
  'hospital-park': [ride('hosp-garki', 'Taxi go Garki Area 1', '🚕', 'garki', 8, 700, [4.4, 2.6])],
  'lounge-park': [ride('lounge-mai', 'Taxi go Maitama', '🚕', 'maitama', 10, 1200, [4.6, 2.6])],
};
