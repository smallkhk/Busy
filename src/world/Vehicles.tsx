import { SKINS, type Look } from '../content/fashion';
import { SEAT_BASE } from '../content/seats';
import { Person } from './Avatar';
import { Box, Cyl } from './Room';
import { Keke } from './Street';

/** Somebody sitting on a vehicle seat whose top is at `top`. */
function Rider({ x = 0, z = 0, top, rot = 0, shirt, look, woman }: { x?: number; z?: number; top: number; rot?: number; shirt: string; look?: Look; woman?: boolean }) {
  return (
    <group position={[x, top - SEAT_BASE, z]} rotation={[0, rot, 0]} scale={0.92}>
      <Person shirt={shirt} outfit={look?.outfit} hair={look?.hair} skin={look ? SKINS[look.skin ?? 2] : undefined} woman={woman} move="Sit" />
    </group>
  );
}

/** Your hired okada (faces +z): you in front, a passenger or a food box behind. */
export function HustleOkada({ shirt, look, passenger, food }: { shirt: string; look?: Look; passenger?: boolean; food?: boolean }) {
  return (
    <group>
      <Box p={[0, 0.45, 0]} s={[0.24, 0.3, 1.15]} c="#b0201c" />
      <Box p={[0, 0.63, -0.1]} s={[0.3, 0.06, 0.8]} c="#1b1b1b" />
      <Box p={[0, 0.9, 0.48]} s={[0.6, 0.05, 0.05]} c="#2b2b2b" />
      <Cyl p={[0, 0.7, 0.5]} r={0.03} h={0.45} c="#555" />
      {[-0.48, 0.48].map((z) => (
        <mesh key={z} position={[0, 0.26, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.1, 14]} />
          <meshStandardMaterial color="#141414" />
        </mesh>
      ))}
      <Rider z={0.05} top={0.66} shirt={shirt} look={look} />
      {passenger && <Rider z={-0.38} top={0.66} shirt="#8e44ad" woman />}
      {food && (
        <group position={[0, 0.85, -0.45]}>
          <Box p={[0, 0, 0]} s={[0.45, 0.4, 0.4]} c="#e8692c" />
          <Box p={[0, 0.05, 0.205]} s={[0.3, 0.12, 0.01]} c="#f4f4f4" />
        </group>
      )}
    </group>
  );
}

/** Your hired keke (built facing +x, so turn it to face +z): you drive, passengers at the back. */
export function HustleKeke({ shirt, look, passenger }: { shirt: string; look?: Look; passenger?: boolean }) {
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <Keke />
      <Rider x={0.25} top={0.72} rot={Math.PI / 2} shirt={shirt} look={look} />
      {passenger && (
        <>
          <Rider x={-0.3} z={-0.18} top={0.72} rot={Math.PI / 2} shirt="#c0392b" />
          <Rider x={-0.3} z={0.18} top={0.72} rot={Math.PI / 2} shirt="#16a085" woman />
        </>
      )}
    </group>
  );
}
