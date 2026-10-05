import { Person } from '../Avatar';
import { Box, Cyl, Tappable } from '../Room';
import { Car, Tree, Walkers, type Walker } from '../Street';
import { Flag, Ground } from './common';

/* All five scenes share one layout (see src/content/districts.ts):
   spots at x ≈ -4.2, -0.6, 2.8 along the back, motor park front right. */

function Windows({ xs, ys, z, c = '#7fb3d0', w = 0.55, h = 0.45 }: { xs: number[]; ys: number[]; z: number; c?: string; w?: number; h?: number }) {
  return (
    <>
      {xs.flatMap((x) => ys.map((y) => <Box key={`${x}:${y}`} p={[x, y, z]} s={[w, h, 0.02]} c={c} />))}
    </>
  );
}

/** Bus shelter or taxi rank, front right. */
function Park({ id, color = '#1f8a4c', taxi }: { id: string; color?: string; taxi?: boolean }) {
  return (
    <Tappable id={id}>
      <Box p={[5.0, 0.02, 3.0]} s={[2.8, 0.04, 1.8]} c="#3a3d42" />
      <Box p={[5.0, 2.0, 3.6]} s={[2.2, 0.08, 1.0]} c={color} />
      <Box p={[4.0, 1.0, 3.9]} s={[0.08, 2.0, 0.08]} c="#555" />
      <Box p={[6.0, 1.0, 3.9]} s={[0.08, 2.0, 0.08]} c="#555" />
      <Box p={[5.0, 0.42, 3.8]} s={[1.8, 0.08, 0.35]} c="#7a5a3c" />
      <group position={[5.6, 0, 2.4]}>
        {taxi ? <Car body="#f4f4f4" roof="#f4f4f4" stripe="#1f8a4c" /> : <Bus />}
      </group>
    </Tappable>
  );
}

function Bus({ c = '#f2c230' }: { c?: string }) {
  return (
    <group>
      <Box p={[0, 0.7, 0]} s={[2.6, 1.1, 1.0]} c={c} />
      <Box p={[0, 0.95, 0]} s={[2.62, 0.3, 1.02]} c="#9ad0ec" />
      <Box p={[0, 0.5, 0]} s={[2.62, 0.08, 1.02]} c="#222" />
      {[[-0.85, 0.5], [0.85, 0.5], [-0.85, -0.5], [0.85, -0.5]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.18, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
    </group>
  );
}

/** Station canopy with two pumps, front left. `queue` lines cars up. */
function FillingStation({ canopy, queue }: { canopy: string; queue?: boolean }) {
  return (
    <group position={[-4.6, 0, 3.0]}>
      <Box p={[0, 0.02, 0]} s={[3.0, 0.04, 1.8]} c="#4a4d52" />
      {[-0.9, 0.9].map((x) => (
        <Box key={x} p={[x, 1.1, 0]} s={[0.12, 2.2, 0.12]} c="#ddd" />
      ))}
      <Box p={[0, 2.25, 0]} s={[3.0, 0.18, 1.6]} c={canopy} />
      <Box p={[0, 2.25, 0.81]} s={[2.4, 0.12, 0.02]} c="#f4f4f4" />
      {[-0.4, 0.4].map((x) => (
        <group key={x} position={[x, 0, -0.1]}>
          <Box p={[0, 0.45, 0]} s={[0.3, 0.9, 0.25]} c="#f4f4f4" />
          <Box p={[0, 0.7, 0.13]} s={[0.2, 0.15, 0.02]} c="#222" />
        </group>
      ))}
      {queue &&
        [0, 1, 2].map((i) => (
          <group key={i} position={[1.8 + i * 2.1, 0, 0.1]} rotation={[0, 0, 0]} scale={0.9}>
            <Car body={['#b9bcc2', '#8b1e3f', '#20232a'][i]} roof={['#b9bcc2', '#8b1e3f', '#20232a'][i]} />
          </group>
        ))}
    </group>
  );
}

function Umbrella({ x, z, c }: { x: number; z: number; c: string }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 0.9, 0]} r={0.03} h={1.8} c="#666" />
      <mesh position={[0, 1.8, 0]}>
        <coneGeometry args={[0.8, 0.35, 8]} />
        <meshStandardMaterial color={c} />
      </mesh>
    </group>
  );
}

function Stall({ x, z, c }: { x: number; z: number; c: string }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.45, 0]} s={[1.0, 0.9, 0.6]} c="#8a6a45" />
      <Box p={[0, 0.95, 0]} s={[1.0, 0.1, 0.6]} c={c} />
      <Box p={[0, 1.6, 0]} s={[1.2, 0.06, 0.8]} c={c} />
      <Box p={[-0.55, 1.25, -0.35]} s={[0.05, 0.7, 0.05]} c="#5a4632" />
      <Box p={[0.55, 1.25, -0.35]} s={[0.05, 0.7, 0.05]} c="#5a4632" />
    </group>
  );
}

// ---------------- Maitama ----------------
const MAITAMA_WALKERS: Walker[] = [
  { from: -6, to: 4, z: 1.4, speed: 0.4, shirt: '#2c3e50' },
  { from: 3, to: -5, z: 2.4, speed: 0.35, shirt: '#ecf0f1' },
];

export function Maitama() {
  return (
    <group>
      <Ground color="#6f9e4f" />
      <Ground color="#e3ded3" size={[15, 6]} pos={[0, 0, 0.6]} />

      {/* Embassy behind its fence */}
      <Tappable id="embassy">
        <Box p={[-4.2, 1.5, -4.4]} s={[3.2, 3.0, 2.6]} c="#f4f1ec" />
        <Box p={[-4.2, 3.05, -4.4]} s={[3.4, 0.12, 2.8]} c="#2c3e50" />
        <Windows xs={[-5.2, -3.2]} ys={[1.0, 2.2]} z={-3.08} />
        <Box p={[-4.2, 0.8, -3.08]} s={[0.8, 1.6, 0.04]} c="#5b4636" />
        <Box p={[-4.2, 0.6, -2.4]} s={[3.2, 1.2, 0.05]} c="#2b2b2b" />
        <Flag x={-5.6} z={-2.8} h={3.4} />
        {[0, 1, 2].map((i) => (
          <group key={i} position={[-3.4 + i * 0.5, 0, -1.9]} scale={0.88}>
            <Person shirt={['#16a085', '#c0392b', '#2c3e50'][i]} trousers="#2d2d2d" />
          </group>
        ))}
      </Tappable>

      {/* Glass restaurant */}
      <Tappable id="finedine">
        <Box p={[-0.6, 1.2, -4.0]} s={[2.8, 2.4, 2.2]} c="#cfe3ee" />
        <Box p={[-0.6, 2.45, -4.0]} s={[3.0, 0.1, 2.4]} c="#c9a24a" />
        <Box p={[-0.6, 2.1, -2.88]} s={[2.0, 0.3, 0.04]} c="#1b1a22" />
        {[-1.4, 0.2].map((x) => (
          <group key={x}>
            <Cyl p={[x, 0.42, -2.3]} r={0.35} h={0.05} c="#fff" />
            <Cyl p={[x, 0.2, -2.3]} r={0.04} h={0.4} c="#888" />
          </group>
        ))}
        <Umbrella x={-0.6} z={-2.3} c="#f4f1ec" />
      </Tappable>

      {/* Mansion with big gate */}
      <Tappable id="villa-gate">
        <Box p={[2.8, 1.4, -5.0]} s={[3.4, 2.8, 2.4]} c="#efe9df" />
        <mesh position={[2.8, 3.1, -5.0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[2.6, 0.9, 4]} />
          <meshStandardMaterial color="#8a3b2b" />
        </mesh>
        <Box p={[1.6, 0.9, -2.5]} s={[0.4, 1.8, 0.4]} c="#d8cfc0" />
        <Box p={[4.0, 0.9, -2.5]} s={[0.4, 1.8, 0.4]} c="#d8cfc0" />
        <Box p={[2.8, 0.8, -2.5]} s={[2.0, 1.5, 0.08]} c="#1b1a22" />
        <group position={[3.6, 0, -2.0]}>
          <Person shirt="#34495e" trousers="#1b1a22" />
        </group>
      </Tappable>

      <Park id="maitama-park" taxi />
      <Tappable id="maitama-fuel">
        <FillingStation canopy="#c0392b" />
      </Tappable>
      <Tree p={[-7.0, 0, -1.4]} />
      <Tree p={[6.8, 0, -1.6]} s={1.1} />
      <Tree p={[0.8, 0, 3.3]} s={0.8} />
      <Walkers walkers={MAITAMA_WALKERS} />
    </group>
  );
}

// ---------------- Asokoro ----------------
const ASOKORO_WALKERS: Walker[] = [
  { from: -5, to: 5, z: 1.6, speed: 0.4, shirt: '#ecf0f1' },
  { from: 4, to: -3, z: 2.6, speed: 0.5, shirt: '#118a4c' },
];

export function Asokoro() {
  return (
    <group>
      <Ground color="#7aa55a" />
      <Ground color="#d9d4c7" size={[15, 5]} pos={[0, 0, 1.2]} />

      <Tappable id="golf">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.4, 0.01, -3.6]}>
          <circleGeometry args={[2.2, 24]} />
          <meshStandardMaterial color="#4f9a3f" />
        </mesh>
        <Cyl p={[-4.0, 0.7, -3.8]} r={0.02} h={1.4} c="#ddd" />
        <Box p={[-3.85, 1.3, -3.8]} s={[0.3, 0.2, 0.02]} c="#d63c3c" />
        <group position={[-5.0, 0, -2.6]}>
          <Person shirt="#f4f4f4" trousers="#c9a24a" />
        </group>
        {/* Golf cart */}
        <group position={[-3.2, 0, -1.9]}>
          <Box p={[0, 0.35, 0]} s={[1.0, 0.3, 0.6]} c="#f4f4f4" />
          <Box p={[0, 0.9, 0]} s={[1.0, 0.05, 0.6]} c="#118a4c" />
        </group>
      </Tappable>

      <Tappable id="agency">
        <Box p={[-0.6, 2.0, -4.6]} s={[3.0, 4.0, 2.4]} c="#ddd5c4" />
        <Windows xs={[-1.6, -0.6, 0.4]} ys={[1.2, 2.2, 3.2]} z={-3.38} c="#4a6d82" w={0.6} h={0.55} />
        <Box p={[-0.6, 0.6, -3.38]} s={[1.0, 1.2, 0.04]} c="#5b4636" />
        <Box p={[-0.6, 4.1, -3.4]} s={[2.4, 0.3, 0.04]} c="#118a4c" />
        <Flag x={1.3} z={-3.0} h={3.8} />
        {/* Black convoy SUV */}
        <group position={[-0.6, 0, -2.0]}>
          <Car body="#111" roof="#111" />
        </group>
      </Tappable>

      <Tappable id="aso-suya">
        <Box p={[2.8, 0.5, -2.4]} s={[1.2, 1.0, 0.6]} c="#6b4a2f" />
        <Box p={[2.8, 1.05, -2.4]} s={[1.0, 0.06, 0.5]} c="#333" />
        <mesh position={[2.8, 1.2, -2.4]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#ff7a2f" emissive="#ff5a00" emissiveIntensity={0.8} />
        </mesh>
        <group position={[2.8, 0, -3.0]}>
          <Person shirt="#ecf0f1" trousers="#ecf0f1" />
        </group>
      </Tappable>

      {/* Villas behind walls */}
      <Box p={[4.8, 1.0, -4.6]} s={[2.6, 2.0, 2.0]} c="#f4f1ec" />
      <Box p={[4.8, 0.7, -3.4]} s={[3.0, 1.4, 0.15]} c="#c9b99a" />

      <Park id="asokoro-park" />
      <Tree p={[-7.0, 0, -0.8]} s={1.1} />
      <Tree p={[6.9, 0, -1.4]} />
      <Tree p={[1.2, 0, 3.4]} s={0.8} />
      <Walkers walkers={ASOKORO_WALKERS} />
    </group>
  );
}

// ---------------- Garki Area 1 ----------------
const GARKI_WALKERS: Walker[] = [
  { from: -6, to: 6, z: 0.6, speed: 0.6, shirt: '#e67e22', tray: true },
  { from: 5, to: -5, z: 1.6, speed: 0.7, shirt: '#8e44ad' },
  { from: -3, to: 4, z: 2.6, speed: 0.5, shirt: '#27ae60' },
];

export function Garki() {
  return (
    <group>
      <Ground color="#b9a27c" />
      <Ground color="#c9c0a8" size={[15, 6]} pos={[0, 0, 0.6]} />

      <Tappable id="area1">
        <Box p={[-4.2, 1.2, -4.6]} s={[3.6, 2.4, 1.6]} c="#e2c48f" />
        <Stall x={-5.2} z={-2.6} c="#e74c3c" />
        <Stall x={-3.9} z={-2.6} c="#27ae60" />
        <Stall x={-2.6} z={-2.6} c="#2980b9" />
        {[[-5.2, '#f39c12'], [-3.9, '#c0392b']].map(([x, c]) => (
          <mesh key={x as number} position={[x as number, 1.05, -2.6]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color={c as string} />
          </mesh>
        ))}
      </Tappable>

      <Tappable id="pos-stand">
        <Umbrella x={-0.6} z={-2.2} c="#f2c230" />
        <Box p={[-0.6, 0.4, -2.2]} s={[0.9, 0.8, 0.5]} c="#1f6fb2" />
        <Box p={[-0.6, 0.85, -2.2]} s={[0.25, 0.1, 0.15]} c="#222" />
        <group position={[-0.6, 0, -2.8]}>
          <Person shirt="#f2c230" trousers="#2d2d2d" />
        </group>
      </Tappable>

      <Tappable id="mechanic">
        <Box p={[2.8, 1.0, -4.4]} s={[3.0, 2.0, 1.6]} c="#6d6a64" />
        <Box p={[2.8, 2.05, -4.4]} s={[3.2, 0.1, 1.8]} c="#8a3b2b" />
        {/* Car on jack with bonnet open */}
        <group position={[2.8, 0.15, -2.4]} rotation={[0, 0, 0.06]}>
          <Car body="#2e6fa8" roof="#2e6fa8" />
        </group>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[4.4, 0.2, -2.0 - i * 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.08, 6, 12]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
      </Tappable>

      <Park id="garki-park" color="#c0392b" />
      <Tappable id="nnpc">
        <FillingStation canopy="#118a4c" queue />
      </Tappable>
      <Tree p={[-7.0, 0, -1.6]} />
      <Tree p={[6.9, 0, -1.2]} s={0.9} />
      <Walkers walkers={GARKI_WALKERS} />
    </group>
  );
}

// ---------------- Nyanya ----------------
const NYANYA_WALKERS: Walker[] = [
  { from: -6, to: 6, z: 0.8, speed: 0.8, shirt: '#c0392b' },
  { from: 5, to: -6, z: 1.8, speed: 0.9, shirt: '#2980b9' },
  { from: -4, to: 3, z: 2.8, speed: 0.6, shirt: '#f1c40f', tray: true },
  { from: 2, to: -2, z: 0.2, speed: 0.5, shirt: '#16a085' },
];

export function Nyanya() {
  return (
    <group>
      <Ground color="#b58d5c" />
      <Ground color="#9c8f7a" size={[16, 6]} pos={[0, 0, 0.8]} />

      <Tappable id="nyanya-mamaput">
        <Box p={[-4.2, 0.9, -4.0]} s={[2.4, 1.8, 1.6]} c="#d8c7a4" />
        <Box p={[-4.2, 1.85, -4.0]} s={[2.6, 0.08, 1.8]} c="#7a7a7a" />
        <Box p={[-4.2, 0.4, -2.6]} s={[2.0, 0.08, 0.6]} c="#8a6a45" />
        {[-4.8, -3.6].map((x) => (
          <Cyl key={x} p={[x, 0.55, -2.6]} r={0.18} h={0.25} c="#c0392b" />
        ))}
        <group position={[-4.2, 0, -3.2]}>
          <Person shirt="#e67e22" trousers="#e67e22" />
        </group>
      </Tappable>

      <Tappable id="nyanya-barber">
        <Box p={[-0.6, 1.0, -4.0]} s={[2.0, 2.0, 1.6]} c="#2e6fa8" />
        <Box p={[-0.6, 1.7, -3.18]} s={[1.6, 0.35, 0.04]} c="#f4f4f4" />
        <Cyl p={[0.6, 0.8, -3.0]} r={0.08} h={1.6} c="#d63c3c" />
        <Box p={[-0.6, 0.7, -3.18]} s={[0.7, 1.3, 0.04]} c="#1b1a22" />
      </Tappable>

      <Tappable id="crusade">
        <Box p={[2.8, 0.3, -3.6]} s={[3.2, 0.6, 1.8]} c="#7a5a3c" />
        <Box p={[2.8, 2.4, -3.8]} s={[3.4, 0.1, 2.2]} c="#f4f4f4" />
        {[1.2, 4.4].map((x) => (
          <Box key={x} p={[x, 1.4, -3.8]} s={[0.08, 2.0, 0.08]} c="#999" />
        ))}
        <Box p={[2.8, 1.9, -2.7]} s={[2.6, 0.35, 0.04]} c="#8e44ad" />
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} p={[1.6 + i * 0.8, 0.25, -1.8]} s={[0.6, 0.5, 0.4]} c="#d0d0d0" />
        ))}
      </Tappable>

      <Park id="nyanya-park" color="#2980b9" />
      <group position={[-4.6, 0, 3.0]}>
        <Bus />
      </group>
      <Tappable id="jerrycan">
        <group position={[-1.6, 0, 3.0]}>
          {[-0.5, -0.1, 0.3].map((x, i) => (
            <Box key={x} p={[x, 0.3, i % 2 ? 0.2 : -0.1]} s={[0.35, 0.6, 0.25]} c={['#f2c230', '#2e6fa8', '#27ae60'][i]} />
          ))}
          <Cyl p={[0.6, 0.02, 0.4]} r={0.6} h={0.02} c="#3b2a1a" />
          <group position={[0.8, 0, -0.2]}>
            <Person shirt="#7f8c8d" trousers="#2d2d2d" />
          </group>
        </group>
      </Tappable>
      <Tree p={[-7.0, 0, -1.4]} s={0.9} />
      <Walkers walkers={NYANYA_WALKERS} />
    </group>
  );
}

// ---------------- Airport ----------------
const AIRPORT_WALKERS: Walker[] = [
  { from: -6, to: 2, z: 0.6, speed: 0.5, shirt: '#2c3e50' },
  { from: 2, to: -6, z: 1.4, speed: 0.45, shirt: '#d35400' },
];

function Plane() {
  return (
    <group position={[2.0, 1.2, -7.5]} rotation={[0, 0.3, 0.12]}>
      <Box p={[0, 0, 0]} s={[4.0, 0.5, 0.5]} c="#f4f4f4" />
      <Box p={[0, 0, 0]} s={[1.0, 0.06, 4.0]} c="#dfe6ea" />
      <Box p={[-1.8, 0.4, 0]} s={[0.5, 0.7, 0.06]} c="#118a4c" />
    </group>
  );
}

export function Airport() {
  return (
    <group>
      <Ground color="#7fa856" />
      <Ground color="#cfd2d6" size={[16, 6]} pos={[0, 0, 0.6]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.01, -8]}>
        <planeGeometry args={[30, 3]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <Plane />

      {/* Terminal */}
      <Box p={[-2.4, 1.6, -4.6]} s={[7.6, 3.2, 2.6]} c="#dfe6ea" />
      <Box p={[-2.4, 3.3, -4.6]} s={[8.0, 0.2, 3.0]} c="#118a4c" />
      <Box p={[-2.4, 1.6, -3.28]} s={[7.0, 2.4, 0.03]} c="#8fc6e8" />

      <Tappable id="terminal">
        <Box p={[-4.2, 2.9, -3.24]} s={[2.4, 0.4, 0.04]} c="#f2c230" />
        <group position={[-4.6, 0, -2.4]}>
          <Person shirt="#2c3e50" trousers="#2c3e50" />
        </group>
        <Box p={[-3.8, 0.3, -2.3]} s={[0.4, 0.6, 0.3]} c="#c0392b" />
        <Box p={[-3.3, 0.25, -2.3]} s={[0.35, 0.5, 0.25]} c="#2980b9" />
      </Tappable>

      <Tappable id="airport-cafe">
        <Box p={[-0.6, 2.9, -3.24]} s={[1.8, 0.4, 0.04]} c="#6b4a2f" />
        <Box p={[-0.6, 0.5, -2.6]} s={[1.6, 1.0, 0.5]} c="#6b4a2f" />
        <Cyl p={[-0.6, 1.1, -2.6]} r={0.08} h={0.2} c="#fff" />
      </Tappable>

      <Box p={[3.4, 1.0, -3.6]} s={[0.4, 2.0, 0.4]} c="#a7c7db" />
      <Box p={[3.4, 2.4, -3.6]} s={[1.0, 0.8, 1.0]} c="#4a6d82" />

      <Tappable id="airport-rank">
        <Box p={[5.0, 0.02, 3.0]} s={[2.8, 0.04, 1.8]} c="#3a3d42" />
        <Box p={[5.0, 2.0, 3.6]} s={[2.2, 0.08, 1.0]} c="#118a4c" />
        <Box p={[4.0, 1.0, 3.9]} s={[0.08, 2.0, 0.08]} c="#555" />
        <Box p={[6.0, 1.0, 3.9]} s={[0.08, 2.0, 0.08]} c="#555" />
        <group position={[5.6, 0, 2.4]}>
          <Car body="#2e6fa8" roof="#2e6fa8" stripe="#f4f4f4" />
        </group>
      </Tappable>

      {[[-5.6, '#f4f4f4'], [-3.4, '#20232a'], [-1.2, '#8b1e3f']].map(([x, c]) => (
        <group key={x as number} position={[x as number, 0, 3.0]}>
          <Car body={c as string} roof={c as string} />
        </group>
      ))}
      <Tree p={[-7.0, 0, -1.4]} />
      <Tree p={[7.0, 0, -1.4]} s={0.9} />
      <Walkers walkers={AIRPORT_WALKERS} />
    </group>
  );
}

// ---------------- Utako ----------------
const UTAKO_WALKERS: Walker[] = [
  { from: -6, to: 5, z: 0.8, speed: 0.7, shirt: '#2c3e50' },
  { from: 4, to: -6, z: 1.8, speed: 0.8, shirt: '#e67e22', tray: true },
  { from: -3, to: 3, z: 2.7, speed: 0.5, shirt: '#16a085' },
];

export function Utako() {
  return (
    <group>
      <Ground color="#a99a7c" />
      <Ground color="#9c9483" size={[16, 6]} pos={[0, 0, 0.8]} />

      <Tappable id="utako-market">
        <Box p={[-4.2, 1.1, -4.4]} s={[3.2, 2.2, 1.8]} c="#d8d1c2" />
        <Box p={[-4.2, 2.25, -4.4]} s={[3.4, 0.1, 2.0]} c="#2980b9" />
        <Stall x={-5.0} z={-2.6} c="#2980b9" />
        <Stall x={-3.6} z={-2.6} c="#8e44ad" />
        {[-5.2, -4.9, -3.8, -3.4].map((x, i) => (
          <Box key={x} p={[x, 1.02, -2.6]} s={[0.18, 0.12, 0.28]} c={i % 2 ? '#111' : '#7f8c8d'} />
        ))}
      </Tappable>

      <Tappable id="hub">
        <Box p={[-0.6, 1.6, -4.6]} s={[2.8, 3.2, 2.2]} c="#cfe3ee" />
        <Windows xs={[-1.4, -0.6, 0.2]} ys={[1.2, 2.2]} z={-3.48} c="#1f6fb2" w={0.6} h={0.55} />
        <Box p={[-0.6, 3.0, -3.47]} s={[2.2, 0.35, 0.04]} c="#1b1a22" />
        <Box p={[-0.6, 3.0, -3.45]} s={[1.6, 0.12, 0.02]} c="#3dd6ff" />
        <Box p={[-0.6, 0.6, -3.48]} s={[0.9, 1.2, 0.04]} c="#5b4636" />
      </Tappable>

      <Tappable id="utako-food">
        <Box p={[2.8, 0.45, -2.4]} s={[1.2, 0.9, 0.6]} c="#6b4a2f" />
        <Box p={[2.8, 0.95, -2.4]} s={[1.0, 0.06, 0.5]} c="#333" />
        {[2.5, 2.8, 3.1].map((x) => (
          <mesh key={x} position={[x, 1.05, -2.4]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
            <meshStandardMaterial color="#e2a531" />
          </mesh>
        ))}
        <group position={[2.8, 0, -3.0]}>
          <Person shirt="#c0392b" trousers="#2d2d2d" />
        </group>
      </Tappable>

      <Tappable id="utako-park">
        <Box p={[5.0, 0.02, 3.0]} s={[2.8, 0.04, 1.8]} c="#3a3d42" />
        <Box p={[5.0, 2.0, 3.6]} s={[2.2, 0.08, 1.0]} c="#c0392b" />
        <Box p={[4.0, 1.0, 3.9]} s={[0.08, 2.0, 0.08]} c="#555" />
        <Box p={[6.0, 1.0, 3.9]} s={[0.08, 2.0, 0.08]} c="#555" />
        <group position={[5.6, 0, 2.4]}>
          <Bus c="#f4f4f4" />
        </group>
      </Tappable>
      {/* Luxury interstate coaches */}
      {[-4.6, -1.6].map((x, i) => (
        <group key={x} position={[x, 0, 3.0]} scale={[1.2, 1.15, 1]}>
          <Bus c={i ? '#118a4c' : '#1f6fb2'} />
        </group>
      ))}
      <Tree p={[-7.0, 0, -1.4]} />
      <Walkers walkers={UTAKO_WALKERS} />
    </group>
  );
}

// ---------------- Mararaba ----------------
const MARARABA_WALKERS: Walker[] = [
  { from: -6, to: 6, z: 0.6, speed: 0.8, shirt: '#f1c40f', tray: true },
  { from: 5, to: -5, z: 1.6, speed: 0.9, shirt: '#8e44ad' },
  { from: -4, to: 4, z: 2.6, speed: 0.7, shirt: '#c0392b' },
  { from: 2, to: -3, z: 0.1, speed: 0.6, shirt: '#27ae60', tray: true },
];

function Okada({ x, z, c }: { x: number; z: number; c: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
      <Box p={[0, 0.45, 0]} s={[0.9, 0.2, 0.2]} c={c} />
      <Box p={[-0.1, 0.62, 0]} s={[0.4, 0.1, 0.22]} c="#111" />
      {[-0.38, 0.38].map((dx) => (
        <mesh key={dx} position={[dx, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.05, 6, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
    </group>
  );
}

export function Mararaba() {
  return (
    <group>
      <Ground color="#b58d5c" />
      <Ground color="#a08664" size={[16, 6]} pos={[0, 0, 0.8]} />

      <Tappable id="mararaba-market">
        <Stall x={-5.4} z={-2.7} c="#e74c3c" />
        <Stall x={-4.2} z={-2.7} c="#f39c12" />
        <Stall x={-3.0} z={-2.7} c="#27ae60" />
        {[-5.4, -4.2, -3.0].map((x, i) => (
          <mesh key={x} position={[x, 1.05, -2.7]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color={['#c0392b', '#f1c40f', '#2ecc71'][i]} />
          </mesh>
        ))}
        <Box p={[-4.2, 1.0, -4.3]} s={[3.6, 2.0, 1.4]} c="#cbb994" />
      </Tappable>

      <Tappable id="peppersoup">
        <Box p={[-0.6, 0.9, -4.0]} s={[2.2, 1.8, 1.6]} c="#d8c7a4" />
        <Box p={[-0.6, 1.85, -4.0]} s={[2.4, 0.08, 1.8]} c="#7a7a7a" />
        <Box p={[-0.6, 1.4, -3.18]} s={[1.8, 0.3, 0.04]} c="#c0392b" />
        {[-1.2, 0.0].map((x) => (
          <group key={x}>
            <Cyl p={[x, 0.4, -2.4]} r={0.3} h={0.05} c="#e0e0e0" />
            <Cyl p={[x, 0.2, -2.4]} r={0.04} h={0.4} c="#888" />
            <Cyl p={[x, 0.48, -2.4]} r={0.1} h={0.1} c="#8b2e16" />
          </group>
        ))}
      </Tappable>

      <Tappable id="okada-stand">
        <Okada x={2.4} z={-2.4} c="#c0392b" />
        <Okada x={3.2} z={-2.4} c="#1f6fb2" />
        <group position={[2.8, 0, -3.0]}>
          <Person shirt="#2c3e50" trousers="#2d2d2d" />
        </group>
      </Tappable>

      <Park id="mararaba-park" color="#e67e22" />
      {/* "Welcome to Nasarawa State" sign */}
      <group position={[-1.6, 0, 3.4]}>
        <Box p={[-0.8, 0.8, 0]} s={[0.08, 1.6, 0.08]} c="#555" />
        <Box p={[0.8, 0.8, 0]} s={[0.08, 1.6, 0.08]} c="#555" />
        <Box p={[0, 1.65, 0]} s={[2.0, 0.5, 0.06]} c="#118a4c" />
        <Box p={[0, 1.65, 0.035]} s={[1.7, 0.12, 0.01]} c="#f4f4f4" />
      </group>
      <Tree p={[-7.0, 0, -1.4]} s={0.9} />
      <Tree p={[6.9, 0, -1.2]} />
      <Walkers walkers={MARARABA_WALKERS} />
    </group>
  );
}
