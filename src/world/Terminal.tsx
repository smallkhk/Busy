import { Html, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, type ReactElement } from 'react';
import { DoubleSide, type Group } from 'three';
import { clockParts, daylight } from '../engine/clock';
import { useGame } from '../store/game';
import { Box, Cyl } from './Room';

/**
 * Zuma Air jet: "Jet airplane" by weirdybeardyman (OpenGameArt, CC0), repainted
 * in Zuma Air green (see public/models/LICENSE-zuma-jet.txt). Nose points +x.
 * The parked one has its wheels down.
 */
const JET_URL = `${import.meta.env.BASE_URL}models/zuma-jet.glb`;
const PARKED_URL = `${import.meta.env.BASE_URL}models/zuma-jet-parked.glb`;
/** Bottom of the parked jet's wheels, in model units. */
const WHEELS = 1.9;

function JetModel({ parked }: { parked?: boolean }) {
  const { scene } = useGLTF(parked ? PARKED_URL : JET_URL);
  const obj = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={obj} />;
}

export function ZumaJetModel({ parked }: { parked?: boolean }) {
  return (
    <Suspense fallback={null}>
      <JetModel parked={parked} />
    </Suspense>
  );
}

/** The jet in the sky: a gentle bob and roll. Sized so the cabin fits inside it. */
export function FlyingJet() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.position.y = 1.38 + Math.sin(t * 0.8) * 0.15;
    g.rotation.x = Math.sin(t * 0.5) * 0.03;
  });
  return (
    <group ref={ref} position={[0.75, 1.38, 0]} scale={2.4}>
      <ZumaJetModel />
    </group>
  );
}

const useNight = () => useGame((s) => daylight(clockParts(Math.floor(s.time / 30) * 30).minuteOfDay) < 0.35);

/** Glass that shows the sky by day and glows warm at night. */
function Glass({ p, s }: { p: [number, number, number]; s: [number, number, number] }) {
  const night = useNight();
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={night ? '#f3c77a' : '#79aecb'} emissive={night ? '#ffbf5e' : '#0d2533'} emissiveIntensity={night ? 0.9 : 0.25} roughness={0.15} metalness={0.3} />
    </mesh>
  );
}

const W = 20;
const DEPTH = 5;
const H = 3.6;

/** The big curved roof over the hall: an arc of a wide cylinder, overhanging the front. */
function WaveRoof() {
  const R = 14;
  const chord = DEPTH + 2.4;
  const a = Math.asin(chord / 2 / R);
  const top = H + 0.9;
  const zMid = -DEPTH / 2 + 0.9;
  return (
    <group position={[0, top - R, zMid]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[R, R, W + 1.6, 48, 1, true, Math.PI / 2 - a, 2 * a]} />
        <meshStandardMaterial color="#eef1f4" metalness={0.35} roughness={0.35} side={DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * A modern airport terminal, front (glass and doors) facing +z at z = 0, 20 wide
 * and 5 deep so it fits one city block: drop-off canopy, curved roof, control
 * tower, and a Zuma Air jet at the gate beside the hall (`jetSide` +1 east, -1 west).
 */
export function Terminal({ name, tower = [-13, -3], jetSide = 1 }: { name: string; tower?: [number, number]; jetSide?: 1 | -1 }) {
  const mullions: ReactElement[] = [];
  for (let x = -W / 2; x <= W / 2 + 0.01; x += 1.2) mullions.push(<Box key={x} p={[x, H / 2, 0.04]} s={[0.07, H, 0.08]} c="#9aa4ad" />);
  const gate = jetSide * (W / 2);
  return (
    <group>
      {/* Plinth and the hall */}
      <Box p={[0, 0.12, -DEPTH / 2]} s={[W + 2, 0.24, DEPTH + 1]} c="#cfd3d6" />
      <Box p={[0, H / 2, -DEPTH / 2 - 0.1]} s={[W, H, DEPTH - 0.2]} c="#e6eaed" />
      <Glass p={[0, H / 2 + 0.1, 0]} s={[W, H - 0.4, 0.05]} />
      {mullions}
      <Box p={[0, H - 0.05, 0.08]} s={[W + 0.4, 0.4, 0.14]} c="#118a4c" />
      <Box p={[0, H + 0.2, 0.06]} s={[W + 0.4, 0.1, 0.1]} c="#d8a53a" />
      {/* Sliding doors */}
      {[-5, 0, 5].map((x) => (
        <group key={x}>
          <Box p={[x, 1.15, 0.08]} s={[1.9, 2.3, 0.06]} c="#2b3640" />
          <Box p={[x, 1.15, 0.12]} s={[0.04, 2.2, 0.04]} c="#9aa4ad" />
        </group>
      ))}
      <WaveRoof />
      {/* Drop-off canopy on slim columns */}
      <Box p={[0, 3.05, 1.2]} s={[W - 2, 0.14, 2.4]} c="#f4f6f8" />
      <Box p={[0, 3.13, 2.38]} s={[W - 2, 0.1, 0.06]} c="#118a4c" />
      {[-8, -4, 0, 4, 8].map((x) => (
        <Cyl key={x} p={[x, 1.5, 2.2]} r={0.08} h={3} c="#c7ccd2" />
      ))}
      <Html position={[0, H + 1.4, 0.4]} center zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}>
        <div className="block-name campus-sign">✈️ {name}</div>
      </Html>

      {/* Control tower */}
      <group position={[tower[0], 0, tower[1]]}>
        <Cyl p={[0, 4, 0]} r={0.55} h={8} c="#dfe4e8" />
        <Cyl p={[0, 7.4, 0]} r={1.1} h={0.3} c="#cfd3d6" />
        <Glass p={[0, 8.2, 0]} s={[2.4, 1.2, 2.4]} />
        <Cyl p={[0, 8.95, 0]} r={1.5} h={0.25} c="#eef1f4" />
        <Cyl p={[0, 9.6, 0]} r={0.04} h={1.2} c="#888" />
      </group>

      {/* Gate beside the hall: apron, jet bridge and our jet, nose to the terminal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[gate + jetSide * 5.5, 0.012, -6]}>
        <planeGeometry args={[11, 12]} />
        <meshStandardMaterial color="#b4b9bf" />
      </mesh>
      <Box p={[gate + jetSide * 5.5, 0.02, -6]} s={[10, 0.01, 0.12]} c="#f2c230" />
      <Box p={[gate + jetSide * 0.9, 2.1, -4.6]} s={[1.8, 0.9, 0.9]} c="#cfd3d6" />
      <Box p={[gate + jetSide * 1.5, 1.0, -4.6]} s={[0.25, 2, 0.25]} c="#6c757d" />
      <group position={[gate + jetSide * 6.4, WHEELS * 0.5, -6]} rotation={[0, jetSide > 0 ? Math.PI : 0, 0]} scale={0.5}>
        <ZumaJetModel parked />
      </group>
    </group>
  );
}

export const preloadJets = () => {
  useGLTF.preload(JET_URL);
  useGLTF.preload(PARKED_URL);
};
