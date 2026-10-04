export type Business = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  cost: number;
  /** Daily profit range at level 1. */
  profit: [number, number];
  requires?: { longLeg?: number; packaging?: number };
};

export const BUSINESSES: Business[] = [
  { id: 'pos', name: 'POS stand', emoji: '💳', blurb: 'Withdrawal and transfer for your street. Small but steady.', cost: 150000, profit: [3000, 8000] },
  { id: 'provision', name: 'Provision shop, Wuse Market', emoji: '🏪', blurb: 'Indomie, milk, sugar. Market people dey buy every day.', cost: 600000, profit: [10000, 22000] },
  { id: 'catering', name: 'Catering & small chops', emoji: '🍲', blurb: 'Owambe and office events. You need people to give you jobs.', cost: 1500000, profit: [25000, 55000], requires: { longLeg: 30 } },
  { id: 'logistics', name: 'Dispatch bikes (5 riders)', emoji: '🛵', blurb: 'Delivery for the whole Abuja. Big money, big wahala.', cost: 3500000, profit: [55000, 110000], requires: { longLeg: 45, packaging: 35 } },
];

export const MAX_BIZ_LEVEL = 3;

export type OwnedBusiness = { level: number; closedUntil?: number };

export const businessById = (id: string) => BUSINESSES.find((b) => b.id === id);

/** Upgrading to the next level costs the base price times the current level. */
export const upgradeCost = (b: Business, level: number) => b.cost * level;

export const profitMultiplier = (level: number) => 1 + 0.6 * (level - 1);

export function dailyProfit(b: Business, level: number, rand: number): number {
  const [lo, hi] = b.profit;
  return Math.round((lo + (hi - lo) * rand) * profitMultiplier(level));
}
