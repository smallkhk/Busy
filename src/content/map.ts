import type { Place } from './common';
import type { AreaId } from './housing';

/** Stylised Abuja map (north up) in a 300×360 SVG space. Not to scale. */
export type MapSpot = { id: string; name: string; short?: string; emoji: string; x: number; y: number; place?: Place; note?: string; label?: 'above' | 'below' | 'left' | 'right' };

/** Where your home node sits depends on the area you live in. */
export const HOME_XY: Record<AreaId, [number, number]> = {
  kubwa: [58, 62],
  gwarinpa: [92, 112],
  wuse2: [196, 132],
  kuje: [22, 300],
  guzape: [238, 262],
};

export const MAP_SPOTS: MapSpot[] = [
  { id: 'jabi', name: 'Jabi Lake Mall', short: 'Jabi Lake', emoji: '🌊', x: 112, y: 176, place: 'jabi', label: 'below' },
  { id: 'wuse', name: 'Wuse Market', emoji: '🛍️', x: 162, y: 168, place: 'wuse', label: 'above' },
  { id: 'lounge', name: 'Wuse 2 lounge', short: 'Wuse 2', emoji: '🍾', x: 214, y: 146, place: 'lounge', label: 'right' },
  { id: 'secretariat', name: 'Federal Secretariat (CBD)', short: 'Secretariat', emoji: '🏛️', x: 214, y: 214, place: 'secretariat', label: 'left' },
  { id: 'hospital', name: 'General Hospital', short: 'Hospital', emoji: '🏥', x: 166, y: 232, place: 'hospital', label: 'left' },
  { id: 'maitama', name: 'Maitama', emoji: '💎', x: 230, y: 96, place: 'maitama', label: 'right', note: 'Embassies, mansions and big men' },
  { id: 'asorock', name: 'Aso Rock', emoji: '⛰️', x: 280, y: 196, label: 'above', note: 'Presidential Villa. You no fit enter 😅' },
  { id: 'asokoro', name: 'Asokoro', emoji: '🏰', x: 262, y: 240, place: 'asokoro', label: 'left', note: 'Government and VIPs' },
  { id: 'garki', name: 'Garki / Area 1', short: 'Garki', emoji: '🏪', x: 186, y: 258, place: 'garki', note: 'Area 1 market, POS and mechanics' },
  { id: 'nyanya', name: 'Nyanya', emoji: '🚌', x: 280, y: 290, label: 'left', place: 'nyanya', note: 'Where Abuja workers sleep' },
  { id: 'lugbe', name: 'Lugbe', emoji: '🏘️', x: 92, y: 290, note: 'Coming soon' },
  { id: 'airport', name: 'Nnamdi Azikiwe Airport', short: 'Airport', emoji: '✈️', x: 40, y: 336, label: 'right', place: 'airport', note: 'Japa route ✈️' },
];

/** Main roads as SVG polylines. */
export const ROADS: { name: string; points: [number, number][]; major?: boolean }[] = [
  { name: 'Kubwa Expressway', major: true, points: [[40, 40], [58, 62], [92, 112], [130, 150], [162, 168], [190, 190], [214, 214], [262, 240], [286, 286]] },
  { name: 'Airport Road', major: true, points: [[214, 214], [186, 258], [140, 276], [92, 290], [40, 336]] },
  { name: 'Ahmadu Bello Way', points: [[112, 176], [162, 168], [214, 146], [230, 96]] },
  { name: 'Shehu Shagari Way', points: [[214, 146], [214, 214], [280, 196]] },
  { name: 'Gwarinpa link', points: [[92, 112], [112, 176]] },
];
