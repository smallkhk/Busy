import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Color, type Group, type MeshStandardMaterial } from 'three';
import { Person } from '../Avatar';
import { Box, Cyl, Tappable } from '../Room';
import { Car } from '../Street';
import { Ground } from './common';

const FLOOR_COLORS = ['#ff3d7f', '#3dd6ff', '#ffd23d', '#8b5cff', '#3dff9a'].map((c) => new Color(c));

/** 4x4 light-up tiles that cycle colours to the beat. */
function DanceFloor() {
  const mats = useRef<(MeshStandardMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const beat = Math.floor(clock.getElapsedTime() * 2);
    mats.current.forEach((m, i) => {
      if (!m) return;
      const c = FLOOR_COLORS[(i + beat * 3 + (i % 4) * beat) % FLOOR_COLORS.length];
      m.color.copy(c);
      m.emissive.copy(c);
    });
  });
  return (
    <group position={[0.4, 0.02, -0.6]}>
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} position={[(i % 4) * 0.75 - 1.125, 0, Math.floor(i / 4) * 0.75 - 1.125]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.7, 0.7]} />
          <meshStandardMaterial ref={(m) => { mats.current[i] = m; }} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Dancers() {
  const refs = useRef<(Group | null)[]>([]);
  const spots: [number, number, string][] = [[-0.3, -1.2, '#e84393'], [1.1, -0.1, '#00cec9'], [-0.2, 0.3, '#fdcb6e']];
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((g, i) => {
      if (!g) return;
      g.position.y = Math.abs(Math.sin(t * 4 + i)) * 0.12;
      g.rotation.y = Math.sin(t * 1.5 + i * 2) * 0.8;
    });
  });
  return (
    <>
      {spots.map(([x, z, shirt], i) => (
        <group key={i} position={[x, 0, z]}>
          <group ref={(g) => { refs.current[i] = g; }}>
            <Person shirt={shirt} trousers={i % 2 ? '#1d1d1d' : undefined} woman={i % 2 === 0} move="Wave" />
          </group>
        </group>
      ))}
    </>
  );
}

function Neon({ p, s, c }: { p: [number, number, number]; s: [number, number, number]; c: string }) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2} />
    </mesh>
  );
}

export function Lounge() {
  return (
    <group>
      <Ground color="#2a2630" />
      <Ground color="#1b1a22" size={[14, 8]} pos={[-0.5, 0, -0.6]} />

      {/* Back wall with neon */}
      <Box p={[-0.5, 1.6, -4.3]} s={[14, 3.2, 0.2]} c="#14131a" />
      <Neon p={[-0.5, 3.0, -4.18]} s={[13, 0.06, 0.04]} c="#ff3d7f" />
      <Neon p={[-0.5, 0.2, -4.18]} s={[13, 0.06, 0.04]} c="#3dd6ff" />
      <Box p={[-0.5, 2.45, -4.17]} s={[4.2, 0.7, 0.04]} c="#0d0c12" />
      <Neon p={[-0.5, 2.45, -4.15]} s={[3.6, 0.14, 0.03]} c="#e8b04b" />
      {/* Side wall */}
      <Box p={[-7.4, 1.6, -0.6]} s={[0.2, 3.2, 7.6]} c="#18171e" />
      <Neon p={[-7.28, 2.9, -0.6]} s={[0.04, 0.06, 7.2]} c="#8b5cff" />

      {/* String lights */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-6 + i * 1.1, 3.1 - Math.sin((i / 11) * Math.PI) * 0.4, 0.6]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#fff2b0" emissive="#ffd27a" emissiveIntensity={2.5} />
        </mesh>
      ))}

      <Tappable id="bar">
        <Box p={[-4.2, 0.55, -2.6]} s={[3.2, 1.1, 0.7]} c="#3b2a1f" />
        <Box p={[-4.2, 1.12, -2.6]} s={[3.3, 0.06, 0.8]} c="#c9a24a" />
        <Box p={[-4.2, 1.7, -4.0]} s={[3.0, 0.06, 0.3]} c="#3b2a1f" />
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[-5.4 + i * 0.3, 1.88, -4.0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.3, 8]} />
            <meshStandardMaterial color={['#3dff9a', '#e8b04b', '#ff3d7f'][i % 3]} emissive={['#1a7a4a', '#7a5a1a', '#7a1a3a'][i % 3]} emissiveIntensity={0.8} transparent opacity={0.85} />
          </mesh>
        ))}
        <group position={[-4.2, 0, -3.4]}>
          <Person shirt="#111" trousers="#111" />
        </group>
      </Tappable>

      <Tappable id="dancefloor">
        <DanceFloor />
      </Tappable>
      <Dancers />

      <Tappable id="dj">
        <Box p={[3.2, 0.5, -2.9]} s={[1.8, 1.0, 0.7]} c="#111" />
        <Neon p={[3.2, 0.5, -2.54]} s={[1.6, 0.05, 0.02]} c="#3dd6ff" />
        <Cyl p={[2.8, 1.04, -2.9]} r={0.2} h={0.04} c="#333" />
        <Cyl p={[3.6, 1.04, -2.9]} r={0.2} h={0.04} c="#333" />
        <group position={[3.2, 0, -3.6]}>
          <Person shirt="#ff3d7f" woman />
        </group>
        {[1.8, 4.6].map((x) => (
          <group key={x}>
            <Box p={[x, 0.8, -3.2]} s={[0.6, 1.6, 0.6]} c="#0d0d0d" />
            <Cyl p={[x, 0.5, -2.89]} r={0.2} h={0.02} c="#444" />
            <Cyl p={[x, 1.15, -2.89]} r={0.12} h={0.02} c="#444" />
          </group>
        ))}
      </Tappable>

      {/* VIP couches */}
      {[[-5.2, 1.2], [-3.4, 1.2]].map(([x, z]) => (
        <group key={x} position={[x, 0, z]}>
          <Box p={[0, 0.25, 0]} s={[1.4, 0.4, 0.7]} c="#6b1f3a" />
          <Box p={[0, 0.6, -0.3]} s={[1.4, 0.5, 0.15]} c="#561830" />
          <Box p={[0, 0.25, 0.9]} s={[0.6, 0.4, 0.4]} c="#c9a24a" />
          <group position={[-0.3, 0.2, 0.05]} scale={0.9}>
            <Person shirt={x < -4 ? '#e8b04b' : '#ecf0f1'} trousers="#1d1d1d" />
          </group>
        </group>
      ))}

      {/* Entrance with bouncer */}
      <Box p={[3.2, 1.2, 1.9]} s={[0.25, 2.4, 0.25]} c="#2b2b33" />
      <Neon p={[3.2, 2.45, 1.9]} s={[0.3, 0.06, 0.3]} c="#e8b04b" />
      <group position={[2.6, 0, 2.2]} rotation={[0, Math.PI / 4, 0]}>
        <Person shirt="#0d0d0d" trousers="#0d0d0d" kind="suit" />
      </group>

      <Tappable id="lounge-park">
        <group position={[5.2, 0, 3.1]}>
          <Car body="#f4f4f4" roof="#f4f4f4" stripe="#1f8a4c" />
        </group>
      </Tappable>
      {[[-3.6, '#c0c0c0'], [-1.4, '#0d0d0d']].map(([x, c]) => (
        <group key={x as number} position={[x as number, 0, 3.2]}>
          <Car body={c as string} roof={c as string} />
        </group>
      ))}

      {/* Party lights (plus a purple fill so the room no too dark) */}
      <ambientLight intensity={0.55} color="#a58bd6" />
      <hemisphereLight args={['#8b5cff', '#1b1a22', 0.6]} />
      <pointLight position={[0.4, 2.6, -0.6]} intensity={10} distance={7} color="#ff3d7f" />
      <pointLight position={[-4.2, 2.2, -2.2]} intensity={7} distance={6} color="#ffd27a" />
      <pointLight position={[3.2, 2.2, -2.2]} intensity={7} distance={6} color="#3dd6ff" />
    </group>
  );
}
