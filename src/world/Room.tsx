import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useState, type ReactNode } from 'react';
import { INTERACTABLES } from '../content/activities';
import { useGame } from '../store/game';
import { Person } from './Avatar';

type V3 = [number, number, number];

function Box({ p, s, c, r }: { p: V3; s: V3; c: string; r?: V3 }) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} />
    </mesh>
  );
}

function Cyl({ p, r, h, c }: { p: V3; r: number; h: number; c: string }) {
  return (
    <mesh position={p} castShadow>
      <cylinderGeometry args={[r, r, h, 16]} />
      <meshStandardMaterial color={c} />
    </mesh>
  );
}

/** Wraps furniture so tapping it opens its action menu. */
function Tappable({ id, children }: { id: string; children: ReactNode }) {
  const [hover, setHover] = useState(false);
  const openMenu = useGame((s) => s.openMenu);
  const item = INTERACTABLES.find((i) => i.id === id)!;
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    openMenu(id);
  };
  return (
    <group
      onPointerDown={onDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = '';
      }}
      scale={hover ? 1.03 : 1}
    >
      {children}
      <Html position={item.label} center zIndexRange={[5, 0]}>
        <button className="obj-chip" onPointerDown={(e) => { e.stopPropagation(); openMenu(id); }}>
          {item.emoji}
        </button>
      </Html>
    </group>
  );
}

export function Room() {
  const walkTo = useGame((s) => s.walkTo);
  const power = useGame((s) => s.power);

  const onFloor = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    walkTo(e.point.x, e.point.z);
  };

  return (
    <group>
      {/* Ground: compound sand + tiled room floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, -0.02, 0.5]} receiveShadow onPointerDown={onFloor}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#b98f5e" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow onPointerDown={onFloor}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#d9cbb0" />
      </mesh>
      {/* Bathroom tiles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 0.005, -2.2]} receiveShadow onPointerDown={onFloor}>
        <planeGeometry args={[2, 1.6]} />
        <meshStandardMaterial color="#9ec3cf" />
      </mesh>
      {/* Concrete compound slab outside the door */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5.2, 0.004, 1.2]} receiveShadow onPointerDown={onFloor}>
        <planeGeometry args={[2.4, 5]} />
        <meshStandardMaterial color="#a7a39a" />
      </mesh>

      {/* Back walls (cream paint, with the classic skirting) */}
      <Box p={[0, 1.4, -3.05]} s={[8, 2.8, 0.1]} c="#efe4cf" />
      <Box p={[-4.05, 1.4, 0]} s={[0.1, 2.8, 6.2]} c="#e8dcc3" />
      <Box p={[0, 0.08, -2.99]} s={[8, 0.16, 0.02]} c="#6b4b2e" />
      <Box p={[-3.99, 0.08, 0]} s={[0.02, 0.16, 6.2]} c="#6b4b2e" />
      {/* Front walls are cut away (dollhouse view); skirting marks the edge */}
      <Box p={[4.0, 0.05, -1.1]} s={[0.08, 0.1, 3.8]} c="#6b4b2e" />
      <Box p={[4.0, 0.05, 2.75]} s={[0.08, 0.1, 0.5]} c="#6b4b2e" />
      {/* Bathroom partition */}
      <Box p={[1.95, 1, -2.4]} s={[0.08, 2, 1.2]} c="#cfe0e5" />

      {/* Window with burglary-proof */}
      <Box p={[-1.8, 1.7, -2.99]} s={[1.3, 0.9, 0.02]} c={power ? '#9fd3f0' : '#7fb3d0'} />
      {[-2.2, -1.8, -1.4].map((x) => (
        <Box key={x} p={[x, 1.7, -2.97]} s={[0.04, 0.9, 0.02]} c="#333" />
      ))}

      {/* Bulb */}
      <mesh position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={power ? '#fff3c4' : '#666'} emissive={power ? '#ffd27a' : '#000'} emissiveIntensity={power ? 2 : 0} />
      </mesh>

      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.8, 0.01, 1]} receiveShadow onPointerDown={onFloor}>
        <planeGeometry args={[2.2, 1.6]} />
        <meshStandardMaterial color="#8c2f39" />
      </mesh>

      <Tappable id="bed">
        <Box p={[-2.9, 0.2, -1.9]} s={[1.5, 0.4, 2.1]} c="#5b3a21" />
        <Box p={[-2.9, 0.47, -1.85]} s={[1.4, 0.16, 2.0]} c="#e9e4f2" />
        <Box p={[-2.9, 0.5, -1.6]} s={[1.42, 0.17, 1.3]} c="#2d6a8a" />
        <Box p={[-2.9, 0.62, -2.6]} s={[0.9, 0.12, 0.4]} c="#fafafa" />
        <Box p={[-2.9, 0.7, -2.95]} s={[1.5, 0.9, 0.08]} c="#5b3a21" />
      </Tappable>

      <Tappable id="cooler">
        <Box p={[-0.7, 0.25, -2.6]} s={[0.8, 0.5, 0.5]} c="#c8312b" />
        <Box p={[-0.7, 0.54, -2.6]} s={[0.84, 0.08, 0.54]} c="#f4f4f4" />
        <Box p={[-0.7, 0.6, -2.6]} s={[0.4, 0.04, 0.08]} c="#f4f4f4" />
      </Tappable>

      <Tappable id="stove">
        <Box p={[0.8, 0.4, -2.65]} s={[1.0, 0.8, 0.5]} c="#7a5a3c" />
        <Box p={[0.8, 0.86, -2.65]} s={[0.8, 0.1, 0.42]} c="#2b2b2b" />
        <Cyl p={[0.62, 0.93, -2.65]} r={0.1} h={0.04} c="#555" />
        <Cyl p={[0.98, 0.93, -2.65]} r={0.1} h={0.04} c="#555" />
        <Cyl p={[0.62, 1.03, -2.65]} r={0.13} h={0.16} c="#b5b5b5" />
        {/* Gas cylinder */}
        <Cyl p={[1.55, 0.3, -2.7]} r={0.17} h={0.6} c="#2f8f4e" />
      </Tappable>

      <Tappable id="bucket">
        <Cyl p={[2.5, 0.2, -2.6]} r={0.2} h={0.4} c="#2f6fd6" />
        <Cyl p={[2.5, 0.41, -2.6]} r={0.18} h={0.02} c="#8fc8ff" />
        <Box p={[2.85, 0.12, -2.65]} s={[0.25, 0.2, 0.25]} c="#f0c419" />
      </Tappable>

      <Tappable id="toilet">
        <Box p={[3.5, 0.22, -2.55]} s={[0.4, 0.44, 0.55]} c="#f5f5f5" />
        <Box p={[3.5, 0.6, -2.85]} s={[0.45, 0.45, 0.2]} c="#f5f5f5" />
      </Tappable>

      <Tappable id="tv">
        <Box p={[-3.6, 0.3, 1]} s={[0.5, 0.6, 1.4]} c="#3d2a1a" />
        <Box p={[-3.62, 0.95, 1]} s={[0.08, 0.68, 1.15]} c="#111" />
        <mesh position={[-3.57, 0.95, 1]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.05, 0.58]} />
          <meshStandardMaterial color={power ? '#4aa3df' : '#0b0b0b'} emissive={power ? '#1d6fa5' : '#000'} emissiveIntensity={power ? 0.8 : 0} />
        </mesh>
        {/* Red plastic chairs */}
        {[0.6, 1.4].map((z) => (
          <group key={z} position={[-1.7, 0, z]}>
            <Box p={[0, 0.42, 0]} s={[0.45, 0.06, 0.45]} c="#d62f2f" />
            <Box p={[0.2, 0.72, 0]} s={[0.06, 0.6, 0.45]} c="#d62f2f" />
            {[-0.18, 0.18].flatMap((x) => [-0.18, 0.18].map((zz) => (
              <Box key={`${x}${zz}`} p={[x, 0.2, zz]} s={[0.05, 0.4, 0.05]} c="#d62f2f" />
            )))}
          </group>
        ))}
      </Tappable>

      {/* Standing fan */}
      <group position={[2.6, 0, 0.6]}>
        <Cyl p={[0, 0.03, 0]} r={0.25} h={0.06} c="#333" />
        <Cyl p={[0, 0.6, 0]} r={0.03} h={1.2} c="#ccc" />
        <Cyl p={[0, 1.25, 0]} r={0.25} h={0.08} c="#e8e8e8" />
      </group>

      {/* Door (open) */}
      <Box p={[4.05, 1.0, 1.85]} s={[0.06, 2, 0.05]} c="#5b3a21" />
      <Box p={[4.5, 1.0, 1.35]} s={[0.9, 2, 0.06]} c="#7a4e2a" r={[0, -0.6, 0]} />

      <Tappable id="bench">
        <Box p={[3.6, 0.35, 3.3]} s={[1.6, 0.08, 0.4]} c="#8a6a45" />
        <Box p={[3.0, 0.17, 3.3]} s={[0.08, 0.34, 0.35]} c="#6b4f32" />
        <Box p={[4.2, 0.17, 3.3]} s={[0.08, 0.34, 0.35]} c="#6b4f32" />
        <group position={[3.2, 0.12, 3.35]} rotation={[0, Math.PI, 0]} scale={0.9}>
          <Person shirt="#7b4fb0" trousers="#3a3a3a" skin="#6b4430" />
        </group>
      </Tappable>

      <Tappable id="maishayi">
        {/* Kiosk table + bench + kettle + bread */}
        <Box p={[5.8, 0.45, 0]} s={[1.2, 0.08, 0.7]} c="#2c6e9b" />
        {[[-0.5, -0.28], [0.5, -0.28], [-0.5, 0.28], [0.5, 0.28]].map(([x, z]) => (
          <Box key={`${x}${z}`} p={[5.8 + x, 0.22, z]} s={[0.06, 0.45, 0.06]} c="#1f4f70" />
        ))}
        <Cyl p={[5.5, 0.6, 0]} r={0.1} h={0.22} c="#c9c9c9" />
        <Box p={[6.05, 0.55, 0.05]} s={[0.4, 0.12, 0.2]} c="#e0a94f" />
        <Box p={[5.85, 0.52, -0.15]} s={[0.2, 0.06, 0.2]} c="#f4e3b0" />
        <group position={[6.6, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <Person shirt="#f2f2f2" trousers="#f2f2f2" skin="#4a2e1d" />
          {/* Cap */}
          <mesh position={[0, 1.42, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.12, 16]} />
            <meshStandardMaterial color="#8b1e3f" />
          </mesh>
        </group>
        {/* Umbrella */}
        <Cyl p={[6.3, 1.1, 0.35]} r={0.03} h={2.2} c="#777" />
        <mesh position={[6.3, 2.2, 0.35]}>
          <coneGeometry args={[1.1, 0.4, 8]} />
          <meshStandardMaterial color="#e2a531" />
        </mesh>
      </Tappable>

      {/* Compound fence */}
      <Box p={[2, 0.8, -4.1]} s={[11, 1.6, 0.15]} c="#cbbd9d" />
    </group>
  );
}
