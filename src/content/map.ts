import type { Place } from './common';
import type { AreaId } from './housing';

/** Stylised Abuja map (north up) in a 300×360 SVG space. Not to scale. */
export type MapSpot = { id: string; name: string; short?: string; emoji: string; x: number; y: number; place?: Place; note?: string; label?: 'above' | 'below' | 'left' | 'right'; /** Landmark you see on the map (not a place to visit). */ landmark?: boolean };

/** Where your home node sits depends on the area you live in. */
export const HOME_XY: Record<AreaId, [number, number]> = {
  mararaba: [276, 338],
  nyanya: [262, 300],
  garki: [170, 246],
  maitama: [214, 84],
  asokoro: [250, 226],
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
  { id: 'utako', name: 'Utako', emoji: '🚍', x: 136, y: 150, place: 'utako', label: 'above', note: 'Interstate motor park, electronics, tech hub' },
  { id: 'mararaba', name: 'Mararaba', emoji: '🌶️', x: 290, y: 322, place: 'mararaba', label: 'left', note: 'Nasarawa side. Cheapest market for town' },
  { id: 'park', name: 'Millennium Park', short: 'Millennium Park', emoji: '🌳', x: 254, y: 108, place: 'park', label: 'right', note: 'Biggest park for Abuja. Picnic, jogging, photoshoot.' },
  { id: 'stadium', name: 'Moshood Abiola National Stadium', short: 'National Stadium', emoji: '🏟️', x: 124, y: 230, place: 'stadium', label: 'left', note: 'Super Eagles home ground.' },
  // Landmarks: things you go see as you dey pass
  { id: 'mosque', name: 'National Mosque', emoji: '🕌', x: 194, y: 196, landmark: true, note: 'Golden dome and four minarets. Jumat for Friday full everywhere.' },
  { id: 'church', name: 'National Christian Centre', emoji: '⛪', x: 236, y: 204, landmark: true, note: 'The tall triangle you go see from far. Big services and weddings.' },
  { id: 'eagle', name: 'Eagle Square', emoji: '🦅', x: 240, y: 226, landmark: true, note: 'Where presidents take oath and Independence parade dey happen.' },
  { id: 'cbn', name: 'Central Bank of Nigeria', emoji: '🏦', x: 204, y: 234, landmark: true, note: 'Where Naira policy dey come from 💸' },
  { id: 'nnpc-towers', name: 'NNPC Towers', emoji: '🛢️', x: 186, y: 218, landmark: true, note: 'Four towers for Central Business District.' },
  { id: 'silverbird', name: 'Silverbird Galleria', emoji: '🎞️', x: 198, y: 248, landmark: true, note: 'Cinema and shops for Central Area.' },
  { id: 'tower', name: 'Abuja Millennium Tower', emoji: '🗼', x: 208, y: 184, landmark: true, note: 'The tallest thing for Abuja sky (when dem finish am 😅).' },
  { id: 'hilton', name: 'Transcorp Hilton', emoji: '🏨', x: 218, y: 112, landmark: true, note: 'Big men hotel for Maitama. Owambe and conference central.' },
  { id: 'fountain', name: 'Unity Fountain', emoji: '⛲', x: 234, y: 126, landmark: true, note: 'Fountain with names of all 36 states. Protests dey start here.' },
  { id: 'banex', name: 'Banex Plaza', emoji: '📱', x: 192, y: 146, landmark: true, note: 'Phones, laptops and "original" chargers for Wuse 2.' },
  { id: 'citygate', name: 'Abuja City Gate', emoji: '🚪', x: 140, y: 276, landmark: true, note: '"Welcome to Abuja" arch on Airport Road.' },
  { id: 'zuma', name: 'Zuma Rock', emoji: '🪨', x: 22, y: 26, landmark: true, note: 'The giant rock with face for Madalla. Na the gate to Abuja from the north.' },
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
