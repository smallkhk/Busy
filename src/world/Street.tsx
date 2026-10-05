import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { clockParts, daylight } from '../engine/clock';
import { carById } from '../content/cars';
import { CarModel } from './CarModel';
import { useGame } from '../store/game';
import { Person } from './Avatar';
import { Box, Cyl, Tappable, type V3 } from './Room';

const LOOP = 30; // vehicles wrap between -15 and +15

/** Street car: the detailed showroom model. Taxis get the green Abuja stripe. */
export function Car({ body, stripe, kind = 'sedan' }: { body: string; roof?: string; stripe?: string; kind?: 'sedan' | 'suv' | 'gwagon' }) {
  return (
    <group scale={0.95}>
      <CarModel kind={kind} paint={body} />
      {stripe &&
        [-0.453, 0.453].map((z) => (
          <mesh key={z} position={[0, 0.4, z]}>
            <boxGeometry args={[1.98, 0.1, 0.01]} />
            <meshStandardMaterial color={stripe} />
          </mesh>
        ))}
    </group>
  );
}

export function Keke() {
  return (
    <group>
      <Box p={[0, 0.45, 0]} s={[1.2, 0.5, 0.8]} c="#2f9e44" />
      <Box p={[0.05, 1.05, 0]} s={[1.1, 0.06, 0.86]} c="#1e1e1e" />
      <Box p={[-0.5, 0.8, 0]} s={[0.06, 0.55, 0.8]} c="#1e1e1e" />
      <Box p={[0.5, 0.8, 0]} s={[0.06, 0.55, 0.8]} c="#f2c230" />
      <Box p={[0.3, 0.75, 0]} s={[0.04, 0.3, 0.6]} c="#9ad0ec" />
      {[[-0.4, 0.38], [-0.4, -0.38], [0.55, 0]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.15, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
    </group>
  );
}

type Mover = { kind: 'taxi' | 'keke' | 'car' | 'suv'; lane: number; dir: 1 | -1; speed: number; offset: number; color?: string };

// Abuja taxis are green and white.
const TRAFFIC: Mover[] = [
  { kind: 'taxi', lane: 1.0, dir: 1, speed: 3.2, offset: 0 },
  { kind: 'car', lane: 1.0, dir: 1, speed: 3.2, offset: 13, color: '#b9bcc2' },
  { kind: 'keke', lane: -0.2, dir: -1, speed: 2.2, offset: 4 },
  { kind: 'taxi', lane: -0.2, dir: -1, speed: 2.2, offset: 17 },
  { kind: 'suv', lane: -0.2, dir: -1, speed: 2.2, offset: 25, color: '#20232a' },
];

function Traffic() {
  const refs = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    TRAFFIC.forEach((m, i) => {
      const g = refs.current[i];
      if (!g) return;
      const d = ((t * m.speed + m.offset) % LOOP) - LOOP / 2;
      g.position.set(d * m.dir, 0, m.lane);
      g.rotation.y = m.dir === 1 ? 0 : Math.PI;
    });
  });
  return (
    <>
      {TRAFFIC.map((m, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }}>
          {m.kind === 'keke' ? <Keke /> : m.kind === 'taxi' ? <Car body="#f4f4f4" roof="#f4f4f4" stripe="#1f8a4c" /> : <Car body={m.color!} kind={m.kind === 'suv' ? 'suv' : 'sedan'} />}
        </group>
      ))}
    </>
  );
}

export type Walker = { from: number; to: number; z: number; speed: number; shirt: string; tray?: boolean; woman?: boolean };

const WALKERS: Walker[] = [
  { from: -7, to: 7, z: 2.9, speed: 0.9, shirt: '#c0392b' },
  { from: 6, to: -6, z: -1.6, speed: 0.7, shirt: '#f1c40f', tray: true },
  { from: -2, to: 6.5, z: 3.1, speed: 0.6, shirt: '#8e44ad' },
];

function Pedestrians() {
  return <Walkers walkers={WALKERS} />;
}

/** NPCs pacing back and forth along x. */
export function Walkers({ walkers }: { walkers: Walker[] }) {
  const refs = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    walkers.forEach((w, i) => {
      const g = refs.current[i];
      if (!g) return;
      const len = Math.abs(w.to - w.from);
      const raw = (t * w.speed) % (len * 2);
      const forward = raw < len;
      const along = forward ? raw : len * 2 - raw;
      const dir = Math.sign(w.to - w.from);
      g.position.set(w.from + along * dir, Math.abs(Math.sin(t * 7)) * 0.03, w.z);
      g.rotation.y = (forward ? dir : -dir) > 0 ? Math.PI / 2 : -Math.PI / 2;
    });
  });
  return (
    <>
      {walkers.map((w, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }} scale={0.92}>
          {/* Hawkers with tray and every second passer-by na woman */}
          <Person shirt={w.shirt} trousers={w.tray || (w.woman ?? i % 2 === 1) ? undefined : '#2d2d2d'} woman={w.tray || (w.woman ?? i % 2 === 1)} move="Walk" />
          {w.tray && (
            <>
              {/* Pure water seller with tray on head */}
              <Cyl p={[0, 1.56, 0]} r={0.32} h={0.05} c="#c4c4c4" />
              <Box p={[0, 1.66, 0]} s={[0.4, 0.14, 0.4]} c="#cfe8ff" />
            </>
          )}
        </group>
      ))}
    </>
  );
}

function Shop({ x, color, awning, children }: { x: number; color: string; awning: string; children?: React.ReactNode }) {
  return (
    <group position={[x, 0, -3.5]}>
      <Box p={[0, 1.1, 0]} s={[2.6, 2.2, 1.6]} c={color} />
      {/* Dark open front */}
      <Box p={[0, 0.95, 0.81]} s={[1.6, 1.5, 0.02]} c="#2a211b" />
      {/* Awning */}
      <Box p={[0, 2.0, 1.15]} s={[2.7, 0.08, 0.8]} c={awning} r={[0.25, 0, 0]} />
      {/* Signboard */}
      <Box p={[0, 2.45, 0.82]} s={[2.2, 0.4, 0.04]} c="#f7f1e3" />
      {children}
    </group>
  );
}

export function Lamp({ p, on }: { p: V3; on: boolean }) {
  return (
    <group position={p}>
      <Cyl p={[0, 1.6, 0]} r={0.05} h={3.2} c="#4b4b4b" />
      <Box p={[0, 3.2, 0.35]} s={[0.12, 0.08, 0.8]} c="#4b4b4b" />
      <mesh position={[0, 3.12, 0.7]}>
        <boxGeometry args={[0.25, 0.08, 0.2]} />
        <meshStandardMaterial color={on ? '#fff3c4' : '#777'} emissive={on ? '#ffd27a' : '#000'} emissiveIntensity={on ? 2 : 0} />
      </mesh>
      {on && <pointLight position={[0, 2.9, 0.7]} intensity={8} distance={6} color="#ffd9a0" />}
    </group>
  );
}

export function Tree({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.17, 1.6, 10]} />
        <meshStandardMaterial color="#6b4a2b" roughness={0.9} />
      </mesh>
      {/* Leafy canopy: a few soft clumps */}
      {[
        [0, 2.05, 0, 0.85, '#3f7d3a'],
        [0.5, 1.75, 0.3, 0.58, '#4c8f45'],
        [-0.45, 1.8, -0.2, 0.55, '#468a3f'],
        [0.1, 2.55, -0.15, 0.5, '#529a4a'],
      ].map(([x, y, z, r, c]) => (
        <mesh key={`${x}${y}`} position={[x as number, y as number, z as number]} castShadow receiveShadow>
          <icosahedronGeometry args={[r as number, 1]} />
          <meshStandardMaterial color={c as string} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** Your own car, parked in front of your gate. */
function MyCar() {
  const car = useGame((s) => s.car);
  const c = car ? carById(car.id) : undefined;
  if (!c) return null;
  return (
    <group position={[-5.6, 0.03, -1.75]} scale={0.92}>
      <CarModel kind={c.model} paint={car?.paint ?? c.color} />
    </group>
  );
}

export function Street() {
  const walkTo = useGame((s) => s.walkTo);
  const night = useGame((s) => daylight(clockParts(Math.floor(s.time / 10) * 10).minuteOfDay) < 0.3);

  const onGround = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A drag moves the camera; only a tap counts
    if (e.delta > 8) return;
    walkTo(e.point.x, e.point.z);
  };

  return (
    <group>
      {/* Red Abuja laterite ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow onClick={onGround}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#b0703f" />
      </mesh>
      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.4]} receiveShadow onClick={onGround}>
        <planeGeometry args={[60, 2.6]} />
        <meshStandardMaterial color="#3a3d42" />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-15 + i * 2, 0.005, 0.4]}>
          <planeGeometry args={[1, 0.08]} />
          <meshStandardMaterial color="#f2f2f2" />
        </mesh>
      ))}
      {/* Sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -1.9]} receiveShadow onClick={onGround}>
        <planeGeometry args={[60, 2.0]} />
        <meshStandardMaterial color="#bdb6a8" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 2.6]} receiveShadow onClick={onGround}>
        <planeGeometry args={[60, 1.8]} />
        <meshStandardMaterial color="#bdb6a8" />
      </mesh>
      {/* Black & yellow painted kerbs, very Abuja */}
      {Array.from({ length: 30 }, (_, i) => (
        <group key={i}>
          <Box p={[-15 + i, 0.08, -0.9]} s={[1, 0.16, 0.14]} c={i % 2 ? '#f2c230' : '#1d1d1d'} />
          <Box p={[-15 + i, 0.08, 1.7]} s={[1, 0.16, 0.14]} c={i % 2 ? '#1d1d1d' : '#f2c230'} />
        </group>
      ))}

      {/* Shops */}
      <Tappable id="mamaput">
        <Shop x={-4.2} color="#e9d8a6" awning="#c0392b">
          <Box p={[0.6, 0.45, 1.3]} s={[1.0, 0.08, 0.6]} c="#2c6e9b" />
          <Cyl p={[0.4, 0.62, 1.3]} r={0.18} h={0.28} c="#9b9b9b" />
          <Cyl p={[0.85, 0.6, 1.3]} r={0.16} h={0.22} c="#c0392b" />
          <group position={[-0.4, 0, 1.2]} rotation={[0, 0, 0]}>
            {/* Mama Put in her wrapper and gele */}
            <Person shirt="#e67e22" skin="#5a3825" woman hat={{ type: 'gele', color: '#e67e22', band: '#c0392b' }} move="Interact" />
          </group>
        </Shop>
      </Tappable>
      <Tappable id="barber">
        <Shop x={-1.2} color="#d6e4f0" awning="#2a5d9f">
          {/* Barber pole */}
          <Cyl p={[1.1, 1.0, 0.95]} r={0.08} h={0.9} c="#e74c3c" />
          <Cyl p={[1.1, 1.0, 0.95]} r={0.085} h={0.3} c="#f4f4f4" />
        </Shop>
      </Tappable>
      <Tappable id="viewing">
        <Shop x={1.8} color="#cfe3c2" awning="#1f8a4c">
          <Box p={[0, 1.2, 0.84]} s={[1.0, 0.6, 0.04]} c="#1d6fa5" />
          {[-0.6, 0, 0.6].map((x) => (
            <Box key={x} p={[x, 0.22, 1.25]} s={[0.4, 0.44, 0.3]} c="#3b4a5a" />
          ))}
        </Shop>
      </Tappable>

      <Tappable id="suya">
        <Box p={[4.8, 0.5, -2.7]} s={[1.2, 0.12, 0.6]} c="#1d1d1d" />
        <Box p={[4.8, 0.58, -2.7]} s={[1.0, 0.04, 0.45]} c={night ? '#ff7a1a' : '#a2471b'} />
        {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map(([x, z]) => (
          <Box key={`${x}${z}`} p={[4.8 + x, 0.25, -2.7 + z]} s={[0.05, 0.5, 0.05]} c="#333" />
        ))}
        <group position={[4.8, 0, -3.4]}>
          {/* Mallam Suya in jalabiya and hula */}
          <Person shirt="#f2f2f2" trousers="#f2f2f2" skin="#4a2e1d" hat={{ type: 'hula', color: '#1f6f4a', band: '#f2f2f2' }} move="Interact" />
        </group>
        {night && <pointLight position={[4.8, 1.0, -2.5]} intensity={5} distance={3.5} color="#ff8c3a" />}
      </Tappable>

      <Tappable id="chemist">
        {/* Green-cross chemist kiosk */}
        <Box p={[6.6, 0.9, 3.5]} s={[1.4, 1.8, 0.9]} c="#f2f4f5" />
        <Box p={[6.6, 1.9, 3.5]} s={[1.6, 0.12, 1.1]} c="#1f8a4c" />
        <Box p={[6.6, 1.45, 3.04]} s={[0.4, 0.12, 0.02]} c="#2ecc71" />
        <Box p={[6.6, 1.45, 3.04]} s={[0.12, 0.4, 0.02]} c="#2ecc71" />
        <Box p={[6.6, 0.6, 3.04]} s={[1.1, 0.6, 0.02]} c="#2b3a44" />
      </Tappable>

      <Tappable id="busstop">
        <Box p={[1.0, 2.0, 3.6]} s={[2.4, 0.08, 1.1]} c="#1f8a4c" />
        <Box p={[0.0, 1.0, 3.9]} s={[0.08, 2.0, 0.08]} c="#555" />
        <Box p={[2.0, 1.0, 3.9]} s={[0.08, 2.0, 0.08]} c="#555" />
        <Box p={[1.0, 0.42, 3.8]} s={[1.8, 0.08, 0.35]} c="#7a5a3c" />
        <Box p={[-0.4, 1.3, 2.6]} s={[0.06, 2.6, 0.06]} c="#555" />
        <Box p={[-0.4, 2.45, 2.6]} s={[0.04, 0.4, 0.6]} c="#1f8a4c" />
        <group position={[1.4, 0.2, 3.75]} rotation={[0, Math.PI, 0]} scale={0.9}>
          <Person shirt="#16a085" trousers="#2d2d2d" />
        </group>
      </Tappable>

      <Tappable id="home-gate">
        {/* Your compound wall and blue gate, facing the road */}
        <Box p={[-9.6, 0.9, -3.0]} s={[3.2, 1.8, 0.2]} c="#cbbd9d" />
        <Box p={[-6.4, 0.9, -3.0]} s={[0.5, 1.8, 0.2]} c="#cbbd9d" />
        <Box p={[-7.2, 0.95, -3.0]} s={[1.2, 1.9, 0.08]} c="#2a5d9f" />
        {[-7.6, -7.3, -7.0, -6.7].map((x) => (
          <Box key={x} p={[x, 0.95, -2.95]} s={[0.05, 1.8, 0.04]} c="#1c467a" />
        ))}
        <Box p={[-7.8, 1.6, -4.2]} s={[2.4, 1.2, 2.2]} c="#efe4cf" />
        <Box p={[-7.8, 2.3, -4.2]} s={[2.6, 0.2, 2.4]} c="#8c3b2a" />
      </Tappable>

      <Lamp p={[-2.7, 0, -1.0]} on={night} />
      <Lamp p={[3.6, 0, -1.0]} on={night} />

      <Tree p={[6.6, 0, -3.6]} />
      <Tree p={[-10.5, 0, -4.4]} s={1.2} />
      <Tree p={[5.6, 0, 3.9]} s={0.9} />

      {/* Distant Abuja hills and granite rock */}
      <mesh position={[-12, 1.6, -16]} scale={[4, 2.8, 2.5]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#7d7468" flatShading />
      </mesh>
      <mesh position={[-3, 1.0, -17]} scale={[6, 2, 3]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#5f7d4a" flatShading />
      </mesh>
      <mesh position={[7, 1.3, -16]} scale={[5, 2.2, 3]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#6c8a52" flatShading />
      </mesh>

      <MyCar />
      <Traffic />
      <Pedestrians />
    </group>
  );
}
