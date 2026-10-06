import { decodeLook, SKINS } from '../content/fashion';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Vector3, type Group } from 'three';
import { Person } from '../world/Avatar';
import { useNet, type Remote } from './useNet';
import { useGame } from '../store/game';
import { nearestSeat, SEAT_BASE } from '../content/seats';

/** World position above each remote player's head, read by LabelSync. */
export const remoteLabelPos = new Map<string, Vector3>();

function RemotePlayer({ p }: { p: Remote }) {
  // Another player sitting: put them on the seat they chose
  const seat = useGame((s) => (p.pose === 'sit' ? nearestSeat(s.place, s.area, [p.x, p.z], 0.4) : null));
  const ref = useRef<Group>(null);
  const legs = useRef<Group[]>([]);
  const look = decodeLook(p.look);
  const phase = useRef(0);
  const [walking, setWalking] = useState(false);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const dx = p.x - g.position.x;
    const dz = p.z - g.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 6) g.position.set(p.x, 0, p.z);
    else if (dist > 0.02) {
      const step = Math.min(dist, 2.8 * dt);
      g.position.x += (dx / dist) * step;
      g.position.z += (dz / dist) * step;
      g.rotation.y = Math.atan2(dx, dz);
      phase.current += dt * 11;
    }
    if (seat && dist < 0.5) {
      g.position.set(seat.x, seat.y - SEAT_BASE, seat.z);
      g.rotation.y = seat.rot;
    } else if (g.position.y !== 0) g.position.y = 0;
    const moving = dist > 0.02 && dist <= 6;
    if (moving !== walking) setWalking(moving);
    const swing = dist > 0.02 ? Math.sin(phase.current) * 0.5 : 0;
    legs.current.forEach((l, i) => l && (l.rotation.x = i === 0 ? swing : -swing));
    let v = remoteLabelPos.get(p.id);
    if (!v) remoteLabelPos.set(p.id, (v = new Vector3()));
    v.set(g.position.x, 1.75, g.position.z);
  });
  return (
    <group ref={ref} position={[p.x, 0, p.z]} visible={!p.hidden}>
      <Person shirt={p.shirt} legs={legs} outfit={look.outfit} hair={look.hair} skin={SKINS[look.skin]} move={walking ? 'Walk' : seat ? 'Sit' : p.pose === 'dance' ? 'Dance' : p.pose === 'wave' ? 'Wave' : p.pose === 'kneel' ? 'Kneel' : p.pose === 'phone' ? 'Interact' : 'Idle'} />
    </group>
  );
}

export function RemotePlayers() {
  const players = useNet((s) => s.players);
  return (
    <>
      {Object.values(players).map((p) => (
        <RemotePlayer key={p.id} p={p} />
      ))}
    </>
  );
}
