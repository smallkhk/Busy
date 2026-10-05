import type { ThreeEvent } from '@react-three/fiber';
import { AREAS } from '../content/housing';
import { clockParts, daylight } from '../engine/clock';
import { useGame } from '../store/game';
import { Art, Chair, Floor, marble, paint, Plant, Sconce, TRIM, WOOD } from './Interior';
import { Box, Cyl, Tappable } from './Room';

/** A proper flat (Gwarinpa, Garki, Wuse 2, your Kuje bungalow): bedroom, kitchen, bathroom, parlour, dining and a small study. */
export function Flat({ onFloor }: { onFloor: (e: ThreeEvent<MouseEvent>) => void }) {
  const area = useGame((s) => s.area);
  const power = useGame((s) => s.power);
  const ups = useGame((s) => s.homeUps ?? []);
  const night = useGame((s) => daylight(clockParts(Math.floor(s.time / 10) * 10).minuteOfDay) < 0.35);
  const has = (id: string) => ups.includes(id);
  const theme = AREAS[area].theme;
  const lux = !!AREAS[area].lux;
  // Light dey only when NEPA bring am, or when you get inverter
  const lit = night && (power || has('inverter'));
  const tvOn = power || has('inverter');

  const tile = paint(`flat-tile-${theme.floor}`, marble(theme.floor, '#ffffff', '#00000033'));
  const white = paint('flat-white', marble('#eef0f2', '#c9ccd2', '#cfd2d8'));
  const sofa = lux ? '#3d4a5c' : '#6b4f3a';

  return (
    <group>
      {/* ---------- Floors ---------- */}
      <Floor x0={-6.6} z0={-3} x1={4} z1={2.9} tex={tile} tile={1.4} rough={0.35} onFloor={onFloor} />
      <Floor x0={-1.3} z0={-3} x1={4} z1={-0.8} tex={white} y={0.006} tile={1.2} onFloor={onFloor} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.6, 0.01, 1.0]} receiveShadow onClick={onFloor}>
        <planeGeometry args={[2.2, 1.6]} />
        <meshStandardMaterial color={theme.rug} roughness={0.9} />
      </mesh>

      {/* ---------- Walls ---------- */}
      <Box p={[-1.3, 1.3, -3.05]} s={[10.7, 2.6, 0.12]} c={theme.wall} />
      <Box p={[-6.66, 1.3, -0.05]} s={[0.12, 2.6, 6.1]} c={theme.wall2} />
      <Box p={[-1.3, 0.08, -2.98]} s={[10.7, 0.16, 0.03]} c={TRIM} />
      <Box p={[-1.3, 0.05, 2.92]} s={[10.7, 0.1, 0.08]} c={TRIM} />
      <Box p={[4.0, 0.05, -1.2]} s={[0.08, 0.1, 3.6]} c={TRIM} />
      {/* Inside walls, cut low */}
      <Box p={[-3.2, 0.6, -0.2]} s={[1.6, 1.2, 0.1]} c={theme.wall2} />
      <Box p={[-1.3, 0.6, -2.0]} s={[0.1, 1.2, 2.0]} c={theme.wall2} />
      <Box p={[1.95, 0.6, -2.0]} s={[0.1, 1.2, 2.0]} c="#cfe0e5" />
      <Box p={[3.3, 0.6, -0.8]} s={[1.4, 1.2, 0.1]} c="#cfe0e5" />
      <Box p={[-4.2, 0.6, -1.6]} s={[0.1, 1.2, 2.8]} c={theme.wall2} />
      <Box p={[-5.9, 0.6, 0.3]} s={[1.4, 1.2, 0.1]} c={theme.wall2} />

      {/* Window, lights and art */}
      <Box p={[-1.8, 1.7, -2.97]} s={[1.2, 0.9, 0.02]} c="#9fd3f0" />
      <Box p={[-1.8, 1.7, -2.95]} s={[1.3, 0.04, 0.03]} c="#f4f4f4" />
      {[-5.4, -3.6, 0.2, 3.0].map((x) => <Sconce key={x} p={[x, 1.9, -2.96]} lit={lit} />)}
      <Art p={[-6.58, 1.5, 1.6]} w={0.8} h={0.6} c1={theme.rug} c2="#f4f1ec" rotY={Math.PI / 2} />
      <Art p={[-3.0, 1.85, -2.96]} w={0.8} h={0.5} c1="#2f6b4a" c2="#e8b04b" />

      {/* ---------- Bedroom ---------- */}
      <Tappable id="bed">
        <Box p={[-2.9, 0.2, -1.9]} s={[1.6, 0.4, 2.1]} c={WOOD} />
        <Box p={[-2.9, 0.46, -1.85]} s={[1.5, 0.14, 2.0]} c="#f1eee8" />
        <Box p={[-2.9, 0.5, -1.5]} s={[1.52, 0.12, 1.2]} c={theme.bed} />
        <Box p={[-2.9, 0.6, -2.6]} s={[1.0, 0.12, 0.34]} c="#fafafa" />
        <Box p={[-2.9, 0.75, -2.95]} s={[1.7, 1.0, 0.08]} c={WOOD} />
        {has('mattress') && <Box p={[-2.9, 0.55, -1.85]} s={[1.5, 0.06, 2.0]} c="#ece7dd" />}
      </Tappable>
      <Box p={[-3.9, 0.25, -2.75]} s={[0.36, 0.5, 0.36]} c={WOOD} />
      <mesh position={[-3.9, 0.65, -2.75]}>
        <cylinderGeometry args={[0.09, 0.12, 0.16, 14]} />
        <meshStandardMaterial color="#fff1cf" emissive="#ffc46b" emissiveIntensity={lit ? 1.4 : 0.05} />
      </mesh>
      {/* Wardrobe */}
      <Box p={[-1.75, 0.95, -2.7]} s={[0.7, 1.9, 0.55]} c="#8a6a4a" />
      <Box p={[-1.75, 0.95, -2.42]} s={[0.02, 1.8, 0.02]} c="#3a2a1c" />
      {(lux || has('ac')) && <Box p={[-2.9, 2.25, -2.92]} s={[1.0, 0.3, 0.18]} c="#f4f4f4" />}

      {/* ---------- Kitchen ---------- */}
      <Tappable id="cooler">
        {has('fridge') ? (
          <>
            <Box p={[-0.75, 0.8, -2.65]} s={[0.65, 1.6, 0.6]} c="#d9dde0" />
            <Box p={[-0.5, 1.0, -2.34]} s={[0.03, 0.4, 0.03]} c="#888" />
          </>
        ) : (
          <>
            <Box p={[-0.7, 0.25, -2.6]} s={[0.8, 0.5, 0.5]} c="#c8312b" />
            <Box p={[-0.7, 0.54, -2.6]} s={[0.84, 0.08, 0.54]} c="#f4f4f4" />
          </>
        )}
      </Tappable>
      <Tappable id="stove">
        <Box p={[0.8, 0.44, -2.68]} s={[1.9, 0.88, 0.6]} c="#e9e4d8" />
        <Box p={[0.8, 0.9, -2.68]} s={[1.94, 0.05, 0.64]} c="#3a3a3a" />
        {[0.2, 0.8, 1.4].map((x) => <Box key={x} p={[x, 0.5, -2.37]} s={[0.55, 0.7, 0.02]} c="#d9d2c2" />)}
        {[0.65, 0.95].map((x) => <Cyl key={x} p={[x, 0.95, -2.68]} r={0.09} h={0.02} c="#444" />)}
        <Cyl p={[0.65, 1.04, -2.68]} r={0.12} h={0.16} c="#b5b5b5" />
        <Box p={[0.8, 1.85, -2.8]} s={[1.9, 0.55, 0.35]} c="#e9e4d8" />
        <Cyl p={[1.6, 0.3, -2.25]} r={0.16} h={0.55} c="#2f8f4e" />
      </Tappable>

      {/* ---------- Bathroom ---------- */}
      <Tappable id="bucket">
        <Box p={[2.45, 0.04, -2.6]} s={[0.8, 0.08, 0.7]} c="#f4f4f4" />
        {lux ? (
          <mesh position={[2.45, 1.0, -2.24]}>
            <boxGeometry args={[0.8, 1.9, 0.03]} />
            <meshStandardMaterial color="#cdeefa" transparent opacity={0.35} roughness={0.05} />
          </mesh>
        ) : (
          <Box p={[2.45, 1.0, -2.24]} s={[0.8, 1.7, 0.02]} c="#5aa7c7" />
        )}
        <Cyl p={[2.45, 1.95, -2.85]} r={0.09} h={0.03} c="#c0c0c0" />
        <Cyl p={[2.95, 0.15, -2.6]} r={0.16} h={0.3} c="#2f6fd6" />
      </Tappable>
      <Tappable id="toilet">
        <Box p={[3.55, 0.22, -2.55]} s={[0.4, 0.44, 0.55]} c="#f5f5f5" />
        <Box p={[3.55, 0.6, -2.85]} s={[0.45, 0.45, 0.2]} c="#f5f5f5" />
      </Tappable>
      <Box p={[3.55, 0.42, -1.2]} s={[0.5, 0.84, 0.38]} c={WOOD} />
      <Box p={[3.55, 0.86, -1.2]} s={[0.52, 0.05, 0.4]} c="#f4f4f4" />

      {/* ---------- Parlour ---------- */}
      <Tappable id="tv">
        <Box p={[-3.85, 0.3, 1.0]} s={[0.45, 0.6, 1.8]} c="#3d2a1a" />
        {has('smarttv') ? (
          <>
            <Box p={[-3.95, 1.15, 1.0]} s={[0.06, 0.95, 1.7]} c="#0d0d0d" />
            <mesh position={[-3.91, 1.15, 1.0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[1.6, 0.86]} />
              <meshStandardMaterial color={tvOn ? '#3fb27f' : '#0b0b0b'} emissive={tvOn ? '#1d8a5a' : '#000'} emissiveIntensity={0.7} />
            </mesh>
          </>
        ) : (
          <>
            <Box p={[-3.88, 0.95, 1.0]} s={[0.08, 0.66, 1.1]} c="#111" />
            <mesh position={[-3.83, 0.95, 1.0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[1.0, 0.56]} />
              <meshStandardMaterial color={tvOn ? '#4aa3df' : '#0b0b0b'} emissive={tvOn ? '#1d6fa5' : '#000'} emissiveIntensity={0.8} />
            </mesh>
          </>
        )}
        {has('ps5') && <Box p={[-3.8, 0.68, 1.65]} s={[0.12, 0.3, 0.26]} c="#f4f4f4" />}
        {/* Three-seater and an armchair */}
        <group position={[-1.6, 0, 1.0]}>
          <Box p={[0, 0.28, 0]} s={[0.8, 0.4, 1.9]} c={sofa} />
          <Box p={[0.32, 0.68, 0]} s={[0.18, 0.55, 1.9]} c={sofa} />
          <Box p={[0, 0.52, -0.88]} s={[0.8, 0.3, 0.14]} c={sofa} />
          <Box p={[0, 0.52, 0.88]} s={[0.8, 0.3, 0.14]} c={sofa} />
        </group>
        <group position={[-2.6, 0, 2.4]}>
          <Box p={[0, 0.25, 0]} s={[0.8, 0.4, 0.7]} c={sofa} />
          <Box p={[0, 0.6, 0.28]} s={[0.8, 0.4, 0.15]} c={sofa} />
        </group>
        <Box p={[-2.6, 0.25, 1.0]} s={[0.6, 0.06, 0.9]} c="#2b2b2b" />
      </Tappable>
      {/* Ceiling fan */}
      <group position={[-2.4, 2.4, 1.0]}>
        <Cyl p={[0, 0, 0]} r={0.08} h={0.12} c="#e8e8e8" />
        <Box p={[0, -0.04, 0]} s={[1.2, 0.02, 0.14]} c="#e8e8e8" />
        <Box p={[0, -0.04, 0]} s={[0.14, 0.02, 1.2]} c="#e8e8e8" />
      </group>
      <Plant p={[-3.85, 0, 2.6]} s={0.9} />
      {has('wifi') && (
        <group>
          <Box p={[-3.8, 0.64, 0.25]} s={[0.25, 0.06, 0.18]} c="#f4f4f4" />
          <Box p={[-3.7, 0.68, 0.25]} s={[0.03, 0.02, 0.03]} c="#2ecc71" />
        </group>
      )}
      {has('inverter') && (
        <group>
          <Box p={[0.6, 0.3, 2.5]} s={[0.4, 0.6, 0.35]} c="#2c3e50" />
          <Box p={[0.81, 0.45, 2.5]} s={[0.02, 0.06, 0.06]} c="#2ecc71" />
        </group>
      )}

      {/* ---------- Dining ---------- */}
      <group position={[-5.4, 0, -1.4]}>
        <Box p={[0, 0.72, 0]} s={[1.4, 0.05, 0.8]} c={WOOD} />
        {[-0.6, 0.6].flatMap((x) => [-0.32, 0.32].map((z) => <Box key={`${x}${z}`} p={[x, 0.36, z]} s={[0.06, 0.72, 0.06]} c="#3a2a1c" />))}
        {[-0.35, 0.35].map((x) => (
          <group key={x}>
            <Chair p={[x, 0, -0.65]} rotY={0} />
            <Chair p={[x, 0, 0.65]} rotY={Math.PI} />
          </group>
        ))}
        <Cyl p={[0, 0.8, 0]} r={0.12} h={0.1} c="#f4f4f4" />
      </group>
      <Plant p={[-6.3, 0, -2.6]} s={0.8} />

      {/* ---------- Small study ---------- */}
      <group position={[-5.4, 0, 1.6]}>
        <Box p={[0, 0.72, -0.6]} s={[1.2, 0.05, 0.55]} c="#8a6a4a" />
        {[-0.55, 0.55].map((x) => <Box key={x} p={[x, 0.36, -0.6]} s={[0.05, 0.72, 0.5]} c="#6b4f32" />)}
        <Box p={[0, 0.88, -0.75]} s={[0.5, 0.3, 0.03]} c="#111" />
        <Chair p={[0, 0, -0.1]} rotY={Math.PI} />
        <Box p={[-1.05, 0.9, 0.3]} s={[0.35, 1.8, 0.8]} c="#7a5a3c" />
        {[0.5, 0.95, 1.4].map((y) => <Box key={y} p={[-0.9, y, 0.3]} s={[0.05, 0.3, 0.7]} c={y > 1 ? '#c0392b' : '#2f7fd6'} />)}
      </group>

      {/* ---------- Front door ---------- */}
      <Box p={[4.05, 1.0, 1.85]} s={[0.06, 2, 0.05]} c="#5b3a21" />
      <Box p={[4.5, 1.0, 1.35]} s={[0.9, 2, 0.06]} c="#7a4e2a" r={[0, -0.6, 0]} />

      {lit && <pointLight position={[-5.4, 2.0, -0.6]} intensity={6} distance={5} decay={1.6} color="#ffd9a0" />}
    </group>
  );
}
