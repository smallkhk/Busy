import type { Place } from './common';
import { AREAS, type AreaId } from './housing';

export type Post = {
  id: string;
  label: string;
  emoji: string;
  cost: number;
  baseFollowers: number;
  packaging?: number;
  /** Only where you can actually take the picture. */
  where?: Place[];
  /** Flexing what you don't own: raises Packaging without real money. */
  fake?: boolean;
  caption: string;
};

export const POSTS: Post[] = [
  { id: 'selfie', label: 'Selfie', emoji: '🤳', cost: 200, baseFollowers: 12, caption: 'Blessed and highly favoured 🙏✨' },
  { id: 'food', label: 'Food pic', emoji: '🍔', cost: 200, baseFollowers: 18, where: ['street', 'wuse', 'jabi', 'secretariat'], caption: 'Chop life, my guy 🍽️' },
  { id: 'lake', label: 'Lakeside photoshoot', emoji: '🌊', cost: 500, baseFollowers: 60, packaging: 2, where: ['jabi'], caption: 'Soft life for Jabi Lake 🌊💅' },
  { id: 'office', label: '"New office vibes 💼"', emoji: '🏛️', cost: 200, baseFollowers: 40, packaging: 3, where: ['secretariat'], caption: 'Federal Government don call me o 💼🇳🇬' },
  { id: 'lounge', label: 'Lounge pics 🍾', emoji: '🥂', cost: 500, baseFollowers: 90, packaging: 3, where: ['lounge'], caption: 'Wuse 2 on a Friday. Enjoyment minister 🥂🔥' },
  { id: 'benz', label: 'Rent Benz 1 hour, snap am', emoji: '🚘', cost: 15000, baseFollowers: 220, packaging: 10, fake: true, caption: 'New whip. God did 🙌🚘' },
  { id: 'jet', label: 'Photoshop private jet', emoji: '🛩️', cost: 3000, baseFollowers: 160, packaging: 8, fake: true, caption: 'Abuja ➡️ Dubai. Weekend things ✈️' },
];

export const POST_COOLDOWN_MIN = 180;
export const BRAND_MIN_FOLLOWERS = 300;
export const BRAND_COOLDOWN_DAYS = 3;
/** Packaging above real wealth by this much draws exposure. */
export const GAP_DANGER = 30;

export const postById = (id: string) => POSTS.find((p) => p.id === id);

/** 0–100: how rich you really are (money + where you live). */
export function realWealth(money: number, area: AreaId): number {
  return Math.max(0, Math.min(100, Math.round(Math.max(0, money) / 20000 + AREAS[area].packaging)));
}

export const packagingGap = (packaging: number, money: number, area: AreaId) => Math.round(packaging - realWealth(money, area));

export function followersGain(post: Post, packaging: number, rand: number): number {
  return Math.round(post.baseFollowers * (1 + packaging / 50) * (0.7 + rand * 0.6));
}

export const brandPay = (followers: number) => Math.min(150000, Math.round(followers * 15));
