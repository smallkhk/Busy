import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { Color, Fog, type Group } from 'three';
import { carById } from '../content/cars';
import { clockParts, daylight } from '../engine/clock';
import { useGame } from '../store/game';
import { useSettings } from '../settings';
import { CarModel } from './CarModel';
import { KitInstances, kitMaterial, paintedMap, useKit, type Placement } from './City';
import { Keke, Tree } from './Street';
import { Person } from './Avatar';

/** One thing on the road ahead, as the drive game sees it: y runs 0 (far) to 1 (behind you). */
export type RoadHazard = { id: number; lane: number; y: number; emoji: string; hit?: boolean };

const LANE_W = 1.7;
/** Road units per unit of hazard y. */
const DEPTH = 30;
/** Where the hit window (y 0.78–0.92) sits on the road: right under your car. */
const CAR_Y = 0.85;
/** How fast the road rolls past (matches hazards moving 0.55 y per second). */
const SPEED = 0.55 * DEPTH;
const SEG = 48;
const SLOTS = 10;

const laneX = (lane: number) => (lane - 1) * LANE_W;
const zOf = (y: number) => (y - CAR_Y) * DEPTH;

/** Everything here scrolls toward the camera and wraps every SEG units. */
function Scroll({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.z = (clock.getElapsedTime() * SPEED) % SEG;
  });
  return (
    <group ref={ref}>
      {[-2, -1, 0, 1].map((k) => (
        <group key={k} position={[0, 0, k * SEG]}>
          {children}
        </group>
      ))}
    </group>
  );
}

/** Abuja houses and offices lining both sides of the road. */
function Roadside() {
  const sub = useKit('suburban');
  const com = useKit('commercial');
  const rows = useMemo(() => {
    const out: { kit: 'suburban' | 'commercial'; name: string; at: Placement[] }[] = [];
    const names = [
      ['commercial', 'building-c'], ['suburban', 'building-type-b'], ['commercial', 'building-e'], ['suburban', 'building-type-n'],
      ['commercial', 'building-h'], ['suburban', 'building-type-d'], ['commercial', 'building-k'], ['suburban', 'building-type-g'],
    ] as const;
    names.forEach(([kit, name], i) => {
      const at: Placement[] = [];
      for (const side of [-1, 1]) {
        const z = -i * (SEG / names.length) - (side > 0 ? 3 : 0);
        at.push({ x: side * 8.2, z, rot: side > 0 ? -Math.PI / 2 : Math.PI / 2, s: kit === 'commercial' ? 2.4 : 2.3 });
      }
      out.push({ kit, name, at });
    });
    return out;
  }, []);
  return (
    <>
      {rows.map(({ kit, name, at }) => {
        const k = kit === 'suburban' ? sub : com;
        const part = k.parts[name];
        return part ? <KitInstances key={name} part={part} at={at} material={kitMaterial(paintedMap(k.map, kit, kit === 'suburban' ? { roof: '#b5402e', wall: '#f3e6cc' } : { wall: '#f1e3c8' }))} shadows={false} /> : null;
      })}
    </>
  );
}

function RoadSegment({ night }: { night: boolean }) {
  return (
    <>
      {/* Lane dashes and the black-and-yellow kerbs */}
      {Array.from({ length: SEG / 4 }, (_, i) => (
        <group key={i}>
          {[0.5, 1.5].map((l) => (
            <mesh key={l} rotation={[-Math.PI / 2, 0, 0]} position={[(l - 1) * LANE_W, 0.01, -i * 4]}>
              <planeGeometry args={[0.12, 1.6]} />
              <meshStandardMaterial color="#f2f2f2" />
            </mesh>
          ))}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (LANE_W * 1.5 + 0.1), 0.08, -i * 4]}>
              <boxGeometry args={[0.16, 0.16, 2]} />
              <meshStandardMaterial color={i % 2 ? '#f2c230' : '#1d1d1d'} />
            </mesh>
          ))}
          {[-1, 1].map((side) => (
            <mesh key={`b${side}`} position={[side * (LANE_W * 1.5 + 0.1), 0.08, -i * 4 - 2]}>
              <boxGeometry args={[0.16, 0.16, 2]} />
              <meshStandardMaterial color={i % 2 ? '#1d1d1d' : '#f2c230'} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Street lights and trees on the walkway */}
      {Array.from({ length: 4 }, (_, i) => (
        <group key={i}>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 4.4, 0, -i * 12 - 4]}>
              <mesh position={[0, 1.7, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 3.4, 8]} />
                <meshStandardMaterial color="#4b4b4b" />
              </mesh>
              <mesh position={[-side * 0.5, 3.35, 0]}>
                <boxGeometry args={[1, 0.08, 0.14]} />
                <meshStandardMaterial color={night ? '#fff3c4' : '#4b4b4b'} emissive={night ? '#ffd27a' : '#000'} emissiveIntensity={night ? 2 : 0} />
              </mesh>
            </group>
          ))}
          <Tree p={[(i % 2 ? 1 : -1) * 5.4, 0, -i * 12 - 9]} s={1.1} />
        </group>
      ))}
    </>
  );
}

/** A goat: body, head and four legs. */
function Goat() {
  return (
    <group scale={0.9}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.35, 0.32, 0.7]} />
        <meshStandardMaterial color="#e9e2d0" />
      </mesh>
      <mesh position={[0, 0.78, -0.42]} castShadow>
        <boxGeometry args={[0.22, 0.26, 0.3]} />
        <meshStandardMaterial color="#d8cfb8" />
      </mesh>
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.97, -0.38]} rotation={[0.5, 0, 0]}>
          <coneGeometry args={[0.03, 0.18, 6]} />
          <meshStandardMaterial color="#5b4a3a" />
        </mesh>
      ))}
      {[-0.12, 0.12].flatMap((x) => [-0.25, 0.25].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.2, z]}>
          <boxGeometry args={[0.07, 0.4, 0.07]} />
          <meshStandardMaterial color="#cfc6ae" />
        </mesh>
      )))}
    </group>
  );
}

/** Okada: bike and rider. */
function Okada() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.22, 0.32, 1.1]} />
        <meshStandardMaterial color="#b0201c" />
      </mesh>
      {[-0.45, 0.45].map((z) => (
        <mesh key={z} position={[0, 0.26, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.1, 14]} />
          <meshStandardMaterial color="#141414" />
        </mesh>
      ))}
      <group position={[0, 0.3, 0.1]} scale={0.8}>
        <Person shirt="#2c5e8a" trousers="#2d2d2d" />
      </group>
    </group>
  );
}

function Pothole() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.6, 14]} />
        <meshStandardMaterial color="#1b1712" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[0.6, 0.72, 14]} />
        <meshStandardMaterial color="#6a5a48" />
      </mesh>
    </group>
  );
}

function Barrier() {
  return (
    <group>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.4, 0]}>
          <boxGeometry args={[0.08, 0.8, 0.08]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      ))}
      {[0.45, 0.72].map((y, i) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[1.4, 0.16, 0.06]} />
          <meshStandardMaterial color={i ? '#f4f4f4' : '#d9361e'} />
        </mesh>
      ))}
    </group>
  );
}

const KINDS: Record<string, () => ReactNode> = {
  '🕳️': () => <Pothole />,
  '🏍️': () => <Okada />,
  '🐐': () => <Goat />,
  '🚧': () => <Barrier />,
  // Keke going the same way, a bit slower than you
  '🛺': () => (
    <group rotation={[0, Math.PI / 2, 0]}>
      <Keke />
    </group>
  ),
};
const KIND_KEYS = Object.keys(KINDS);

/** A fixed pool of slots; each frame the hazards are dealt into them. */
function Hazards({ list }: { list: MutableRefObject<RoadHazard[]> }) {
  const slots = useRef<(Group | null)[]>([]);
  const kinds = useRef<(Group | null)[][]>([]);
  useFrame(({ clock }) => {
    const hs = list.current;
    for (let i = 0; i < SLOTS; i++) {
      const g = slots.current[i];
      if (!g) continue;
      const h = hs[i];
      g.visible = !!h;
      if (!h) continue;
      g.position.set(laneX(h.lane), 0, zOf(h.y));
      // Knocked things tumble away
      g.rotation.z = h.hit ? Math.sin(clock.getElapsedTime() * 20) * 0.4 : 0;
      kinds.current[i]?.forEach((k, j) => {
        if (k) k.visible = KIND_KEYS[j] === h.emoji;
      });
    }
  });
  return (
    <>
      {Array.from({ length: SLOTS }, (_, i) => (
        <group key={i} ref={(g) => { slots.current[i] = g; }} visible={false}>
          {KIND_KEYS.map((k, j) => (
            <group
              key={k}
              ref={(g) => {
                kinds.current[i] ??= [];
                kinds.current[i][j] = g;
              }}
            >
              {KINDS[k]()}
            </group>
          ))}
        </group>
      ))}
    </>
  );
}

/** Your car slides between lanes and shakes when you hit something. */
function MyCar({ lane, hits }: { lane: MutableRefObject<number>; hits: number }) {
  const car = useGame((s) => s.car);
  const c = car ? carById(car.id) : undefined;
  const ref = useRef<Group>(null);
  const shake = useRef(0);
  const seen = useRef(hits);
  const { camera } = useThree();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (hits !== seen.current) {
      seen.current = hits;
      shake.current = 0.5;
    }
    shake.current = Math.max(0, shake.current - dt);
    const target = laneX(lane.current);
    const dx = target - g.position.x;
    g.position.x += dx * Math.min(1, dt * 10);
    // Lean into the turn
    g.rotation.y = Math.PI / 2 - dx * 0.12;
    g.rotation.z = Math.sin(shake.current * 60) * shake.current * 0.1;
    g.position.y = Math.abs(Math.sin(shake.current * 40)) * shake.current * 0.3;
    // Chase camera follows a little behind
    camera.position.x += (g.position.x * 0.6 - camera.position.x) * Math.min(1, dt * 4);
    camera.lookAt(g.position.x * 0.8, 0.6, -9);
  });
  return (
    <group ref={ref} rotation={[0, Math.PI / 2, 0]}>
      <CarModel kind={c?.model ?? 'sedan'} paint={car?.paint ?? c?.color ?? '#b9bcc2'} lights />
    </group>
  );
}

function Sky() {
  const light = useGame((s) => daylight(clockParts(Math.floor(s.time / 10) * 10).minuteOfDay));
  const { scene } = useThree();
  const sky = light > 0.25 ? '#bfe3f7' : '#2b3550';
  useEffect(() => {
    scene.background = new Color(sky);
    scene.fog = new Fog(sky, 28, 70);
  }, [scene, sky]);
  return (
    <>
      <hemisphereLight args={[light > 0.25 ? '#cfe8ff' : '#8fa3d6', '#8a6a45', 0.8]} />
      <directionalLight position={[6, 12, 4]} intensity={0.6 + light * 1.6} color={light > 0.6 ? '#fff4e0' : '#ffb877'} />
      <ambientLight intensity={0.3} />
    </>
  );
}

/** The 3D road for the drive game: your own car, Abuja on both sides, wahala in your lane. */
export function DriveRoad({ lane, hazards, hits }: { lane: MutableRefObject<number>; hazards: MutableRefObject<RoadHazard[]>; hits: number }) {
  const low = useSettings((s) => s.quality === 'low');
  const night = useGame((s) => daylight(clockParts(Math.floor(s.time / 10) * 10).minuteOfDay) < 0.3);
  return (
    <Canvas dpr={low ? 1 : [1, 2]} camera={{ position: [0, 3.2, 6.8], fov: 50 }} gl={{ antialias: !low }} resize={{ offsetSize: true }}>
      <Sky />
      {/* Tarred road and the red laterite beyond the walkways */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]}>
        <planeGeometry args={[LANE_W * 3 + 0.4, 120]} />
        <meshStandardMaterial color="#3a3d42" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 3.9, 0.02, -30]}>
            <planeGeometry args={[2.2, 120]} />
            <meshStandardMaterial color="#bdb6a8" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 30, -0.01, -30]}>
            <planeGeometry args={[50, 120]} />
            <meshStandardMaterial color="#b0703f" />
          </mesh>
        </group>
      ))}
      <Scroll>
        <RoadSegment night={night} />
        <Suspense fallback={null}>
          <Roadside />
        </Suspense>
      </Scroll>
      <Hazards list={hazards} />
      <MyCar lane={lane} hits={hits} />
    </Canvas>
  );
}
