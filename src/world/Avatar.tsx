import { useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import type { Group } from 'three';
import { activityById } from '../content/activities';
import { live, useGame } from '../store/game';
import { SKINS, type Hair, type Outfit } from '../content/fashion';
import { avatarLabelPos } from './labels';
import { CELL_X, CELL_Z, currentCell } from '../content/worldmap';
import { shiftOrigin } from './origin';
import { homePoint } from '../content/homeLayout';
import { HumanModel, type Hat, type HumanKind, type Move } from './HumanModel';
import { dressFor } from './dress';
import { CarModel } from './CarModel';
import { carById } from '../content/cars';
import { clockParts, daylight } from '../engine/clock';

const SPEED = 2.6; // world units per second
/** Driving round town. */
const CAR_SPEED = 9;
const BED_POS: [number, number] = [-2.9, -1.9];

function Hairdo({ hair, color = '#111' }: { hair: Hair; color?: string }) {
  switch (hair) {
    case 'bald':
      return null;
    case 'afro':
      return (
        <mesh position={[0, 1.37, -0.05]} scale={[1, 0.9, 0.95]}>
          <sphereGeometry args={[0.22, 16, 12]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      );
    case 'braids':
      return (
        <group>
          <mesh position={[0, 1.27, -0.012]} scale={[1.05, 0.92, 1.06]}>
            <sphereGeometry args={[0.172, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          {[-0.1, 0, 0.1].map((x) => (
            <mesh key={x} position={[x, 1.08, -0.16]}>
              <capsuleGeometry args={[0.025, 0.28, 3, 6]} />
              <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
          ))}
        </group>
      );
    case 'fila':
      return (
        <mesh position={[0.02, 1.38, -0.01]} rotation={[0, 0, -0.18]}>
          <cylinderGeometry args={[0.15, 0.175, 0.16, 16]} />
          <meshStandardMaterial color="#8b1e3f" roughness={0.8} />
        </mesh>
      );
    case 'cap':
      return (
        <group>
          <mesh position={[0, 1.29, -0.01]} scale={[1.06, 0.9, 1.06]}>
            <sphereGeometry args={[0.172, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
            <meshStandardMaterial color="#1f4f7a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.31, 0.17]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.24, 0.02, 0.16]} />
            <meshStandardMaterial color="#1f4f7a" />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh position={[0, 1.27, -0.012]} scale={[1.04, 0.9, 1.04]}>
          <sphereGeometry args={[0.172, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      );
  }
}

/** Rounded little human: capsule limbs, round head, hair, hands and shoes. Shows while the real model loads. */
function BlockPerson({ shirt, skin = '#5a3825', trousers = '#24324a', legs, outfit = 'tee', hair = 'short' }: {
  shirt: string;
  skin?: string;
  trousers?: string;
  /** Filled with [left leg, right leg, right arm, left arm] so walking can swing them. */
  legs?: React.RefObject<Group[]>;
  outfit?: Outfit;
  hair?: Hair;
}) {
  const reg = (i: number) => (g: Group | null) => {
    if (legs?.current && g) legs.current[i] = g;
  };
  const top = outfit === 'jersey' ? '#118a4c' : outfit === 'suit' ? '#1f2a36' : shirt;
  const pants = outfit === 'suit' ? '#1f2a36' : outfit === 'kaftan' || outfit === 'agbada' || outfit === 'native' ? shirt : outfit === 'jersey' ? '#f4f4f4' : trousers;
  const longSleeve = outfit === 'suit' || outfit === 'kaftan' || outfit === 'agbada' || outfit === 'native';
  return (
    <group>
      {/* Legs pivot at the hip */}
      {[-0.1, 0.1].map((x, i) => (
        <group key={x} position={[x, 0.46, 0]} ref={reg(i)}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.28, 4, 8]} />
            <meshStandardMaterial color={pants} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.42, 0.04]} castShadow scale={[1, 0.55, 1.5]}>
            <sphereGeometry args={[0.085, 10, 8]} />
            <meshStandardMaterial color={outfit === 'jersey' ? '#f4f4f4' : '#1a1a1a'} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Body */}
      {outfit === 'agbada' ? (
        <group>
          <mesh position={[0, 0.66, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.36, 0.78, 16]} />
            <meshStandardMaterial color={top} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.88, 0.16]}>
            <boxGeometry args={[0.16, 0.22, 0.02]} />
            <meshStandardMaterial color="#c9a24a" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ) : outfit === 'kaftan' ? (
        <mesh position={[0, 0.62, 0]} castShadow scale={[1, 1, 0.66]}>
          <capsuleGeometry args={[0.2, 0.46, 4, 12]} />
          <meshStandardMaterial color={top} roughness={0.75} />
        </mesh>
      ) : (
        <mesh position={[0, 0.74, 0]} castShadow scale={[1, 1, 0.62]}>
          <capsuleGeometry args={[0.2, 0.26, 4, 12]} />
          <meshStandardMaterial color={top} roughness={0.8} />
        </mesh>
      )}
      {outfit === 'suit' && (
        <group>
          <mesh position={[0, 0.84, 0.115]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.09, 0.22, 3]} />
            <meshStandardMaterial color="#f4f4f4" />
          </mesh>
          <mesh position={[0, 0.78, 0.13]}>
            <boxGeometry args={[0.04, 0.2, 0.02]} />
            <meshStandardMaterial color="#8b1e3f" />
          </mesh>
        </group>
      )}
      {outfit === 'jersey' && (
        <mesh position={[0, 0.76, 0.128]}>
          <boxGeometry args={[0.12, 0.14, 0.01]} />
          <meshStandardMaterial color="#f4f4f4" />
        </mesh>
      )}
      {outfit === 'native' &&
        [0.62, 0.78, 0.94].map((y) => (
          <mesh key={y} position={[0, y, 0]} scale={[1, 1, 0.64]}>
            <torusGeometry args={[0.2, 0.012, 4, 20]} />
            <meshStandardMaterial color="#f2c230" />
          </mesh>
        ))}
      {/* Arms pivot at the shoulder */}
      {[0.27, -0.27].map((x, i) => (
        <group key={x} position={[outfit === 'agbada' ? x * 1.15 : x, 0.92, 0]} ref={reg(2 + i)}>
          {outfit === 'agbada' ? (
            <mesh position={[0, -0.2, 0]} castShadow>
              <boxGeometry args={[0.2, 0.42, 0.24]} />
              <meshStandardMaterial color={top} roughness={0.7} />
            </mesh>
          ) : (
            <mesh position={[0, -0.1, 0]} castShadow>
              <capsuleGeometry args={[0.065, 0.12, 4, 8]} />
              <meshStandardMaterial color={top} roughness={0.8} />
            </mesh>
          )}
          <mesh position={[0, -0.27, 0]} castShadow>
            <capsuleGeometry args={[0.052, 0.16, 4, 8]} />
            <meshStandardMaterial color={longSleeve && outfit !== 'agbada' ? top : skin} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.39, 0]}>
            <sphereGeometry args={[0.058, 8, 6]} />
            <meshStandardMaterial color={skin} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Neck, head, ears, hair */}
      <mesh position={[0, 1.04, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 10]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.22, 0]} castShadow scale={[1, 1.08, 1]}>
        <sphereGeometry args={[0.17, 16, 14]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, 1.21, 0]} scale={[0.5, 1, 0.8]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
      ))}
      <Hairdo hair={hair} />
      {/* Eyes and a small smile */}
      {[-0.06, 0.06].map((x) => (
        <group key={x} position={[x, 1.24, 0.152]}>
          <mesh>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <sphereGeometry args={[0.016, 6, 5]} />
            <meshStandardMaterial color="#1a0f08" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.15, 0.158]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.035, 0.008, 4, 10, Math.PI]} />
        <meshStandardMaterial color="#3a1a10" />
      </mesh>
    </group>
  );
}

/** A person on the map: a rigged, animated human in Abuja clothes. */
export function Person(props: {
  shirt: string;
  skin?: string;
  trousers?: string;
  /** Old blocky walk: filled with limbs so walking can swing them. */
  legs?: React.RefObject<Group[]>;
  outfit?: Outfit;
  hair?: Hair;
  woman?: boolean;
  hat?: Hat;
  kind?: HumanKind;
  move?: Move;
}) {
  const block = <BlockPerson shirt={props.shirt} skin={props.skin} trousers={props.trousers} legs={props.legs} outfit={props.outfit} hair={props.hair} />;
  const skin = props.skin ?? '#5a3825';
  return (
    <Suspense fallback={block}>
      <HumanModel {...dressFor({ ...props, skin })} skin={skin} move={props.move} />
    </Suspense>
  );
}

export function Avatar() {
  const group = useRef<Group>(null);
  const legs = useRef<Group[]>([]);
  const walkPhase = useRef(0);
  const shirt = useGame((s) => s.shirt);
  const look = useGame((s) => s.look);
  const fitness = useGame((s) => s.fitness ?? 10);
  const active = useGame((s) => s.active);
  const walking = useGame((s) => !!s.target);
  const activity = active ? activityById(active.id) : undefined;
  const hidden = !!activity?.away;
  const sleeping = !!activity?.sleep;
  const driving = useGame((s) => s.driving);
  const car = useGame((s) => s.car);
  const carDef = car ? carById(car.id) : undefined;
  const night = useGame((s) => daylight(clockParts(Math.floor(s.time / 30) * 30).minuteOfDay) < 0.3);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const { target, pos, arrive } = useGame.getState();

    if (sleeping) {
      // Faint on the floor if not at the bed
      const { area, place } = useGame.getState();
      const [bx, bz] = homePoint(area, 'bed', BED_POS[0], BED_POS[1]);
      const atBed = place === 'home' && Math.hypot(pos[0] - bx, pos[1] - bz) < 2.5;
      g.position.set(atBed ? bx : pos[0], atBed ? (area === 'mararaba' ? 0.32 : 0.62) : 0.15, atBed ? bz + 0.65 : pos[1]);
      g.rotation.set(-Math.PI / 2, 0, 0);
      avatarLabelPos.set(g.position.x, g.position.y + 0.5, g.position.z - 0.6);
      return;
    }
    if (g.rotation.x !== 0) {
      g.rotation.set(0, g.rotation.y, 0);
      g.position.set(pos[0], 0, pos[1]);
    }

    if (target) {
      const dx = target[0] - g.position.x;
      const dz = target[1] - g.position.z;
      const dist = Math.hypot(dx, dz);
      const step = (useGame.getState().driving ? CAR_SPEED : SPEED) * dt;
      if (dist <= step || dist < 0.02) {
        g.position.set(target[0], 0, target[1]);
        arrive([target[0], target[1]]);
      } else {
        g.position.x += (dx / dist) * step;
        g.position.z += (dz / dist) * step;
        // Ease round corners
        const want = Math.atan2(dx, dz);
        let turn = want - g.rotation.y;
        turn = Math.atan2(Math.sin(turn), Math.cos(turn));
        g.rotation.y += turn * Math.min(1, dt * 12);
        live.rot = g.rotation.y;
        walkPhase.current += dt * 11;
      }
    } else {
      // Snap to saved position (e.g. after load or coming back from work)
      if (Math.hypot(g.position.x - pos[0], g.position.z - pos[1]) > 0.05) {
        g.position.set(pos[0], 0, pos[1]);
        // Climbing into a parked car: face the way it is parked
        if (useGame.getState().driving) g.rotation.y = live.rot;
      }
      walkPhase.current = 0;
    }

    live.pos = target ? [g.position.x, g.position.z] : null;

    // Walked across a block edge: the next block becomes the origin
    const s = useGame.getState();
    if (s.place !== 'home') {
      const dc = g.position.x > CELL_X / 2 + 1.5 ? 1 : g.position.x < -CELL_X / 2 - 1.5 ? -1 : 0;
      const dr = g.position.z > CELL_Z / 2 + 1.5 ? 1 : g.position.z < -CELL_Z / 2 - 1.5 ? -1 : 0;
      if (dc || dr) {
        const before = currentCell(s);
        s.shiftCell(dc, dr);
        const after = currentCell(useGame.getState());
        if (before && after && (before[0] !== after[0] || before[1] !== after[1])) {
          g.position.x -= dc * CELL_X;
          g.position.z -= dr * CELL_Z;
          shiftOrigin(dc * CELL_X, dr * CELL_Z);
        }
      }
    }

    const inCar = useGame.getState().driving;
    const swing = target && !inCar ? Math.sin(walkPhase.current) * 0.5 : 0;
    legs.current.forEach((l, i) => l && (l.rotation.x = i % 2 === 0 ? swing : -swing));
    g.position.y = target && !inCar ? Math.abs(Math.sin(walkPhase.current)) * 0.04 : 0;
    avatarLabelPos.set(g.position.x, 1.75, g.position.z);
  });

  return (
    <group ref={group} visible={!hidden}>
      {driving && carDef ? (
        // Your own motor, nose forward (car models face +x, you face +z)
        <group rotation={[0, -Math.PI / 2, 0]}>
          <CarModel kind={carDef.model} paint={car?.paint ?? carDef.color} lights={night} />
        </group>
      ) : (
      <>
      {/* Fitness shows: fit people get broader shoulders */}
      <group scale={[0.92 + fitness * 0.0016, 1, 0.94 + fitness * 0.0012]}>
        <Person shirt={shirt} legs={legs} outfit={look?.outfit} hair={look?.hair} skin={SKINS[look?.skin ?? 2]} move={walking ? 'Walk' : active && !sleeping ? 'Interact' : 'Idle'} />
      </group>
      </>
      )}
    </group>
  );
}
