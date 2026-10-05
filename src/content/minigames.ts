/** Pure logic for the mini-games, so we fit test am. */

/** POS charge: ₦100 per ₦5,000 started (min ₦100). */
export const posCharge = (amount: number) => Math.max(100, Math.ceil(amount / 5000) * 100);

export type PosRound = { amount: number; answer: number; options: number[] };

export function posRound(rand: () => number): PosRound {
  const amount = (1 + Math.floor(rand() * 12)) * 2500;
  const answer = amount + posCharge(amount);
  const wrong = [answer + 100 * (1 + Math.floor(rand() * 3)), Math.max(100, answer - 100 * (1 + Math.floor(rand() * 3)))];
  const options = [answer, ...wrong].sort(() => rand() - 0.5);
  return { amount, answer, options: [...new Set(options)] };
}

export type Recipe = { name: string; emoji: string; needs: string[] };

export const RECIPES: Recipe[] = [
  { name: 'Jollof rice', emoji: '🍚', needs: ['🍚 Rice', '🍅 Tomato', '🌶️ Pepper'] },
  { name: 'Egusi soup', emoji: '🥘', needs: ['🟡 Egusi', '🥬 Ugu leaf', '🐟 Stockfish'] },
  { name: 'Fried plantain & egg', emoji: '🍳', needs: ['🍌 Plantain', '🥚 Egg', '🛢️ Oil'] },
];

export const DECOYS = ['🍫 Milo', '🍦 Ice cream', '🧃 Chivita', '🍬 Sweet', '🥛 Peak milk'];

/** Score for picked ingredients: right ones count, wrong ones cost. */
export function cookScore(recipe: Recipe, picked: string[]): number {
  const right = picked.filter((p) => recipe.needs.includes(p)).length;
  const wrong = picked.length - right;
  return Math.max(0, Math.min(1, (right - wrong * 0.5) / recipe.needs.length));
}

/** Timing bar: marker position 0–1 bounces; green zone in the middle. */
export const markerAt = (t: number, speed = 0.9) => {
  const x = (t * speed) % 2;
  return x < 1 ? x : 2 - x;
};
export const inZone = (pos: number, lo = 0.4, hi = 0.6) => pos >= lo && pos <= hi;

export type Match = { home: string; away: string };
export const MATCHES_TV: Match[] = [
  { home: '🇳🇬 Super Eagles', away: '🇬🇭 Black Stars' },
  { home: '🔴 Arsenal', away: '🔵 Chelsea' },
  { home: '🔴 Man United', away: '🔵 Man City' },
  { home: '⚪ Real Madrid', away: '🔵 Barcelona' },
];

export type Pick = 'home' | 'draw' | 'away';
export function matchResult(rand: () => number): { result: Pick; score: string } {
  const h = Math.floor(rand() * 4);
  const a = Math.floor(rand() * 3);
  return { result: h > a ? 'home' : h === a ? 'draw' : 'away', score: `${h} - ${a}` };
}
