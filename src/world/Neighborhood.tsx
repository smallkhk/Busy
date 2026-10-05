import { Instance, Instances } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { RoundedBoxGeometry } from 'three-stdlib';
import { KitInstances, kitMaterial, paintedMap, useKit, type Paint, type Placement } from './City';

/** Rects [x0, z0, x1, z1] the filler houses must stay out of (the playable area). */
export type Rect = [number, number, number, number];

type BoxPart = { p: [number, number, number]; s: [number, number, number]; c: string; r?: number };
type ConePart = { p: [number, number, number]; s: [number, number, number]; c: string };
type CylPart = { p: [number, number, number]; r: number; h: number; c: string };
type TreePart = { x: number; z: number; s: number; c: string };

const WALLS = ['#efe4cf', '#f3d9c4', '#d9e6ef', '#dcefdc', '#f7f3ea', '#e8d3a9', '#f2d0d6', '#f4e7a8', '#cfd8dc', '#e6c9a8', '#d4c4e8'];
const ROOFS = ['#a33b2b', '#7a2b2b', '#2f6b4a', '#2a5d9f', '#6b4a2b', '#5f6670', '#8a5a2b', '#3d3d3d'];
const GATES = ['#2a5d9f', '#1f8a4c', '#8b1e3f', '#1b1a22', '#c9a24a', '#5a3d2b'];
const AWNINGS = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#f39c12', '#16a085'];
const TREES = ['#3f7d3a', '#4c8f45', '#2f6b32', '#5a9a47'];

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** What kind of area the filler lots belong to. */
export type HoodStyle = 'poor' | 'mixed' | 'rich' | 'city';

/** Kenney model footprints at scale 1: [width x, height, depth z]. */
const SUBURBAN: Record<string, [number, number, number]> = {
  'building-type-a': [1.30, 0.83, 1.03], 'building-type-b': [1.83, 1.14, 1.14], 'building-type-c': [1.29, 1.03, 1.03],
  'building-type-d': [1.76, 1.24, 1.03], 'building-type-e': [1.30, 1.14, 1.03], 'building-type-f': [1.43, 1.14, 1.41],
  'building-type-g': [1.45, 0.77, 1.18], 'building-type-h': [1.30, 0.74, 0.92], 'building-type-i': [1.29, 0.74, 1.03],
  'building-type-j': [1.37, 1.04, 0.92], 'building-type-k': [0.92, 1.15, 1.02], 'building-type-l': [1.03, 1.05, 1.02],
  'building-type-m': [1.43, 0.74, 1.43], 'building-type-n': [1.78, 1.14, 1.38], 'building-type-o': [1.27, 1.14, 1.03],
  'building-type-p': [1.24, 0.92, 0.99], 'building-type-q': [1.24, 0.92, 0.89], 'building-type-r': [1.03, 1.14, 1.02],
  'building-type-s': [1.41, 1.14, 1.09], 'building-type-t': [1.31, 1.16, 1.41], 'building-type-u': [1.43, 1.14, 1.09],
};
const COMMERCIAL: Record<string, [number, number, number]> = {
  'building-a': [0.88, 1.29, 0.94], 'building-b': [0.97, 1.29, 0.94], 'building-c': [0.88, 0.89, 1.09], 'building-d': [0.84, 1.29, 0.90],
  'building-e': [1.64, 0.89, 1.01], 'building-f': [0.84, 1.69, 1.03], 'building-g': [0.97, 1.69, 0.92], 'building-h': [0.88, 1.29, 1.01],
  'building-i': [1.24, 1.68, 1.30], 'building-j': [2.08, 1.69, 1.34], 'building-k': [2.08, 1.47, 0.94], 'building-l': [1.37, 2.27, 1.40],
  'building-m': [1.24, 3.15, 1.24], 'building-n': [2.32, 2.48, 1.82],
  'building-skyscraper-a': [1.36, 2.88, 1.36], 'building-skyscraper-b': [1.36, 4.48, 1.36], 'building-skyscraper-c': [1.28, 4.08, 1.39],
  'building-skyscraper-d': [1.28, 5.47, 1.39], 'building-skyscraper-e': [1.29, 4.08, 1.24],
};
const BUNGALOWS = Object.keys(SUBURBAN).filter((k) => SUBURBAN[k][1] < 0.85);
const DUPLEXES = Object.keys(SUBURBAN).filter((k) => SUBURBAN[k][1] >= 0.85);
const BLOCKS = Object.keys(COMMERCIAL).filter((k) => !k.includes('sky'));
const TOWERS = Object.keys(COMMERCIAL).filter((k) => k.includes('sky') || COMMERCIAL[k][1] > 2.2);

/** Roof sheets and paint you see around Abuja: red, rust, green, blue and grey zinc over cream walls. */
const HOUSE_PAINTS: Paint[] = [
  { roof: '#b5402e', wall: '#f3e6cc' },
  { roof: '#8a4a2b', wall: '#f2d6bf' },
  { roof: '#2f7a4f', wall: '#f7f3ea' },
  { roof: '#2a5d9f', wall: '#e4ecf2' },
  { roof: '#6d7278', wall: '#f4e7a8' },
  { roof: '#7a2b2b', wall: '#ead2c0' },
];
const BLOCK_PAINTS: Paint[] = [{}, { wall: '#f1e3c8' }, { wall: '#e9d2c2' }, { wall: '#dfe8ee' }];

export type KenneyLot = { kit: 'suburban' | 'commercial'; name: string; paint: number; x: number; z: number; rot: number; s: number };

/** Builds one lot's house from parts. Every house rolls its own type, size and colours. */
function house(x: number, z: number, r: () => number, box: BoxPart[], cone: ConePart[], cyl: CylPart[], glass: BoxPart[], trees: TreePart[], style: HoodStyle = 'mixed', kenney?: KenneyLot[], roadZ = 0) {
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const wall = pick(WALLS);
  const roof = pick(ROOFS);
  // Back rows face the road (+z), the rows across the road face back at it.
  const rot = z < roadZ ? 0 : Math.PI;
  const front = z > roadZ;
  if (kenney) {
    const roll = r();
    const odds = { poor: [0.45, 0.45, 0.45], mixed: [0.68, 0.68, 0.68], rich: [0.92, 0.92, 0.92], city: [0.12, 0.82, 0.82] }[style];
    let name: string | undefined;
    let kit: KenneyLot['kit'] = 'suburban';
    if (style === 'city' && roll >= odds[0] && roll < odds[1]) {
      kit = 'commercial';
      // Towers stand at the back so they never block your view
      const pool = !front && z < roadZ - 9 && r() < 0.45 ? TOWERS : BLOCKS.filter((k) => !front || COMMERCIAL[k][1] < 1.4);
      name = pick(pool);
    } else if (roll < odds[0]) {
      name = style === 'poor' ? pick(r() < 0.7 ? BUNGALOWS : DUPLEXES) : style === 'rich' ? pick(DUPLEXES) : pick(r() < 0.4 ? BUNGALOWS : DUPLEXES);
    }
    if (name) {
      const [w, , d] = (kit === 'suburban' ? SUBURBAN : COMMERCIAL)[name];
      const max = kit === 'suburban' ? (style === 'rich' ? 2.1 : 1.9) : 2.3;
      const s = Math.min(max, 3.0 / Math.max(w, d));
      kenney.push({ kit, name, paint: Math.floor(r() * (kit === 'suburban' ? HOUSE_PAINTS : BLOCK_PAINTS).length), x, z, rot, s });
      // Most Abuja houses sit inside a fenced compound with a gate
      if (kit === 'suburban' && r() < (style === 'rich' ? 0.9 : 0.6)) {
        const fw = Math.min(3.25, w * s + 0.7);
        const fd = Math.min(3.3, d * s + 0.9);
        const fc = pick(['#cbbd9d', '#d8cdb5', '#b9a98a', '#e3d9c6', '#f1ece2']);
        const h = style === 'rich' ? 1.25 : 0.9 + r() * 0.3;
        const gz = front ? z - fd / 2 : z + fd / 2;
        const bz = front ? z + fd / 2 : z - fd / 2;
        box.push({ p: [x, h / 2, bz], s: [fw, h, 0.12], c: fc });
        box.push({ p: [x - fw / 2, h / 2, z], s: [0.12, h, fd], c: fc });
        box.push({ p: [x + fw / 2, h / 2, z], s: [0.12, h, fd], c: fc });
        box.push({ p: [x - fw * 0.3, h / 2, gz], s: [fw * 0.4, h, 0.12], c: fc });
        box.push({ p: [x + fw * 0.35, h / 2, gz], s: [fw * 0.3, h, 0.12], c: fc });
        box.push({ p: [x + 0.05, h * 0.52, gz], s: [fw * 0.3, h * 1.05, 0.06], c: pick(GATES) });
      }
      if (r() < 0.35) trees.push({ x: x - 1.35, z: z + (front ? -1.2 : 1.2), s: 0.45 + r() * 0.25, c: pick(TREES) });
      return;
    }
  }
  const type = style === 'rich' || style === 'city' ? 0.52 + r() * 0.32 : style === 'poor' ? 0.6 + r() * 0.4 : 0.52 + r() * 0.48;
  // Windows on the two faces the camera sees (+x and +z)
  const windows = (cx: number, cz: number, w: number, d: number, y0: number, floors: number, fh: number) => {
    for (let f = 0; f < floors; f++) {
      const y = y0 + f * fh + fh * 0.55;
      const n = Math.max(1, Math.floor(w / 0.8));
      for (let i = 0; i < n; i++) glass.push({ p: [cx - w / 2 + (i + 0.5) * (w / n), y, cz + d / 2 + 0.01], s: [0.36, 0.42, 0.02], c: '#2c4a63' });
      const m = Math.max(1, Math.floor(d / 0.9));
      for (let i = 0; i < m; i++) glass.push({ p: [cx + w / 2 + 0.01, y, cz - d / 2 + (i + 0.5) * (d / m)], s: [0.02, 0.42, 0.36], c: '#2c4a63' });
    }
  };
  const fence = (cx: number, cz: number, w: number, d: number) => {
    const fc = pick(['#cbbd9d', '#d8cdb5', '#b9a98a', '#e3d9c6']);
    const h = 0.9 + r() * 0.5;
    box.push({ p: [cx, h / 2, cz - d / 2], s: [w, h, 0.12], c: fc });
    box.push({ p: [cx - w / 2, h / 2, cz], s: [0.12, h, d], c: fc });
    box.push({ p: [cx + w / 2, h / 2, cz], s: [0.12, h, d], c: fc });
    box.push({ p: [cx - w * 0.3, h / 2, cz + d / 2], s: [w * 0.4, h, 0.12], c: fc });
    box.push({ p: [cx + w * 0.35, h / 2, cz + d / 2], s: [w * 0.3, h, 0.12], c: fc });
    box.push({ p: [cx + 0.05, h * 0.52, cz + d / 2], s: [w * 0.3, h * 1.05, 0.06], c: pick(GATES) });
  };

  if (type < 0.3) {
    // Bungalow with hip roof inside a compound
    const w = 1.7 + r() * 0.9, d = 1.5 + r() * 0.7, h = 1.1 + r() * 0.3;
    box.push({ p: [x, h / 2, z], s: [w, h, d], c: wall });
    cone.push({ p: [x, h + 0.32, z], s: [w * 0.78, 0.65, d * 0.78], c: roof });
    box.push({ p: [x + 0.2, 0.45, z + d / 2 + 0.01], s: [0.4, 0.9, 0.04], c: '#5b3a21' });
    windows(x, z, w, d, 0, 1, h);
    if (r() < 0.75) fence(x, z + 0.15, w + 1.0, d + 1.3);
    if (r() < 0.5) trees.push({ x: x - w / 2 - 0.3, z: z + d / 2 + 0.2, s: 0.5 + r() * 0.3, c: pick(TREES) });
  } else if (type < 0.52) {
    // Duplex: two floors, balcony, water tank on top
    const w = 2.0 + r() * 0.8, d = 1.7 + r() * 0.6, fh = 1.05;
    box.push({ p: [x, fh / 2, z], s: [w, fh, d], c: wall });
    box.push({ p: [x - 0.1, fh * 1.5, z - 0.05], s: [w * 0.88, fh, d * 0.92], c: wall });
    box.push({ p: [x, fh + 0.04, z + d / 2 + 0.2], s: [w * 0.7, 0.08, 0.45], c: '#bdb6a8' });
    box.push({ p: [x, fh + 0.3, z + d / 2 + 0.42], s: [w * 0.7, 0.4, 0.04], c: pick(['#f4f4f4', '#2b2b2b', '#c9a24a']) });
    if (r() < 0.5) cone.push({ p: [x - 0.1, fh * 2 + 0.3, z - 0.05], s: [w * 0.7, 0.6, d * 0.72], c: roof });
    else {
      box.push({ p: [x - 0.1, fh * 2 + 0.06, z - 0.05], s: [w * 0.9, 0.12, d * 0.95], c: '#d6d0c4' });
      cyl.push({ p: [x + w * 0.2, fh * 2 + 0.38, z - d * 0.2], r: 0.22, h: 0.55, c: r() < 0.7 ? '#1b1b1b' : '#2a5d9f' });
    }
    windows(x, z, w, d, 0, 2, fh);
    if (r() < 0.6) fence(x, z + 0.2, w + 1.0, d + 1.4);
  } else if (type < 0.68) {
    // Block of flats: 3–4 floors, stairs core, tanks on the roof
    const floors = 3 + Math.floor(r() * 2);
    const w = 2.2 + r() * 0.6, d = 1.8 + r() * 0.4, fh = 0.9;
    box.push({ p: [x, (floors * fh) / 2, z], s: [w, floors * fh, d], c: wall });
    box.push({ p: [x, floors * fh + 0.06, z], s: [w + 0.1, 0.12, d + 0.1], c: '#cfc8ba' });
    box.push({ p: [x - w / 2 - 0.25, (floors * fh) / 2, z + 0.3], s: [0.5, floors * fh + 0.2, 0.7], c: pick(WALLS) });
    for (let f = 1; f < floors; f++) box.push({ p: [x, f * fh, z + d / 2 + 0.15], s: [w, 0.06, 0.3], c: '#bdb6a8' });
    cyl.push({ p: [x - 0.4, floors * fh + 0.4, z], r: 0.2, h: 0.5, c: '#1b1b1b' });
    cyl.push({ p: [x + 0.3, floors * fh + 0.4, z - 0.3], r: 0.2, h: 0.5, c: '#1b1b1b' });
    windows(x, z, w, d, 0, floors, fh);
  } else if (type < 0.84) {
    // Row of small shops with colourful awnings
    const n = 2 + Math.floor(r() * 3);
    const sw = 1.1, d = 1.4, h = 1.2 + r() * 0.3;
    const x0 = x - ((n - 1) * sw) / 2;
    box.push({ p: [x, h / 2, z], s: [n * sw, h, d], c: wall });
    box.push({ p: [x, h + 0.05, z], s: [n * sw + 0.1, 0.1, d + 0.1], c: '#8d8a84' });
    for (let i = 0; i < n; i++) {
      const sx = x0 + i * sw;
      box.push({ p: [sx, h * 0.78, z + d / 2 + 0.25], s: [sw * 0.92, 0.05, 0.5], c: pick(AWNINGS) });
      box.push({ p: [sx, h * 0.42, z + d / 2 + 0.01], s: [sw * 0.7, h * 0.8, 0.03], c: '#3a3d42' });
      box.push({ p: [sx, h * 0.95, z + d / 2 + 0.02], s: [sw * 0.8, 0.18, 0.02], c: pick(AWNINGS) });
    }
  } else {
    // Uncompleted building: pillars, a slab and some blocks — very Abuja
    const w = 2.2 + r() * 0.6, d = 1.8 + r() * 0.4, h = 1.2;
    const floors = 1 + Math.floor(r() * 2);
    for (let f = 0; f < floors; f++) {
      for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]]) {
        box.push({ p: [x + (px * w) / 2, f * h + h / 2, z + (pz * d) / 2], s: [0.16, h, 0.16], c: '#9a978f' });
      }
      box.push({ p: [x, (f + 1) * h, z], s: [w + 0.1, 0.12, d + 0.1], c: '#a6a39b' });
    }
    box.push({ p: [x - w / 4, 0.35, z - d / 2], s: [w / 2, 0.7, 0.16], c: '#b8b4aa' });
    box.push({ p: [x + w / 2, 0.25, z], s: [0.16, 0.5, d * 0.6], c: '#b8b4aa' });
    for (let i = 0; i < 3; i++) box.push({ p: [x + w / 2 + 0.5, 0.1 + i * 0.12, z + d / 2 + 0.3], s: [0.6, 0.11, 0.3], c: '#bdb9ae' });
    // Rebars sticking out of the top
    for (const px of [-1, 1]) box.push({ p: [x + (px * w) / 2, floors * h + 0.3, z - d / 2], s: [0.03, 0.5, 0.03], c: '#5b3a21' });
  }
}

const roundedUnit = new RoundedBoxGeometry(1, 1, 1, 2, 0.06);

/**
 * Filler neighbourhood around a scene: varied houses, flats, shop rows and
 * uncompleted buildings, plus trees. All drawn with a handful of instanced meshes.
 */
export function Neighborhood({ seed, clear = [], extent = 26, near = -5.5, far = -19, front = 6.2, frontFar = 17, style = 'mixed', roadZ = 0 }: { seed: number; clear?: Rect[]; extent?: number; near?: number; far?: number; front?: number; frontFar?: number; style?: HoodStyle; /** z of the road the houses face. */ roadZ?: number }) {
  const parts = useMemo(() => {
    const r = rng(seed * 7919 + 13);
    const box: BoxPart[] = [], cone: ConePart[] = [], cyl: CylPart[] = [], glass: BoxPart[] = [], trees: TreePart[] = [];
    const kenney: KenneyLot[] = [];
    const blocked = (x: number, z: number) => clear.some(([x0, z0, x1, z1]) => x > x0 - 1.6 && x < x1 + 1.6 && z > z0 - 1.6 && z < z1 + 1.6);
    const lots: [number, number][] = [];
    // Back rows (behind the scene) and front rows (across the road)
    for (let z = near - 1.6; z >= far; z -= 3.4) for (let x = -extent; x <= extent; x += 3.3) lots.push([x + (r() - 0.5) * 0.6, z + (r() - 0.5) * 0.5]);
    for (let z = front + 1.6; z <= frontFar; z += 3.4) for (let x = -extent; x <= extent; x += 3.3) lots.push([x + (r() - 0.5) * 0.6, z + (r() - 0.5) * 0.5]);
    for (const [x, z] of lots) {
      if (blocked(x, z)) continue;
      if (r() < 0.12) {
        // Empty plot with trees and a "This land is not for sale" sign
        for (let i = 0; i < 3; i++) trees.push({ x: x + (r() - 0.5) * 2, z: z + (r() - 0.5) * 2, s: 0.6 + r() * 0.5, c: TREES[Math.floor(r() * TREES.length)] });
        box.push({ p: [x, 0.5, z + 1.2], s: [0.06, 1.0, 0.06], c: '#555' });
        box.push({ p: [x, 1.0, z + 1.2], s: [0.9, 0.4, 0.04], c: '#f4f4f4' });
        continue;
      }
      house(x, z, r, box, cone, cyl, glass, trees, style, kenney, roadZ);
    }
    return { box, cone, cyl, glass, trees, kenney };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, style, roadZ]);

  return (
    <group>
      <Suspense fallback={null}>
        <KenneyHouses lots={parts.kenney} />
      </Suspense>
      <Instances limit={parts.box.length} geometry={roundedUnit} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.8} />
        {parts.box.map((b, i) => (
          <Instance key={i} position={b.p} scale={b.s} color={b.c} />
        ))}
      </Instances>
      <Instances limit={parts.cone.length} castShadow>
        <coneGeometry args={[0.7071, 1, 4]} />
        <meshStandardMaterial roughness={0.6} />
        {parts.cone.map((c, i) => (
          <Instance key={i} position={c.p} scale={c.s} rotation={[0, Math.PI / 4, 0]} color={c.c} />
        ))}
      </Instances>
      <Instances limit={Math.max(1, parts.cyl.length)} castShadow>
        <cylinderGeometry args={[1, 1, 1, 14]} />
        <meshStandardMaterial roughness={0.5} />
        {parts.cyl.map((c, i) => (
          <Instance key={i} position={c.p} scale={[c.r, c.h, c.r]} color={c.c} />
        ))}
      </Instances>
      <Instances limit={Math.max(1, parts.glass.length)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.5} roughness={0.2} />
        {parts.glass.map((g, i) => (
          <Instance key={i} position={g.p} scale={g.s} color={g.c} />
        ))}
      </Instances>
      <Instances limit={Math.max(1, parts.trees.length)} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} />
        {parts.trees.map((t, i) => (
          <Instance key={i} position={[t.x, 1.4 * t.s, t.z]} scale={0.75 * t.s} color={t.c} />
        ))}
      </Instances>
      <Instances limit={Math.max(1, parts.trees.length)}>
        <cylinderGeometry args={[0.08, 0.12, 1, 8]} />
        <meshStandardMaterial color="#6b4a2b" />
        {parts.trees.map((t, i) => (
          <Instance key={i} position={[t.x, 0.5 * t.s, t.z]} scale={[t.s, t.s, t.s]} />
        ))}
      </Instances>
    </group>
  );
}

/** The Kenney houses and blocks: one instanced mesh per model and paint. */
function KenneyHouses({ lots }: { lots: KenneyLot[] }) {
  const suburban = useKit('suburban');
  const commercial = useKit('commercial');
  const groups = useMemo(() => {
    const g = new Map<string, { lot: KenneyLot; at: Placement[] }>();
    for (const l of lots) {
      const k = `${l.kit}|${l.name}|${l.paint}`;
      if (!g.has(k)) g.set(k, { lot: l, at: [] });
      g.get(k)!.at.push({ x: l.x, z: l.z, rot: l.rot, s: l.s });
    }
    return [...g.values()];
  }, [lots]);
  return (
    <>
      {groups.map(({ lot, at }) => {
        const kit = lot.kit === 'suburban' ? suburban : commercial;
        const paint = (lot.kit === 'suburban' ? HOUSE_PAINTS : BLOCK_PAINTS)[lot.paint];
        const part = kit.parts[lot.name];
        if (!part) return null;
        return <KitInstances key={`${lot.kit}|${lot.name}|${lot.paint}`} part={part} at={at} material={kitMaterial(paintedMap(kit.map, lot.kit, paint))} />;
      })}
    </>
  );
}
