import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { Person } from '../Avatar';
import { Box, Cyl, Tappable } from '../Room';
import { Car, Walkers, type Walker } from '../Street';
import { Ground } from './common';

function Palm({ x, z, h = 2.6 }: { x: number; z: number; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, h / 2, 0]} r={0.1} h={h} c="#8d6e4a" />
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos((i * 2 * Math.PI) / 5) * 0.45, h - 0.05, Math.sin((i * 2 * Math.PI) / 5) * 0.45]} rotation={[0, (-i * 2 * Math.PI) / 5, 0.5]}>
          <boxGeometry args={[1.0, 0.04, 0.28]} />
          <meshStandardMaterial color="#2e8b3a" />
        </mesh>
      ))}
    </group>
  );
}

function Boat() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.position.set(4 + Math.sin(t * 0.15) * 3, 0.05 + Math.sin(t * 1.5) * 0.04, -6.5);
    ref.current.rotation.z = Math.sin(t * 1.2) * 0.04;
  });
  return (
    <group ref={ref}>
      <Box p={[0, 0.15, 0]} s={[1.6, 0.3, 0.6]} c="#f4f4f4" />
      <Box p={[0, 0.32, 0]} s={[1.4, 0.06, 0.5]} c="#c0392b" />
      <group position={[-0.3, 0.15, 0]} scale={0.8}>
        <Person shirt="#f1c40f" />
      </group>
    </group>
  );
}

const STROLLERS: Walker[] = [
  { from: -1, to: 6.5, z: -1.9, speed: 0.4, shirt: '#e84393' },
  { from: 6, to: -1.2, z: -1.6, speed: 0.45, shirt: '#0984e3' },
  { from: -7, to: 2, z: -0.4, speed: 0.6, shirt: '#2d3436' },
  { from: 1, to: -6.5, z: 0.4, speed: 0.55, shirt: '#fdcb6e' },
];

export function JabiLake() {
  return (
    <group>
      <Ground color="#7fa856" />
      {/* Paved promenade and mall forecourt */}
      <Ground color="#d6cfc0" size={[18, 5.6]} pos={[-0.5, 0, 0.6]} />

      {/* Lake */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0.01, -9]}>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color="#3d8fc4" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Railing along the water */}
      <Box p={[3.75, 0.5, -2.9]} s={[10.5, 0.06, 0.06]} c="#e0e0e0" />
      {Array.from({ length: 11 }, (_, i) => (
        <Box key={i} p={[-1.25 + i, 0.25, -2.9]} s={[0.06, 0.5, 0.06]} c="#e0e0e0" />
      ))}
      <Boat />

      {/* Mall building */}
      <Box p={[-4.75, 1.7, -4.6]} s={[5.6, 3.4, 4]} c="#e9e4dc" />
      <Box p={[-4.75, 3.5, -4.6]} s={[5.8, 0.2, 4.2]} c="#c9a24a" />
      {/* Glass shopfronts */}
      {[-6.4, -4.75, -3.1].map((x) => (
        <Box key={x} p={[x, 1.3, -2.58]} s={[1.4, 2.0, 0.04]} c="#8fc6e8" />
      ))}
      {/* Mall sign band */}
      <Box p={[-4.75, 2.75, -2.56]} s={[4.6, 0.45, 0.04]} c="#0d2b22" />
      <Box p={[-4.75, 2.75, -2.54]} s={[3.6, 0.12, 0.02]} c="#e8b04b" />

      <Tappable id="cinema">
        <Box p={[-6.4, 2.3, -2.5]} s={[1.4, 0.3, 0.1]} c="#c0392b" />
      </Tappable>
      <Tappable id="foodcourt">
        <Box p={[-4.75, 2.3, -2.5]} s={[1.4, 0.3, 0.1]} c="#e67e22" />
        {[-5.3, -4.2].map((x) => (
          <group key={x}>
            <Cyl p={[x, 0.4, -1.4]} r={0.35} h={0.06} c="#f4f4f4" />
            <Cyl p={[x, 0.2, -1.4]} r={0.04} h={0.4} c="#888" />
          </group>
        ))}
      </Tappable>
      <Tappable id="boutique">
        <Box p={[-3.1, 2.3, -2.5]} s={[1.4, 0.3, 0.1]} c="#8e44ad" />
        <group position={[-3.1, 0, -2.2]}>
          <Person shirt="#2c3e50" woman />
        </group>
      </Tappable>

      <Tappable id="lakeside">
        <Box p={[3.0, 0.4, -2.4]} s={[1.6, 0.08, 0.45]} c="#8a6a45" />
        <Box p={[3.0, 0.65, -2.6]} s={[1.6, 0.4, 0.06]} c="#8a6a45" />
        <Box p={[2.4, 0.2, -2.4]} s={[0.08, 0.4, 0.4]} c="#555" />
        <Box p={[3.6, 0.2, -2.4]} s={[0.08, 0.4, 0.4]} c="#555" />
      </Tappable>

      <Tappable id="jabi-park">
        <Box p={[4.8, 0.02, 3.0]} s={[2.6, 0.04, 1.6]} c="#3a3d42" />
        <group position={[5.0, 0, 3.0]}>
          <Car body="#f4f4f4" roof="#f4f4f4" stripe="#1f8a4c" />
        </group>
        <Box p={[3.4, 1.2, 2.2]} s={[0.06, 2.4, 0.06]} c="#555" />
        <Box p={[3.4, 2.3, 2.2]} s={[0.5, 0.35, 0.04]} c="#f2c230" />
      </Tappable>

      {/* Parked cars */}
      {[[-6.4, '#20232a'], [-4.4, '#b9bcc2'], [-2.4, '#8b1e3f']].map(([x, c]) => (
        <group key={x as number} position={[x as number, 0, 2.9]} rotation={[0, Math.PI / 2, 0]}>
          <Car body={c as string} roof={c as string} />
        </group>
      ))}

      <Palm x={0.2} z={-2.4} />
      <Palm x={6.6} z={-2.4} h={2.9} />
      <Palm x={-0.6} z={2.8} h={2.4} />
      <Palm x={2.2} z={3.2} />

      <Walkers walkers={STROLLERS} />
    </group>
  );
}
