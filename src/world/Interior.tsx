import type { ThreeEvent } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import { useMemo } from 'react';
import { useSettings } from '../settings';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { Box, Cyl, type V3 } from './Room';

/** Shared bits for house interiors: painted floors, plants, lights, art and chairs. */

export const TRIM = '#2b2f33';
export const WOOD = '#6b4a32';
export const RED = '#a3141c';
export const GOLD = '#c9a24a';

// ---------------- Floors (painted once on a canvas, repeated) ----------------

const textures = new Map<string, CanvasTexture>();

/** Seeded random so the marble veins look the same every time. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function paint(key: string, draw: (g: CanvasRenderingContext2D, r: () => number) => void): CanvasTexture {
  let t = textures.get(key);
  if (!t) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    c.getContext('2d')!.imageSmoothingEnabled = true;
    draw(c.getContext('2d')!, rng(key.length * 977 + 13));
    t = new CanvasTexture(c);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    textures.set(key, t);
  }
  return t;
}

export function marble(base: string, vein: string, grout: string) {
  return (g: CanvasRenderingContext2D, r: () => number) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = vein;
    for (let i = 0; i < 16; i++) {
      g.globalAlpha = 0.12 + r() * 0.25;
      g.lineWidth = 0.6 + r() * 1.8;
      g.beginPath();
      const x = r() * 256;
      const y = r() * 256;
      g.moveTo(x, y);
      g.bezierCurveTo(x + r() * 120 - 60, y + r() * 120 - 60, x + r() * 160 - 80, y + r() * 160 - 80, x + r() * 200 - 100, y + r() * 200 - 100);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.strokeStyle = grout;
    g.lineWidth = 2;
    for (const p of [0, 128, 256]) {
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, 256);
      g.moveTo(0, p);
      g.lineTo(256, p);
      g.stroke();
    }
  };
}

export function carpet(g: CanvasRenderingContext2D) {
  g.fillStyle = RED;
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = GOLD;
  g.lineWidth = 3;
  g.strokeRect(10, 10, 236, 236);
  g.lineWidth = 1.5;
  g.strokeRect(22, 22, 212, 212);
  g.beginPath();
  g.moveTo(128, 22);
  g.lineTo(128, 234);
  g.moveTo(22, 128);
  g.lineTo(234, 128);
  g.stroke();
}

export function concrete(g: CanvasRenderingContext2D, r: () => number) {
  g.fillStyle = '#6f7378';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) {
    g.fillStyle = r() > 0.5 ? '#676b70' : '#7a7e83';
    g.fillRect(r() * 256, r() * 256, 2, 2);
  }
}

/** A floor patch. `tile` is world units per texture repeat. */
export function Floor({ x0, z0, x1, z1, tex, tile = 2, y = 0.004, rough = 0.3, reflect = false, onFloor }: { x0: number; z0: number; x1: number; z1: number; tex: Texture; tile?: number; y?: number; rough?: number; /** Polished floor that mirrors the room (high graphics only). */ reflect?: boolean; onFloor: (e: ThreeEvent<MouseEvent>) => void }) {
  const low = useSettings((s) => s.quality === 'low');
  const w = x1 - x0;
  const d = z1 - z0;
  const map = useMemo(() => {
    const m = tex.clone();
    m.repeat.set(w / tile, d / tile);
    m.needsUpdate = true;
    return m;
  }, [tex, w, d, tile]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, y, (z0 + z1) / 2]} receiveShadow onClick={onFloor}>
      <planeGeometry args={[w, d]} />
      {reflect && !low ? (
        <MeshReflectorMaterial map={map} roughness={rough} metalness={0.15} mirror={0.55} blur={[260, 80]} mixBlur={0.8} mixStrength={1.4} resolution={512} depthScale={0} />
      ) : (
        <meshStandardMaterial map={map} roughness={rough} metalness={0.05} />
      )}
    </mesh>
  );
}

// ---------------- Small furniture pieces ----------------

export function Plant({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.18, 0]} r={0.16} h={0.36} c="#f2f2f2" />
      <mesh position={[0, 0.62, 0]} castShadow>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#2f8a3e" flatShading />
      </mesh>
      <mesh position={[0.08, 0.9, -0.05]} castShadow>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#3aa34b" flatShading />
      </mesh>
    </group>
  );
}

/** Warm wall light. Glows at night. */
export function Sconce({ p, rotY = 0, lit }: { p: V3; rotY?: number; lit: boolean }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Box p={[0, 0, 0]} s={[0.12, 0.22, 0.06]} c={TRIM} />
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.08, 0.16, 0.04]} />
        <meshStandardMaterial color="#ffe2a8" emissive="#ffb347" emissiveIntensity={lit ? 2.2 : 0.2} />
      </mesh>
    </group>
  );
}

/** Framed painting. `face` turns it to hang on a side wall. */
export function Art({ p, w, h, c1, c2, rotY = 0 }: { p: V3; w: number; h: number; c1: string; c2: string; rotY?: number }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Box p={[0, 0, 0]} s={[w, h, 0.04]} c="#111" />
      <Box p={[0, 0, 0.025]} s={[w * 0.86, h * 0.86, 0.01]} c={c1} />
      <Box p={[w * 0.12, -h * 0.08, 0.032]} s={[w * 0.4, h * 0.45, 0.01]} c={c2} />
    </group>
  );
}

export function Chair({ p, rotY }: { p: V3; rotY: number }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Box p={[0, 0.42, 0]} s={[0.38, 0.06, 0.38]} c={WOOD} />
      <Box p={[0, 0.72, -0.17]} s={[0.38, 0.55, 0.05]} c={WOOD} />
      {[-0.15, 0.15].flatMap((x) => [-0.15, 0.15].map((z) => <Box key={`${x}${z}`} p={[x, 0.2, z]} s={[0.04, 0.4, 0.04]} c="#3a2a1c" />))}
    </group>
  );
}


/** Bare cement with cracks and patches (one-room houses). */
export function cementFloor(g: CanvasRenderingContext2D, r: () => number) {
  g.fillStyle = '#9c968a';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = r() > 0.5 ? '#928c80' : '#a8a296';
    g.fillRect(r() * 256, r() * 256, 3, 3);
  }
  g.strokeStyle = '#6f695e';
  g.globalAlpha = 0.6;
  for (let i = 0; i < 4; i++) {
    g.lineWidth = 1;
    g.beginPath();
    let x = r() * 256;
    let y = r() * 256;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += r() * 30 - 15;
      y += r() * 30 - 5;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
}
