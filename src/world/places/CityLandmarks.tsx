import { Person } from '../Avatar';
import { Box, Cyl } from '../Room';
import { Car, Tree } from '../Street';
import { Flag } from './common';

/*
 * Abuja landmarks that stand in their own block of the connected city, plus the
 * University of Abuja. Landmarks are to see as you pass; UniAbuja is a full
 * place with the usual layout (three spots at the back, gate front right).
 */

function Windows({ xs, ys, z, c = '#7fb3d0', w = 0.5, h = 0.45 }: { xs: number[]; ys: number[]; z: number; c?: string; w?: number; h?: number }) {
  return <>{xs.flatMap((x) => ys.map((y) => <Box key={`${x}:${y}`} p={[x, y, z]} s={[w, h, 0.02]} c={c} />))}</>;
}

/** Paved forecourt in front of a landmark, open to the road. */
function Forecourt({ w = 16, d = 8, c = '#d9d4c7' }: { w?: number; d?: number; c?: string }) {
  return <Box p={[0, 0.01, 1.5 - d / 2 + 2]} s={[w, 0.02, d]} c={c} />;
}

function Palms({ xs, z }: { xs: number[]; z: number }) {
  return (
    <>
      {xs.map((x) => (
        <group key={x} position={[x, 0, z]}>
          <Cyl p={[0, 1.5, 0]} r={0.09} h={3} c="#7a5a3a" />
          {[0, 1, 2, 3, 4].map((k) => (
            <Box key={k} p={[Math.cos((k * 2 * Math.PI) / 5) * 0.55, 3.0, Math.sin((k * 2 * Math.PI) / 5) * 0.55]} s={[1.1, 0.06, 0.3]} r={[0, -(k * 2 * Math.PI) / 5, -0.35]} c="#3f8a3a" />
          ))}
        </group>
      ))}
    </>
  );
}

/** National Mosque: golden dome on a white hall, four tall minarets. */
export function NationalMosque() {
  return (
    <group>
      <Forecourt w={20} d={10} c="#e4ddcc" />
      <Box p={[0, 1.6, -5]} s={[8, 3.2, 6]} c="#f4efe4" />
      <Windows xs={[-3, -1.5, 0, 1.5, 3]} ys={[1.2]} z={-1.98} c="#2f6b4a" w={0.5} h={1.2} />
      <mesh position={[0, 3.2, -5]} castShadow>
        <sphereGeometry args={[2.6, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#d8a53a" metalness={0.75} roughness={0.25} />
      </mesh>
      <Cyl p={[0, 6.1, -5]} r={0.08} h={0.8} c="#d8a53a" />
      {[[-5.5, -1.5], [5.5, -1.5], [-5.5, -8.5], [5.5, -8.5]].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <Cyl p={[0, 4.5, 0]} r={0.35} h={9} c="#f4efe4" />
          <Cyl p={[0, 7.2, 0]} r={0.5} h={0.25} c="#d8a53a" />
          <mesh position={[0, 9.4, 0]}>
            <coneGeometry args={[0.38, 1.2, 12]} />
            <meshStandardMaterial color="#d8a53a" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <Palms xs={[-8, 8]} z={2.5} />
    </group>
  );
}

/** National Christian Centre (Ecumenical Centre): tall white triangle with blue glass and a cross. */
export function ChristianCentre() {
  return (
    <group>
      <Forecourt w={18} d={10} c="#dfe3e6" />
      <mesh position={[0, 4.5, -5]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[5, 9, 4]} />
        <meshStandardMaterial color="#f2f4f6" roughness={0.5} />
      </mesh>
      <Box p={[0, 3, -1.95]} s={[1.2, 6, 0.05]} c="#3b6fb0" />
      <Box p={[0, 9.6, -5]} s={[0.15, 1.6, 0.15]} c="#d8a53a" />
      <Box p={[0, 9.9, -5]} s={[0.9, 0.15, 0.15]} c="#d8a53a" />
      <Box p={[0, 1, -1.7]} s={[2, 2, 0.4]} c="#cfd6dc" />
      <Palms xs={[-7, 7]} z={2} />
    </group>
  );
}

/** Eagle Square: big parade ground, green-roofed grandstand and flags. */
export function EagleSquare() {
  return (
    <group>
      <Box p={[0, 0.015, -1]} s={[24, 0.03, 12]} c="#cfc9bb" />
      {/* Grandstand */}
      <Box p={[0, 1, -6.2]} s={[14, 2, 2.5]} c="#eae5d8" />
      {[0, 1, 2].map((i) => (
        <Box key={i} p={[0, 0.4 + i * 0.5, -4.9 + i * 0.5]} s={[13, 0.3, 0.6]} c="#d0cab9" />
      ))}
      <Box p={[0, 3.4, -5.6]} s={[15, 0.25, 3.6]} c="#1f8a4c" />
      {[-7, -3.5, 0, 3.5, 7].map((x) => (
        <Cyl key={x} p={[x, 1.7, -4.1]} r={0.12} h={3.4} c="#eae5d8" />
      ))}
      {[-10, -6, -2, 2, 6, 10].map((x) => (
        <Flag key={x} x={x} z={3.6} h={4} />
      ))}
      {/* Eagle on its pillar */}
      <Cyl p={[9, 1.6, -1]} r={0.4} h={3.2} c="#e9e2d0" />
      <Box p={[9, 3.5, -1]} s={[1.6, 0.25, 0.5]} c="#3d3a33" />
      <Box p={[9, 3.7, -1]} s={[0.4, 0.5, 0.4]} c="#3d3a33" />
    </group>
  );
}

/** Central Bank of Nigeria: tall dark glass tower on a stone podium. */
export function CentralBank() {
  return (
    <group>
      <Forecourt w={16} d={9} c="#d8d2c4" />
      <Box p={[0, 1, -5]} s={[10, 2, 7]} c="#d6cdb8" />
      <Box p={[0, 7, -5]} s={[5.5, 10, 5]} c="#2b3a48" />
      <Windows xs={[-2, -1, 0, 1, 2]} ys={[3, 4.4, 5.8, 7.2, 8.6, 10]} z={-2.48} c="#6fa3c8" w={0.7} h={1} />
      <Box p={[0, 12.2, -5]} s={[6, 0.4, 5.5]} c="#d6cdb8" />
      <Box p={[0, 2.4, -1.45]} s={[4, 0.5, 0.06]} c="#1f8a4c" />
      <Flag x={-6} z={2} h={4} />
      <Flag x={6} z={2} h={4} />
    </group>
  );
}

/** Aso Rock: the huge granite rock behind the villa. You no fit enter 😅 */
export function AsoRock() {
  return (
    <group>
      {[
        [0, 4, -9, 9, 6, 6, '#8a8174'],
        [-6, 2.6, -7, 5, 4, 4, '#7d7468'],
        [6, 3, -8, 6, 4.5, 4.5, '#837a6d'],
        [2, 6.5, -10, 5, 3, 4, '#958c7e'],
      ].map(([x, y, z, sx, sy, sz, c], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} scale={[sx as number, sy as number, sz as number]} castShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={c as string} flatShading roughness={0.95} />
        </mesh>
      ))}
      {/* Villa wall and guarded gate */}
      <Box p={[0, 1, -2]} s={[22, 2, 0.4]} c="#e8e1d0" />
      <Box p={[0, 1.2, -1.75]} s={[3, 2.4, 0.2]} c="#2b2b2b" />
      <Flag x={-2.2} z={-1.4} h={3.6} />
      <Flag x={2.2} z={-1.4} h={3.6} />
      <group position={[-2.6, 0, 0]}>
        <Person shirt="#3f5a3a" trousers="#3f5a3a" skin="#3d2416" />
      </group>
      <group position={[2.6, 0, 0]}>
        <Person shirt="#3f5a3a" trousers="#3f5a3a" skin="#4a2e1d" />
      </group>
      <Tree p={[-9, 0, 1]} s={1.3} />
      <Tree p={[9, 0, 1]} s={1.3} />
    </group>
  );
}

/** Zuma Rock: the giant rock with a face, the gate to Abuja from the north. */
export function ZumaRock() {
  return (
    <group>
      <mesh position={[0, 6, -8]} scale={[8, 7, 6]} castShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#6f675c" flatShading roughness={0.95} />
      </mesh>
      {/* The face: two dark eyes and a long nose streak */}
      <Box p={[-1.6, 8, -2.6]} s={[1.2, 0.6, 0.3]} c="#3b362f" />
      <Box p={[1.6, 8, -2.6]} s={[1.2, 0.6, 0.3]} c="#3b362f" />
      <Box p={[0, 6.6, -2.4]} s={[0.5, 2.2, 0.3]} c="#4a443b" />
      <Box p={[0, 5, -2.5]} s={[2.4, 0.4, 0.3]} c="#3b362f" />
      {[-9, -6, 6, 9].map((x) => (
        <Tree key={x} p={[x, 0, -1 + (x % 2)]} s={1.2} />
      ))}
    </group>
  );
}

/** Transcorp Hilton: the big white hotel with rows of balconies. */
export function Hilton() {
  return (
    <group>
      <Forecourt w={18} d={9} c="#dcd6c8" />
      <Box p={[0, 5, -6]} s={[14, 10, 4]} c="#f3f1ec" />
      {Array.from({ length: 8 }, (_, i) => (
        <Box key={i} p={[0, 1.4 + i * 1.1, -3.9]} s={[13.6, 0.12, 0.4]} c="#d9d4ca" />
      ))}
      <Windows xs={[-6, -4.5, -3, -1.5, 0, 1.5, 3, 4.5, 6]} ys={[2, 3.1, 4.2, 5.3, 6.4, 7.5, 8.6]} z={-3.98} c="#7a9cb8" w={0.9} h={0.6} />
      <Box p={[0, 10.4, -6]} s={[6, 0.8, 0.2]} c="#1b4f8a" />
      {/* Porch for big men's cars */}
      <Box p={[0, 2.2, -2.4]} s={[6, 0.25, 3]} c="#e7e2d6" />
      <group position={[-1.5, 0, -1.2]} rotation={[0, Math.PI, 0]}>
        <Car body="#16171b" kind="gls" />
      </group>
      <Palms xs={[-8, 8]} z={1.5} />
    </group>
  );
}

/** Unity Fountain: round pool with jets and flags of the states around it. */
export function UnityFountain() {
  return (
    <group>
      <Box p={[0, 0.01, -2]} s={[18, 0.02, 12]} c="#ddd7c9" />
      <Cyl p={[0, 0.25, -3]} r={4.2} h={0.5} c="#cfc9bb" />
      <mesh position={[0, 0.52, -3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.9, 32]} />
        <meshStandardMaterial color="#5fb4d8" metalness={0.3} roughness={0.15} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <Cyl key={k} p={[Math.cos((k * Math.PI) / 3) * 2, 1.1, -3 + Math.sin((k * Math.PI) / 3) * 2]} r={0.08} h={1.2} c="#cfeaf5" />
      ))}
      <Cyl p={[0, 1.6, -3]} r={0.14} h={2.2} c="#e6f5fb" />
      {Array.from({ length: 12 }, (_, k) => (
        <Flag key={k} x={Math.cos((k * Math.PI) / 6) * 6} z={-3 + Math.sin((k * Math.PI) / 6) * 5} h={3} />
      ))}
    </group>
  );
}

/** Banex Plaza: rows of phone and laptop shops with loud signboards. */
export function BanexPlaza() {
  const signs = ['#e74c3c', '#2980b9', '#f1c40f', '#8e44ad', '#16a085', '#e67e22'];
  return (
    <group>
      <Forecourt w={20} d={9} c="#c9c2b2" />
      <Box p={[0, 2, -6]} s={[16, 4, 4]} c="#e3dccd" />
      {signs.map((c, i) => (
        <group key={i}>
          <Box p={[-6.7 + i * 2.7, 0.9, -3.98]} s={[2.2, 1.8, 0.05]} c="#2a2d33" />
          <Box p={[-6.7 + i * 2.7, 2.3, -3.97]} s={[2.4, 0.6, 0.06]} c={c} />
          <Box p={[-6.7 + i * 2.7, 3.3, -3.97]} s={[2.4, 0.5, 0.06]} c={signs[(i + 3) % signs.length]} />
        </group>
      ))}
      <Box p={[0, 4.3, -6]} s={[6, 0.8, 0.3]} c="#1b4f8a" />
      {[-5, 0, 5].map((x) => (
        <Box key={x} p={[x, 0.45, 0]} s={[1.2, 0.9, 0.6]} c="#3a3d42" />
      ))}
    </group>
  );
}

/** Abuja City Gate: the big arch over the road, "Welcome to Abuja". */
export function CityGate() {
  return (
    <group>
      {/* Pillars either side of the road, the beam across it */}
      {[7 - 2.9, 7 + 2.9].map((z) => (
        <group key={z}>
          <Box p={[0, 3.5, z]} s={[1.6, 7, 1.6]} c="#e9e2d0" />
          <Box p={[0, 7.2, z]} s={[2.2, 0.5, 2.2]} c="#1f8a4c" />
        </group>
      ))}
      <Box p={[0, 7.8, 7]} s={[1.2, 1.4, 7.4]} c="#e9e2d0" />
      <Box p={[0.62, 7.8, 7]} s={[0.05, 0.7, 4.6]} c="#1f8a4c" />
      <Box p={[0.66, 7.8, 7]} s={[0.03, 0.25, 4.2]} c="#f4f4f4" />
      <Flag x={-9} z={2} h={4} />
      <Flag x={9} z={2} h={4} />
      {[-12, -9, 9, 12].map((x) => (
        <Tree key={x} p={[x, 0, -3]} s={1.1} />
      ))}
    </group>
  );
}

export const LANDMARK_SCENES = {
  mosque: NationalMosque,
  church: ChristianCentre,
  eagle: EagleSquare,
  cbn: CentralBank,
  asorock: AsoRock,
  zuma: ZumaRock,
  hilton: Hilton,
  fountain: UnityFountain,
  banex: BanexPlaza,
  citygate: CityGate,
} as const;
