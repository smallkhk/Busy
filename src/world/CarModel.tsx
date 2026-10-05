import { useGLTF } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { type BufferGeometry, type Mesh, type MeshStandardMaterial } from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type CarKind = 'sedan' | 'suv' | 'gwagon' | 'gls' | 'challenger';

type V3 = [number, number, number];

function B({ p, s, c, metal = 0.35, rough = 0.4, emissive, r }: { p: V3; s: V3; c: string; metal?: number; rough?: number; emissive?: string; r?: V3 }) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} metalness={metal} roughness={rough} emissive={emissive ?? '#000'} emissiveIntensity={emissive ? 2.2 : 0} />
    </mesh>
  );
}

function Wheel({ p, r = 0.2, w = 0.16 }: { p: V3; r?: number; w?: number }) {
  return (
    <group position={p} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, w, 24]} />
        <meshStandardMaterial color="#141414" roughness={0.9} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[0, (side * w) / 2 + side * 0.002, 0]}>
            <cylinderGeometry args={[r * 0.62, r * 0.62, 0.01, 20]} />
            <meshStandardMaterial color="#c9ccd1" metalness={0.9} roughness={0.2} />
          </mesh>
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[0, (side * w) / 2 + side * 0.006, 0]} rotation={[0, (k * 2 * Math.PI) / 5, 0]}>
              <boxGeometry args={[r * 1.1, 0.008, 0.035]} />
              <meshStandardMaterial color="#8d9196" metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

const GLASS = '#1d2a36';
const CHROME = '#d5d8dc';

/** Nigerian plate: white with green writing. */
function Plate({ p, r }: { p: V3; r?: V3 }) {
  return (
    <group position={p} rotation={r}>
      <B p={[0, 0, 0]} s={[0.012, 0.09, 0.28]} c="#f4f4f4" metal={0} />
      <B p={[0.007, 0, 0]} s={[0.004, 0.03, 0.2]} c="#118a4c" metal={0} />
    </group>
  );
}

function Lights({ front, back, y, z, on, round }: { front: number; back: number; y: number; z: number; on: boolean; round?: boolean }) {
  return (
    <>
      {[-z, z].map((zz) => (
        <group key={zz}>
          {round ? (
            <mesh position={[front, y, zz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
              <meshStandardMaterial color="#fffbe6" emissive={on ? '#fff3c4' : '#000'} emissiveIntensity={on ? 3 : 0} />
            </mesh>
          ) : (
            <B p={[front, y, zz]} s={[0.03, 0.07, 0.2]} c="#fffbe6" emissive={on ? '#fff3c4' : undefined} metal={0.1} />
          )}
          <B p={[back, y, zz]} s={[0.03, 0.07, 0.18]} c="#8b0d12" emissive={on ? '#ff2a2a' : undefined} metal={0.1} />
        </group>
      ))}
      {on && <pointLight position={[front + 0.5, y, 0]} intensity={4} distance={4} color="#fff3c4" />}
    </>
  );
}

function Mirrors({ x, y, z, c }: { x: number; y: number; z: number; c: string }) {
  return (
    <>
      {[-z, z].map((zz) => (
        <B key={zz} p={[x, y, zz]} s={[0.08, 0.07, 0.1]} c={c} />
      ))}
    </>
  );
}

type GlbSpec = {
  file: string;
  /** Turn so the nose points +x. */
  rot: number;
  scale: number;
  /** Material that takes your paint. */
  body: string;
  glass: string[];
  tyres?: string;
  /** Glow when the lights are on: [headlamps, tail lights]. */
  head: string[];
  tail: string[];
  /** Where the headlamp beam starts, in model units. */
  beam: [number, number, number];
};

/** Real car models, shrunk for phones (see public/models/cars). */
const GLB_CARS: Partial<Record<CarKind, GlbSpec>> = {
  // 2020 Mercedes-Benz GLS 580, about 40k triangles
  gls: { file: 'gls', rot: Math.PI / 2, scale: 0.4, body: 'Polar_White', glass: ['WindowsTint', 'Lights_Glass'], tyres: 'Tyres', head: ['Lights_Glass'], tail: ['Color_A07', 'Color_A08'], beam: [0, 1.6, 4.5] },
  // Dodge Challenger, about 37k triangles
  challenger: { file: 'challenger', rot: Math.PI, scale: 0.66, body: 'Material', glass: ['Cam', 'Material.009'], tyres: 'Material.003', head: ['Material.008', 'Material.009'], tail: [], beam: [-2.2, 0.6, 0] },
};

/** These models come without normals (they are simplified hard); crease them once per mesh. */
const creased = new WeakMap<BufferGeometry, BufferGeometry>();

/** A real car model: its own parts keep their colours, the body takes your paint. */
function GlbCar({ spec, paint, lights }: { spec: GlbSpec; paint: string; lights: boolean }) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/cars/${spec.file}.glb`);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      let g = creased.get(m.geometry);
      if (!g) {
        g = toCreasedNormals(m.geometry, 0.6);
        creased.set(m.geometry, g);
      }
      m.geometry = g;
      m.castShadow = true;
      m.receiveShadow = true;
      const k = (m.material as MeshStandardMaterial).clone();
      const n = k.name;
      if (n === spec.body) {
        k.color.set(paint);
        k.metalness = 0.55;
        k.roughness = 0.28;
      } else if (spec.glass.includes(n)) {
        k.color.set('#1d2430');
        k.transparent = true;
        k.opacity = 0.7;
        k.metalness = 0.3;
        k.roughness = 0.05;
      } else if (n === spec.tyres) {
        k.metalness = 0;
        k.roughness = 0.9;
      } else {
        k.metalness = Math.min(k.metalness, 0.6);
        k.roughness = Math.max(k.roughness, 0.25);
      }
      if (lights && spec.head.includes(n)) {
        k.emissive.set('#fff3c4');
        k.emissiveIntensity = 2;
        k.opacity = 0.9;
      } else if (lights && spec.tail.includes(n)) {
        k.emissive.set('#ff2a2a');
        k.emissiveIntensity = 1.5;
      }
      m.material = k;
    });
    return c;
  }, [scene, spec, paint, lights]);
  return (
    <group rotation={[0, spec.rot, 0]} scale={spec.scale}>
      <primitive object={obj} />
      {lights && <pointLight position={spec.beam} intensity={4} distance={10} color="#fff3c4" />}
    </group>
  );
}

/** Showroom-quality cars, about 2 units long, facing +x. */
export function CarModel({ kind, paint, lights = false }: { kind: CarKind; paint: string; lights?: boolean }) {
  const spec = GLB_CARS[kind];
  if (spec) {
    return (
      <Suspense fallback={null}>
        <GlbCar spec={spec} paint={paint} lights={lights} />
      </Suspense>
    );
  }
  if (kind === 'sedan') {
    return (
      <group>
        {/* Lower body, bonnet and boot */}
        <B p={[0, 0.36, 0]} s={[2.0, 0.3, 0.9]} c={paint} />
        <B p={[0.72, 0.53, 0]} s={[0.55, 0.06, 0.86]} c={paint} r={[0, 0, -0.08]} />
        <B p={[-0.78, 0.53, 0]} s={[0.42, 0.06, 0.86]} c={paint} r={[0, 0, 0.06]} />
        {/* Cabin with sloped glass */}
        <B p={[-0.05, 0.7, 0]} s={[0.95, 0.3, 0.8]} c={paint} />
        <B p={[0.47, 0.68, 0]} s={[0.04, 0.3, 0.76]} c={GLASS} r={[0, 0, -0.75]} metal={0.6} rough={0.1} />
        <B p={[-0.56, 0.68, 0]} s={[0.04, 0.28, 0.76]} c={GLASS} r={[0, 0, 0.7]} metal={0.6} rough={0.1} />
        {[-0.405, 0.405].map((z) => (
          <B key={z} p={[-0.05, 0.71, z]} s={[0.85, 0.2, 0.01]} c={GLASS} metal={0.6} rough={0.1} />
        ))}
        {/* Grille, bumpers, door lines */}
        <B p={[1.0, 0.36, 0]} s={[0.02, 0.12, 0.5]} c="#1b1b1b" />
        <B p={[1.0, 0.23, 0]} s={[0.04, 0.08, 0.9]} c="#2a2a2a" />
        <B p={[-1.0, 0.23, 0]} s={[0.04, 0.08, 0.9]} c="#2a2a2a" />
        {[-0.451, 0.451].flatMap((z) => [0.15, -0.35].map((x) => <B key={`${x}${z}`} p={[x, 0.42, z]} s={[0.01, 0.28, 0.005]} c="#1b1b1b" />))}
        <Lights front={1.0} back={-1.0} y={0.42} z={0.32} on={lights} />
        <Mirrors x={0.42} y={0.6} z={0.48} c={paint} />
        <Plate p={[1.02, 0.3, 0]} />
        <Plate p={[-1.02, 0.36, 0]} r={[0, Math.PI, 0]} />
        {[-0.62, 0.62].flatMap((x) => [-0.42, 0.42].map((z) => <Wheel key={`${x}${z}`} p={[x, 0.2, z]} />))}
      </group>
    );
  }
  if (kind === 'suv') {
    return (
      <group>
        <B p={[0, 0.5, 0]} s={[2.15, 0.45, 0.98]} c={paint} />
        <B p={[0.8, 0.75, 0]} s={[0.55, 0.06, 0.94]} c={paint} r={[0, 0, -0.1]} />
        {/* Tall cabin to the back */}
        <B p={[-0.2, 0.98, 0]} s={[1.45, 0.42, 0.9]} c={paint} />
        <B p={[0.55, 0.95, 0]} s={[0.04, 0.4, 0.86]} c={GLASS} r={[0, 0, -0.6]} metal={0.6} rough={0.1} />
        <B p={[-0.93, 0.98, 0]} s={[0.02, 0.34, 0.8]} c={GLASS} metal={0.6} rough={0.1} />
        {[-0.455, 0.455].map((z) => (
          <B key={z} p={[-0.2, 1.0, z]} s={[1.3, 0.28, 0.01]} c={GLASS} metal={0.6} rough={0.1} />
        ))}
        {/* Roof rails, chrome grille, skid plate */}
        {[-0.35, 0.35].map((z) => (
          <B key={z} p={[-0.2, 1.22, z]} s={[1.3, 0.04, 0.04]} c={CHROME} metal={0.9} rough={0.2} />
        ))}
        <B p={[1.08, 0.55, 0]} s={[0.02, 0.22, 0.6]} c="#222" />
        {[-0.08, 0, 0.08].map((y) => (
          <B key={y} p={[1.09, 0.55 + y, 0]} s={[0.01, 0.02, 0.58]} c={CHROME} metal={0.9} rough={0.2} />
        ))}
        <B p={[1.08, 0.3, 0]} s={[0.05, 0.1, 0.8]} c="#9aa0a6" metal={0.6} />
        <B p={[-1.08, 0.33, 0]} s={[0.05, 0.12, 0.98]} c="#2a2a2a" />
        {/* Wheel arches */}
        {[-0.68, 0.68].flatMap((x) => [-0.5, 0.5].map((z) => <B key={`${x}${z}`} p={[x, 0.5, z]} s={[0.6, 0.12, 0.02]} c="#1b1b1b" />))}
        <Lights front={1.08} back={-1.08} y={0.64} z={0.36} on={lights} />
        <Mirrors x={0.5} y={0.85} z={0.52} c={paint} />
        <Plate p={[1.1, 0.42, 0]} />
        <Plate p={[-1.1, 0.5, 0]} r={[0, Math.PI, 0]} />
        {[-0.68, 0.68].flatMap((x) => [-0.46, 0.46].map((z) => <Wheel key={`${x}${z}`} p={[x, 0.25, z]} r={0.25} w={0.2} />))}
      </group>
    );
  }
  // G-wagon style: a proper box
  return (
    <group>
      <B p={[0, 0.58, 0]} s={[2.1, 0.52, 1.0]} c={paint} />
      <B p={[-0.12, 1.1, 0]} s={[1.55, 0.52, 0.96]} c={paint} />
      <B p={[0.67, 1.1, 0]} s={[0.02, 0.4, 0.86]} c={GLASS} metal={0.6} rough={0.1} />
      {[-0.485, 0.485].map((z) => (
        <B key={z} p={[-0.12, 1.12, z]} s={[1.4, 0.36, 0.01]} c={GLASS} metal={0.6} rough={0.1} />
      ))}
      {/* Chrome strip, fender flares, door handles */}
      {[-0.505, 0.505].map((z) => (
        <B key={z} p={[0, 0.7, z]} s={[2.0, 0.03, 0.01]} c={CHROME} metal={0.95} rough={0.15} />
      ))}
      {[-0.7, 0.7].flatMap((x) => [-0.51, 0.51].map((z) => <B key={`${x}${z}`} p={[x, 0.6, z]} s={[0.62, 0.14, 0.04]} c="#1b1b1b" />))}
      {[0.2, -0.45].flatMap((x) => [-0.506, 0.506].map((z) => <B key={`${x}${z}`} p={[x, 0.86, z]} s={[0.12, 0.03, 0.01]} c={CHROME} metal={0.95} />))}
      {/* Grille with star badge */}
      <B p={[1.06, 0.66, 0]} s={[0.02, 0.28, 0.5]} c="#111" />
      {[-0.15, -0.05, 0.05, 0.15].map((z) => (
        <B key={z} p={[1.07, 0.66, z]} s={[0.01, 0.26, 0.02]} c={CHROME} metal={0.95} />
      ))}
      <mesh position={[1.08, 0.66, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.015, 20]} />
        <meshStandardMaterial color={CHROME} metalness={1} roughness={0.1} />
      </mesh>
      <B p={[1.08, 0.36, 0]} s={[0.06, 0.12, 1.0]} c="#2a2a2a" />
      <B p={[-1.08, 0.36, 0]} s={[0.06, 0.12, 1.0]} c="#2a2a2a" />
      {/* Spare wheel on the back door */}
      <group position={[-1.12, 0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.26, 0.26, 0.16, 24]} />
          <meshStandardMaterial color="#141414" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.085, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.01, 24]} />
          <meshStandardMaterial color={paint} metalness={0.35} roughness={0.4} />
        </mesh>
      </group>
      <Lights front={1.07} back={-1.07} y={0.78} z={0.38} on={lights} round />
      <Mirrors x={0.55} y={1.0} z={0.55} c={paint} />
      <Plate p={[1.1, 0.48, 0]} />
      {[-0.7, 0.7].flatMap((x) => [-0.47, 0.47].map((z) => <Wheel key={`${x}${z}`} p={[x, 0.27, z]} r={0.27} w={0.22} />))}
    </group>
  );
}
