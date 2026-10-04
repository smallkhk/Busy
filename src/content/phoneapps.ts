import { PLACE_NAMES, type Activity, type Place } from './common';

// ---------------- ChopNow: food delivery ----------------
export const CHOP_ITEMS: Activity[] = [
  { id: 'chop-jollof', label: 'Jollof rice & chicken', doing: 'Waiting for ChopNow rider 🛵', emoji: '🍗', minutes: 40, cost: 5500, gains: { food: 60, fun: 10 }, hours: [8, 23] },
  { id: 'chop-tuwo', label: 'Tuwo shinkafa & miyan kuka', doing: 'Waiting for ChopNow rider 🛵', emoji: '🥣', minutes: 40, cost: 3500, gains: { food: 55, fun: 5 }, hours: [8, 22] },
  { id: 'chop-shawarma', label: 'Chicken shawarma', doing: 'Waiting for ChopNow rider 🛵', emoji: '🌯', minutes: 35, cost: 4500, gains: { food: 45, fun: 12 }, hours: [10, 23] },
  { id: 'chop-suya', label: 'Suya & cold drink', doing: 'Waiting for ChopNow rider 🛵', emoji: '🍢', minutes: 35, cost: 3000, gains: { food: 30, fun: 15 }, hours: [17, 24] },
  { id: 'chop-pizza', label: 'Pizza (big boy food)', doing: 'Waiting for ChopNow rider 🛵', emoji: '🍕', minutes: 45, cost: 12000, gains: { food: 60, fun: 20, social: 5 }, hours: [10, 23] },
];

// ---------------- Ride app: door to door ----------------
export const RIDE_PLACES: Place[] = ['street', 'wuse', 'jabi', 'secretariat', 'lounge'];

/** Rough road distance in km. 'street' is your area, measured from Kubwa (closer areas scale it down). */
const KM: Record<string, number> = {
  'street-wuse': 22,
  'street-jabi': 18,
  'street-secretariat': 25,
  'street-lounge': 22,
  'wuse-jabi': 6,
  'wuse-secretariat': 4,
  'wuse-lounge': 3,
  'jabi-secretariat': 7,
  'jabi-lounge': 5,
  'secretariat-lounge': 5,
};

export const rideKm = (a: Place, b: Place) => KM[`${a}-${b}`] ?? KM[`${b}-${a}`] ?? 10;

const rideName = (p: Place) => (p === 'street' ? 'your area (home)' : PLACE_NAMES[p]);

export const RIDES: Activity[] = RIDE_PLACES.flatMap((from) =>
  RIDE_PLACES.filter((to) => to !== from).map((to): Activity => {
    const km = rideKm(from, to);
    return {
      id: `hail-${from}-${to}`,
      label: `Ride go ${rideName(to)}`,
      doing: `Inside ride go ${rideName(to)}`,
      emoji: '🚘',
      minutes: Math.round(6 + km * 1.6),
      cost: Math.round((900 + km * 220) / 100) * 100,
      gains: { fun: -2 },
      travelTo: to,
      away: true,
      commute: true,
      homeLeg: from === 'street' || to === 'street',
    };
  }),
);

/** Rides you can book from where you dey (home counts as your street). */
export const ridesFrom = (place: Place) => {
  const from = place === 'home' ? 'street' : place;
  return RIDES.filter((r) => r.id.startsWith(`hail-${from}-`));
};

// ---------------- Trek: free, slow, tiring ----------------
/** Walking pace: minutes per km. */
export const TREK_MIN_PER_KM = 12;

export const TREKS: Activity[] = RIDE_PLACES.flatMap((from) =>
  RIDE_PLACES.filter((to) => to !== from).map((to): Activity => {
    const km = rideKm(from, to);
    return {
      id: `trek-${from}-${to}`,
      label: `Trek go ${rideName(to)}`,
      doing: `Trekking go ${rideName(to)} 🥵`,
      emoji: '🚶',
      minutes: km * TREK_MIN_PER_KM,
      gains: { energy: -Math.round(km * 2), hygiene: -Math.round(km * 1.2), food: -Math.round(km * 0.8), fun: -Math.round(km * 0.5) },
      travelTo: to,
      away: true,
      homeLeg: from === 'street' || to === 'street',
    };
  }),
);

/** Normalise home to its street: you leave from your gate either way. */
export const fromPlace = (place: Place): Place => (place === 'home' ? 'street' : place);

export const trekBetween = (from: Place, to: Place) => TREKS.find((t) => t.id === `trek-${fromPlace(from)}-${to}`);
export const rideBetween = (from: Place, to: Place) => RIDES.find((r) => r.id === `hail-${fromPlace(from)}-${to}`);

// ---------------- Ego Bank ----------------
export const LOAN_MAX = 50000;
export const LOAN_FEE = 0.1;
export const LOAN_DAYS = 14;
export const SAVINGS_DAILY_RATE = 0.005;
export const TOKEN_COST = 5000;
export const AMOUNT_CHIPS = [2000, 5000, 10000, 20000, 50000];

// ---------------- News ----------------
export const HEADLINES = [
  '⛽ Fuel price don touch ₦1,100 for some filling stations for Kubwa',
  '🚧 FCDA begin demolition of illegal structures for Mpape',
  '💡 AEDC: "Band A customers go get 20 hours light" (we dey watch)',
  '🚛 Trailer fall for Kubwa expressway again, traffic reach Dutse',
  '🏛️ Federal Government announce recruitment for 3 agencies',
  '🌧️ NiMet warn: heavy rain go fall for Abuja this week',
  '🍅 Tomato price don drop small for Wuse Market',
  '🚕 Taxi drivers threaten strike over new FCT levy',
  '🎉 Jabi Lake Mall go host free concert this weekend',
  '📱 Another loan app don dey harass customers contacts. Shine your eye!',
  '🏠 Rent for Gwarinpa don increase by 20%, agents talk',
  '🛂 Embassy say visa appointment wait time don reach 8 months',
];
