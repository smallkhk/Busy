import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef, type ReactElement } from 'react';
import type { Group } from 'three';
import { BENIN, BUKA_TABLE_BENCHES } from '../../content/benin';
import { useGame } from '../../store/game';
import { useSettings } from '../../settings';
import { Person } from '../Avatar';
import { Box, Cyl, Tappable } from '../Room';
import { Car, Keke, Tree, Walkers, type Walker } from '../Street';
import { Flag } from './common';

type P2 = [number, number];

/** Benin earth: the red laterite the city is known for. */
const RED_EARTH = '#a5502e';
const PALACE_WALL = '#9b3f22';
const BRONZE = '#8a5a2b';

function useWalk() {
  const walkTo = useGame((s) => s.walkTo);
  return (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 8) return;
    walkTo(e.point.x, e.point.z);
  };
}

function Sign({ p, text }: { p: [number, number, number]; text: string }) {
  return (
    <Html position={p} center zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}>
      <div className="block-name campus-sign">{text}</div>
    </Html>
  );
}

/** A plain building with windows on the two faces the camera sees. */
function House({ p, w, d, h, wall, roof }: { p: P2; w: number; d: number; h: number; wall: string; roof: string }) {
  const wins: ReactElement[] = [];
  for (let y = 1; y < h - 0.4; y += 1.3) for (let x = -w / 2 + 0.8; x < w / 2 - 0.4; x += 1.3) wins.push(<Box key={`${x}${y}`} p={[x, y, d / 2 + 0.01]} s={[0.6, 0.6, 0.03]} c="#6d8fa8" />);
  return (
    <group position={[p[0], 0, p[1]]}>
      <Box p={[0, h / 2, 0]} s={[w, h, d]} c={wall} />
      <Box p={[0, h + 0.12, 0]} s={[w + 0.4, 0.24, d + 0.4]} c={roof} />
      {wins}
    </group>
  );
}

/** Pointed roof turret like the palace's: a four-sided pyramid on a square base. */
function Turret({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <Box p={[0, 1.6, 0]} s={[2, 3.2, 2]} c={PALACE_WALL} />
      <mesh position={[0, 4.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.75, 2.6, 4]} />
        <meshStandardMaterial color="#6b5a45" roughness={0.9} />
      </mesh>
      <Cyl p={[0, 5.9, 0]} r={0.08} h={0.6} c={BRONZE} />
    </group>
  );
}

/** A bronze statue on a pedestal (a person, cast all in bronze). */
function Statue({ p, s = 1.4 }: { p: P2; s?: number }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <Cyl p={[0, 0.6, 0]} r={1.1} h={1.2} c="#d9d2c4" />
      <Cyl p={[0, 1.25, 0]} r={0.8} h={0.1} c={BRONZE} />
      <group position={[0, 1.3, 0]} scale={s}>
        <Person shirt={BRONZE} skin={BRONZE} trousers={BRONZE} woman move="Idle" />
      </group>
    </group>
  );
}

/** A bronze head on a stand (Igun Street). */
function BronzeHead({ x, z, h = 0.9 }: { x: number; z: number; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, h / 2, 0]} s={[0.4, h, 0.4]} c="#5b3a21" />
      <Cyl p={[0, h + 0.25, 0]} r={0.17} h={0.5} c={BRONZE} />
      <mesh position={[0, h + 0.58, 0]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color={BRONZE} metalness={0.7} roughness={0.35} />
      </mesh>
      <Cyl p={[0, h + 0.85, 0]} r={0.16} h={0.35} c={BRONZE} />
    </group>
  );
}

/** Furnace with a glowing pot. */
function Furnace({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 0.45, 0]} r={0.6} h={0.9} c="#6b4a3a" />
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.35, 0.3, 0.2, 14]} />
        <meshStandardMaterial color="#ff7a1a" emissive="#ff5a00" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

/** White luxury bus with a green stripe ("Edo Express"). Nose +x. */
function LuxuryBus({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box p={[0, 1.25, 0]} s={[6, 2.1, 1.6]} c="#f4f6f8" />
      <Box p={[0, 1.55, 0.81]} s={[5.4, 0.7, 0.02]} c="#2b3640" />
      <Box p={[0, 1.55, -0.81]} s={[5.4, 0.7, 0.02]} c="#2b3640" />
      <Box p={[0, 0.75, 0.81]} s={[6, 0.25, 0.02]} c="#118a4c" />
      <Box p={[0, 0.75, -0.81]} s={[6, 0.25, 0.02]} c="#118a4c" />
      <Box p={[3.01, 1.5, 0]} s={[0.02, 1.1, 1.4]} c="#2b3640" />
      {[-2, 2].flatMap((dx) => [-0.75, 0.75].map((dz) => (
        <mesh key={`${dx}${dz}`} position={[dx, 0.35, dz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 14]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )))}
    </group>
  );
}

/** Kekes and cars moving both ways on the main road. */
function Traffic({ low }: { low: boolean }) {
  const ref = useRef<Group>(null);
  const lanes: { z: number; dir: 1 | -1; kind: 'keke' | 'car'; color: string; off: number; v: number }[] = [
    { z: 0.8, dir: 1, kind: 'keke', color: '', off: 0, v: 3 },
    { z: 0.8, dir: 1, kind: 'car', color: '#c0392b', off: 22, v: 3.6 },
    { z: 2.4, dir: -1, kind: 'keke', color: '', off: 10, v: 2.8 },
    { z: 2.4, dir: -1, kind: 'car', color: '#2e6fa8', off: 34, v: 3.4 },
    { z: 0.8, dir: 1, kind: 'keke', color: '', off: 44, v: 3.1 },
  ];
  const shown = low ? lanes.slice(0, 3) : lanes;
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.children.forEach((c, i) => {
      const l = shown[i];
      const x = (((l.off + t * l.v) % 60) + 60) % 60 - 30;
      c.position.x = l.dir > 0 ? x : -x;
    });
  });
  return (
    <group ref={ref}>
      {shown.map((l, i) => (
        <group key={i} position={[0, 0, l.z]} rotation={[0, l.dir > 0 ? 0 : Math.PI, 0]}>
          {l.kind === 'keke' ? <Keke /> : <Car body={l.color} />}
        </group>
      ))}
    </group>
  );
}

const BENIN_WALKERS: Walker[] = [
  { from: -24, to: 24, z: 3.6, speed: 0.8, shirt: '#c0392b' },
  { from: 8, to: -14, z: -0.4, speed: 0.7, shirt: '#f1c40f', tray: true },
  { from: -4, to: 10, z: -4.6, speed: 0.6, shirt: '#16a085', woman: true },
  { from: 18, to: 4, z: 9.6, speed: 0.5, shirt: '#8e44ad' },
];

export function Benin() {
  const low = useSettings((s) => s.quality === 'low');
  const walk = useWalk();
  const [px, pz] = BENIN.palace;
  return (
    <group>
      {/* Red earth everywhere, the main road through the middle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow onClick={walk}>
        <planeGeometry args={[160, 80]} />
        <meshStandardMaterial color={RED_EARTH} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1.6]} receiveShadow onClick={walk}>
        <planeGeometry args={[160, 3.6]} />
        <meshStandardMaterial color="#3a3a3e" />
      </mesh>
      {Array.from({ length: 20 }, (_, i) => <Box key={i} p={[-28 + i * 3, 0.02, 1.6]} s={[1.2, 0.01, 0.1]} c="#f2f2f2" />)}
      <Traffic low={low} />

      {/* Oba's Palace: long red walls, pointed roofs, the gate */}
      <Tappable id="oba-palace">
        <Box p={[px, 1.2, pz + 3.4]} s={[14, 2.4, 0.5]} c={PALACE_WALL} />
        <Box p={[px - 6.8, 1.2, pz - 0.2]} s={[0.5, 2.4, 7.6]} c={PALACE_WALL} />
        <Box p={[px + 6.8, 1.2, pz - 0.2]} s={[0.5, 2.4, 7.6]} c={PALACE_WALL} />
        {/* Grooved wall pattern */}
        {Array.from({ length: 9 }, (_, i) => <Box key={i} p={[px - 6 + i * 1.5, 1.2, pz + 3.66]} s={[0.12, 2.2, 0.04]} c="#7e3119" />)}
        <Box p={[px, 1.4, pz + 3.68]} s={[2.4, 2.8, 0.06]} c="#3b2414" />
        <Box p={[px, 3.0, pz + 3.5]} s={[3.6, 0.5, 0.8]} c="#6b5a45" />
        <Turret x={px - 4} z={pz - 1.5} />
        <Turret x={px + 4} z={pz - 1.5} />
        <Turret x={px} z={pz - 2.5} s={1.3} />
      </Tappable>
      <Sign p={[px, 5.6, pz + 3.6]} text="👑 OBA'S PALACE" />
      <Flag x={px + 7.6} z={pz + 4} h={4} />

      {/* Igun Street: bronze casters' workshops */}
      <Tappable id="igun-street">
        {[-3.2, 0, 3.2].map((dx, i) => (
          <group key={dx}>
            <House p={[BENIN.igun[0] + dx, BENIN.igun[1] - 1.2]} w={2.8} d={2.4} h={2.4} wall={['#c7a57a', '#d6b48a', '#bf9a6a'][i]} roof="#7a5a3a" />
            <Box p={[BENIN.igun[0] + dx, 0.45, BENIN.igun[1] + 1.2]} s={[2.4, 0.9, 0.9]} c="#6b4a2f" />
            <BronzeHead x={BENIN.igun[0] + dx - 0.7} z={BENIN.igun[1] + 1.2} />
            <BronzeHead x={BENIN.igun[0] + dx + 0.7} z={BENIN.igun[1] + 1.2} h={1.1} />
          </group>
        ))}
        <Furnace x={BENIN.igun[0] + 5.2} z={BENIN.igun[1] + 1.4} />
        <group position={[BENIN.igun[0] + 5.2, 0, BENIN.igun[1] + 2.4]} rotation={[0, Math.PI, 0]}>
          <Person shirt="#6b4a2f" move="Interact" />
        </group>
      </Tappable>
      <Sign p={[BENIN.igun[0], 3.6, BENIN.igun[1] + 1.5]} text="🗿 IGUN STREET BRONZE CASTERS" />

      {/* National Museum: round building */}
      <Tappable id="benin-museum">
        <Cyl p={[BENIN.museum[0], 1.8, BENIN.museum[1]]} r={3.6} h={3.6} c="#e9e2d2" />
        <Cyl p={[BENIN.museum[0], 3.75, BENIN.museum[1]]} r={3.9} h={0.3} c="#8a5a2b" />
        <Box p={[BENIN.museum[0], 1.2, BENIN.museum[1] + 3.55]} s={[1.6, 2.4, 0.2]} c="#3b2414" />
        <Box p={[BENIN.museum[0], 2.8, BENIN.museum[1] + 3.6]} s={[3.2, 0.5, 0.2]} c="#118a4c" />
      </Tappable>
      <Sign p={[BENIN.museum[0], 5, BENIN.museum[1] + 3.6]} text="🏺 NATIONAL MUSEUM" />

      {/* King's Square: the roundabout with the bronze statue */}
      <Tappable id="ring-road">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[BENIN.ring[0], 0.012, BENIN.ring[1]]}>
          <ringGeometry args={[2.4, 4.2, 40]} />
          <meshStandardMaterial color="#3a3a3e" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[BENIN.ring[0], 0.015, BENIN.ring[1]]}>
          <circleGeometry args={[2.4, 40]} />
          <meshStandardMaterial color="#6fa84a" />
        </mesh>
        <Statue p={BENIN.ring} />
      </Tappable>
      <Sign p={[BENIN.ring[0], 4.6, BENIN.ring[1]]} text="⭕ KING'S SQUARE" />

      {/* Mama Osas buka with benches */}
      <Tappable id="banga-buka">
        <House p={[BENIN.buka[0], BENIN.buka[1] - 0.4]} w={4.6} d={2.2} h={2.3} wall="#e8c27a" roof="#9b2c1f" />
        <Box p={[BENIN.buka[0], 2.25, BENIN.buka[1] + 1.2]} s={[4.8, 0.1, 1.6]} r={[0.12, 0, 0]} c="#c0392b" />
        <group position={[BENIN.buka[0] + 1.2, 0, BENIN.buka[1] + 1]} rotation={[0, Math.PI, 0]}>
          <Person shirt="#c0392b" woman hat={{ type: 'gele', color: '#c0392b', band: '#f1c40f' }} move="Idle" />
        </group>
      </Tappable>
      {BUKA_TABLE_BENCHES.map(([x, z]) => (
        <group key={x}>
          <Box p={[x, 0.75, z - 0.6]} s={[1.4, 0.08, 0.7]} c="#8a6a45" />
          <Box p={[x, 0.37, z - 0.6]} s={[0.12, 0.74, 0.12]} c="#5b3a21" />
          <Box p={[x, 0.42, z]} s={[1.5, 0.06, 0.4]} c="#8a6a45" />
          {[-0.65, 0.65].map((dx) => <Box key={dx} p={[x + dx, 0.2, z]} s={[0.07, 0.4, 0.34]} c="#5b3a21" />)}
        </group>
      ))}

      {/* Hotel */}
      <Tappable id="benin-hotel">
        <House p={BENIN.hotel} w={6} d={4} h={6} wall="#f1efe8" roof="#118a4c" />
      </Tappable>
      <Sign p={[BENIN.hotel[0], 6.8, BENIN.hotel[1]]} text="🏨 HOTEL" />

      {/* Luxury bus park */}
      <Tappable id="benin-park">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[BENIN.park[0], 0.012, BENIN.park[1] + 0.5]}>
          <planeGeometry args={[9, 6]} />
          <meshStandardMaterial color="#8b8f94" />
        </mesh>
        <LuxuryBus x={BENIN.park[0]} z={BENIN.park[1]} />
        <LuxuryBus x={BENIN.park[0]} z={BENIN.park[1] + 2.4} />
      </Tappable>
      <Sign p={[BENIN.park[0], 3.4, BENIN.park[1] - 1.5]} text="🚌 EDO EXPRESS · ABUJA" />

      {/* Airport desk */}
      <Tappable id="benin-airport">
        <House p={BENIN.airport} w={5} d={3} h={3.2} wall="#dfe4e8" roof="#118a4c" />
        <Box p={[BENIN.airport[0], 1.4, BENIN.airport[1] - 1.52]} s={[3.6, 1.8, 0.04]} c="#79aecb" />
      </Tappable>
      <Sign p={[BENIN.airport[0], 4, BENIN.airport[1] - 1.5]} text="🛫 BENIN AIRPORT" />

      {[[-12, -3], [9, -4], [-2, 10], [22, -2], [-26, -3], [27, 10]].map(([x, z]) => (
        <Tree key={`${x}${z}`} p={[x, 0, z]} />
      ))}
      <Walkers walkers={low ? BENIN_WALKERS.slice(0, 2) : BENIN_WALKERS} />
    </group>
  );
}
