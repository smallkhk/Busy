import type { AreaId } from './housing';

export type HomeItem = { id: string; name: string; emoji: string; cost: number; packaging: number; minArea: AreaId; perk: string };

/** Things you fit buy for your house. Some need a bigger house before they fit. */
export const HOME_ITEMS: HomeItem[] = [
  { id: 'mattress', name: 'Vitafoam mattress', emoji: '🛏️', cost: 45000, packaging: 1, minArea: 'kubwa', perk: 'Wake up happier after full sleep (+8 🎉)' },
  { id: 'fridge', name: 'Fridge', emoji: '🧊', cost: 180000, packaging: 2, minArea: 'kubwa', perk: 'Foodstuff last longer: +1 meal every time you buy' },
  { id: 'generator', name: '"I better pass my neighbour" gen', emoji: '🔌', cost: 250000, packaging: 2, minArea: 'kubwa', perk: 'Gen fuel ₦500 instead of ₦1,000 when NEPA take light' },
  { id: 'wifi', name: 'Home WiFi', emoji: '📶', cost: 60000, packaging: 1, minArea: 'kubwa', perk: 'Phone gist, group chat and skits na free' },
  { id: 'smarttv', name: '65" Smart TV', emoji: '📺', cost: 350000, packaging: 3, minArea: 'gwarinpa', perk: 'TV na +10 🎉 extra' },
  { id: 'sofa', name: 'Leather sofa', emoji: '🛋️', cost: 300000, packaging: 3, minArea: 'gwarinpa', perk: 'TV na +5 🎉 extra, visitors go respect you' },
  { id: 'inverter', name: 'Inverter & solar', emoji: '🔋', cost: 900000, packaging: 3, minArea: 'gwarinpa', perk: 'No gen fuel again: TV free even when NEPA take light' },
  { id: 'ac', name: 'Split AC', emoji: '❄️', cost: 650000, packaging: 4, minArea: 'wuse2', perk: 'Sleep cool: +12 🎉 and +5 🚿 after full sleep' },
  { id: 'ps5', name: 'PS5', emoji: '🎮', cost: 900000, packaging: 3, minArea: 'wuse2', perk: 'Play FIFA for your house (+40 🎉)' },
  { id: 'cctv', name: 'CCTV & security', emoji: '📹', cost: 400000, packaging: 2, minArea: 'wuse2', perk: 'Thieves no fit burgle your house' },
  { id: 'art', name: 'Big wall art', emoji: '🖼️', cost: 1200000, packaging: 6, minArea: 'wuse2', perk: 'Pure packaging 😎' },
];

const AREA_RANK: Record<AreaId, number> = { kubwa: 0, gwarinpa: 1, wuse2: 2 };
export const areaAllows = (area: AreaId, item: HomeItem) => AREA_RANK[area] >= AREA_RANK[item.minArea];
export const homeItemById = (id: string) => HOME_ITEMS.find((i) => i.id === id);

export const BASE_GEN_COST = 1000;
/** Gen fuel for power activities when NEPA take light. */
export const genCostFor = (ups: string[] | undefined) => (ups?.includes('inverter') ? 0 : ups?.includes('generator') ? 500 : BASE_GEN_COST);

/** Activities that become free with WiFi. */
export const WIFI_FREE = ['groupchat', 'skits'];
export const TV_ACTIVITIES = ['nollywood', 'football', 'ps5'];
