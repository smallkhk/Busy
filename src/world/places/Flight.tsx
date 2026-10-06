import { Html } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type ReactElement } from 'react';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Group, type OrthographicCamera } from 'three';
import { create } from 'zustand';
import { AIRLINE, BEACH_CHAIR_TOP, BEACH_CHAIRS, BIZ_ROWS, BIZ_TOP, BIZ_ZS, BUKA_BENCHES, CABIN_TAKEN, ECON_ROWS, ECON_TOP, ECON_ZS, LAGOS } from '../../content/flights';
import { SEAT_BASE } from '../../content/seats';
import { useGame } from '../../store/game';
import { useSettings } from '../../settings';
import { Person } from '../Avatar';
import { Box, Cyl, Tappable } from '../Room';
import { Danfo, Keke, Tree, Walkers, type Walker } from '../Street';
import { groundMap } from '../groundTex';
import { Flag } from './common';
import { AirportModel } from '../AirportModel';

/** Inside the cabin or outside looking at the plane. */
export const useFlightView = create<{ out: boolean; setOut: (out: boolean) => void }>((set) => ({ out: false, setOut: (out) => set({ out }) }));

type P2 = [number, number];

function useWalk() {
  const walkTo = useGame((s) => s.walkTo);
  return (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 8) return;
    walkTo(e.point.x, e.point.z);
  };
}

function Sign({ p, text, cls = '' }: { p: [number, number, number]; text: string; cls?: string }) {
  return (
    <Html position={p} center zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`block-name campus-sign ${cls}`}>{text}</div>
    </Html>
  );
}

// ---------------- Up in the sky ----------------

/** Farmland from 35,000 ft: green and brown patches with dark tree dots. */
function farmTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const greens = ['#7fa35a', '#8fb065', '#6e9450', '#a5b874', '#9c8a5c', '#b39a68'];
  g.fillStyle = '#86a660';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) {
    g.fillStyle = greens[Math.floor(rnd() * greens.length)];
    g.fillRect(rnd() * 256, rnd() * 256, 20 + rnd() * 50, 14 + rnd() * 40);
  }
  g.fillStyle = 'rgba(40,70,35,0.55)';
  for (let i = 0; i < 260; i++) {
    g.beginPath();
    g.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 2.2, 0, Math.PI * 2);
    g.fill();
  }
  // A river winding across
  g.strokeStyle = '#6f9fc4';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 180);
  g.bezierCurveTo(80, 120, 160, 240, 256, 170);
  g.stroke();
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(6, 6);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The land far below, sliding back as the plane flies forward (+x), and clouds passing. */
function Sky() {
  const tex = useMemo(farmTexture, []);
  useEffect(() => () => tex.dispose(), [tex]);
  const clouds = useRef<Group>(null);
  const puffs = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ x: -60 + i * 9 + (i % 3) * 2, y: -5 - (i % 4) * 2.5, z: ((i * 37) % 40) - 20, s: 1.2 + (i % 4) * 0.6 })), []);
  useFrame((_, dt) => {
    tex.offset.x += dt * 0.02;
    const g = clouds.current;
    if (!g) return;
    g.children.forEach((c) => {
      c.position.x -= dt * 9;
      if (c.position.x < -65) c.position.x += 130;
    });
  });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -40, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      <group ref={clouds}>
        {puffs.map((p, i) => (
          <group key={i} position={[p.x, p.y, p.z]} scale={p.s}>
            {[-1, 0, 1].map((k) => (
              <mesh key={k} position={[k * 1.1, k === 0 ? 0.3 : 0, 0]} scale={[1.5, 0.7, 1.1]}>
                <sphereGeometry args={[1, 12, 8]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </>
  );
}

function PlaneSeat({ x, z, top, biz }: { x: number; z: number; top: number; biz?: boolean }) {
  const w = biz ? 0.6 : 0.46;
  const c = biz ? '#1d4b3a' : '#2d4a7a';
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, top - 0.05, 0]} s={[0.5, 0.1, w]} c={c} />
      <Box p={[-0.3, top + 0.4, 0]} s={[0.1, 0.85, w]} c={c} />
      <Box p={[-0.33, top + 0.85, 0]} s={[0.12, 0.12, w * 0.7]} c="#e8e4da" />
      <Box p={[0, (top - 0.1) / 2, 0]} s={[0.3, top - 0.1, 0.06]} c="#555" />
      {/* Screen on the back of the seat in front */}
      <Box p={[0.5, top + 0.6, 0]} s={[0.02, 0.2, 0.26]} c="#16202c" />
    </group>
  );
}

function SeatedPassenger({ x, z, top, shirt, woman }: { x: number; z: number; top: number; shirt: string; woman?: boolean }) {
  return (
    <group position={[x - 0.05, top - SEAT_BASE, z]} rotation={[0, Math.PI / 2, 0]}>
      <Person shirt={shirt} woman={woman} trousers={woman ? undefined : '#2d2d2d'} move="Sit" />
    </group>
  );
}

/** Air hostess pushing the trolley up and down the aisle. */
function Crew() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.getElapsedTime() * 0.25;
    const k = (Math.sin(t) + 1) / 2;
    g.position.x = -8 + k * 10;
    g.rotation.y = Math.cos(t) > 0 ? Math.PI / 2 : -Math.PI / 2;
  });
  return (
    <group ref={ref} position={[0, 0, 0]}>
      <Person shirt="#118a4c" woman hat={{ type: 'gele', color: '#118a4c', band: '#d8a53a' }} move="Walk" />
      <Box p={[0.7, 0.5, 0]} s={[0.6, 0.9, 0.36]} c="#c9ccd1" />
      <Box p={[0.7, 0.97, 0]} s={[0.5, 0.06, 0.3]} c="#8a8d92" />
    </group>
  );
}

const CABIN_L = 23;
const CABIN_W = 4.2;

function Interior() {
  const low = useSettings((s) => s.quality === 'low');
  const walk = useWalk();
  const windows: ReactElement[] = [];
  for (let x = -10.5; x <= 9; x += 1) windows.push(<Box key={x} p={[x, 1.25, -CABIN_W / 2 + 0.06]} s={[0.36, 0.48, 0.02]} c="#bfe3ff" />);
  return (
    <group>
      {/* Floor: blue carpet with the aisle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.75, 0, 0]} receiveShadow onClick={walk}>
        <planeGeometry args={[CABIN_L, CABIN_W]} />
        <meshStandardMaterial color="#3b4a6b" />
      </mesh>
      <Box p={[-0.75, 0.005, 0]} s={[CABIN_L, 0.01, 0.6]} c="#8a7f6a" />
      {/* Far wall with windows, low near wall so you fit see inside */}
      <Box p={[-0.75, 1.3, -CABIN_W / 2]} s={[CABIN_L, 2.6, 0.1]} c="#eef0f2" />
      {windows}
      <Box p={[-0.75, 2.45, -CABIN_W / 2 + 0.35]} s={[CABIN_L, 0.4, 0.6]} c="#d9dde2" />
      <Box p={[-0.75, 0.3, CABIN_W / 2]} s={[CABIN_L, 0.6, 0.1]} c="#eef0f2" />
      <Box p={[-0.75, 0.62, CABIN_W / 2]} s={[CABIN_L, 0.06, 0.14]} c="#118a4c" />
      {/* Back wall (toilets) and front wall (galley and cockpit door) */}
      <Box p={[-12.3, 1.3, 0]} s={[0.1, 2.6, CABIN_W]} c="#e1e4e8" />
      <Box p={[10.8, 1.3, -1.2]} s={[0.1, 2.6, 1.8]} c="#e1e4e8" />
      <Box p={[3.4, 1.3, -1.6]} s={[0.08, 2.6, 0.9]} c="#d4d8de" />
      <Box p={[3.4, 1.3, 1.6]} s={[0.08, 1.2, 0.9]} c="#d4d8de" />
      <Sign p={[3.4, 2.5, 0]} text="BUSINESS ▸" />

      <Tappable id="seat-screen">
        {ECON_ROWS.flatMap((x) => ECON_ZS.map((z) => <PlaneSeat key={`${x}${z}`} x={x} z={z} top={ECON_TOP} />))}
      </Tappable>
      {BIZ_ROWS.flatMap((x) => BIZ_ZS.map((z) => <PlaneSeat key={`${x}${z}`} x={x} z={z} top={BIZ_TOP} biz />))}

      <Tappable id="galley">
        <Box p={[10.2, 0.55, -1.3]} s={[0.9, 1.1, 1.4]} c="#c9ccd1" />
        <Box p={[10.2, 1.12, -1.3]} s={[0.95, 0.05, 1.45]} c="#8a8d92" />
        <group position={[9.8, 0, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
          <Person shirt="#118a4c" woman hat={{ type: 'gele', color: '#118a4c', band: '#d8a53a' }} move="Idle" />
        </group>
      </Tappable>
      <Tappable id="lavatory">
        <Box p={[-11.6, 1.1, -1.2]} s={[1.2, 2.2, 1.6]} c="#cfd6dd" />
        <Box p={[-11.0, 1.0, -0.4]} s={[0.05, 1.9, 0.7]} c="#9aa4ae" />
      </Tappable>
      <Sign p={[-11.6, 2.5, -1.2]} text="🚻 Toilet" />

      {(low ? CABIN_TAKEN.slice(0, 6) : CABIN_TAKEN).map(([x, z, shirt, woman]) => (
        <SeatedPassenger key={`${x}${z}`} x={x} z={z} top={x > 3 ? BIZ_TOP : ECON_TOP} shirt={shirt} woman={woman} />
      ))}
      {!low && <Crew />}
    </group>
  );
}

/** The plane from outside: white body, green tail and stripe, two engines. Parked planes stay still. */
export function ZumaJet({ parked }: { parked?: boolean }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || parked) return;
    const t = clock.getElapsedTime();
    g.position.y = Math.sin(t * 0.8) * 0.15;
    g.rotation.x = Math.sin(t * 0.5) * 0.03;
  });
  const white = '#f4f6f8';
  return (
    <group ref={ref}>
      {/* Body along x, nose at +x */}
      <mesh position={[-0.75, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[2.25, 2.25, 25, 32]} />
        <meshStandardMaterial color={white} roughness={0.4} />
      </mesh>
      <mesh position={[11.75, 1.0, 0]} scale={[1.9, 1, 1]}>
        <sphereGeometry args={[2.25, 24, 16]} />
        <meshStandardMaterial color={white} roughness={0.4} />
      </mesh>
      <mesh position={[14.6, 1.6, 0]} rotation={[0, 0, -0.5]} scale={[0.8, 0.5, 1.4]}>
        <boxGeometry args={[0.8, 0.5, 1.4]} />
        <meshStandardMaterial color="#1b2633" />
      </mesh>
      <mesh position={[-15.5, 1.5, 0]} rotation={[0, 0, Math.PI / 2 + 0.12]}>
        <cylinderGeometry args={[2.2, 0.4, 6, 24]} />
        <meshStandardMaterial color={white} roughness={0.4} />
      </mesh>
      {/* Green stripes and the windows */}
      <Box p={[-0.75, 0.25, 2.12]} s={[25, 0.22, 0.05]} c="#118a4c" />
      <Box p={[-0.75, 0.05, 2.02]} s={[25, 0.08, 0.05]} c="#d8a53a" />
      {Array.from({ length: 30 }, (_, i) => (
        <Box key={i} p={[-12 + i * 0.75, 1.55, 2.2]} s={[0.22, 0.28, 0.03]} c="#26313d" />
      ))}
      <Box p={[11.2, 1.6, 2.15]} s={[0.35, 1.7, 0.04]} c="#c7ccd2" />
      {/* Wings, swept back */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box p={[-1.5, 0.1, side * 8.2]} s={[3.8, 0.25, 12]} r={[0, -side * 0.35, 0]} c="#d6dbe0" />
          <Box p={[-3.8, 0.8, side * 13.9]} s={[1.2, 1.4, 0.12]} r={[0, -side * 0.35, 0]} c="#118a4c" />
          <mesh position={[0.6, -0.6, side * 5.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.85, 0.75, 3.2, 20]} />
            <meshStandardMaterial color="#e8ebee" roughness={0.35} />
          </mesh>
          <mesh position={[2.21, -0.6, side * 5.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.7, 0.7, 0.05, 20]} />
            <meshStandardMaterial color="#2a2f35" />
          </mesh>
        </group>
      ))}
      {/* Tail fin and tailplanes */}
      <Box p={[-15.2, 4.3, 0]} s={[3.4, 4.4, 0.25]} r={[0, 0, -0.45]} c="#118a4c" />
      <mesh position={[-15.6, 4.9, 0.14]}>
        <circleGeometry args={[0.7, 20]} />
        <meshStandardMaterial color="#d8a53a" />
      </mesh>
      {[-1, 1].map((side) => (
        <Box key={side} p={[-16, 1.8, side * 2.6]} s={[2, 0.15, 3.6]} r={[0, -side * 0.3, 0]} c="#d6dbe0" />
      ))}
      {!parked && (
        <Html position={[0, 2.6, 2.3]} center zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}>
          <div className="plane-livery">{AIRLINE.toUpperCase()}</div>
        </Html>
      )}
    </group>
  );
}

/** Pull the camera back to see the whole plane while you look from outside. */
function OutCamera() {
  const camera = useThree((s) => s.camera) as OrthographicCamera;
  useEffect(() => {
    const before = camera.zoom;
    camera.zoom = before * 0.42;
    camera.updateProjectionMatrix();
    return () => {
      camera.zoom = before;
      camera.updateProjectionMatrix();
    };
  }, [camera]);
  return null;
}

export function Cabin() {
  const out = useFlightView((s) => s.out);
  return (
    <group>
      <Sky />
      {out ? (
        <>
          <ZumaJet />
          <OutCamera />
        </>
      ) : (
        <Interior />
      )}
    </group>
  );
}

// ---------------- Lagos ----------------

function Tower({ p, w, d, h, c, glass = '#7fb0d0' }: { p: P2; w: number; d: number; h: number; c: string; glass?: string }) {
  const rows: ReactElement[] = [];
  for (let y = 1; y < h - 0.5; y += 1.1) rows.push(<Box key={y} p={[0, y, d / 2 + 0.01]} s={[w * 0.9, 0.55, 0.03]} c={glass} />);
  for (let y = 1; y < h - 0.5; y += 1.1) rows.push(<Box key={`x${y}`} p={[w / 2 + 0.01, y, 0]} s={[0.03, 0.55, d * 0.9]} c={glass} />);
  return (
    <group position={[p[0], 0, p[1]]}>
      <Box p={[0, h / 2, 0]} s={[w, h, d]} c={c} />
      {rows}
    </group>
  );
}

function Stall({ p, cloth }: { p: P2; cloth: string }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <Box p={[0, 0.45, 0]} s={[1.6, 0.9, 1]} c="#8a6a45" />
      <Box p={[0, 1.9, 0]} s={[1.9, 0.08, 1.4]} r={[0.12, 0, 0]} c={cloth} />
      {[-0.85, 0.85].map((x) => <Cyl key={x} p={[x, 1.0, 0.6]} r={0.04} h={1.9} c="#5b3a21" />)}
      {[0, 1, 2].map((k) => <Box key={k} p={[-0.5 + k * 0.5, 1.0, 0.1]} s={[0.4, 0.2, 0.6]} c={['#e67e22', '#8e44ad', '#16a085'][k]} />)}
    </group>
  );
}

function Lounger({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, BEACH_CHAIR_TOP - 0.03, 0]} s={[0.55, 0.06, 0.6]} c="#f4f4f4" />
      <Box p={[0, BEACH_CHAIR_TOP + 0.25, -0.3]} s={[0.55, 0.5, 0.06]} r={[-0.3, 0, 0]} c="#f4f4f4" />
      <Cyl p={[0, 1.2, -0.6]} r={0.03} h={2.4} c="#ddd" />
      <mesh position={[0, 2.35, -0.6]}>
        <coneGeometry args={[0.9, 0.4, 8]} />
        <meshStandardMaterial color={x % 3 < 1.5 ? '#e74c3c' : '#f1c40f'} />
      </mesh>
    </group>
  );
}

function Sea() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.children.forEach((c, i) => {
      c.position.z = 11.2 + ((t * 0.5 + i * 0.7) % 2.1);
    });
  });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 40]}>
        <planeGeometry args={[160, 58]} />
        <meshStandardMaterial color="#2f7fb0" roughness={0.3} />
      </mesh>
      <group ref={ref}>
        {[0, 1, 2].map((i) => (
          <Box key={i} p={[16, 0.0, 11.5]} s={[34, 0.03, 0.18]} c="#e9f6ff" />
        ))}
      </group>
    </>
  );
}

const LAGOS_WALKERS: Walker[] = [
  { from: -24, to: 24, z: 3.4, speed: 0.9, shirt: '#c0392b' },
  { from: 10, to: -16, z: -0.2, speed: 0.7, shirt: '#f1c40f', tray: true },
  { from: 2, to: 12, z: -4.5, speed: 0.6, shirt: '#8e44ad', woman: true },
  { from: 13, to: 26, z: 7.2, speed: 0.5, shirt: '#16a085' },
];

export function Lagos() {
  const low = useSettings((s) => s.quality === 'low');
  const walk = useWalk();
  return (
    <group>
      {/* Ground: tarred city, sand by the sea, the Atlantic */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -4]} receiveShadow onClick={walk}>
        <planeGeometry args={[160, 30]} />
        <meshStandardMaterial map={groundMap('earth', 160, 30)} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0, 8]} receiveShadow onClick={walk}>
        <planeGeometry args={[160, 6.4]} />
        <meshStandardMaterial color="#e8d3a2" roughness={1} />
      </mesh>
      <Sea />
      {/* The expressway with go-slow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1.6]} receiveShadow onClick={walk}>
        <planeGeometry args={[160, 3.6]} />
        <meshStandardMaterial color="#3a3a3e" />
      </mesh>
      {Array.from({ length: 20 }, (_, i) => <Box key={i} p={[-28 + i * 3, 0.02, 1.6]} s={[1.2, 0.01, 0.1]} c="#f2c230" />)}
      {[[-14, 0.8], [-10, 2.4], [2, 0.8], [8, 2.4], [14, 0.8]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, z > 1.6 ? Math.PI : 0, 0]}>
          {i % 2 === 0 ? <Danfo /> : <Keke />}
        </group>
      ))}

      {/* Murtala Muhammed Airport */}
      <Suspense fallback={null}>
        <AirportModel position={[LAGOS.airport[0] - 8, 0, LAGOS.airport[1] - 6]} />
      </Suspense>
      <ParkedJets at={[LAGOS.airport[0] - 8, LAGOS.airport[1] - 6]} />
      {/* Departures canopy: where you check in */}
      <Tappable id="mmia">
        <Box p={[LAGOS.airport[0], 2.4, LAGOS.airport[1] + 3.2]} s={[6, 0.15, 2.4]} c="#118a4c" />
        {[-2.8, 2.8].map((dx) => <Cyl key={dx} p={[LAGOS.airport[0] + dx, 1.2, LAGOS.airport[1] + 4.2]} r={0.08} h={2.4} c="#c7ccd2" />)}
        <Box p={[LAGOS.airport[0], 0.55, LAGOS.airport[1] + 3]} s={[3, 1.1, 0.7]} c="#d9dde2" />
      </Tappable>
      <Sign p={[LAGOS.airport[0], 3.3, LAGOS.airport[1] + 3.6]} text="✈️ MURTALA MUHAMMED AIRPORT" />
      <Flag x={LAGOS.airport[0] - 4} z={LAGOS.airport[1] + 5} h={4} />

      {/* Danfo park */}
      <Tappable id="danfo-park">
        {[-2.6, 0, 2.6].map((dx) => (
          <group key={dx} position={[LAGOS.danfo[0] + dx, 0, LAGOS.danfo[1]]} rotation={[0, Math.PI / 2, 0]}>
            <Danfo />
          </group>
        ))}
      </Tappable>
      <group position={[LAGOS.danfo[0] + 1.3, 0, LAGOS.danfo[1] - 1.8]} rotation={[0, 0, 0]}>
        <Person shirt="#e67e22" move="Wave" />
      </group>

      {/* Balogun market stalls */}
      <Tappable id="balogun">
        {[-3, -1, 1, 3].flatMap((dx) => [-1.5, 1].map((dz) => <Stall key={`${dx}${dz}`} p={[LAGOS.market[0] + dx * 1.1, LAGOS.market[1] + dz]} cloth={['#e74c3c', '#2980b9', '#27ae60', '#f39c12'][(dx + 3) / 2]} />))}
      </Tappable>
      <Sign p={[LAGOS.market[0], 3, LAGOS.market[1] - 2.8]} text="🧵 BALOGUN MARKET" />

      {/* Mama Put */}
      <Tappable id="lagos-buka">
        <Box p={[LAGOS.buka[0], 1.3, LAGOS.buka[1]]} s={[5, 2.6, 3]} c="#e8c27a" />
        <Box p={[LAGOS.buka[0], 2.7, LAGOS.buka[1] + 0.6]} s={[5.6, 0.12, 4.4]} r={[0.1, 0, 0]} c="#9b2c1f" />
        <Box p={[LAGOS.buka[0], 0.45, LAGOS.buka[1] + 2.2]} s={[4.5, 0.9, 0.7]} c="#7a5a3a" />
      </Tappable>
      {BUKA_BENCHES.map(([x, z]) => (
        <group key={x}>
          <Box p={[x, 0.42, z]} s={[1.5, 0.06, 0.4]} c="#8a6a45" />
          {[-0.65, 0.65].map((dx) => <Box key={dx} p={[x + dx, 0.2, z]} s={[0.07, 0.4, 0.34]} c="#5b3a21" />)}
        </group>
      ))}

      {/* Victoria Island towers and the hotel */}
      <Tappable id="eko-hotel">
        <Tower p={LAGOS.hotel} w={7} d={5} h={10} c="#f1efe8" />
      </Tappable>
      <Sign p={[LAGOS.hotel[0], 10.6, LAGOS.hotel[1]]} text="🏨 VI HOTEL" />
      {!low && (
        <>
          <Tower p={[10, -13]} w={4} d={4} h={14} c="#5d7b93" glass="#a9d2ee" />
          <Tower p={[29, -12]} w={4} d={5} h={12} c="#c9b79c" />
          <Tower p={[-3, -14]} w={4} d={3} h={8} c="#a3a8ae" />
        </>
      )}

      {/* Elegushi beach */}
      <Tappable id="beach">
        {BEACH_CHAIRS.map(([x, z]) => <Lounger key={x} x={x} z={z} />)}
      </Tappable>
      <group position={[21, 0, 7]} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 0.9, 0]} s={[0.4, 0.5, 1.4]} c="#6b4a2f" />
        <Box p={[0, 1.35, 0.75]} s={[0.25, 0.7, 0.3]} r={[0.4, 0, 0]} c="#6b4a2f" />
        {[-0.5, 0.5].flatMap((dz) => [-0.12, 0.12].map((dx) => <Box key={`${dx}${dz}`} p={[dx, 0.35, dz]} s={[0.08, 0.7, 0.08]} c="#5b3a21" />))}
      </group>
      <Sign p={[LAGOS.beach[0], 2.4, LAGOS.beach[1] - 1.5]} text="🏖️ ELEGUSHI BEACH" />
      {[[12, 6.4], [26, 6.6], [-20, 6]].map(([x, z]) => (
        <Tree key={x} p={[x, 0, z]} />
      ))}

      <Walkers walkers={low ? LAGOS_WALKERS.slice(0, 2) : LAGOS_WALKERS} />
    </group>
  );
}

/** Zuma Air jets parked on the apron behind a terminal centred at `at`, noses to the gates. */
export function ParkedJets({ at }: { at: [number, number] }) {
  return (
    <>
      {[-9, 4].map((dx) => (
        <group key={dx} position={[at[0] + dx, 0.45, at[1] - 7.5]} rotation={[0, -Math.PI / 2, 0]} scale={0.13}>
          <ZumaJet parked />
        </group>
      ))}
    </>
  );
}

export const FLIGHT_SCENES = { cabin: Cabin, lagos: Lagos } as const;
