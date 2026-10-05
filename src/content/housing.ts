import type { Place } from './common';

export type AreaId = 'mararaba' | 'nyanya' | 'kubwa' | 'gwarinpa' | 'garki' | 'wuse2' | 'maitama' | 'asokoro' | 'kuje' | 'guzape';

export type Area = {
  id: AreaId;
  name: string;
  home: string;
  emoji: string;
  /** Rent per 30-day cycle. */
  rent: number;
  /** Packaging you get just from your address. */
  packaging: number;
  /** Multiplier on trips to and from your area. */
  commute: number;
  blurb: string;
  /** Big-money area: fine furniture, gatemen, Alhajis for road. */
  lux?: boolean;
  /** Full multi-room mansion instead of a flat. */
  mansion?: boolean;
  /** Houses you buy instead of rent: no rent once you own am. */
  own?: { land?: number; build?: number; buildDays?: number; price?: number; rentOut: number };
  theme: { wall: string; wall2: string; floor: string; rug: string; bed: string };
};

export const AREAS: Record<AreaId, Area> = {
  mararaba: {
    id: 'mararaba',
    name: 'Mararaba',
    home: 'Face-me-I-face-you, Mararaba',
    emoji: '🛖',
    rent: 35000,
    packaging: -5,
    commute: 1.6,
    blurb: 'Nasarawa side. Rent cheap pass everywhere, but Nyanya bridge traffic na your portion.',
    theme: { wall: '#e6d9bf', wall2: '#dccdb0', floor: '#b9a687', rug: '#6b4a2f', bed: '#5a6b3a' },
  },
  nyanya: {
    id: 'nyanya',
    name: 'Nyanya',
    home: 'Room & parlour, Nyanya',
    emoji: '🏚️',
    rent: 50000,
    packaging: -2,
    commute: 1.3,
    blurb: 'Where Abuja workers sleep. Bus full by 6am, but money go remain for your pocket.',
    theme: { wall: '#ebdfc7', wall2: '#e0d2b6', floor: '#c8b393', rug: '#8a3b2b', bed: '#2f5d8a' },
  },
  kubwa: {
    id: 'kubwa',
    name: 'Kubwa',
    home: 'Self-con, Kubwa',
    emoji: '🏠',
    rent: 70000,
    packaging: 0,
    commute: 1,
    blurb: 'Cheap, but expressway traffic go finish you.',
    theme: { wall: '#efe4cf', wall2: '#e8dcc3', floor: '#d9cbb0', rug: '#8c2f39', bed: '#2d6a8a' },
  },
  gwarinpa: {
    id: 'gwarinpa',
    name: 'Gwarinpa',
    home: 'Mini flat, Gwarinpa',
    emoji: '🏘️',
    rent: 180000,
    packaging: 10,
    commute: 0.65,
    blurb: 'Estate life. Closer to town, people go respect you small.',
    theme: { wall: '#e3ece6', wall2: '#d8e4dc', floor: '#c9b79c', rug: '#2f5d8a', bed: '#6b3fa0' },
  },
  garki: {
    id: 'garki',
    name: 'Garki',
    home: '2-bedroom flat, Garki Area 11',
    emoji: '🏢',
    rent: 320000,
    packaging: 15,
    commute: 0.5,
    blurb: 'Old Abuja, central. Area 1 market for your back, CBD for your front.',
    theme: { wall: '#eef0ea', wall2: '#e2e6dc', floor: '#a88a6a', rug: '#2f6b4a', bed: '#5a3d7a' },
  },
  wuse2: {
    id: 'wuse2',
    name: 'Wuse 2',
    home: '1-bedroom, Wuse 2',
    emoji: '🏙️',
    rent: 450000,
    packaging: 25,
    commute: 0.35,
    blurb: 'Big girl/big boy address. Everywhere near, but rent no be joke.',
    lux: true,
    theme: { wall: '#f4f1ec', wall2: '#ebe6de', floor: '#8a6a4f', rug: '#e8b04b', bed: '#1f2a36' },
  },
  maitama: {
    id: 'maitama',
    name: 'Maitama',
    home: 'Serviced 4-bedroom, Maitama',
    emoji: '💎',
    rent: 3500000,
    packaging: 60,
    commute: 0.3,
    blurb: 'Embassies, senators and Alhajis with three Land Cruisers. ₦40m+ a year. Gateman go salute you.',
    lux: true,
    mansion: true,
    theme: { wall: '#fbf9f4', wall2: '#f1ede4', floor: '#4a3828', rug: '#8b1e3f', bed: '#0f1a24' },
  },
  asokoro: {
    id: 'asokoro',
    name: 'Asokoro',
    home: 'Mansion, Asokoro',
    emoji: '🏰',
    rent: 7500000,
    packaging: 80,
    commute: 0.3,
    blurb: 'Presidential neighbourhood. ₦90m a year, soldiers for road, and your neighbour na Minister.',
    lux: true,
    mansion: true,
    theme: { wall: '#fdfbf6', wall2: '#f3efe6', floor: '#3a2a1e', rug: '#c9a24a', bed: '#14202c' },
  },
  kuje: {
    id: 'kuje',
    name: 'Kuje',
    home: 'Your own bungalow, Kuje',
    emoji: '🏡',
    rent: 0,
    packaging: 8,
    commute: 1.5,
    blurb: 'Land cheap, road far. But na YOUR house: no landlord, no rent.',
    own: { land: 3500000, build: 12000000, buildDays: 10, rentOut: 9000 },
    theme: { wall: '#f1e6d2', wall2: '#e6d8bf', floor: '#c7a982', rug: '#a0522d', bed: '#2f6b4a' },
  },
  guzape: {
    id: 'guzape',
    name: 'Guzape',
    home: 'Your duplex, Guzape',
    emoji: '🏰',
    rent: 0,
    packaging: 40,
    commute: 0.45,
    blurb: 'Hills, views, big gates. When you say "I dey Guzape", conversation don end.',
    own: { price: 85000000, rentOut: 90000 },
    lux: true,
    mansion: true,
    theme: { wall: '#fbf8f2', wall2: '#f0ebe2', floor: '#5c4433', rug: '#c9a24a', bed: '#14202c' },
  },
};

/** Areas you rent (the move list); the others you must buy first. */
export const RENT_AREAS: AreaId[] = ['mararaba', 'nyanya', 'kubwa', 'gwarinpa', 'garki', 'wuse2', 'maitama', 'asokoro'];

export type Property = { status: 'land' | 'building' | 'built'; boughtDay: number; readyDay?: number; spent: number; rentedOut?: boolean };

/** What you fit sell am for: what you spent, growing 0.4% a day (max +60%). */
export const propertyValue = (p: Property, day: number) => Math.round(p.spent * Math.min(1.6, 1 + 0.004 * Math.max(0, day - p.boughtDay)));
export const PROPERTY_SELL_FEE = 0.05;
export const MOVE_IN_OWN_COST = 50000;

export const RENT_CYCLE_DAYS = 30;
export const RENT_GRACE_DAYS = 5;
export const LATE_PENALTY = 0.1;
/** Moving costs this many cycles of rent upfront, plus agent fee. */
export const MOVE_UPFRONT_CYCLES = 2;
export const AGENT_FEE = 0.1;

export const moveCost = (area: AreaId) => AREAS[area].own ? MOVE_IN_OWN_COST : Math.round(AREAS[area].rent * MOVE_UPFRONT_CYCLES * (1 + AGENT_FEE));

/** Rent owed right now: late rent attracts a penalty. */
export const rentOwed = (area: AreaId, day: number, dueDay: number) =>
  Math.round(AREAS[area].rent * (day > dueDay ? 1 + LATE_PENALTY : 1));

/** Display name of a place, given where you live. */
export function placeLabel(place: Place, area: AreaId, names: Record<Place, string>): string {
  if (place === 'home') return AREAS[area].home;
  if (place === 'street') return `${AREAS[area].name} street`;
  return names[place];
}
