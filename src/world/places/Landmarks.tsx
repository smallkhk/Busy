import { Person } from '../Avatar';
import { Box, Cyl, Tappable } from '../Room';
import { Car, Tree, Walkers, type Walker } from '../Street';
import { Flag, Ground } from './common';

/** Taxi rank / bus stop, front right (same spot as the district scenes). */
function Rank({ id, color }: { id: string; color: string }) {
  return (
    <Tappable id={id}>
      <Box p={[5.0, 0.02, 3.0]} s={[2.8, 0.04, 1.8]} c="#3a3d42" />
      <Box p={[5.0, 2.0, 3.6]} s={[2.2, 0.08, 1.0]} c={color} />
      <Box p={[4.0, 1.0, 3.9]} s={[0.08, 2.0, 0.08]} c="#555" />
      <Box p={[6.0, 1.0, 3.9]} s={[0.08, 2.0, 0.08]} c="#555" />
      <Box p={[5.0, 0.42, 3.8]} s={[1.8, 0.08, 0.35]} c="#7a5a3c" />
      <group position={[5.6, 0, 2.4]}>
        <Car body="#f4f4f4" roof="#f4f4f4" stripe="#1f8a4c" />
      </group>
    </Tappable>
  );
}

function RoundTree({ x, z, s = 1, c = '#3f8f3a' }: { x: number; z: number; s?: number; c?: string }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <Cyl p={[0, 0.6, 0]} r={0.1} h={1.2} c="#7a5536" />
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.7, 14, 12]} />
        <meshStandardMaterial color={c} roughness={0.9} />
      </mesh>
      <mesh position={[0.35, 1.3, 0.2]} castShadow>
        <sphereGeometry args={[0.45, 12, 10]} />
        <meshStandardMaterial color={c} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Flowers({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.cos(i) * 0.35, 0.12, Math.sin(i * 1.7) * 0.25]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshStandardMaterial color={['#e74c3c', '#f1c40f', '#ff6b9a', '#ffffff'][i % 4]} />
        </mesh>
      ))}
    </group>
  );
}

const PARK_WALKERS: Walker[] = [
  { from: -6, to: 5, z: 0.4, speed: 0.4, shirt: '#e84393' },
  { from: 5, to: -5, z: 1.4, speed: 0.9, shirt: '#0984e3' },
  { from: -2, to: 4, z: 2.4, speed: 0.35, shirt: '#fdcb6e' },
];

/** Millennium Park: lawns, a fountain, and a jogging track. */
export function Park() {
  return (
    <group>
      <Ground color="#6fae4f" />
      {/* Paths */}
      <Ground color="#d9cfb8" size={[16, 1.2]} pos={[0, 0, 1.4]} />
      <Ground color="#d9cfb8" size={[1.2, 6]} pos={[-0.6, 0, -1.4]} />

      <Tappable id="lawn">
        <Box p={[-4.2, 0.02, -2.0]} s={[1.6, 0.03, 1.1]} c="#c0392b" />
        {[-4.6, -3.8].map((x, i) => (
          <group key={x} position={[x, 0, -2.6]} rotation={[0, i ? -0.4 : 0.4, 0]} scale={0.9}>
            <Person shirt={i ? '#f1c40f' : '#16a085'} trousers={i ? undefined : '#2d2d2d'} woman={i === 1} />
          </group>
        ))}
        <Box p={[-3.6, 0.15, -1.7]} s={[0.4, 0.3, 0.3]} c="#8a6a45" />
      </Tappable>

      <Tappable id="park-fountain">
        <Cyl p={[-0.6, 0.18, -3.2]} r={1.3} h={0.36} c="#d8d1c2" />
        <Cyl p={[-0.6, 0.34, -3.2]} r={1.15} h={0.04} c="#4aa3df" />
        <Cyl p={[-0.6, 0.8, -3.2]} r={0.12} h={1.0} c="#e9e4dc" />
        <Cyl p={[-0.6, 1.3, -3.2]} r={0.45} h={0.08} c="#e9e4dc" />
        <mesh position={[-0.6, 1.65, -3.2]}>
          <coneGeometry args={[0.3, 0.7, 12, 1, true]} />
          <meshStandardMaterial color="#9fd8ff" transparent opacity={0.6} />
        </mesh>
      </Tappable>

      <Tappable id="jog-track">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.8, 0.01, -2.6]}>
          <ringGeometry args={[0.9, 1.3, 32]} />
          <meshStandardMaterial color="#b55b3a" />
        </mesh>
        <group position={[3.9, 0, -2.4]}>
          <Person shirt="#e74c3c" trousers="#1b1a22" />
        </group>
        {/* Ice cream bicycle */}
        <group position={[2.0, 0, -1.4]}>
          <Box p={[0, 0.55, 0]} s={[0.6, 0.5, 0.45]} c="#f4f4f4" />
          <Box p={[0, 0.82, 0]} s={[0.62, 0.06, 0.47]} c="#e8336d" />
          {[-0.35, 0.35].map((x) => (
            <mesh key={x} position={[x, 0.2, 0.25]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.18, 0.03, 6, 14]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          ))}
        </group>
      </Tappable>

      <Rank id="park-taxi" color="#1f8a4c" />
      <RoundTree x={-6.6} z={-1.2} s={1.2} />
      <RoundTree x={-2.2} z={-3.8} />
      <RoundTree x={1.2} z={-3.9} s={1.1} c="#2f7d32" />
      <RoundTree x={6.6} z={-1.6} s={1.3} />
      <RoundTree x={-5.6} z={3.2} s={0.9} c="#2f7d32" />
      <RoundTree x={1.6} z={3.3} />
      <Flowers x={-2.0} z={0.4} />
      <Flowers x={0.9} z={0.4} />
      <Flowers x={-5.6} z={0.6} />
      {[-3.0, 2.0].map((x) => (
        <group key={x}>
          <Box p={[x, 0.4, 2.2]} s={[1.2, 0.07, 0.35]} c="#7a5a3c" />
          <Box p={[x, 0.2, 2.2]} s={[1.1, 0.4, 0.05]} c="#555" />
        </group>
      ))}
      <Walkers walkers={PARK_WALKERS} />
    </group>
  );
}

const STADIUM_WALKERS: Walker[] = [
  { from: -6, to: 4, z: 1.2, speed: 0.8, shirt: '#118a4c' },
  { from: 4, to: -6, z: 2.0, speed: 0.9, shirt: '#ffffff' },
  { from: -5, to: 3, z: 2.8, speed: 0.7, shirt: '#118a4c' },
  { from: 2, to: -4, z: 0.6, speed: 0.6, shirt: '#f1c40f', tray: true },
];

/** Moshood Abiola National Stadium: the bowl, the gate and a practice pitch. */
export function Stadium() {
  return (
    <group>
      <Ground color="#7fa856" />
      <Ground color="#cfcac0" size={[16, 5.5]} pos={[0, 0, 1.0]} />

      <Tappable id="stands">
        {/* The bowl: tiers rising behind the gate */}
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[-2.4, 0.6 + k * 0.9, -6]} castShadow>
            <cylinderGeometry args={[4.6 + k * 0.6, 4.4 + k * 0.6, 0.9, 40, 1, true]} />
            <meshStandardMaterial color={k === 2 ? '#118a4c' : '#e9e4dc'} side={2} />
          </mesh>
        ))}
        <mesh position={[-2.4, 3.3, -6]}>
          <torusGeometry args={[5.9, 0.12, 8, 48]} />
          <meshStandardMaterial color="#f4f4f4" />
        </mesh>
        {/* Gate arch */}
        <Box p={[-3.4, 1.3, -2.6]} s={[0.4, 2.6, 0.4]} c="#e9e4dc" />
        <Box p={[-1.4, 1.3, -2.6]} s={[0.4, 2.6, 0.4]} c="#e9e4dc" />
        <Box p={[-2.4, 2.75, -2.6]} s={[2.6, 0.4, 0.45]} c="#118a4c" />
        <Box p={[-2.4, 2.75, -2.37]} s={[2.0, 0.14, 0.02]} c="#f4f4f4" />
        <Flag x={-4.2} z={-2.4} h={3.4} />
        <Flag x={-0.6} z={-2.4} h={3.4} />
      </Tappable>

      <Tappable id="pitch">
        <Box p={[2.8, 0.02, -2.6]} s={[3.2, 0.03, 1.9]} c="#3f9a3c" />
        <Box p={[2.8, 0.04, -2.6]} s={[0.04, 0.01, 1.9]} c="#f4f4f4" />
        {[1.25, 4.35].map((x) => (
          <group key={x}>
            <Box p={[x, 0.4, -2.9]} s={[0.05, 0.8, 0.05]} c="#f4f4f4" />
            <Box p={[x, 0.4, -2.3]} s={[0.05, 0.8, 0.05]} c="#f4f4f4" />
            <Box p={[x, 0.8, -2.6]} s={[0.05, 0.05, 0.65]} c="#f4f4f4" />
          </group>
        ))}
        {[2.2, 3.4].map((x, i) => (
          <group key={x} position={[x, 0, -2.5]} rotation={[0, i ? -1.2 : 1.2, 0]} scale={0.9}>
            <Person shirt={i ? '#e74c3c' : '#2980b9'} trousers="#f4f4f4" />
          </group>
        ))}
        <mesh position={[2.8, 0.12, -2.4]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </Tappable>

      <Rank id="stadium-park" color="#118a4c" />
      <Tree p={[-7.0, 0, -1.2]} />
      <Tree p={[7.0, 0, -1.4]} s={0.9} />
      <Walkers walkers={STADIUM_WALKERS} />
    </group>
  );
}
