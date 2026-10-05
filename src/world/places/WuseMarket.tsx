import type { ReactNode } from 'react';
import { Person } from '../Avatar';
import { Box, Cyl, Tappable } from '../Room';
import { Car, Walkers, type Walker } from '../Street';
import { Ground } from './common';

const TARPS = ['#2a5d9f', '#c0392b', '#e2a531', '#1f8a4c', '#7b4fb0', '#16a085'];

/** Market stall: wooden table, four poles and a tarp roof, with a trader behind it. */
function Stall({ x, z, tarp, trader, flip, children }: { x: number; z: number; tarp: string; trader?: string; flip?: boolean; children?: ReactNode }) {
  // Front-row stalls face the aisle behind them.
  return (
    <group position={[x, 0, z]} rotation={[0, flip ? Math.PI : 0, 0]}>
      <Box p={[0, 0.45, 0]} s={[1.8, 0.08, 0.9]} c="#8a6a45" />
      {[[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]].map(([px, pz]) => (
        <Cyl key={`${px}${pz}`} p={[px, 0.95, pz]} r={0.03} h={1.9} c="#6b4f32" />
      ))}
      <Box p={[0, 1.95, 0]} s={[2.1, 0.05, 1.3]} c={tarp} r={[0.08, 0, 0]} />
      {trader && (
        <group position={[0, 0, -0.75]}>
          {/* Market women in wrapper and headtie */}
          <Person shirt={trader} woman hat={{ type: 'gele', color: trader }} />
        </group>
      )}
      {children}
    </group>
  );
}

/** Heap of produce on a stall table. */
function Heap({ x, color, count = 5 }: { x: number; color: string; count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[x + (i % 3) * 0.13 - 0.13, 0.55 + Math.floor(i / 3) * 0.1, (i % 2) * 0.12 - 0.06]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

const SHOPPERS: Walker[] = [
  { from: -5, to: 5.5, z: -0.6, speed: 0.6, shirt: '#e67e22' },
  { from: 5, to: -4, z: -0.2, speed: 0.5, shirt: '#2980b9' },
  { from: -3, to: 5, z: 2.6, speed: 0.7, shirt: '#c0392b', tray: true },
];

export function WuseMarket() {
  return (
    <group>
      <Ground color="#a59a86" />
      {/* Market floor */}
      <Ground color="#bdb3a0" size={[14, 8]} pos={[0, 0, -0.4]} />

      {/* Back row */}
      <Tappable id="foodstuff">
        <Stall x={-3.2} z={-2.6} tarp={TARPS[0]} trader="#f39c12">
          {/* Rice bags, beans, yams */}
          <Box p={[-0.5, 0.65, 0]} s={[0.4, 0.35, 0.3]} c="#f1ead2" />
          <Box p={[-0.05, 0.6, 0]} s={[0.35, 0.25, 0.3]} c="#c79a5b" />
          <Heap x={0.55} color="#7a4b2a" count={6} />
        </Stall>
      </Tappable>
      <Stall x={-0.8} z={-2.6} tarp={TARPS[1]} trader="#27ae60">
        <Heap x={-0.45} color="#d63c2f" count={6} />
        <Heap x={0.35} color="#e8a317" count={6} />
      </Stall>
      <Tappable id="okrika">
        <Stall x={1.6} z={-2.6} tarp={TARPS[2]} trader="#8e44ad">
          {/* Hanging clothes */}
          {[-0.6, -0.2, 0.2, 0.6].map((cx, i) => (
            <Box key={cx} p={[cx, 1.35, 0.45]} s={[0.3, 0.45, 0.04]} c={['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1'][i]} />
          ))}
          <Box p={[0, 0.58, 0]} s={[1.4, 0.18, 0.6]} c="#5d6d7e" />
        </Stall>
      </Tappable>
      <Stall x={4.0} z={-2.6} tarp={TARPS[3]} trader="#d35400">
        {[-0.5, -0.1, 0.3, 0.6].map((cx) => (
          <Box key={cx} p={[cx, 0.55, 0.05]} s={[0.25, 0.1, 0.12]} c="#3b2a1a" />
        ))}
      </Stall>

      {/* Front row */}
      <Tappable id="zobo">
        <Stall x={-1.6} z={1.2} flip tarp={TARPS[4]} trader="#c0392b">
          {[-0.4, -0.15, 0.1].map((cx) => (
            <Cyl key={cx} p={[cx, 0.6, 0]} r={0.06} h={0.22} c="#7b1e3a" />
          ))}
          <Heap x={0.5} color="#c98a3c" count={6} />
        </Stall>
      </Tappable>
      <Stall x={0.8} z={1.2} flip tarp={TARPS[5]} trader="#2c3e50">
        <Heap x={-0.3} color="#2f8f3a" count={6} />
        <Heap x={0.4} color="#f5e6b8" count={5} />
      </Stall>
      <Stall x={3.2} z={1.2} flip tarp={TARPS[1]} trader="#16a085">
        <Box p={[0, 0.6, 0]} s={[1.2, 0.2, 0.5]} c="#e5e5e5" />
      </Stall>

      <Tappable id="alabaru">
        {/* Wheelbarrow with load, and its owner */}
        <group position={[5.4, 0, 0.2]}>
          <Box p={[0, 0.45, 0]} s={[0.9, 0.3, 0.6]} c="#7f8c8d" />
          <Box p={[0.05, 0.7, 0]} s={[0.6, 0.25, 0.4]} c="#f1ead2" />
          <mesh position={[0.5, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 12]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <Box p={[-0.65, 0.45, 0.2]} s={[0.6, 0.04, 0.04]} c="#555" />
          <Box p={[-0.65, 0.45, -0.2]} s={[0.6, 0.04, 0.04]} c="#555" />
          <group position={[-1.1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Person shirt="#95a5a6" trousers="#34495e" />
          </group>
        </group>
      </Tappable>

      {/* Market gate */}
      <group position={[-5.6, 0, -2.6]}>
        <Box p={[-0.9, 1.4, 0]} s={[0.3, 2.8, 0.3]} c="#d9cbb0" />
        <Box p={[0.9, 1.4, 0]} s={[0.3, 2.8, 0.3]} c="#d9cbb0" />
        <Box p={[0, 2.85, 0]} s={[2.3, 0.5, 0.35]} c="#1f8a4c" />
      </group>

      <Tappable id="wuse-park">
        {/* Motor park with a waiting bus */}
        <group position={[-5.6, 0, 3.2]} rotation={[0, Math.PI / 2, 0]}>
          <Box p={[0, 0.85, 0]} s={[2.8, 1.3, 1.2]} c="#f4f4f4" />
          <Box p={[0, 0.7, 0]} s={[2.82, 0.2, 1.22]} c="#1f8a4c" />
          <Box p={[0.3, 1.2, 0]} s={[2.0, 0.35, 1.24]} c="#9ad0ec" />
          {[[-0.9, 0.6], [0.9, 0.6], [-0.9, -0.6], [0.9, -0.6]].map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x, 0.2, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.12, 12]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          ))}
        </group>
        <group position={[-4.2, 0, 3.4]} rotation={[0, -Math.PI / 2, 0]} scale={0.95}>
          <Person shirt="#e74c3c" trousers="#2d2d2d" />
        </group>
      </Tappable>

      <group position={[6.6, 0, 3.0]} rotation={[0, Math.PI / 2, 0]}>
        <Car body="#f4f4f4" roof="#f4f4f4" stripe="#1f8a4c" />
      </group>

      <Walkers walkers={SHOPPERS} />
    </group>
  );
}
