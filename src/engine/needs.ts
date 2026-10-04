export const NEED_KEYS = ['food', 'energy', 'fun', 'social', 'hygiene', 'bladder'] as const;
export type NeedKey = (typeof NEED_KEYS)[number];
export type Needs = Record<NeedKey, number>;

export const NEED_META: Record<NeedKey, { label: string; emoji: string }> = {
  food: { label: 'Food', emoji: '🍛' },
  energy: { label: 'Energy', emoji: '⚡' },
  fun: { label: 'Fun', emoji: '🎉' },
  social: { label: 'Social', emoji: '💬' },
  hygiene: { label: 'Hygiene', emoji: '🚿' },
  bladder: { label: 'Toilet', emoji: '🚽' },
};

/** Points lost per in-game hour. */
export const DECAY_PER_HOUR: Needs = {
  food: 4.5,
  energy: 3.5,
  fun: 3,
  social: 2.5,
  hygiene: 2,
  bladder: 6,
};

export const LOW_NEED = 20;

export const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

export const fullNeeds = (): Needs => ({ food: 80, energy: 85, fun: 60, social: 60, hygiene: 75, bladder: 70 });

/**
 * Advance needs by `minutes` of game time.
 * Needs being restored by the current activity (keys in `gains`) don't decay;
 * while sleeping everything else decays slower.
 */
export function tickNeeds(
  needs: Needs,
  minutes: number,
  opts: { gains?: Partial<Needs>; activityMinutes?: number; sleeping?: boolean } = {},
): Needs {
  const { gains = {}, activityMinutes = 0, sleeping = false } = opts;
  const next = { ...needs };
  for (const k of NEED_KEYS) {
    const gain = gains[k];
    let delta = 0;
    if (gain === undefined || gain < 0) delta -= (DECAY_PER_HOUR[k] * minutes) / 60 * (sleeping ? 0.4 : 1);
    if (gain !== undefined && activityMinutes > 0) delta += (gain * minutes) / activityMinutes;
    next[k] = clamp(needs[k] + delta);
  }
  return next;
}

export function mood(needs: Needs): number {
  const values = NEED_KEYS.map((k) => needs[k]);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  // The worst need drags mood down: hungry person no dey happy.
  return clamp(avg * 0.6 + Math.min(...values) * 0.4);
}

export function moodFace(m: number): string {
  if (m >= 75) return '😄';
  if (m >= 55) return '🙂';
  if (m >= 35) return '😐';
  if (m >= 20) return '😩';
  return '😵';
}
