import { Instance, Instances, MapControls, OrthographicCamera } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Vector3, type Group } from 'three';
import { HOME_XY, ROADS, type MapSpot } from '../content/map';
import { fromPlace } from '../content/phoneapps';
import { useGame } from '../store/game';
import { TravelSheet, useMapSpots } from './MapView';
import { AdBoards, AdSheet } from './AdBoards';
import { loadAds } from '../net/billboards';

/** SVG map coords (300×360) → world units. */
const W = (x: number, y: number): [number, number] => [(x - 150) / 9, (y - 180) / 9];

/** Small deterministic random so the city looks the same every time. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const labelEls = new Map<string, HTMLElement>();
/** How high each chip floats: tall landmarks get higher labels. */
const LABEL_Y: Record<string, number> = { secretariat: 1.9, maitama: 1.9, mosque: 2.0, church: 2.3, cbn: 2.4, 'nnpc-towers': 2.0, tower: 3.6, hilton: 2.3, zuma: 3.0 };
const tmp = new Vector3();

function LabelSync({ anchors }: { anchors: Map<string, Vector3> }) {
  useFrame(({ camera, size }) => {
    for (const [id, el] of labelEls) {
      const a = anchors.get(id);
      if (!a) continue;
      tmp.copy(a).project(camera);
      el.style.transform = `translate(${((tmp.x + 1) / 2) * size.width}px, ${((1 - tmp.y) / 2) * size.height}px) translate(-50%, -100%)`;
    }
  });
  return null;
}

function Block({ p, s, c, emissive }: { p: [number, number, number]; s: [number, number, number]; c: string; emissive?: boolean }) {
  return (
    <mesh position={p} castShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} emissive={emissive ? c : '#000'} emissiveIntensity={emissive ? 1.2 : 0} />
    </mesh>
  );
}

/** Rows of identical houses, like an Abuja estate. */
function Estate({ cx, cz, cols, rows, roof, seed }: { cx: number; cz: number; cols: number; rows: number; roof: string; seed: number }) {
  const r = rng(seed);
  const houses = useMemo(
    () =>
      Array.from({ length: cols * rows }, (_, i) => ({
        x: cx + (i % cols) * 0.42 - (cols * 0.42) / 2,
        z: cz + Math.floor(i / cols) * 0.42 - (rows * 0.42) / 2,
        h: 0.18 + r() * 0.08,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cx, cz, cols, rows],
  );
  return (
    <>
      <mesh position={[cx - 0.21, 0.015, cz - 0.21]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[cols * 0.42 + 0.3, rows * 0.42 + 0.3]} />
        <meshStandardMaterial color="#c9c0a8" />
      </mesh>
      <Instances limit={houses.length}>
        <boxGeometry args={[0.28, 1, 0.28]} />
        <meshStandardMaterial color="#efe4cf" />
        {houses.map((h, i) => (
          <Instance key={i} position={[h.x, h.h / 2, h.z]} scale={[1, h.h, 1]} />
        ))}
      </Instances>
      <Instances limit={houses.length}>
        <coneGeometry args={[0.24, 0.14, 4]} />
        <meshStandardMaterial color={roof} />
        {houses.map((h, i) => (
          <Instance key={i} position={[h.x, h.h + 0.07, h.z]} rotation={[0, Math.PI / 4, 0]} />
        ))}
      </Instances>
    </>
  );
}

function Roads() {
  const segs = useMemo(
    () =>
      ROADS.flatMap((r) =>
        r.points.slice(1).map((p, i) => {
          const [ax, az] = W(...r.points[i]);
          const [bx, bz] = W(...p);
          const len = Math.hypot(bx - ax, bz - az);
          return { x: (ax + bx) / 2, z: (az + bz) / 2, len, rot: -Math.atan2(bz - az, bx - ax), major: !!r.major };
        }),
      ),
    [],
  );
  return (
    <>
      {segs.map((s, i) => (
        <group key={i} position={[s.x, 0.03, s.z]} rotation={[0, s.rot, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[s.len + (s.major ? 0.7 : 0.45), 0.04, s.major ? 0.7 : 0.45]} />
            <meshStandardMaterial color="#3a3d42" />
          </mesh>
          {s.major && (
            <mesh position={[0, 0.025, 0]}>
              <boxGeometry args={[s.len, 0.01, 0.05]} />
              <meshStandardMaterial color="#f2c230" />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

const AD_COLORS = ['#e74c3c', '#2980b9', '#27ae60', '#8e44ad', '#f39c12', '#16a085', '#d35400', '#c0392b'];

/** Distance from a point to a road segment. */
function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

const BLOCK_COLORS = ['#e9e4dc', '#d8d1c2', '#cfd8dc', '#efe4cf', '#bfc9d1', '#e2c48f'];

/** Filler city blocks around the centre so the city feels full. */
function CityBlocks({ avoid }: { avoid: [number, number][] }) {
  const blocks = useMemo(() => {
    const r = rng(99);
    const segs = ROADS.flatMap((road) => road.points.slice(1).map((p, i) => [...W(...road.points[i]), ...W(...p)] as [number, number, number, number]));
    const out: { x: number; z: number; h: number; w: number; d: number; c: string }[] = [];
    for (let gx = -8; gx <= 15; gx += 0.72) {
      for (let gz = -8; gz <= 14; gz += 0.72) {
        const x = gx + (r() - 0.5) * 0.25, z = gz + (r() - 0.5) * 0.25;
        const centre = Math.hypot(x - 4, z - 2);
        if (centre > 10.5 || r() < (centre < 6 ? 0.15 : 0.35)) continue;
        if (segs.some((sg) => segDist(x, z, ...sg) < 0.62)) continue;
        if (avoid.some(([ax, az]) => Math.hypot(x - ax, z - az) < 1.1)) continue;
        if (Math.hypot(x + 5.8, (z - 1.1) * 1.6) < 2.6) continue; // Jabi Lake
        const tall = centre < 3.5 ? 1.9 : centre < 6 ? 0.9 : 0.35;
        out.push({ x, z, h: 0.18 + r() * tall, w: 0.3 + r() * 0.28, d: 0.3 + r() * 0.28, c: BLOCK_COLORS[Math.floor(r() * BLOCK_COLORS.length)] });
      }
    }
    return out;
  }, [avoid]);
  const tall = blocks.filter((b) => b.h > 0.7);
  return (
    <>
      <Instances limit={blocks.length} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.75} />
        {blocks.map((b, i) => (
          <Instance key={i} position={[b.x, b.h / 2, b.z]} scale={[b.w, b.h, b.d]} color={b.c} />
        ))}
      </Instances>
      {/* Roof caps and glass bands so the blocks no look like plain boxes */}
      <Instances limit={blocks.length}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8d8a84" roughness={0.6} />
        {blocks.map((b, i) => (
          <Instance key={i} position={[b.x, b.h + 0.025, b.z]} scale={[b.w * 0.86, 0.05, b.d * 0.86]} />
        ))}
      </Instances>
      <Instances limit={tall.length * 3}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4f7fa3" metalness={0.5} roughness={0.25} />
        {tall.flatMap((b, i) =>
          [0.3, 0.55, 0.8].map((t, k) => <Instance key={`${i}-${k}`} position={[b.x, b.h * t, b.z]} scale={[b.w + 0.01, b.h * 0.08, b.d + 0.01]} />),
        )}
      </Instances>
    </>
  );
}

function Trees() {
  const trees = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: 320 }, () => ({ x: (r() - 0.5) * 50, z: (r() - 0.5) * 56, s: 0.6 + r() * 0.6 })).filter((t) => Math.hypot(t.x - 4, t.z - 2) > 8);
  }, []);
  return (
    <Instances limit={trees.length}>
      <coneGeometry args={[0.22, 0.6, 6]} />
      <meshStandardMaterial color="#3f7d3a" flatShading />
      {trees.map((t, i) => (
        <Instance key={i} position={[t.x, 0.3 * t.s, t.z]} scale={t.s} />
      ))}
    </Instances>
  );
}

/** A little landmark model for each place. */
function Landmark({ s }: { s: MapSpot }) {
  const [x, z] = W(s.x, s.y);
  let body: ReactNode = <Block p={[0, 0.25, 0]} s={[0.6, 0.5, 0.6]} c="#d9cbb0" />;
  switch (s.id) {
    case 'jabi':
      body = (
        <>
          <Block p={[0.5, 0.35, -0.3]} s={[1.3, 0.7, 0.8]} c="#e9e4dc" />
          <Block p={[0.5, 0.72, -0.3]} s={[1.35, 0.06, 0.85]} c="#c9a24a" />
        </>
      );
      break;
    case 'wuse':
      body = (
        <>
          {AD_COLORS.slice(0, 6).map((c, i) => (
            <Block key={c} p={[(i % 3) * 0.45 - 0.45, 0.25, Math.floor(i / 3) * 0.45 - 0.2]} s={[0.4, 0.04, 0.35]} c={c} />
          ))}
        </>
      );
      break;
    case 'lounge':
      body = (
        <>
          <Block p={[0, 0.3, 0]} s={[0.9, 0.6, 0.7]} c="#1b1a22" />
          <Block p={[0, 0.5, 0.36]} s={[0.8, 0.05, 0.02]} c="#ff3d7f" emissive />
          <Block p={[0, 0.2, 0.36]} s={[0.8, 0.05, 0.02]} c="#3dd6ff" emissive />
        </>
      );
      break;
    case 'secretariat':
      body = (
        <>
          <Block p={[-0.45, 0.7, 0]} s={[0.6, 1.4, 0.6]} c="#ddd5c4" />
          <Block p={[0.45, 0.7, 0]} s={[0.6, 1.4, 0.6]} c="#ddd5c4" />
          <Block p={[0, 0.25, 0.1]} s={[0.4, 0.5, 0.4]} c="#f4efe6" />
          <Block p={[0, 0.9, 0.5]} s={[0.25, 0.15, 0.02]} c="#118a4c" />
        </>
      );
      break;
    case 'maitama':
      body = (
        <>
          <Block p={[0, 0.9, 0]} s={[0.5, 1.8, 0.5]} c="#7fb3d0" />
          <Block p={[0.6, 0.5, 0.3]} s={[0.4, 1.0, 0.4]} c="#a7c7db" />
        </>
      );
      break;
    case 'asorock':
      body = (
        <mesh position={[0, 0.8, 0]} scale={[1.6, 1.4, 1.3]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#8d857a" flatShading />
        </mesh>
      );
      break;
    case 'asokoro':
      body = (
        <>
          <Block p={[-0.3, 0.2, 0]} s={[0.5, 0.4, 0.5]} c="#f4f1ec" />
          <Block p={[0.4, 0.2, 0.2]} s={[0.5, 0.4, 0.5]} c="#efe9df" />
          <Block p={[0.1, 0.02, -0.5]} s={[0.4, 0.02, 0.25]} c="#3d8fc4" />
        </>
      );
      break;
    case 'airport':
      body = (
        <>
          <Block p={[0, 0.02, 0]} s={[3, 0.03, 0.5]} c="#2b2b2b" />
          <Block p={[0.6, 0.25, 0.7]} s={[1.0, 0.5, 0.5]} c="#dfe6ea" />
        </>
      );
      break;
    case 'mosque':
      body = (
        <>
          <Block p={[0, 0.25, 0]} s={[1.1, 0.5, 1.1]} c="#efe6d2" />
          <mesh position={[0, 0.72, 0]} castShadow>
            <sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#d4a017" metalness={0.8} roughness={0.25} />
          </mesh>
          {[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([x, z]) => (
            <group key={`${x}${z}`} position={[x, 0, z]}>
              <mesh position={[0, 0.8, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.08, 1.6, 10]} />
                <meshStandardMaterial color="#f4efe2" />
              </mesh>
              <mesh position={[0, 1.7, 0]}>
                <coneGeometry args={[0.08, 0.22, 10]} />
                <meshStandardMaterial color="#d4a017" metalness={0.8} roughness={0.25} />
              </mesh>
            </group>
          ))}
        </>
      );
      break;
    case 'church':
      body = (
        <>
          <Block p={[0, 0.2, 0]} s={[1.0, 0.4, 0.9]} c="#e9e4dc" />
          <mesh position={[0, 1.1, 0]} castShadow>
            <coneGeometry args={[0.55, 1.6, 3]} />
            <meshStandardMaterial color="#f4f1ec" />
          </mesh>
          <Block p={[0, 2.05, 0]} s={[0.04, 0.4, 0.04]} c="#c9a24a" />
          <Block p={[0, 2.12, 0]} s={[0.2, 0.04, 0.04]} c="#c9a24a" />
        </>
      );
      break;
    case 'eagle':
      body = (
        <>
          <Block p={[0, 0.02, 0]} s={[1.6, 0.04, 1.0]} c="#e7e1d3" />
          <Block p={[0, 0.2, -0.45]} s={[1.2, 0.36, 0.2]} c="#118a4c" />
          <Block p={[0, 0.42, -0.45]} s={[1.3, 0.04, 0.3]} c="#f4f4f4" />
          {[-0.6, -0.3, 0, 0.3, 0.6].map((x) => (
            <Block key={x} p={[x, 0.45, 0.45]} s={[0.03, 0.9, 0.03]} c="#ddd" />
          ))}
        </>
      );
      break;
    case 'cbn':
      body = (
        <>
          <Block p={[0, 1.0, 0]} s={[0.6, 2.0, 0.6]} c="#3f5566" />
          <Block p={[0, 2.08, 0]} s={[0.72, 0.16, 0.72]} c="#c9a24a" />
          <Block p={[0, 0.15, 0]} s={[1.0, 0.3, 1.0]} c="#d8d1c2" />
        </>
      );
      break;
    case 'nnpc-towers':
      body = (
        <>
          {[[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].map(([x, z]) => (
            <Block key={`${x}${z}`} p={[x, 0.85, z]} s={[0.36, 1.7, 0.36]} c="#5d7f99" />
          ))}
          <Block p={[0, 1.75, 0]} s={[0.9, 0.1, 0.9]} c="#118a4c" />
        </>
      );
      break;
    case 'silverbird':
      body = (
        <>
          <Block p={[0, 0.35, 0]} s={[1.0, 0.7, 0.7]} c="#9fc8e0" />
          <Block p={[0, 0.6, 0.36]} s={[0.9, 0.12, 0.02]} c="#c0392b" emissive />
        </>
      );
      break;
    case 'tower':
      body = (
        <>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.12, 3.0, 12]} />
            <meshStandardMaterial color="#e9e9e9" metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.3, 0.18, 24]} />
            <meshStandardMaterial color="#5d7f99" metalness={0.5} roughness={0.3} />
          </mesh>
          <Block p={[0, 3.2, 0]} s={[0.02, 0.5, 0.02]} c="#d63c3c" emissive />
        </>
      );
      break;
    case 'hilton':
      body = (
        <>
          <Block p={[0, 1.0, 0]} s={[1.2, 2.0, 0.42]} c="#f4f1ec" />
          {[0.4, 0.8, 1.2, 1.6].map((y) => (
            <Block key={y} p={[0, y, 0.215]} s={[1.1, 0.08, 0.01]} c="#7fa7c0" />
          ))}
          <Block p={[0, 0.15, 0.6]} s={[0.8, 0.3, 0.4]} c="#d8d1c2" />
        </>
      );
      break;
    case 'fountain':
      body = (
        <>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.12, 28]} />
            <meshStandardMaterial color="#d8d1c2" />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.52, 0.52, 0.02, 28]} />
            <meshStandardMaterial color="#4aa3df" />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 0.8, 12]} />
            <meshStandardMaterial color="#c9a24a" metalness={0.6} roughness={0.3} />
          </mesh>
        </>
      );
      break;
    case 'banex':
      body = (
        <>
          <Block p={[0, 0.3, 0]} s={[0.9, 0.6, 0.6]} c="#d8d1c2" />
          <Block p={[0, 0.5, 0.31]} s={[0.8, 0.14, 0.02]} c="#2980b9" emissive />
        </>
      );
      break;
    case 'citygate':
      body = (
        <>
          <Block p={[-0.5, 0.55, 0]} s={[0.22, 1.1, 0.3]} c="#efe6d2" />
          <Block p={[0.5, 0.55, 0]} s={[0.22, 1.1, 0.3]} c="#efe6d2" />
          <Block p={[0, 1.18, 0]} s={[1.3, 0.22, 0.32]} c="#118a4c" />
          <Block p={[0, 1.18, 0.17]} s={[1.0, 0.08, 0.01]} c="#f4f4f4" />
        </>
      );
      break;
    case 'zuma':
      body = (
        <>
          <mesh position={[0, 1.1, 0]} scale={[1.8, 1.6, 1.4]} castShadow>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#8f8678" flatShading roughness={0.95} />
          </mesh>
          <Block p={[0.6, 1.4, 0.95]} s={[0.15, 1.2, 0.05]} c="#5b544a" />
        </>
      );
      break;
    case 'park':
      body = (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[1.3, 28]} />
            <meshStandardMaterial color="#58a046" />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 20]} />
            <meshStandardMaterial color="#4aa3df" />
          </mesh>
          {[[-0.7, -0.5], [0.7, -0.4], [-0.5, 0.7], [0.6, 0.7]].map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x, 0.35, z]} castShadow>
              <sphereGeometry args={[0.25, 10, 8]} />
              <meshStandardMaterial color="#2f7d32" />
            </mesh>
          ))}
        </>
      );
      break;
    case 'stadium':
      body = (
        <>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[1.0, 0.9, 0.6, 32, 1, true]} />
            <meshStandardMaterial color="#e9e4dc" side={2} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <torusGeometry args={[1.0, 0.05, 6, 32]} />
            <meshStandardMaterial color="#118a4c" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <circleGeometry args={[0.85, 28]} />
            <meshStandardMaterial color="#3f9a3c" />
          </mesh>
        </>
      );
      break;
    case 'garki':
      body = (
        <>
          <Block p={[-0.3, 0.3, 0]} s={[0.45, 0.6, 0.45]} c="#e2c48f" />
          <Block p={[0.3, 0.45, 0.2]} s={[0.45, 0.9, 0.45]} c="#d8d1c2" />
        </>
      );
      break;
    default:
      break;
  }
  return <group position={[x, 0, z]}>{body}</group>;
}

function YouPin({ at }: { at: [number, number] }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 1.9 + Math.sin(clock.getElapsedTime() * 3) * 0.15;
  });
  return (
    <group ref={ref} position={[at[0], 1.9, at[1]]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.22, 0.5, 12]} />
        <meshStandardMaterial color="#e8b04b" emissive="#e8b04b" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

export function WorldMap() {
  const openPhone = useGame((s) => s.openPhone);
  const place = useGame((s) => s.place);
  const spots = useMapSpots();
  const [selected, setSelected] = useState<string | null>(null);
  const [board, setBoard] = useState<number | null>(null);
  useEffect(() => {
    void loadAds();
  }, []);
  const here = fromPlace(place);
  const herePos = spots.find((s) => s.place === here) ?? spots[0];
  const hereW = W(herePos.x, herePos.y);
  const anchors = useMemo(() => new Map(spots.map((s) => {
    const [x, z] = W(s.x, s.y);
    return [s.id, new Vector3(x, LABEL_Y[s.id] ?? 1.1, z)] as const;
  })), [spots]);
  const sel = spots.find((s) => s.id === selected);
  const avoid = useMemo(() => spots.map((s) => W(s.x, s.y)), [spots]);
  // Look between where you dey and the city centre, so the city fills the screen
  const focus: [number, number] = [(hereW[0] + 3) / 2, (hereW[1] + 2) / 2];

  return (
    <div className="world-map">
      <Canvas shadows dpr={[1, 2]} className="world-canvas">
        <OrthographicCamera makeDefault zoom={Math.min(window.innerWidth / 17, 40)} position={[focus[0] + 20, 24, focus[1] + 20]} near={-100} far={300} />
        <MapControls target={[focus[0], 0, focus[1]]} enableRotate={false} minZoom={10} maxZoom={80} screenSpacePanning={false} />
        <color attach="background" args={['#86ad5f']} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[10, 20, 6]} intensity={1.3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} />
        <LabelSync anchors={anchors} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={() => { setSelected(null); setBoard(null); }}>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#86ad5f" />
        </mesh>
        {/* Laterite patches, Maitama green, Jabi Lake */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 0.005, 2]}>
          <circleGeometry args={[7, 32]} />
          <meshStandardMaterial color="#b9a27c" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10.9, 0.01, -13.6]} scale={[1.8, 1, 1]}>
          <circleGeometry args={[3.2, 32]} />
          <meshStandardMaterial color="#5f9447" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.8, 0.02, 1.1]} scale={[1.8, 1, 1]}>
          <circleGeometry args={[1.25, 32]} />
          <meshStandardMaterial color="#3d8fc4" />
        </mesh>

        <CityBlocks avoid={avoid} />
        <Roads />
        <AdBoards onTap={(slot) => { setSelected(null); setBoard(slot); }} />
        <Trees />

        {/* Estates: your area and the satellite towns */}
        <Estate cx={W(...HOME_XY.kubwa)[0] - 1.8} cz={W(...HOME_XY.kubwa)[1] - 0.6} cols={8} rows={5} roof="#a33b2b" seed={1} />
        <Estate cx={W(...HOME_XY.gwarinpa)[0] - 2.4} cz={W(...HOME_XY.gwarinpa)[1] + 0.6} cols={9} rows={6} roof="#2f6b4a" seed={2} />
        <Estate cx={W(92, 290)[0]} cz={W(92, 290)[1] - 1.6} cols={8} rows={4} roof="#8a5a2b" seed={3} />
        <Estate cx={W(286, 286)[0] - 1.2} cz={W(286, 286)[1] + 1.4} cols={6} rows={3} roof="#a33b2b" seed={4} />
        {/* More estates: Life Camp, Katampe, Lokogoma, Karu, Lugbe extension, Dutse */}
        <Estate cx={W(96, 150)[0]} cz={W(96, 150)[1]} cols={6} rows={4} roof="#7a3b2b" seed={5} />
        <Estate cx={W(176, 86)[0]} cz={W(176, 86)[1]} cols={7} rows={4} roof="#2f4f6b" seed={6} />
        <Estate cx={W(200, 300)[0]} cz={W(200, 300)[1]} cols={8} rows={4} roof="#a35a2b" seed={7} />
        <Estate cx={W(262, 312)[0]} cz={W(262, 312)[1]} cols={6} rows={4} roof="#8a2f2f" seed={8} />
        <Estate cx={W(60, 268)[0]} cz={W(60, 268)[1]} cols={6} rows={3} roof="#5a4a2b" seed={9} />
        <Estate cx={W(110, 70)[0]} cz={W(110, 70)[1]} cols={5} rows={4} roof="#a33b2b" seed={10} />

        {spots.map((s) => (
          <group key={s.id} onPointerDown={(e) => { e.stopPropagation(); setSelected(s.id); setBoard(null); }}>
            <Landmark s={s} />
          </group>
        ))}
        <YouPin at={hereW} />
      </Canvas>

      <div className="world-labels">
        {spots.map((s) => (
          <button
            key={s.id}
            ref={(el) => { if (el) labelEls.set(s.id, el); else labelEls.delete(s.id); }}
            className={`world-chip ${s.landmark ? 'landmark' : s.place ? '' : 'soon'} ${selected === s.id ? 'on' : ''} ${s.id === herePos.id ? 'here' : ''}`}
            onPointerDown={(e) => { e.stopPropagation(); setSelected(s.id); setBoard(null); }}
          >
            {s.id === herePos.id ? '📍 ' : ''}{s.emoji}{s.landmark && selected !== s.id ? '' : ` ${s.short ?? s.name}`}{s.place || s.landmark ? '' : ' · Soon'}
          </button>
        ))}
      </div>

      <div className="world-top">
        <span className="world-title">🗺️ Abuja <span className="muted small">· drag to move, pinch to zoom</span></span>
        <button className="world-close" onClick={() => openPhone(null)} aria-label="Close map">✕</button>
      </div>

      {board !== null && (
        <div className="world-sheet card">
          <AdSheet slot={board} onClose={() => setBoard(null)} />
        </div>
      )}
      {sel && board === null && (
        <div className="world-sheet card">
          <TravelSheet sel={sel} />
        </div>
      )}
    </div>
  );
}
