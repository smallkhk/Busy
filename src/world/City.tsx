import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { CanvasTexture, Matrix4, MeshStandardMaterial, Object3D, Quaternion, SRGBColorSpace, Vector3, type BufferGeometry, type InstancedMesh, type Mesh, type Texture } from 'three';

/**
 * Kenney city kits (CC0), packed in public/models/city: suburban houses,
 * commercial blocks, road furniture and work vehicles. Every model is one mesh
 * on one shared colour-swatch texture, so a whole street of them is drawn with
 * a few instanced meshes.
 */
export type Kit = 'suburban' | 'commercial' | 'roads' | 'cars';

const url = (k: Kit) => `${import.meta.env.BASE_URL}models/city/${k}.glb`;

export type KitPart = { geometry: BufferGeometry; matrix: Matrix4; size: Vector3 };

/** Each model in a kit: its geometry and transform inside the model. */
export function useKit(kit: Kit) {
  const gltf = useGLTF(url(kit));
  return useMemo(() => {
    const parts: Record<string, KitPart[]> = {};
    let map: Texture | null = null;
    for (const holder of gltf.scene.children) {
      holder.updateWorldMatrix(true, true);
      const inv = new Matrix4().copy(holder.matrixWorld).invert();
      const list: KitPart[] = [];
      holder.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        map ??= (m.material as MeshStandardMaterial).map;
        m.geometry.computeBoundingBox();
        const size = new Vector3();
        m.geometry.boundingBox!.getSize(size);
        list.push({ geometry: m.geometry, matrix: new Matrix4().multiplyMatrices(inv, m.matrixWorld), size });
      });
      parts[holder.name] = list;
    }
    return { parts, map: map as Texture | null, scene: gltf.scene };
  }, [gltf]);
}

/** Size of a model on the ground (x, height, z) at scale 1. */
export function modelSize(part: KitPart[]) {
  const v = new Vector3();
  const s = new Vector3();
  const q = new Quaternion();
  const p = new Vector3();
  for (const { size, matrix } of part) {
    matrix.decompose(p, q, s);
    v.max(new Vector3(size.x * s.x, size.y * s.y, size.z * s.z));
  }
  return v;
}

// ---------------- Repainting the swatch texture ----------------

/** Swatches on the 512×512 Kenney colour map (x, y, w, h). */
const ROOF: [number, number, number, number] = [0, 128, 64, 128];
const WALL: [number, number, number, number] = [192, 256, 64, 128];
/** Car kit: the paint most vehicle bodies use. */
const BODY: [number, number, number, number] = [192, 256, 64, 128];
/** …and the colour on van and truck roofs and upper panels. */
const BODY_TOP: [number, number, number, number] = [448, 128, 64, 128];

export type Paint = { roof?: string; wall?: string; body?: string };

const painted = new Map<string, Texture>();

/** A copy of the kit texture with the roof, wall or car-body swatch painted over. */
export function paintedMap(base: Texture | null, key: string, paint: Paint) {
  if (!base?.image) return base;
  const id = `${key}|${paint.roof}|${paint.wall}|${paint.body}`;
  const hit = painted.get(id);
  if (hit) return hit;
  const img = base.image as CanvasImageSource & { width: number; height: number };
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  if (!ctx) return base;
  ctx.drawImage(img, 0, 0);
  const k = img.width / 512;
  const fill = (r: [number, number, number, number], color: string | CanvasGradient, op: GlobalCompositeOperation) => {
    ctx.globalCompositeOperation = op;
    ctx.fillStyle = color;
    ctx.fillRect(r[0] * k, r[1] * k, r[2] * k, r[3] * k);
  };
  // Solid new colour with the swatch's light-to-dark shading laid back on top
  const recolor = (r: [number, number, number, number], color: string) => {
    fill(r, color, 'source-over');
    const g = ctx.createLinearGradient(r[0] * k, 0, (r[0] + r[2]) * k, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.22)');
    fill(r, g, 'source-over');
  };
  if (paint.roof) recolor(ROOF, paint.roof);
  // White walls just take the tint
  if (paint.wall) fill(WALL, paint.wall, 'multiply');
  if (paint.body) {
    recolor(BODY, paint.body);
    recolor(BODY_TOP, paint.body);
  }
  const t = new CanvasTexture(c);
  t.flipY = base.flipY;
  t.colorSpace = SRGBColorSpace;
  t.magFilter = base.magFilter;
  t.minFilter = base.minFilter;
  t.generateMipmaps = base.generateMipmaps;
  painted.set(id, t);
  return t;
}

const materials = new Map<Texture | null, MeshStandardMaterial>();
export function kitMaterial(map: Texture | null) {
  let m = materials.get(map);
  if (!m) {
    m = new MeshStandardMaterial({ map, roughness: 0.75, metalness: 0 });
    materials.set(map, m);
  }
  return m;
}

// ---------------- Instancing ----------------

export type Placement = { x: number; z: number; rot?: number; s?: number; y?: number };

const tmp = new Matrix4();
const place = new Matrix4();
const dummy = new Object3D();

/** Draw one model at many spots with a single draw call per mesh. */
export function KitInstances({ part, at, material, shadows = true }: { part: KitPart[]; at: Placement[]; material: MeshStandardMaterial; shadows?: boolean }) {
  return (
    <>
      {part.map((p, i) => (
        <PartInstances key={i} part={p} at={at} material={material} shadows={shadows} />
      ))}
    </>
  );
}

function PartInstances({ part, at, material, shadows }: { part: KitPart; at: Placement[]; material: MeshStandardMaterial; shadows: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    at.forEach((a, i) => {
      dummy.position.set(a.x, a.y ?? 0, a.z);
      dummy.rotation.set(0, a.rot ?? 0, 0);
      dummy.scale.setScalar(a.s ?? 1);
      dummy.updateMatrix();
      place.copy(dummy.matrix);
      tmp.multiplyMatrices(place, part.matrix);
      m.setMatrixAt(i, tmp);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [at, part]);
  if (at.length === 0) return null;
  return <instancedMesh ref={ref} args={[part.geometry, material, at.length]} castShadow={shadows} receiveShadow />;
}

/** One model, placed once (a street light, a sign, a van). */
export function KitModel({ kit, name, p = [0, 0, 0], rot = 0, s = 1, paint }: { kit: Kit; name: string; p?: [number, number, number]; rot?: number; s?: number; paint?: Paint }) {
  const { parts, map } = useKit(kit);
  const part = parts[name];
  const material = useMemo(() => kitMaterial(paint ? paintedMap(map, kit, paint) : map), [map, kit, paint]);
  if (!part) return null;
  return (
    <group position={p} rotation={[0, rot, 0]} scale={s}>
      {part.map((q, i) => (
        <mesh key={i} geometry={q.geometry} material={material} matrixAutoUpdate={false} matrix={q.matrix} castShadow receiveShadow />
      ))}
    </group>
  );
}

export const preloadCity = () => (['suburban', 'commercial', 'roads', 'cars'] as Kit[]).forEach((k) => useGLTF.preload(url(k)));
