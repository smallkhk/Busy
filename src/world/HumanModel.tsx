import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { Box3, Color, Vector3, type Group, type Material, type Mesh, type MeshStandardMaterial } from 'three';
import { SkeletonUtils } from 'three-stdlib';

/** Quaternius "Ultimate Modular Men" characters (CC0), packed with meshopt in public/models. */
export type HumanKind = 'casual_2' | 'casual_hoodie' | 'suit' | 'worker' | 'farmer' | 'beach' | 'king';
export type Move = 'Idle' | 'Walk' | 'Run' | 'Wave' | 'Interact';

const url = (k: HumanKind) => `${import.meta.env.BASE_URL}models/${k}.glb`;

/** Target standing height in world units (matches the old blocky people). */
const HEIGHT = 1.5;

/** Darker shade of a skin colour for lips/shadows the model paints separately. */
const darker = (hex: string) => `#${new Color(hex).multiplyScalar(0.78).getHexString()}`;

/**
 * A rigged, animated human. `skin` recolours the skin materials; `tint` recolours
 * any other material by name (e.g. the shirt).
 */
export function HumanModel({ kind, skin, tint, move = 'Idle' }: { kind: HumanKind; skin?: string; tint?: Record<string, string>; move?: Move }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(url(kind));

  // Each person needs their own skeleton and materials
  const { model, scale } = useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as Group;
    clone.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.frustumCulled = false;
      const recolor = (mat: Material) => {
        const c = (mat as MeshStandardMaterial).clone();
        const name = mat.name;
        if (skin && name === 'Skin') c.color.set(skin);
        else if (skin && name === 'Skin_Darker') c.color.set(darker(skin));
        else if (tint?.[name]) c.color.set(tint[name]);
        return c;
      };
      m.material = Array.isArray(m.material) ? m.material.map(recolor) : recolor(m.material);
    });
    const size = new Box3().setFromObject(clone).getSize(new Vector3());
    return { model: clone, scale: size.y > 0 ? HEIGHT / size.y : 1 };
  }, [scene, skin, JSON.stringify(tint)]);

  const { actions } = useAnimations(animations, group);
  useEffect(() => {
    const a = actions[move] ?? actions.Idle;
    a?.reset().fadeIn(0.2).play();
    return () => {
      a?.fadeOut(0.2);
    };
  }, [actions, move]);

  return (
    <group ref={group} scale={scale}>
      <primitive object={model} />
    </group>
  );
}

export const preloadHumans = (kinds: HumanKind[]) => kinds.forEach((k) => useGLTF.preload(url(k)));
