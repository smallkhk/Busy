import { useGLTF } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { Box3, Group, Vector3, type Material, type Mesh, type MeshStandardMaterial } from 'three';

/** Kenney "Furniture Kit" models (CC0) in public/models/furniture. */
export type PropName =
  | 'bedDouble' | 'bedSingle' | 'sideTable' | 'sideTableDrawers' | 'lampRoundTable' | 'lampSquareFloor' | 'lampRoundFloor' | 'lampWall'
  | 'pottedPlant' | 'plantSmall1' | 'plantSmall2' | 'plantSmall3'
  | 'loungeSofaCorner' | 'loungeSofaLong' | 'loungeSofa' | 'loungeChair' | 'loungeDesignSofa' | 'loungeSofaOttoman'
  | 'tableCoffee' | 'tableCoffeeGlass' | 'tableCoffeeGlassSquare' | 'rugRound' | 'rugRectangle' | 'rugRounded'
  | 'televisionModern' | 'televisionVintage' | 'cabinetTelevision' | 'cabinetTelevisionDoors' | 'speaker' | 'speakerSmall'
  | 'kitchenCabinet' | 'kitchenCabinetDrawer' | 'kitchenCabinetUpper' | 'kitchenCabinetUpperDouble' | 'kitchenStove' | 'kitchenSink'
  | 'kitchenFridgeLarge' | 'kitchenFridge' | 'kitchenFridgeSmall' | 'kitchenBar' | 'kitchenBarEnd' | 'stoolBar' | 'stoolBarSquare'
  | 'kitchenMicrowave' | 'hoodModern' | 'kitchenCoffeeMachine'
  | 'toilet' | 'shower' | 'showerRound' | 'bathroomSink' | 'bathroomSinkSquare' | 'bathroomMirror' | 'bathroomCabinet' | 'bathtub'
  | 'tableRound' | 'table' | 'tableCloth' | 'chair' | 'chairCushion' | 'chairDesk' | 'chairModernCushion' | 'desk' | 'computerScreen' | 'computerKeyboard'
  | 'bookcaseOpen' | 'bookcaseClosedDoors' | 'bookcaseOpenLow' | 'ceilingFan' | 'washer' | 'coatRackStanding' | 'books' | 'laptop' | 'radio'
  | 'trashcan' | 'cardboardBoxClosed' | 'pillow' | 'pillowLong' | 'benchCushion';

const url = (n: PropName) => `${import.meta.env.BASE_URL}models/furniture/${n}.glb`;

/** Kenney models are small: this makes a chair chair-sized next to our people. */
const KS = 1.6;

const size = new Vector3();
const center = new Vector3();
const box = new Box3();

/**
 * One piece of furniture: centred on its footprint, standing on y = 0, recoloured
 * by material name (`wood`, `carpet`, `metal`…) with `tint`.
 */
function PropModel({ name, tint, glossy }: { name: PropName; tint?: Record<string, string>; glossy?: boolean }) {
  const { scene } = useGLTF(url(name));
  const tintKey = JSON.stringify(tint ?? {});
  const obj = useMemo(() => {
    const tints: Record<string, string> = JSON.parse(tintKey);
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const recolor = (mat: Material) => {
        const k = (mat as MeshStandardMaterial).clone();
        if (tints[mat.name]) k.color.set(tints[mat.name]);
        if (glossy) k.roughness = Math.min(k.roughness, 0.35);
        if (mat.name === 'glass') {
          k.transparent = true;
          k.opacity = 0.35;
        }
        return k;
      };
      m.material = Array.isArray(m.material) ? m.material.map(recolor) : recolor(m.material);
    });
    box.setFromObject(c);
    box.getSize(size);
    box.getCenter(center);
    c.position.set(-center.x, -box.min.y, -center.z);
    const g = new Group();
    g.add(c);
    return g;
  }, [scene, tintKey, glossy]);
  return <primitive object={obj} />;
}

/** Place a piece of furniture. `rot` turns it (radians), `s` scales on top of the kit size. */
export function Prop({ name, p = [0, 0, 0], rot = 0, s = 1, tint, glossy }: { name: PropName; p?: [number, number, number]; rot?: number; s?: number | [number, number, number]; tint?: Record<string, string>; glossy?: boolean }) {
  const sc: [number, number, number] = Array.isArray(s) ? [s[0] * KS, s[1] * KS, s[2] * KS] : [s * KS, s * KS, s * KS];
  return (
    <group position={p} rotation={[0, rot, 0]} scale={sc}>
      <Suspense fallback={null}>
        <PropModel name={name} tint={tint} glossy={glossy} />
      </Suspense>
    </group>
  );
}

export const preloadProps = (names: PropName[]) => names.forEach((n) => useGLTF.preload(url(n)));
