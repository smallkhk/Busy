import type { Activity } from './common';

// ---------------- Weather ----------------
export type Weather = 'sunny' | 'cloudy' | 'rain' | 'storm';

export const WEATHER: Record<Weather, { name: string; emoji: string; /** Road trips take this much longer. */ trip: number; /** Walking takes this much longer. */ trek: number }> = {
  sunny: { name: 'Sunny', emoji: '☀️', trip: 1, trek: 1 },
  cloudy: { name: 'Cloudy', emoji: '🌤️', trip: 1, trek: 1 },
  rain: { name: 'Rain', emoji: '🌧️', trip: 1.3, trek: 1.4 },
  storm: { name: 'Heavy storm', emoji: '⛈️', trip: 1.6, trek: 1.8 },
};

/** Chance of each next weather, by the current one. */
const NEXT: Record<Weather, [Weather, number][]> = {
  sunny: [['sunny', 5], ['cloudy', 4], ['rain', 1]],
  cloudy: [['sunny', 3], ['cloudy', 2], ['rain', 3], ['storm', 1]],
  rain: [['cloudy', 4], ['rain', 2], ['storm', 1], ['sunny', 1]],
  storm: [['rain', 3], ['cloudy', 2]],
};

export function nextWeather(cur: Weather, rand: () => number, rainy = false): Weather {
  const opts = NEXT[cur].map(([w, n]) => [w, rainy && (w === 'rain' || w === 'storm') ? n * 2 : n] as const);
  let r = rand() * opts.reduce((s, [, n]) => s + n, 0);
  for (const [w, n] of opts) {
    r -= n;
    if (r < 0) return w;
  }
  return opts[0][0];
}

/** How long the weather holds, in game minutes. */
export const weatherSpell = (w: Weather, rand: () => number) => Math.round((w === 'storm' ? 60 + rand() * 120 : 180 + rand() * 300));

// ---------------- World news ----------------
/** Price and time changes the news brings while it lasts. */
export type Mods = {
  /** Multiplier on driving fuel cost. */
  fuel?: number;
  /** Multiplier on bus, taxi and ride app fares. */
  fares?: number;
  /** Multiplier on foodstuff prices. */
  food?: number;
  /** Multiplier on road trip time. */
  traffic?: number;
  /** Extra CV progress per submission. */
  cvBonus?: number;
  /** Weather turns rainy more often. */
  rainy?: boolean;
};

export type WorldNews = { id: string; headline: string; detail: string; days: number; mods: Mods };

export const WORLD_NEWS: WorldNews[] = [
  { id: 'fuel-hike', headline: '⛽ Fuel price don jump again!', detail: 'Driving cost +25%, transport fares +15%', days: 3, mods: { fuel: 1.25, fares: 1.15 } },
  { id: 'fuel-crash', headline: '⛽ Refinery don start work, fuel price drop', detail: 'Driving cost -20%', days: 2, mods: { fuel: 0.8 } },
  { id: 'recruitment', headline: '🏛️ Federal Government open recruitment portal', detail: 'Every CV you submit count double', days: 2, mods: { cvBonus: 1 } },
  { id: 'road-repair', headline: '🚧 FCDA begin repair for major roads', detail: 'Road trips take 20% longer', days: 3, mods: { traffic: 1.2 } },
  { id: 'tomato-crash', headline: '🍅 Tomato and pepper price crash for markets', detail: 'Foodstuff 30% cheaper', days: 2, mods: { food: 0.7 } },
  { id: 'food-inflation', headline: '📈 Food inflation: rice price don double', detail: 'Foodstuff 30% costlier', days: 3, mods: { food: 1.3 } },
  { id: 'nimet', headline: '🌧️ NiMet warn: heavy rain go fall this week', detail: 'Expect plenty rain and storms', days: 3, mods: { rainy: true } },
  { id: 'taxi-strike', headline: '🚕 Taxi drivers protest new FCT levy', detail: 'Transport fares +30%', days: 2, mods: { fares: 1.3 } },
];

export type ActiveNews = { id: string; until: number };

export const newsById = (id: string) => WORLD_NEWS.find((n) => n.id === id);

/** All the news still running on `day`, folded into one set of modifiers. */
export function combinedMods(news: ActiveNews[] | undefined, day: number): Mods {
  const out: Mods = {};
  for (const n of news ?? []) {
    if (day > n.until) continue;
    const m = newsById(n.id)?.mods;
    if (!m) continue;
    if (m.fuel) out.fuel = (out.fuel ?? 1) * m.fuel;
    if (m.fares) out.fares = (out.fares ?? 1) * m.fares;
    if (m.food) out.food = (out.food ?? 1) * m.food;
    if (m.traffic) out.traffic = (out.traffic ?? 1) * m.traffic;
    if (m.cvBonus) out.cvBonus = (out.cvBonus ?? 0) + m.cvBonus;
    if (m.rainy) out.rainy = true;
  }
  return out;
}

const round100 = (n: number) => Math.round(n / 100) * 100;

/** What an activity costs today, after fuel prices, fares and food prices. */
export function priceOf(a: Activity, mods: Mods): number {
  const base = a.cost ?? 0;
  if (!base) return 0;
  if (a.effects?.fuel && mods.fuel) return round100(base * mods.fuel);
  if (a.travelTo && !a.id.startsWith('drive-') && mods.fares) return round100(base * mods.fares);
  if (a.effects?.pantry && mods.food) return round100(base * mods.food);
  return base;
}

/** Extra time factor on a trip from weather and road news. */
export function tripFactor(a: Activity, weather: Weather | undefined, mods: Mods): number {
  if (!a.travelTo) return 1;
  const w = WEATHER[weather ?? 'sunny'];
  if (a.id.startsWith('trek-')) return w.trek;
  return w.trip * (a.commute ? (mods.traffic ?? 1) : 1);
}
