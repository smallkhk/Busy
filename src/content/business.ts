export type BizTier = 'small' | 'medium' | 'big';

export type Business = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  tier: BizTier;
  cost: number;
  /** Daily profit range at level 1, before extra staff. */
  profit: [number, number];
  requires?: { longLeg?: number; packaging?: number };
};

export const BUSINESSES: Business[] = [
  // Small
  { id: 'pos', tier: 'small', name: 'POS stand', emoji: '💳', blurb: 'Withdrawal and transfer for your street. Small but steady.', cost: 150000, profit: [3000, 8000] },
  { id: 'foodstall', tier: 'small', name: 'Rice & stew stall', emoji: '🍛', blurb: 'Workers go chop by 1pm every day. Na pot of gold.', cost: 200000, profit: [3500, 9000] },
  { id: 'barbing', tier: 'small', name: 'Barbing salon', emoji: '💈', blurb: 'Clipper, mirror, generator. Saturday na your harvest.', cost: 250000, profit: [4000, 10000] },
  { id: 'phoneacc', tier: 'small', name: 'Phone accessories kiosk', emoji: '📱', blurb: 'Chargers, screen guard, earpiece. Everybody need am.', cost: 300000, profit: [5000, 11000] },
  { id: 'carwash', tier: 'small', name: 'Car wash', emoji: '🧽', blurb: 'Abuja dust no dey finish. Neither go your customers.', cost: 350000, profit: [5000, 12000] },
  { id: 'laundry', tier: 'small', name: 'Laundry & dry clean', emoji: '👔', blurb: 'Civil servants and their agbada. Starch am well.', cost: 400000, profit: [6000, 13000] },
  { id: 'shawarma', tier: 'small', name: 'Shawarma spot', emoji: '🌯', blurb: 'Night time, music, sausage. Big boys dey buy two.', cost: 450000, profit: [7000, 15000] },
  // Medium
  { id: 'provision', tier: 'medium', name: 'Provision shop, Wuse Market', emoji: '🏪', blurb: 'Indomie, milk, sugar. Market people dey buy every day.', cost: 600000, profit: [10000, 22000] },
  { id: 'catering', tier: 'medium', name: 'Catering & small chops', emoji: '🍲', blurb: 'Owambe and office events. You need people to give you jobs.', cost: 1500000, profit: [25000, 55000], requires: { longLeg: 30 } },
  { id: 'boutique', tier: 'medium', name: 'Boutique', emoji: '👗', blurb: 'Turkey and Dubai clothes. Your own packaging must dey correct.', cost: 2000000, profit: [25000, 60000], requires: { packaging: 30 } },
  { id: 'restaurant', tier: 'medium', name: 'Restaurant', emoji: '🍽️', blurb: 'Pepper soup, jollof, grills. Good cook na everything.', cost: 2500000, profit: [30000, 65000], requires: { longLeg: 20 } },
  { id: 'pharmacy', tier: 'medium', name: 'Pharmacy', emoji: '💊', blurb: 'Malaria no dey finish. Neither go your customers.', cost: 3000000, profit: [35000, 70000] },
  { id: 'logistics', tier: 'medium', name: 'Dispatch bikes (5 riders)', emoji: '🛵', blurb: 'Delivery for the whole Abuja. Big money, big wahala.', cost: 3500000, profit: [55000, 110000], requires: { longLeg: 45, packaging: 35 } },
  { id: 'supermarket', tier: 'medium', name: 'Supermarket', emoji: '🛒', blurb: 'AC, shelves, cashier. Estate people go love you.', cost: 4000000, profit: [45000, 90000], requires: { packaging: 30 } },
  { id: 'mylounge', tier: 'medium', name: 'Your own lounge', emoji: '🍾', blurb: 'Wuse 2 night life. Celebrities, bottles, wahala.', cost: 8000000, profit: [80000, 180000], requires: { packaging: 45, longLeg: 35 } },
  // Big
  { id: 'tech', tier: 'big', name: 'Tech startup', emoji: '💻', blurb: 'App for Abuja. Investors love am. Some months, e go burn money.', cost: 20000000, profit: [150000, 700000], requires: { packaging: 40 } },
  { id: 'realestate', tier: 'big', name: 'Real estate company', emoji: '🏘️', blurb: 'Land for Kuje, duplex for Guzape. C of O na gold.', cost: 25000000, profit: [250000, 600000], requires: { longLeg: 55 } },
  { id: 'transport', tier: 'big', name: 'Transport company', emoji: '🚌', blurb: 'Luxury buses: Abuja to Lagos, Kano, Enugu.', cost: 30000000, profit: [300000, 650000], requires: { longLeg: 40 } },
  { id: 'hotel', tier: 'big', name: 'Hotel', emoji: '🏨', blurb: 'Pool, conference hall, big men weekend. Five stars (in your mind).', cost: 40000000, profit: [400000, 800000], requires: { longLeg: 50, packaging: 50 } },
  { id: 'construction', tier: 'big', name: 'Construction company', emoji: '🏗️', blurb: 'Government contracts, roads, bridges. Long Leg na the real capital.', cost: 60000000, profit: [600000, 1300000], requires: { longLeg: 70 } },
];

export const TIER_NAMES: Record<BizTier, string> = { small: '🌱 Small', medium: '🏬 Medium', big: '🏙️ Big' };

export const MAX_BIZ_LEVEL = 3;

/** `staff`: extra workers you hire on top of the basic team. */
export type OwnedBusiness = { level: number; closedUntil?: number; staff?: number };

export const businessById = (id: string) => BUSINESSES.find((b) => b.id === id);

/** Upgrading to the next level costs the base price times the current level. */
export const upgradeCost = (b: Business, level: number) => b.cost * level;

export const profitMultiplier = (level: number) => 1 + 0.6 * (level - 1);

export function dailyProfit(b: Business, level: number, rand: number): number {
  const [lo, hi] = b.profit;
  return Math.round((lo + (hi - lo) * rand) * profitMultiplier(level));
}

// ---------------- Staff ----------------
export const MAX_STAFF: Record<BizTier, number> = { small: 2, medium: 5, big: 10 };
/** Each extra worker sells 12% more and costs about 8% of an average day. */
export const STAFF_BOOST = 0.12;
export const wageOf = (b: Business) => Math.round(((b.profit[0] + b.profit[1]) / 2) * 0.08 / 100) * 100;

/** Chance of a bad day (theft, NEPA, slow market): fewer with more staff watching. */
export const badDayChance = (staff: number) => Math.max(0.03, 0.1 - staff * 0.01);

/** What the business brings home today after wages. Bad days lose money. */
export function dailyNet(b: Business, o: OwnedBusiness, rand: number, bad: boolean): number {
  const staff = o.staff ?? 0;
  const wages = staff * wageOf(b);
  if (bad) return -(wages + Math.round(b.cost * 0.002));
  return Math.round(dailyProfit(b, o.level, rand) * (1 + STAFF_BOOST * staff)) - wages;
}
