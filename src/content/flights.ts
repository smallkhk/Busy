import { type Activity, type Interactable, type Place } from './common';
import type { Seat } from './seats';

/**
 * Flying between Abuja and Lagos on Zuma Air. Check in at the airport, sit in
 * the plane (the `cabin` place, a room everybody on board shares), and land in
 * the other city. Lagos is its own small map (`lagos`) for now.
 */
export const AIRLINE = 'Zuma Air';
export type Airport = 'ABV' | 'LOS';
export type FlightClass = 'economy' | 'business';

export const CITY_NAMES: Record<Airport, string> = { ABV: 'Abuja', LOS: 'Lagos' };
/** Where you come out after landing. */
export const LAND_PLACE: Record<Airport, Place> = { ABV: 'airport', LOS: 'lagos' };
export const FARES: Record<FlightClass, number> = { economy: 95000, business: 320000 };
/** Game minutes the flight shows (ABV–LOS is about 1h10). */
export const FLIGHT_MINUTES = 70;
/** Real seconds in the air: long enough to waka round the cabin. */
export const flightSeconds = (fast: boolean) => (fast ? 30 : 120);

export type Flight = {
  no: string;
  from: Airport;
  to: Airport;
  cls: FlightClass;
  /** Real ms take-off and how long in the air. */
  start: number;
  dur: number;
  /** Turbulence comes (once) on this flight. */
  bumpy: boolean;
  shook?: boolean;
};

export function newFlight(to: Airport, cls: FlightClass, now: number, fast: boolean, rand: () => number): Flight {
  const from: Airport = to === 'LOS' ? 'ABV' : 'LOS';
  // Odd numbers fly out of Abuja, even numbers fly back
  const n = 100 + Math.floor(rand() * 400);
  return { no: `ZA ${to === 'LOS' ? n | 1 : n & ~1}`, from, to, cls, start: now, dur: flightSeconds(fast) * 1000, bumpy: rand() < 0.5 };
}

export const flightProgress = (f: Flight, now: number) => Math.min(1, Math.max(0, (now - f.start) / f.dur));
export const minutesToLanding = (f: Flight, now: number) => Math.ceil((1 - flightProgress(f, now)) * FLIGHT_MINUTES);

/** What the captain and the seatbelt sign are saying. */
export function flightStatus(f: Flight, now: number): string {
  const p = flightProgress(f, now);
  if (p < 0.12) return '🛫 Taking off. Seatbelt sign is on';
  if (f.bumpy && p >= 0.45 && p < 0.58) return '⚠️ Turbulence! Return to your seat';
  if (p < 0.75) return '☁️ Through the clouds. The seatbelt sign is off';
  if (p < 1) return `🛬 Descending into ${CITY_NAMES[f.to]}. Seatbelt on`;
  return '🛬 Landed. Taxiing to the gate';
}

// ---------------- The cabin (local coordinates of the `cabin` place) ----------------
// The nose points to +x. Economy is 3-3 at the back, business 2-2 in front.
export const ECON_ROWS = Array.from({ length: 12 }, (_, i) => -9.5 + i * 1.0);
export const ECON_ZS = [-1.55, -1.05, -0.55, 0.55, 1.05, 1.55];
export const BIZ_ROWS = [4.2, 5.7, 7.2];
export const BIZ_ZS = [-1.4, -0.7, 0.7, 1.4];
export const ECON_TOP = 0.45;
export const BIZ_TOP = 0.48;
const FORWARD = Math.PI / 2;
/** Your bottom sits a touch behind the seat centre, facing the nose. */
const seatAt = (x: number, z: number, y: number): Seat => ({ x: x - 0.05, z, y, rot: FORWARD });

/** Passengers already in their seats: [x, z, shirt, woman?]. */
export const CABIN_TAKEN: [number, number, string, boolean?][] = [
  [-9.5, -1.05, '#2980b9'],
  [-8.5, 0.55, '#e74c3c', true],
  [-7.5, -1.55, '#27ae60'],
  [-6.5, 1.05, '#f1c40f', true],
  [-5.5, -0.55, '#9b59b6', true],
  [-4.5, 1.55, '#34495e'],
  [-3.5, -1.05, '#16a085'],
  [-1.5, 0.55, '#e67e22', true],
  [-0.5, -1.55, '#c0392b'],
  [1.5, 1.05, '#8e44ad', true],
  [4.2, -1.4, '#2c3e50'],
  [5.7, 0.7, '#d35400', true],
];
const taken = (x: number, z: number) => CABIN_TAKEN.some(([tx, tz]) => Math.abs(tx - x) < 0.1 && Math.abs(tz - z) < 0.1);

export const CABIN_SEATS: Seat[] = [
  ...ECON_ROWS.flatMap((x) => ECON_ZS.filter((z) => !taken(x, z)).map((z) => seatAt(x, z, ECON_TOP))),
  ...BIZ_ROWS.flatMap((x) => BIZ_ZS.filter((z) => !taken(x, z)).map((z) => seatAt(x, z, BIZ_TOP))),
];
/** The seat on your boarding pass. */
export const MY_SEAT: Record<FlightClass, Seat> = { economy: seatAt(-2.5, 1.55, ECON_TOP), business: seatAt(7.2, 1.4, BIZ_TOP) };

// ---------------- Lagos (local coordinates of the `lagos` place) ----------------
export const LAGOS = {
  airport: [-19, -7] as [number, number],
  danfo: [-6, 5] as [number, number],
  market: [6, -8] as [number, number],
  buka: [-5, -9] as [number, number],
  hotel: [21, -9] as [number, number],
  beach: [19, 8] as [number, number],
};
export const BEACH_CHAIRS: [number, number][] = [14.5, 16, 17.5, 19, 22, 23.5].map((x) => [x, 8.4]);
export const BEACH_CHAIR_TOP = 0.42;
export const BUKA_BENCHES: [number, number][] = [-6.2, -3.8].map((x) => [x, -5.6]);
export const LAGOS_SEATS: Seat[] = [
  ...BEACH_CHAIRS.map(([x, z]) => ({ x, z: z - 0.05, y: BEACH_CHAIR_TOP, rot: 0 })),
  ...BUKA_BENCHES.flatMap(([x, z]) => [-0.45, 0.45].map((dx) => ({ x: x + dx, z: z + 0.05, y: 0.45, rot: Math.PI }))),
];

const fly = (id: string, to: Airport, cls: FlightClass, spot: [number, number]): Activity => ({
  id,
  label: `✈️ Fly to ${CITY_NAMES[to]} · ${cls === 'economy' ? 'Economy' : 'Business 🥂'}`,
  doing: cls === 'economy' ? 'Check-in, security, boarding 🛂' : 'Business lounge, then priority boarding 🥂',
  emoji: '✈️',
  minutes: 40,
  cost: FARES[cls],
  gains: cls === 'business' ? { food: 20, fun: 15 } : { energy: -5 },
  hours: [6, 22],
  travelTo: 'cabin',
  effects: { flight: { to, cls } },
  spot,
});

/** Booking desks at both airports. */
export const FLY_FROM_ABUJA: Activity[] = [fly('fly-los-eco', 'LOS', 'economy', [-4.2, -1.3]), fly('fly-los-biz', 'LOS', 'business', [-4.2, -1.3])];

const front = (p: [number, number], d = 4): [number, number] => [p[0], p[1] + d];
const label = (p: [number, number], h = 4.5): [number, number, number] => [p[0], h, p[1]];
const MY_ECON: [number, number] = [MY_SEAT.economy.x, MY_SEAT.economy.z];

export const FLIGHT_INTERACTABLES: Interactable[] = [
  // ---------------- On board ----------------
  {
    id: 'galley',
    place: 'cabin',
    name: 'Cabin crew (galley)',
    emoji: '👩🏾‍✈️',
    label: [9.8, 2.4, 0],
    activities: [
      { id: 'fly-jollof', label: 'Order jollof & chicken', doing: 'Eating plane jollof 🍛', emoji: '🍛', minutes: 20, cost: 4000, gains: { food: 35 }, spot: [9.2, 0] },
      { id: 'fly-drink', label: 'Chapman & small chops', doing: 'Sipping Chapman at 35,000 ft 🍹', emoji: '🍹', minutes: 10, cost: 1500, gains: { fun: 10, food: 8 }, spot: [9.2, 0] },
      { id: 'fly-crew', label: 'Gist with the cabin crew', doing: 'Gisting with the air hostess 😄', emoji: '💬', minutes: 15, gains: { social: 15 }, spot: [9.2, 0] },
    ],
  },
  {
    id: 'lavatory',
    place: 'cabin',
    name: 'Toilet',
    emoji: '🚻',
    label: [-11.2, 2.4, 0],
    activities: [{ id: 'fly-toilet', label: 'Use the toilet (tight space 😅)', doing: 'Squeezing inside plane toilet', emoji: '🚽', minutes: 8, gains: { bladder: 90, hygiene: 5 }, spot: [-10.6, 0] }],
  },
  {
    id: 'seat-screen',
    place: 'cabin',
    name: 'Your seat',
    emoji: '💺',
    label: [MY_ECON[0], 1.9, MY_ECON[1]],
    activities: [
      { id: 'fly-film', label: 'Watch Nollywood on the seat screen', doing: 'Watching Nollywood film 🎬', emoji: '🎬', minutes: 40, gains: { fun: 20 }, pose: 'sit', spot: MY_ECON },
      { id: 'fly-nap', label: 'Sleep small', doing: 'Sleeping with mouth open 😴', emoji: '😴', minutes: 40, gains: { energy: 20 }, pose: 'sit', spot: MY_ECON },
      { id: 'fly-snap', label: 'Snap the clouds for Gram', doing: 'Snapping through the window 📸', emoji: '📸', minutes: 5, gains: { fun: 8, social: 5 }, pose: 'sit', spot: MY_ECON },
    ],
  },

  // ---------------- Lagos ----------------
  {
    id: 'mmia',
    place: 'lagos',
    name: 'Murtala Muhammed Airport',
    emoji: '🛫',
    label: label(LAGOS.airport, 5.5),
    activities: [fly('fly-abv-eco', 'ABV', 'economy', front(LAGOS.airport, 5)), fly('fly-abv-biz', 'ABV', 'business', front(LAGOS.airport, 5))],
  },
  {
    id: 'danfo-park',
    place: 'lagos',
    name: 'Danfo park',
    emoji: '🚐',
    label: label(LAGOS.danfo, 3),
    activities: [
      { id: 'danfo-tour', label: 'Enter danfo, cross Third Mainland Bridge', doing: '"Oshodi! Oshodi! Enter with your change!" 🚐', emoji: '🚐', minutes: 90, cost: 800, gains: { fun: 15, energy: -10 }, away: true, spot: [LAGOS.danfo[0], LAGOS.danfo[1] - 1.6] },
      { id: 'lagos-traffic', label: 'Hawk for go-slow (sell gala & water)', doing: 'Running between cars for traffic 🥤', emoji: '🥤', minutes: 120, pay: 5000, gains: { energy: -25, hygiene: -15 }, hours: [7, 20], away: true, spot: [LAGOS.danfo[0], LAGOS.danfo[1] - 1.6] },
    ],
  },
  {
    id: 'balogun',
    place: 'lagos',
    name: 'Balogun Market',
    emoji: '🧵',
    label: label(LAGOS.market, 3.6),
    activities: [
      { id: 'aso-ebi', label: 'Buy aso-ebi fabric for owambe', doing: 'Choosing lace and ankara 🧵', emoji: '🧵', minutes: 45, cost: 18000, gains: { fun: 10 }, effects: { packaging: 6 }, hours: [8, 19], spot: front(LAGOS.market, 3.6) },
      { id: 'lagos-haggle', label: 'Price market like Lagos person', doing: '"Customer, how much you wan pay?" 🗣️', emoji: '🗣️', minutes: 30, gains: { fun: 15, social: 10 }, hours: [8, 19], spot: front(LAGOS.market, 3.6) },
    ],
  },
  {
    id: 'lagos-buka',
    place: 'lagos',
    name: 'Mama Put (amala spot)',
    emoji: '🍲',
    label: label(LAGOS.buka, 3),
    activities: [
      { id: 'lagos-amala', label: 'Amala, gbegiri & ewedu', doing: 'Eating amala with hand 🍲', emoji: '🍲', minutes: 30, cost: 2500, gains: { food: 45 }, pose: 'sit', hours: [7, 21], spot: [LAGOS.buka[0], LAGOS.buka[1] + 3.4] },
    ],
  },
  {
    id: 'eko-hotel',
    place: 'lagos',
    name: 'Victoria Island hotel',
    emoji: '🏨',
    label: label(LAGOS.hotel, 9),
    activities: [
      { id: 'lagos-hotel', label: 'Book room & sleep (8 hrs)', doing: 'Sleeping for hotel with AC ❄️', emoji: '🏨', minutes: 480, cost: 45000, gains: { energy: 95, hygiene: 30 }, sleep: true, spot: front(LAGOS.hotel, 5) },
      { id: 'vi-lounge', label: 'Owambe for VI lounge', doing: 'Spraying money for VI 💃🏾', emoji: '💃🏾', minutes: 120, cost: 20000, gains: { fun: 40, social: 25, energy: -15 }, hours: [17, 24], spot: front(LAGOS.hotel, 5) },
      { id: 'lagos-meetup', label: 'Tech meetup (network with Lagos people)', doing: 'Collecting LinkedIn and business cards 💼', emoji: '💼', minutes: 120, gains: { social: 20, energy: -10 }, effects: { cv: 1 }, hours: [10, 19], spot: front(LAGOS.hotel, 5) },
    ],
  },
  {
    id: 'beach',
    place: 'lagos',
    name: 'Elegushi Beach',
    emoji: '🏖️',
    label: label(LAGOS.beach, 2.6),
    activities: [
      { id: 'beach-chill', label: 'Chill for beach chair', doing: 'Feeling the Atlantic breeze 🌊', emoji: '🏖️', minutes: 60, cost: 2000, gains: { fun: 30, energy: 5 }, pose: 'sit', spot: [17.5, 8.4] },
      { id: 'beach-horse', label: 'Ride horse for beach', doing: 'Galloping on the sand 🐎', emoji: '🐎', minutes: 20, cost: 3000, gains: { fun: 25 }, spot: [21, 7] },
      { id: 'beach-coconut', label: 'Coconut & suya', doing: 'Drinking coconut water 🥥', emoji: '🥥', minutes: 15, cost: 2500, gains: { food: 20, fun: 5 }, pose: 'sit', spot: [22, 8.4] },
    ],
  },
];

/** Places outside the Abuja map: no buses, no car, no Abuja jobs. */
export const AWAY_PLACES: Place[] = ['cabin', 'lagos'];
export const isAway = (p: Place) => AWAY_PLACES.includes(p);
