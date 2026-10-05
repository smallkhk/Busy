import { Person } from '../Avatar';
import { Box, Cyl, Tappable } from '../Room';
import { Car, Tree, Walkers, type Walker } from '../Street';
import { Flag, Ground } from './common';

function RedCross({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <Box p={[0, 0, 0]} s={[0.7, 0.22, 0.04]} c="#d63c3c" />
      <Box p={[0, 0, 0]} s={[0.22, 0.7, 0.04]} c="#d63c3c" />
    </group>
  );
}

const VISITORS: Walker[] = [
  { from: -5, to: 5, z: 1.2, speed: 0.45, shirt: '#ecf0f1' },
  { from: 4, to: -4, z: 2.2, speed: 0.4, shirt: '#e67e22' },
];

export function Hospital() {
  return (
    <group>
      <Ground color="#86ad5f" />
      <Ground color="#d6d2c8" size={[15, 6]} pos={[0, 0, 0.6]} />

      {/* Main block */}
      <Box p={[-1.2, 1.6, -4.4]} s={[8.5, 3.2, 3]} c="#f2f4f5" />
      <Box p={[-1.2, 3.25, -4.4]} s={[8.7, 0.12, 3.2]} c="#2f6fa8" />
      {[-4.4, -3.2, -2.0, -0.4, 0.8, 2.0].flatMap((x) => [1.0, 2.2].map((y) => (
        <Box key={`${x}${y}`} p={[x, y, -2.88]} s={[0.6, 0.5, 0.02]} c="#7fb3d0" />
      )))}
      <Box p={[-1.2, 2.75, -2.86]} s={[3.6, 0.45, 0.04]} c="#2f6fa8" />
      <RedCross p={[-3.6, 2.75, -2.84]} />

      <Tappable id="doctor">
        <Box p={[-1.5, 0.9, -2.85]} s={[1.4, 1.8, 0.06]} c="#5b8fb9" />
        <Box p={[-1.5, 0.05, -2.3]} s={[2.4, 0.1, 1.0]} c="#c7c2b5" />
        {/* Waiting bench, full as usual */}
        <Box p={[-4.0, 0.42, -2.2]} s={[2.4, 0.08, 0.45]} c="#2f6fa8" />
        {[-4.8, -4.0, -3.2].map((x, i) => (
          <group key={x} position={[x, 0.08, -2.25]} scale={0.88}>
            <Person shirt={['#8e44ad', '#16a085', '#c0392b'][i]} trousers="#2d2d2d" />
          </group>
        ))}
      </Tappable>

      <Tappable id="emergency">
        <Box p={[3.0, 1.1, -3.4]} s={[2.4, 2.2, 1.8]} c="#f2f4f5" />
        <Box p={[3.0, 2.0, -2.48]} s={[2.0, 0.35, 0.04]} c="#d63c3c" />
        {/* Ambulance */}
        <group position={[3.0, 0, -1.4]}>
          <Box p={[0, 0.55, 0]} s={[1.9, 0.8, 0.95]} c="#f4f4f4" />
          <Box p={[0, 0.6, 0]} s={[1.92, 0.14, 0.97]} c="#d63c3c" />
          <Box p={[0.1, 1.0, 0]} s={[0.3, 0.1, 0.3]} c="#3d8fff" />
          {[[-0.6, 0.48], [0.6, 0.48], [-0.6, -0.48], [0.6, -0.48]].map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x, 0.17, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.17, 0.17, 0.1, 12]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          ))}
        </group>
      </Tappable>

      <Flag x={-6.2} z={-2.0} />

      <Tappable id="hospital-park">
        <Box p={[5.0, 2.0, 3.4]} s={[2.2, 0.08, 1.0]} c="#1f8a4c" />
        <Box p={[4.0, 1.0, 3.7]} s={[0.08, 2.0, 0.08]} c="#555" />
        <Box p={[6.0, 1.0, 3.7]} s={[0.08, 2.0, 0.08]} c="#555" />
        <Box p={[5.0, 0.42, 3.6]} s={[1.8, 0.08, 0.35]} c="#7a5a3c" />
      </Tappable>

      <group position={[-3.0, 0, 3.2]}>
        <Car body="#f4f4f4" roof="#f4f4f4" stripe="#1f8a4c" />
      </group>
      <Cyl p={[0.8, 0.4, 2.8]} r={0.5} h={0.8} c="#9a927f" />
      <Tree p={[-7.0, 0, -1.4]} />
      <Tree p={[7.0, 0, -1.8]} s={0.9} />
      <Walkers walkers={VISITORS} />
    </group>
  );
}
