import { Person } from '../Avatar';
import { Box, Cyl, Tappable } from '../Room';
import { Car, Tree, Walkers, type Walker } from '../Street';
import { Flag, Ground } from './common';

/** Tall office block with rows of windows. */
function Block({ x }: { x: number }) {
  const floors = [1.0, 1.9, 2.8, 3.7, 4.6];
  return (
    <group position={[x, 0, -5]}>
      <Box p={[0, 2.75, 0]} s={[5.4, 5.5, 4]} c="#ddd5c4" />
      <Box p={[0, 5.55, 0]} s={[5.6, 0.12, 4.2]} c="#9c8f78" />
      {floors.map((y) =>
        [-2, -1, 0, 1, 2].map((wx) => (
          <Box key={`${y}${wx}`} p={[wx, y, 2.01]} s={[0.6, 0.45, 0.02]} c="#33566e" />
        )),
      )}
      {floors.map((y) =>
        [-1.4, -0.5, 0.4, 1.3].map((wz) => (
          <Box key={`s${y}${wz}`} p={[2.71, y, wz]} s={[0.02, 0.45, 0.55]} c="#33566e" />
        )),
      )}
    </group>
  );
}

const STAFF: Walker[] = [
  { from: -6, to: 6, z: -1.2, speed: 0.55, shirt: '#ecf0f1' },
  { from: 5, to: -5, z: 0.6, speed: 0.5, shirt: '#34495e' },
  { from: -4, to: 4, z: 2.0, speed: 0.6, shirt: '#2c3e50' },
];

export function Secretariat() {
  return (
    <group>
      <Ground color="#6f9a4b" />
      {/* Paved plaza */}
      <Ground color="#d2cbbb" size={[15, 6]} pos={[0, 0, 0.6]} />

      <Block x={-4.25} />
      <Block x={4.25} />

      <Tappable id="ministry">
        {/* Central entrance with columns */}
        <Box p={[0, 1.4, -4.2]} s={[3.2, 2.8, 2.4]} c="#e8e1d2" />
        <Box p={[0, 2.95, -3.0]} s={[3.6, 0.3, 1.2]} c="#cfc6b2" />
        {[-1.3, -0.45, 0.45, 1.3].map((x) => (
          <Cyl key={x} p={[x, 1.4, -2.6]} r={0.12} h={2.8} c="#f4efe6" />
        ))}
        <Box p={[0, 0.9, -2.99]} s={[1.2, 1.8, 0.04]} c="#5b3a21" />
        <Box p={[0, 0.06, -2.2]} s={[3.6, 0.12, 0.8]} c="#bfb6a3" />
      </Tappable>

      <Flag x={-2.4} z={-2.0} />
      <Flag x={2.4} z={-2.0} />

      <Tappable id="buka">
        {/* Canopy, table, pots */}
        <Box p={[-5.5, 2.0, 1.2]} s={[2.4, 0.06, 1.6]} c="#1f8a4c" />
        {[[-6.6, 0.5], [-4.4, 0.5], [-6.6, 1.9], [-4.4, 1.9]].map(([x, z]) => (
          <Cyl key={`${x}${z}`} p={[x, 1.0, z]} r={0.03} h={2.0} c="#666" />
        ))}
        <Box p={[-5.5, 0.45, 1.4]} s={[1.6, 0.08, 0.7]} c="#2c6e9b" />
        <Cyl p={[-5.9, 0.62, 1.4]} r={0.2} h={0.26} c="#a0a0a0" />
        <Cyl p={[-5.3, 0.6, 1.4]} r={0.18} h={0.22} c="#c0392b" />
        <group position={[-5.6, 0, 1.95]} rotation={[0, Math.PI, 0]}>
          <Person shirt="#e67e22" trousers="#e67e22" />
        </group>
      </Tappable>

      <Tappable id="bizcentre">
        <Box p={[-2.6, 0.9, 3.0]} s={[1.6, 1.8, 0.9]} c="#f1c40f" />
        <Box p={[-2.6, 1.0, 2.54]} s={[1.0, 0.7, 0.02]} c="#2c3e50" />
        <Box p={[-2.6, 1.95, 3.0]} s={[1.8, 0.12, 1.1]} c="#c0392b" />
      </Tappable>

      {/* Security post */}
      <group position={[6.4, 0, 0.8]}>
        <Box p={[0, 0.9, 0]} s={[1.0, 1.8, 1.0]} c="#efe4cf" />
        <Box p={[0, 1.85, 0]} s={[1.2, 0.1, 1.2]} c="#8c3b2a" />
        <group position={[-0.8, 0, 0.3]} rotation={[0, -Math.PI / 2, 0]}>
          <Person shirt="#2d3e2a" trousers="#2d3e2a" />
        </group>
      </group>

      <Tappable id="sec-bus">
        <Box p={[5.2, 2.0, 3.4]} s={[2.2, 0.08, 1.0]} c="#1f8a4c" />
        <Box p={[4.2, 1.0, 3.7]} s={[0.08, 2.0, 0.08]} c="#555" />
        <Box p={[6.2, 1.0, 3.7]} s={[0.08, 2.0, 0.08]} c="#555" />
        <Box p={[5.2, 0.42, 3.6]} s={[1.8, 0.08, 0.35]} c="#7a5a3c" />
      </Tappable>

      {/* Official cars */}
      {[[0.0, '#1d1d1d'], [1.9, '#ecf0f1']].map(([x, c]) => (
        <group key={x as number} position={[x as number, 0, 3.2]} rotation={[0, Math.PI / 2, 0]}>
          <Car body={c as string} roof={c as string} />
        </group>
      ))}

      <Tree p={[-7.4, 0, -1.6]} />
      <Tree p={[7.6, 0, -2.2]} s={0.9} />

      <Walkers walkers={STAFF} />
    </group>
  );
}
