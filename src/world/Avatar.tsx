import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { activityById } from '../content/activities';
import { useGame } from '../store/game';
import { avatarLabelPos } from './labels';

const SPEED = 2.6; // world units per second
const BED_POS: [number, number] = [-2.9, -1.9];

export function Person({ shirt, skin = '#5a3825', trousers = '#24324a', legs }: {
  shirt: string;
  skin?: string;
  trousers?: string;
  legs?: React.RefObject<Group[]>;
}) {
  return (
    <group>
      {[-0.11, 0.11].map((x, i) => (
        <group key={x} position={[x, 0.42, 0]} ref={(g) => { if (legs?.current && g) legs.current[i] = g; }}>
          <mesh position={[0, -0.21, 0]} castShadow>
            <boxGeometry args={[0.16, 0.42, 0.18]} />
            <meshStandardMaterial color={trousers} />
          </mesh>
          <mesh position={[0, -0.4, 0.04]} castShadow>
            <boxGeometry args={[0.17, 0.06, 0.26]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.44, 0.56, 0.26]} />
        <meshStandardMaterial color={shirt} />
      </mesh>
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.68, 0]} castShadow>
          <boxGeometry args={[0.11, 0.5, 0.14]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      ))}
      <mesh position={[0, 1.17, 0]} castShadow>
        <boxGeometry args={[0.32, 0.34, 0.3]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 1.36, -0.01]}>
        <boxGeometry args={[0.34, 0.08, 0.32]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 1.2, 0.152]}>
          <boxGeometry args={[0.05, 0.05, 0.01]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      ))}
    </group>
  );
}

export function Avatar() {
  const group = useRef<Group>(null);
  const legs = useRef<Group[]>([]);
  const walkPhase = useRef(0);
  const shirt = useGame((s) => s.shirt);
  const active = useGame((s) => s.active);
  const activity = active ? activityById(active.id) : undefined;
  const hidden = !!activity?.away;
  const sleeping = !!activity?.sleep;

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const { target, pos, arrive } = useGame.getState();

    if (sleeping) {
      // Faint on the floor if not at the bed
      const atBed = useGame.getState().place === 'home' && Math.hypot(pos[0] - BED_POS[0], pos[1] - BED_POS[1]) < 2;
      g.position.set(atBed ? BED_POS[0] : pos[0], atBed ? 0.62 : 0.15, atBed ? -1.25 : pos[1]);
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
      const step = SPEED * dt;
      if (dist <= step || dist < 0.02) {
        g.position.set(target[0], 0, target[1]);
        arrive([target[0], target[1]]);
      } else {
        g.position.x += (dx / dist) * step;
        g.position.z += (dz / dist) * step;
        g.rotation.y = Math.atan2(dx, dz);
        walkPhase.current += dt * 11;
      }
    } else {
      // Snap to saved position (e.g. after load or coming back from work)
      if (Math.hypot(g.position.x - pos[0], g.position.z - pos[1]) > 0.05) g.position.set(pos[0], 0, pos[1]);
      walkPhase.current = 0;
    }

    const swing = target ? Math.sin(walkPhase.current) * 0.5 : 0;
    legs.current.forEach((l, i) => l && (l.rotation.x = i === 0 ? swing : -swing));
    g.position.y = target ? Math.abs(Math.sin(walkPhase.current)) * 0.04 : 0;
    avatarLabelPos.set(g.position.x, 1.75, g.position.z);
  });

  return (
    <group ref={group} visible={!hidden}>
      <Person shirt={shirt} legs={legs} />
    </group>
  );
}
