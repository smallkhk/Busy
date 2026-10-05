import type { ThreeEvent } from '@react-three/fiber';
import { carById } from '../content/cars';
import { daylight, clockParts } from '../engine/clock';
import { useGame } from '../store/game';
import { CarModel } from './CarModel';
import { Box, Cyl, Tappable, type V3 } from './Room';
import { At, Shell } from './Spread';
import { Art, carpet, Chair, concrete, Floor, GOLD, marble, paint, Plant, RED, Sconce, TRIM, WOOD } from './Interior';

/** Big-money house for Maitama, Asokoro and Guzape: many rooms, marble, and toys. */

const WALL = '#a9bdb0';
const WALL_IN = '#c9d6cc';

function DiningTable({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.72, 0]} r={0.5} h={0.05} c={WOOD} />
      <Cyl p={[0, 0.36, 0]} r={0.07} h={0.72} c="#3a2a1c" />
      <Cyl p={[0, 0.02, 0]} r={0.28} h={0.04} c="#3a2a1c" />
      <Plant p={[0, 0.75, 0]} s={0.35} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return <Chair key={i} p={[Math.sin(a) * 0.8, 0, Math.cos(a) * 0.8]} rotY={a + Math.PI} />;
      })}
    </group>
  );
}

// ---------------- The house ----------------

export function Mansion({ onFloor }: { onFloor: (e: ThreeEvent<MouseEvent>) => void }) {
  const car = useGame((s) => s.car);
  const ups = useGame((s) => s.homeUps ?? []);
  const night = useGame((s) => daylight(clockParts(Math.floor(s.time / 10) * 10).minuteOfDay) < 0.35);
  // Big man house get gen and inverter: light no dey go
  const lit = night;
  const c = car ? carById(car.id) : undefined;

  const darkMarble = paint('dark-marble', marble('#1f2126', '#9aa0aa', '#0d0e10'));
  const whiteTile = paint('white-tile', marble('#e9eaee', '#b9bcc4', '#c7c9cf'));
  const red = paint('red-carpet', carpet);
  const slab = paint('garage', concrete);

  return (
    <group>
      <Shell>
      {/* ---------- Floors ---------- */}
      <Floor x0={-8.6} z0={-3} x1={4} z1={2.9} tex={darkMarble} onFloor={onFloor} />
      <Floor x0={-1.3} z0={-3} x1={4} z1={-0.8} tex={whiteTile} y={0.006} tile={1.6} onFloor={onFloor} />
      <Floor x0={2.1} z0={-0.6} x1={4} z1={1.0} tex={whiteTile} y={0.006} tile={1.6} onFloor={onFloor} />
      <Floor x0={-8.4} z0={-2.8} x1={-4.5} z1={0.1} tex={red} y={0.008} tile={3.9} rough={0.9} onFloor={onFloor} />
      <Floor x0={-8.6} z0={0.4} x1={-4.2} z1={2.9} tex={slab} y={0.008} tile={2.2} rough={0.9} onFloor={onFloor} />
      {/* Bedroom rug and the round living-room rug */}
      <Floor x0={-4.0} z0={-2.2} x1={-1.6} z1={-0.5} tex={red} y={0.01} tile={2.4} rough={0.9} onFloor={onFloor} />
      {/* ---------- Outer walls (back and side), full height ---------- */}
      <Box p={[-2.3, 1.3, -3.05]} s={[12.7, 2.6, 0.12]} c={WALL} />
      <Box p={[-8.66, 1.3, -0.05]} s={[0.12, 2.6, 6.1]} c={WALL} />
      <Box p={[-2.3, 0.08, -2.98]} s={[12.7, 0.16, 0.03]} c={TRIM} />
      <Box p={[-8.59, 0.08, -0.05]} s={[0.03, 0.16, 6.1]} c={TRIM} />
      {/* Front edge is cut away (dollhouse view); a low kerb shows the line */}
      <Box p={[-2.3, 0.05, 2.92]} s={[12.7, 0.1, 0.08]} c={TRIM} />
      <Box p={[4.0, 0.05, -1.2]} s={[0.08, 0.1, 3.6]} c={TRIM} />

      {/* ---------- Inside walls, cut low so you see every room ---------- */}
      {/* Bedroom front (door gap by the bed) and kitchen side */}
      <Box p={[-3.2, 0.6, -0.2]} s={[1.6, 1.2, 0.1]} c={WALL_IN} />
      <Box p={[-1.3, 0.6, -2.0]} s={[0.1, 1.2, 2.0]} c={WALL_IN} />
      {/* Bathroom glass wall */}
      <mesh position={[2.0, 0.9, -2.15]}>
        <boxGeometry args={[0.05, 1.8, 1.7]} />
        <meshStandardMaterial color="#bfe6f2" transparent opacity={0.35} roughness={0.1} />
      </mesh>
      <Box p={[3.3, 0.6, -0.8]} s={[1.4, 1.2, 0.1]} c={WALL_IN} />
      {/* West wing divider with the TV feature wall in the middle */}
      <Box p={[-4.2, 0.6, -1.6]} s={[0.1, 1.2, 2.8]} c={WALL_IN} />
      <Box p={[-4.2, 0.6, 2.6]} s={[0.1, 1.2, 0.6]} c={WALL_IN} />
      {/* Dining / garage divider (door in the middle) */}
      <Box p={[-7.6, 0.6, 0.3]} s={[2.0, 1.2, 0.1]} c={WALL_IN} />
      <Box p={[-4.75, 0.6, 0.3]} s={[1.0, 1.2, 0.1]} c={WALL_IN} />

      {/* ---------- Wall lights and art ---------- */}
      {[-7.6, -5.2, -3.4, -0.2, 1.6, 3.4].map((x) => <Sconce key={x} p={[x, 1.9, -2.96]} lit={lit} />)}
      {[-2.0, 1.6].map((z) => <Sconce key={z} p={[-8.57, 1.9, z]} rotY={Math.PI / 2} lit={lit} />)}
      <Art p={[-6.4, 1.55, -2.96]} w={1.6} h={0.9} c1="#e8b04b" c2="#8b1e3f" />
      <Art p={[-2.9, 1.75, -2.96]} w={1.0} h={0.6} c1="#2f6b4a" c2="#e8e2d0" />
      <Art p={[-8.57, 1.5, -1.2]} w={0.8} h={1.0} c1="#1f4f7a" c2="#c9a24a" rotY={Math.PI / 2} />

      <Box p={[-8.55, 1.0, 1.65]} s={[0.04, 1.6, 2.2]} c="#8a8f95" />
      {/* Split AC over the bed */}
      <Box p={[-2.9, 2.25, -2.92]} s={[1.0, 0.3, 0.18]} c="#f4f4f4" />
      </Shell>
      <At x={-2.7} z={1.0}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.7, 0.011, 1.0]} receiveShadow onClick={onFloor}>
        <circleGeometry args={[1.1, 40]} />
        <meshStandardMaterial color={GOLD} roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.7, 0.013, 1.0]} receiveShadow onClick={onFloor}>
        <circleGeometry args={[0.95, 40]} />
        <meshStandardMaterial color="#1b1b1f" roughness={0.9} />
      </mesh>
      </At>

      {/* ---------- Master bedroom ---------- */}
      <At id="bed">
      <Tappable id="bed">
        <Box p={[-2.9, 0.18, -1.9]} s={[1.7, 0.36, 2.1]} c="#141518" />
        <Box p={[-2.9, 0.42, -1.85]} s={[1.6, 0.16, 2.0]} c="#f1eee8" />
        <Box p={[-2.9, 0.47, -1.45]} s={[1.62, 0.12, 1.2]} c={RED} />
        <Box p={[-3.25, 0.58, -2.6]} s={[0.6, 0.14, 0.32]} c="#fafafa" />
        <Box p={[-2.55, 0.58, -2.6]} s={[0.6, 0.14, 0.32]} c="#fafafa" />
        <Box p={[-2.9, 0.75, -2.95]} s={[1.9, 1.1, 0.08]} c="#141518" />
        {ups.includes('mattress') && <Box p={[-2.9, 0.53, -1.85]} s={[1.6, 0.06, 2.0]} c="#ece7dd" />}
      </Tappable>
      {[-3.95, -1.6].map((x) => (
        <group key={x}>
          <Box p={[x, 0.25, -2.75]} s={[0.4, 0.5, 0.36]} c={WOOD} />
          <Cyl p={[x, 0.62, -2.75]} r={0.07} h={0.22} c="#d9c7a3" />
          <mesh position={[x, 0.8, -2.75]}>
            <cylinderGeometry args={[0.1, 0.14, 0.16, 16]} />
            <meshStandardMaterial color="#fff1cf" emissive="#ffc46b" emissiveIntensity={lit ? 1.6 : 0.1} />
          </mesh>
        </group>
      ))}
      </At>

      {/* ---------- Kitchen ---------- */}
      <At id="cooler">
      <Tappable id="cooler">
        {/* Double-door fridge */}
        <Box p={[-0.75, 0.95, -2.65]} s={[0.95, 1.9, 0.62]} c="#c9ced3" />
        <Box p={[-0.75, 0.95, -2.33]} s={[0.02, 1.8, 0.02]} c="#7d8389" />
        <Box p={[-0.82, 1.2, -2.32]} s={[0.03, 0.5, 0.03]} c="#7d8389" />
        <Box p={[-0.68, 1.2, -2.32]} s={[0.03, 0.5, 0.03]} c="#7d8389" />
      </Tappable>
      </At>
      <At id="stove">
      <Tappable id="stove">
        {/* Counter run with cooktop, oven and wall cabinets */}
        <Box p={[0.85, 0.44, -2.68]} s={[2.1, 0.88, 0.6]} c="#d8b98f" />
        <Box p={[0.85, 0.9, -2.68]} s={[2.14, 0.05, 0.64]} c="#1c1c1e" />
        {[0.15, 0.85, 1.55].map((x) => <Box key={x} p={[x, 0.5, -2.37]} s={[0.6, 0.7, 0.02]} c="#caa77a" />)}
        <Box p={[0.85, 0.5, -2.36]} s={[0.6, 0.5, 0.02]} c="#222" />
        <Box p={[0.85, 0.93, -2.68]} s={[0.6, 0.02, 0.45]} c="#0d0d0d" />
        {[0.7, 1.0].map((x) => <Cyl key={x} p={[x, 0.95, -2.68]} r={0.08} h={0.01} c="#444" />)}
        <Box p={[0.85, 1.85, -2.8]} s={[2.1, 0.6, 0.35]} c="#e9dcc7" />
        <Box p={[0.85, 1.45, -2.78]} s={[0.7, 0.3, 0.4]} c="#9aa0a6" />
        <Cyl p={[1.5, 1.0, -2.7]} r={0.09} h={0.18} c="#b5b5b5" />
      </Tappable>
      </At>
      {/* Kitchen island with stools */}
      <At x={0.6} z={-1.15}>
      <Box p={[0.6, 0.45, -1.15]} s={[1.4, 0.9, 0.5]} c="#f2f2f2" />
      <Box p={[0.6, 0.92, -1.15]} s={[1.5, 0.05, 0.6]} c="#1c1c1e" />
      {[0.2, 1.0].map((x) => <Cyl key={x} p={[x, 0.32, -0.62]} r={0.14} h={0.64} c="#2b2b2b" />)}
      </At>

      {/* ---------- Bathroom ---------- */}
      <At id="bucket">
      <Tappable id="bucket">
        {/* Glass shower */}
        <Box p={[2.45, 0.04, -2.6]} s={[0.8, 0.08, 0.7]} c="#f4f4f4" />
        <mesh position={[2.45, 1.0, -2.24]}>
          <boxGeometry args={[0.8, 1.9, 0.03]} />
          <meshStandardMaterial color="#cdeefa" transparent opacity={0.35} roughness={0.05} />
        </mesh>
        <Cyl p={[2.45, 1.95, -2.85]} r={0.1} h={0.03} c="#c0c0c0" />
      </Tappable>
      </At>
      <At x={3.05} z={-3}>
      <Box p={[3.05, 0.42, -2.78]} s={[0.5, 0.84, 0.4]} c={WOOD} />
      <Box p={[3.05, 0.86, -2.78]} s={[0.52, 0.05, 0.42]} c="#f4f4f4" />
      <Box p={[3.05, 1.4, -2.97]} s={[0.45, 0.6, 0.02]} c="#cfe6ee" />
      </At>
      <At id="toilet">
      <Tappable id="toilet">
        <Box p={[3.6, 0.22, -2.55]} s={[0.4, 0.44, 0.55]} c="#f8f8f8" />
        <Box p={[3.6, 0.6, -2.85]} s={[0.45, 0.45, 0.2]} c="#f8f8f8" />
      </Tappable>
      </At>
      {/* Jacuzzi corner */}
      <At id="jacuzzi">
      <Tappable id="jacuzzi">
        <group position={[3.05, 0, 0.2]}>
          <Cyl p={[0, 0.25, 0]} r={0.75} h={0.5} c="#f4f4f4" />
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.62, 0.62, 0.05, 32]} />
            <meshStandardMaterial color="#5ec8e6" emissive="#2a9fc4" emissiveIntensity={lit ? 0.8 : 0.25} roughness={0.05} />
          </mesh>
          <Plant p={[0.85, 0, -0.65]} s={0.8} />
        </group>
      </Tappable>
      </At>

      {/* ---------- Living room ---------- */}
      <At id="tv">
      <Tappable id="tv">
        {/* Feature wall with LED strip and a big screen */}
        <Box p={[-4.12, 1.0, 1.0]} s={[0.1, 2.0, 2.4]} c="#16181c" />
        {[0.1, 0.4, 1.6, 1.9].map((z) => <Box key={z} p={[-4.06, 1.0, z]} s={[0.02, 2.0, 0.05]} c="#2a2d33" />)}
        <mesh position={[-4.05, 1.98, 1.0]}>
          <boxGeometry args={[0.03, 0.04, 2.3]} />
          <meshStandardMaterial color="#5ab4ff" emissive="#2f8fff" emissiveIntensity={2} />
        </mesh>
        <Box p={[-4.03, 1.15, 1.0]} s={[0.05, 0.9, 1.6]} c="#0a0a0a" />
        <mesh position={[-4.0, 1.15, 1.0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.5, 0.82]} />
          <meshStandardMaterial color="#2f7fd6" emissive="#1f5fa8" emissiveIntensity={0.9} />
        </mesh>
        <Box p={[-3.85, 0.2, 1.0]} s={[0.4, 0.4, 2.0]} c="#1c1c1e" />
        {[-0.05, 2.05].map((z) => <Box key={z} p={[-3.9, 0.55, z]} s={[0.25, 1.1, 0.25]} c="#111" />)}
        {ups.includes('ps5') && <Box p={[-3.8, 0.47, 1.6]} s={[0.12, 0.3, 0.26]} c="#f4f4f4" />}
        {/* Red sectional sofa facing the TV */}
        <group position={[-1.5, 0, 1.0]}>
          <Box p={[0, 0.25, 0]} s={[0.8, 0.4, 2.2]} c={RED} />
          <Box p={[0.32, 0.65, 0]} s={[0.18, 0.5, 2.2]} c="#8c1118" />
          <Box p={[0, 0.48, -1.0]} s={[0.8, 0.28, 0.2]} c="#8c1118" />
          <Box p={[0, 0.48, 1.0]} s={[0.8, 0.28, 0.2]} c="#8c1118" />
        </group>
        <group position={[-2.7, 0, 2.35]}>
          <Box p={[0, 0.25, 0]} s={[1.6, 0.4, 0.7]} c={RED} />
          <Box p={[0, 0.62, 0.28]} s={[1.6, 0.45, 0.16]} c="#8c1118" />
        </group>
        {/* Coffee table */}
        <Cyl p={[-2.7, 0.3, 1.0]} r={0.45} h={0.06} c="#111" />
        <Cyl p={[-2.7, 0.15, 1.0]} r={0.1} h={0.3} c={GOLD} />
      </Tappable>
      </At>
      {/* Aquarium on the bedroom wall */}
      <At x={-2.6} z={0.05}>
      <group position={[-2.6, 0, 0.05]}>
        <Box p={[0, 0.3, 0]} s={[1.0, 0.6, 0.35]} c="#141518" />
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.96, 0.58, 0.32]} />
          <meshStandardMaterial color="#47c1e0" emissive="#1c8fb5" emissiveIntensity={lit ? 0.9 : 0.35} transparent opacity={0.75} />
        </mesh>
        {[-0.2, 0.15].map((x, i) => <Box key={x} p={[x, 0.85 + i * 0.1, 0]} s={[0.1, 0.05, 0.03]} c={i ? '#ff8c2a' : '#ffd23a'} />)}
      </group>
      </At>
      {/* Grand piano */}
      <At id="piano">
      <Tappable id="piano">
        <group position={[1.1, 0, 0.4]} rotation={[0, -0.5, 0]}>
          <Box p={[0, 0.72, 0]} s={[1.0, 0.22, 1.2]} c="#0b0b0c" />
          <Box p={[0, 0.83, -0.45]} s={[0.98, 0.02, 0.3]} c="#0b0b0c" r={[-0.9, 0, 0]} />
          <Box p={[0, 0.78, 0.62]} s={[0.9, 0.06, 0.16]} c="#f4f4f4" />
          {[-0.4, 0.4].flatMap((x) => [-0.45, 0.45].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.32, z]} r={0.04} h={0.64} c="#0b0b0c" />))}
          <Box p={[0, 0.25, 0.9]} s={[0.6, 0.06, 0.3]} c="#0b0b0c" />
        </group>
      </Tappable>
      </At>
      {/* Pool table */}
      <At id="pooltable">
      <Tappable id="pooltable">
        <group position={[0.6, 0, 2.35]}>
          <Box p={[0, 0.68, 0]} s={[1.8, 0.14, 1.0]} c="#4a2e1c" />
          <Box p={[0, 0.76, 0]} s={[1.6, 0.02, 0.8]} c="#1f7a3f" />
          {[-0.75, 0.75].flatMap((x) => [-0.4, 0.4].map((z) => <Box key={`${x}${z}`} p={[x, 0.3, z]} s={[0.12, 0.6, 0.12]} c="#3a2416" />))}
          {['#f4f4f4', '#e74c3c', '#f1c40f', '#2f7fd6'].map((col, i) => (
            <mesh key={col} position={[-0.4 + i * 0.22, 0.81, (i % 2) * 0.15]}>
              <sphereGeometry args={[0.04, 10, 8]} />
              <meshStandardMaterial color={col} />
            </mesh>
          ))}
        </group>
      </Tappable>
      </At>
      <At x={-3.85} z={2.6}><Plant p={[-3.85, 0, 2.6]} /></At>
      <At x={1.8} z={-0.5}><Plant p={[1.8, 0, -0.5]} s={0.8} /></At>

      {/* ---------- Dining room ---------- */}
      <At x={-7.4} z={-1.4}><DiningTable p={[-7.4, 0, -1.4]} /></At>
      <At x={-5.5} z={-1.4}><DiningTable p={[-5.5, 0, -1.4]} /></At>
      <At x={-6.4} z={-3}><Box p={[-6.4, 0.45, -2.75]} s={[1.6, 0.9, 0.4]} c={WOOD} /></At>
      <At x={-8.2} z={-3}><Plant p={[-8.2, 0, -2.6]} /></At>
      <At x={-4.6} z={-3}><Plant p={[-4.6, 0, -2.6]} s={0.8} /></At>
      {/* Chandelier */}
      <At x={-6.4} z={-1.4}>
        <mesh position={[-6.4, 2.25, -1.4]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#fff2c8" emissive="#ffcf6b" emissiveIntensity={lit ? 2 : 0.3} />
        </mesh>
      </At>

      {/* ---------- Garage ---------- */}
      {[-7.6, -5.4].map((x) => (
        <At key={x} x={x} z={2.6}>
          <Box p={[x, 0.012, 2.6]} s={[0.06, 0.01, 0.6]} c="#f2c230" />
        </At>
      ))}
      <At x={-6.6} z={1.7}>
      {c ? (
        <group position={[-6.6, 0, 1.7]}>
          <CarModel kind={c.model} paint={car?.paint ?? c.color} lights={lit} />
        </group>
      ) : (
        <group position={[-6.6, 0, 1.7]}>
          {/* Empty bay: tools and a bike while you save for motor */}
          <Box p={[-1.6, 0.6, -0.9]} s={[0.6, 1.2, 0.4]} c="#c0392b" />
          <Box p={[0.2, 0.35, 0]} s={[1.0, 0.5, 0.25]} c="#2b2b2b" />
        </group>
      )}
      </At>

      {/* ---------- Front doors (glass, open) ---------- */}
      <At x={4} z={1.85}>
      <Box p={[4.05, 1.1, 1.2]} s={[0.08, 2.2, 0.08]} c={TRIM} />
      <Box p={[4.05, 1.1, 2.5]} s={[0.08, 2.2, 0.08]} c={TRIM} />
      <mesh position={[4.4, 1.05, 1.55]} rotation={[0, -0.9, 0]}>
        <boxGeometry args={[0.6, 2.0, 0.04]} />
        <meshStandardMaterial color="#9fd3f0" transparent opacity={0.4} />
      </mesh>
      </At>

      {/* Night lights: dining and bedroom (rich man gen no dey off) */}
      {lit && (
        <Shell>
          <pointLight position={[-6.4, 2.0, -1.4]} intensity={8} distance={6} decay={1.6} color="#ffd9a0" />
          <pointLight position={[-2.9, 2.0, -1.6]} intensity={6} distance={5} decay={1.6} color="#ffd9a0" />
          <pointLight position={[-0.6, 2.2, 1.3]} intensity={12} distance={8} decay={1.5} color="#ffe0b0" />
          <pointLight position={[-6.4, 2.0, 1.6]} intensity={5} distance={5} decay={1.6} color="#e8f0ff" />
        </Shell>
      )}
    </group>
  );
}
