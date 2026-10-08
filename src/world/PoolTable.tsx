import { Box, Cyl } from './Room';

/** A 3D pool table (long side along z) with a few balls racked and a cue on top. */
export function PoolTable({ p, rot = 0 }: { p: [number, number, number]; rot?: number }) {
  const balls = ['#f2c230', '#d63031', '#2a5db0', '#111111', '#e67e22', '#1e8449'];
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <Box p={[0, 0.72, 0]} s={[1.3, 0.12, 2.4]} c="#5b3a21" />
      <Box p={[0, 0.785, 0]} s={[1.1, 0.02, 2.2]} c="#1a7f4b" />
      {[-0.55, 0.55].map((x) => <Box key={x} p={[x, 0.82, 0]} s={[0.1, 0.06, 2.3]} c="#3b2414" />)}
      {[-1.1, 1.1].map((z) => <Box key={z} p={[0, 0.82, z]} s={[1.2, 0.06, 0.1]} c="#3b2414" />)}
      {[-0.5, 0.5].flatMap((x) => [-1.05, 0, 1.05].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.8, z]} r={0.055} h={0.04} c="#0b0b0b" />))}
      {[-0.5, 0.5].flatMap((x) => [-1, 1].map((z) => <Box key={`l${x}${z}`} p={[x, 0.33, z]} s={[0.12, 0.66, 0.12]} c="#3b2414" />))}
      {balls.map((c, i) => {
        const row = i < 1 ? 0 : i < 3 ? 1 : 2;
        const k = i < 1 ? 0 : i < 3 ? i - 1 : i - 3;
        return (
          <mesh key={i} position={[(k - row / 2) * 0.07, 0.83, -0.55 - row * 0.06]}>
            <sphereGeometry args={[0.035, 12, 10]} />
            <meshStandardMaterial color={c} roughness={0.25} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.83, 0.6]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshStandardMaterial color="#f7f5ee" roughness={0.25} />
      </mesh>
      <Box p={[0.25, 0.86, 0.2]} s={[0.025, 0.025, 1.5]} r={[0, 0.25, 0]} c="#d9b26a" />
      {/* Lamp over the table */}
      <Box p={[0, 2.3, 0]} s={[0.5, 0.12, 1.6]} c="#1f3a2a" />
      <pointLight position={[0, 2.1, 0]} intensity={4} distance={3.5} color="#fff2c4" />
    </group>
  );
}
