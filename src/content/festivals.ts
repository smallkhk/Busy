import type { Mods } from './world';

export type Festival = { id: string; name: string; emoji: string; greeting: string; mods: Mods; decor: string[] };

/** The Abuja Life year runs 60 game days; festivals fall on fixed days of it. */
export const YEAR_DAYS = 60;

const FESTIVALS: Record<number, Festival> = {
  7: { id: 'valentine', name: "Val's Day", emoji: '💘', greeting: "Happy Val's Day! Red everywhere. Your partner dey expect something o 😏", mods: {}, decor: ['#e8336d', '#ff6b9a', '#ffffff'] },
  15: { id: 'sallah', name: 'Sallah', emoji: '🐏', greeting: 'Barka da Sallah! Ram everywhere, rice everywhere 🍛', mods: { food: 1.3, fares: 1.2 }, decor: ['#118a4c', '#f2c230', '#ffffff'] },
  25: { id: 'independence', name: 'Independence Day', emoji: '🇳🇬', greeting: 'Happy Independence! Green-white-green for every street 🇳🇬', mods: {}, decor: ['#118a4c', '#ffffff', '#118a4c'] },
  45: { id: 'christmas', name: 'Christmas', emoji: '🎄', greeting: 'Merry Christmas! Jollof, chicken and family wahala 🎄', mods: { food: 1.35, fares: 1.25 }, decor: ['#c0392b', '#118a4c', '#f2c230'] },
  59: { id: 'newyear', name: "New Year's Eve", emoji: '🎆', greeting: 'Crossover night! Church, club or fireworks? 🎆', mods: { fares: 1.2 }, decor: ['#f2c230', '#3dd6ff', '#e8336d'] },
};

const MONTH_END: Festival = { id: 'monthend', name: 'Month end', emoji: '💸', greeting: 'Month end! Salary don land. ATM queue long, everywhere busy 💸', mods: { fares: 1.1 }, decor: [] };

/** Today's festival, or month end (every 30th day), or nothing. */
export function festivalOn(day: number): Festival | undefined {
  const f = FESTIVALS[((day - 1) % YEAR_DAYS) + 1];
  if (f) return f;
  if (day % 30 === 0) return MONTH_END;
  return undefined;
}

/** Days until the next big festival, for the News app. */
export function nextFestival(day: number): { festival: Festival; inDays: number } {
  for (let d = 1; d <= YEAR_DAYS; d++) {
    const f = FESTIVALS[((day + d - 1) % YEAR_DAYS) + 1];
    if (f) return { festival: f, inDays: d };
  }
  return { festival: FESTIVALS[7], inDays: YEAR_DAYS };
}
