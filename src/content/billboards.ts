import { ROADS } from './map';

/** SVG map coords (300×360) → world units on the 3D map. */
export const mapToWorld = (x: number, y: number): [number, number] => [(x - 150) / 9, (y - 180) / 9];

export type BoardSlot = { slot: number; x: number; z: number; big: boolean; where: string; pricePerDay: number };

/** Small deterministic random so the boards stay in the same place. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const CITY_CENTRE: [number, number] = [4, 2];

const roadside = (): BoardSlot[] => {
  const out: BoardSlot[] = [];
  rng(7);
  for (const road of ROADS.filter((r) => r.major)) {
    road.points.slice(1).forEach((p, i) => {
      const [ax, az] = mapToWorld(...road.points[i]);
      const [bx, bz] = mapToWorld(...p);
      const n = Math.floor(Math.hypot(bx - ax, bz - az) / 2.2);
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const side = k % 2 ? 0.75 : -0.75;
        const nx = -(bz - az), nz = bx - ax;
        const nl = Math.hypot(nx, nz) || 1;
        const x = ax + (bx - ax) * t + (nx / nl) * side;
        const z = az + (bz - az) * t + (nz / nl) * side;
        const centre = Math.hypot(x - CITY_CENTRE[0], z - CITY_CENTRE[1]);
        // Closer to town = more eyes = more money
        const price = Math.round((25000 + Math.max(0, 14 - centre) * 4000) / 1000) * 1000;
        out.push({ slot: out.length + 1, x, z, big: false, where: road.name, pricePerDay: price });
      }
    });
  }
  return out;
};

/** Big LED screens at the busiest junctions. */
const LED: { name: string; at: [number, number] }[] = [
  { name: 'Wuse Market junction', at: [150, 158] },
  { name: 'Jabi Lake roundabout', at: [126, 190] },
  { name: 'Central Business District', at: [226, 222] },
  { name: 'Wuse 2 Banex junction', at: [200, 132] },
];

export const BOARD_SLOTS: BoardSlot[] = [
  ...roadside(),
  ...LED.map((l, i) => {
    const [x, z] = mapToWorld(...l.at);
    return { slot: 101 + i, x, z, big: true, where: l.name, pricePerDay: 200000 };
  }),
];

export const boardBySlot = (slot: number) => BOARD_SLOTS.find((b) => b.slot === slot);

export const AD_COLORS = ['#e8b04b', '#e74c3c', '#2980b9', '#27ae60', '#8e44ad', '#f39c12', '#16a085', '#1b1a22', '#ff6b9a', '#f4f4f4'];
export const AD_EMOJIS = ['📢', '🏪', '🍲', '💈', '🌯', '🚗', '💊', '👗', '🏨', '💻', '🎉', '❤️', '🔥', '⚽', '🙏🏾', '😎'];
export const MAX_AD_DAYS = 7;
/** Business income bonus while you get a billboard running. */
export const AD_BIZ_BOOST = 0.1;
