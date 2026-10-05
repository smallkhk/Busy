import { Instance, Instances, MapControls, OrthographicCamera } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Vector3, type Group } from 'three';
import { HOME_XY, ROADS, type MapSpot } from '../content/map';
import { fromPlace } from '../content/phoneapps';
import { useGame } from '../store/game';
import { TravelSheet, useMapSpots } from './MapView';

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

/** Billboards along the major roads. */
function Billboards() {
  const boards = useMemo(() => {
    const r = rng(7);
    return ROADS.filter((road) => road.major).flatMap((road) =>
      road.points.slice(1).flatMap((p, i) => {
        const [ax, az] = W(...road.points[i]);
        const [bx, bz] = W(...p);
        const n = Math.floor(Math.hypot(bx - ax, bz - az) / 2.2);
        return Array.from({ length: n }, (_, k) => {
          const t = (k + 0.5) / n;
          const side = k % 2 ? 0.75 : -0.75;
          const nx = -(bz - az), nz = bx - ax;
          const nl = Math.hypot(nx, nz) || 1;
          return { x: ax + (bx - ax) * t + (nx / nl) * side, z: az + (bz - az) * t + (nz / nl) * side, c: AD_COLORS[Math.floor(r() * AD_COLORS.length)] };
        });
      }),
    );
  }, []);
  return (
    <>
      {boards.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, Math.PI / 4, 0]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.04, 0.6, 0.04]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          <mesh position={[0, 0.66, 0]}>
            <boxGeometry args={[0.7, 0.36, 0.04]} />
            <meshStandardMaterial color={b.c} emissive={b.c} emissiveIntensity={0.25} />
          </mesh>
        </group>
      ))}
    </>
  );
}

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
    const out: { x: number; z: number; h: number; w: number; c: string }[] = [];
    for (let gx = -6; gx <= 13; gx += 0.9) {
      for (let gz = -6; gz <= 12; gz += 0.9) {
        const x = gx + (r() - 0.5) * 0.3, z = gz + (r() - 0.5) * 0.3;
        const centre = Math.hypot(x - 4, z - 2);
        if (centre > 8.5 || r() < 0.25) continue;
        if (segs.some((sg) => segDist(x, z, ...sg) < 0.75)) continue;
        if (avoid.some(([ax, az]) => Math.hypot(x - ax, z - az) < 1.4)) continue;
        if (Math.hypot(x + 5.8, (z - 1.1) * 1.6) < 2.6) continue; // Jabi Lake
        const tall = centre < 4 ? 1.6 : 0.6;
        out.push({ x, z, h: 0.2 + r() * tall, w: 0.35 + r() * 0.3, c: BLOCK_COLORS[Math.floor(r() * BLOCK_COLORS.length)] });
      }
    }
    return out;
  }, [avoid]);
  return (
    <>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshStandardMaterial color={b.c} />
        </mesh>
      ))}
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
  const here = fromPlace(place);
  const herePos = spots.find((s) => s.place === here) ?? spots[0];
  const hereW = W(herePos.x, herePos.y);
  const anchors = useMemo(() => new Map(spots.map((s) => {
    const [x, z] = W(s.x, s.y);
    return [s.id, new Vector3(x, s.id === 'secretariat' || s.id === 'maitama' ? 1.9 : 1.1, z)] as const;
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

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={() => setSelected(null)}>
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
        <Billboards />
        <Trees />

        {/* Estates: your area and the satellite towns */}
        <Estate cx={W(...HOME_XY.kubwa)[0] - 1.8} cz={W(...HOME_XY.kubwa)[1] - 0.6} cols={8} rows={5} roof="#a33b2b" seed={1} />
        <Estate cx={W(...HOME_XY.gwarinpa)[0] - 2.4} cz={W(...HOME_XY.gwarinpa)[1] + 0.6} cols={9} rows={6} roof="#2f6b4a" seed={2} />
        <Estate cx={W(92, 290)[0]} cz={W(92, 290)[1] - 1.6} cols={8} rows={4} roof="#8a5a2b" seed={3} />
        <Estate cx={W(286, 286)[0] - 1.2} cz={W(286, 286)[1] + 1.4} cols={6} rows={3} roof="#a33b2b" seed={4} />

        {spots.map((s) => (
          <group key={s.id} onPointerDown={(e) => { e.stopPropagation(); setSelected(s.id); }}>
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
            className={`world-chip ${s.place ? '' : 'soon'} ${selected === s.id ? 'on' : ''} ${s.id === herePos.id ? 'here' : ''}`}
            onPointerDown={(e) => { e.stopPropagation(); setSelected(s.id); }}
          >
            {s.id === herePos.id ? '📍 ' : ''}{s.emoji} {s.short ?? s.name}{s.place ? '' : ' · Soon'}
          </button>
        ))}
      </div>

      <div className="world-top">
        <span className="world-title">🗺️ Abuja <span className="muted small">· drag to move, pinch to zoom</span></span>
        <button className="world-close" onClick={() => openPhone(null)} aria-label="Close map">✕</button>
      </div>

      {sel && (
        <div className="world-sheet card">
          <TravelSheet sel={sel} />
        </div>
      )}
    </div>
  );
}
