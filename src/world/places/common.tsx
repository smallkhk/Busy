import type { ThreeEvent } from '@react-three/fiber';
import { useContext } from 'react';
import { useGame } from '../../store/game';
import { CellCtx } from '../origin';

/** Walkable ground plane: tapping it walks the player there. */
export function Ground({ color, size = [80, 80], pos = [0, -0.02, 0] }: { color: string; size?: [number, number]; pos?: [number, number, number] }) {
  const walkTo = useGame((s) => s.walkTo);
  // In the connected city the big ground only covers this block
  const cell = useContext(CellCtx);
  if (cell && size[0] >= 60) size = cell.ground;
  const onDown = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A drag moves the camera; only a tap counts
    if (e.delta > 8) return;
    walkTo(e.point.x, e.point.z);
  };
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={pos} receiveShadow onClick={onDown}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/** Green-white-green flag on a pole. */
export function Flag({ x, z, h = 3.2 }: { x: number; z: number; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.035, 0.035, h, 8]} />
        <meshStandardMaterial color="#d8d8d8" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.12 + i * 0.24, h - 0.3, 0]}>
          <boxGeometry args={[0.24, 0.45, 0.02]} />
          <meshStandardMaterial color={i === 1 ? '#ffffff' : '#118a4c'} />
        </mesh>
      ))}
    </group>
  );
}
