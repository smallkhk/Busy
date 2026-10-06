export const MINUTES_PER_DAY = 24 * 60;

export function clockParts(totalMinutes: number) {
  const day = Math.floor(totalMinutes / MINUTES_PER_DAY) + 1;
  const minuteOfDay = Math.floor(totalMinutes % MINUTES_PER_DAY);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return { day, hour, minute, minuteOfDay };
}

export function formatClock(totalMinutes: number): string {
  const { hour, minute } = clockParts(totalMinutes);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

export type Phase = 'night' | 'dawn' | 'day' | 'dusk';

export function dayPhase(hour: number): Phase {
  if (hour >= 6 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 18) return 'day';
  if (hour >= 18 && hour < 20) return 'dusk';
  return 'night';
}

/** 0 at midnight, 1 at noon: drives sunlight. */
export function daylight(minuteOfDay: number): number {
  const h = minuteOfDay / 60;
  if (h <= 6 || h >= 19.5) return 0;
  if (h < 8) return (h - 6) / 2;
  if (h > 17.5) return (19.5 - h) / 2;
  return 1;
}

export function inHours(totalMinutes: number, [start, end]: [number, number]): boolean {
  const { hour } = clockParts(totalMinutes);
  return hour >= start && hour < end;
}

export const formatNaira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

export function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}

// ---------------- Real Abuja time ----------------
const DAY_MS = 24 * 60 * 60 * 1000;
/** Abuja is on West Africa Time, UTC+1 all year. */
const WAT_OFFSET_MS = 60 * 60 * 1000;

/** Real timestamp of the last midnight in Abuja. */
export const watMidnight = (ms: number) => Math.floor((ms + WAT_OFFSET_MS) / DAY_MS) * DAY_MS - WAT_OFFSET_MS;

/** Game minutes since day 1 started, on the real clock. */
export const realMinutes = (epoch: number, now: number) => (now - epoch) / 60000;

/**
 * How many real seconds an activity takes when the game runs on real time.
 * Quick things stay quick (tea ~15s, an hour ~50s); sleep or a work shift take ~15 minutes.
 */
/** Development speed: every activity finishes in a few real seconds (see Settings). */
let fastActivities = false;
export const setFastActivities = (on: boolean) => {
  fastActivities = on;
};

export const activityRealSeconds = (gameMinutes: number) =>
  fastActivities
    ? Math.min(4, Math.max(2, Math.round(gameMinutes / 120) + 2))
    : Math.round(Math.max(5, Math.pow(Math.max(1, gameMinutes), 1.4) / 6));

export function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
}
