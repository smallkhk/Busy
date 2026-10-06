import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import type { Material, Mesh, MeshStandardMaterial } from 'three';

/**
 * The airport terminal: "Airport" by mamont nikita (Sketchfab, CC-BY-4.0), cut down to
 * the terminal area and simplified (see public/models/LICENSE-airport.txt). The jets
 * that came with it wore real airline colours, so they are taken out.
 */
const URL = `${import.meta.env.BASE_URL}models/airport.glb`;
/** Model units are inches; this fits the whole terminal across one city block. */
const S = 0.00119;
/** Buildings stand a bit taller than true scale so they read next to people. */
const SY = S * 3.2;
/** Middle of the model's footprint (after the cut). */
const MID: [number, number, number] = [-6112, 0, 15306];

/** Glass front faces +z (toward the road); the apron is behind. */
export function AirportModel({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF(URL);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    const done = new Map<Material, Material>();
    c.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      // Simplified geometry has rough normals: flat shading looks clean
      const fix = (mat: Material) => {
        let n = done.get(mat);
        if (!n) {
          n = mat.clone();
          (n as MeshStandardMaterial).flatShading = true;
          done.set(mat, n);
        }
        return n;
      };
      m.material = Array.isArray(m.material) ? m.material.map(fix) : fix(m.material);
      m.receiveShadow = true;
    });
    return c;
  }, [scene]);
  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]} scale={[S, SY, S]}>
      <primitive object={obj} position={MID} />
    </group>
  );
}

export const preloadAirport = () => useGLTF.preload(URL);
