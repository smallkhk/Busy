import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import {
  Box3,
  Color,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Material,
} from 'three';
import { SkeletonUtils } from 'three-stdlib';

/** Quaternius "Ultimate Modular Men/Women" characters (CC0), packed with meshopt in public/models. */
export type HumanKind = 'casual_2' | 'casual_hoodie' | 'suit' | 'worker' | 'beach' | 'w_casual' | 'w_formal' | 'w_suit';
export type Move = 'Idle' | 'Walk' | 'Run' | 'Wave' | 'Interact';

/** Something on the head: Hausa hula cap, Yoruba fila, face cap or a gele headtie. */
export type Hat = { type: 'hula' | 'fila' | 'cap' | 'gele' | 'afro'; color: string; band?: string };

const url = (k: HumanKind) => `${import.meta.env.BASE_URL}models/${k}.glb`;

/** Target standing height in world units (matches the old blocky people). */
const HEIGHT = 1.5;

/** Darker shade of a colour, for skin shadows and embroidery. */
export const darker = (hex: string, by = 0.78) => `#${new Color(hex).multiplyScalar(by).getHexString()}`;

/** The hat's meshes, built in world units with the base at y = 0. */
function hatMeshes(hat: Hat): Group {
  const g = new Group();
  const mat = (c: string) => new MeshStandardMaterial({ color: c, roughness: 0.8 });
  const add = (geo: CylinderGeometry | SphereGeometry | TorusGeometry, c: string, y: number, rx = 0, sx = 1, sz = 1) => {
    const m = new Mesh(geo, mat(c));
    m.position.y = y;
    m.rotation.x = rx;
    m.scale.set(sx, 1, sz);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  if (hat.type === 'hula') {
    // Round, flat-top cap with an embroidered band
    add(new CylinderGeometry(0.108, 0.112, 0.13, 20), hat.color, 0.065);
    add(new TorusGeometry(0.112, 0.01, 6, 24), hat.band ?? darker(hat.color, 0.6), 0.025, Math.PI / 2);
    add(new TorusGeometry(0.108, 0.007, 6, 24), hat.band ?? darker(hat.color, 0.6), 0.09, Math.PI / 2);
  } else if (hat.type === 'fila') {
    // Soft cap folded to one side
    const m = add(new CylinderGeometry(0.085, 0.105, 0.13, 18), hat.color, 0.06);
    m.rotation.z = 0.18;
    m.position.x = 0.012;
  } else if (hat.type === 'cap') {
    add(new SphereGeometry(0.105, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), hat.color, 0);
    const brim = add(new CylinderGeometry(0.08, 0.08, 0.015, 16, 1, false, -Math.PI / 2, Math.PI), hat.color, 0.005);
    brim.position.z = 0.08;
  } else if (hat.type === 'afro') {
    add(new SphereGeometry(0.125, 14, 10), hat.color, 0.05, 0, 1.05, 1.0).position.z = -0.035;
  } else {
    // Gele: big, proud headtie
    add(new SphereGeometry(0.125, 16, 12), hat.color, 0.06, 0, 1.2, 1.05).scale.y = 0.8;
    add(new TorusGeometry(0.11, 0.03, 8, 20), hat.band ?? darker(hat.color, 0.8), 0.02, Math.PI / 2 - 0.2);
  }
  return g;
}

/**
 * A rigged, animated human. `skin` recolours the skin materials; `tint` recolours
 * any other material by name (e.g. the shirt); `hat` sits on the head bone.
 */
export function HumanModel({ kind, skin, tint, hat, move = 'Idle' }: { kind: HumanKind; skin?: string; tint?: Record<string, string>; hat?: Hat; move?: Move }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(url(kind));
  const tintKey = JSON.stringify(tint);
  const hatKey = JSON.stringify(hat);

  // Each person needs their own skeleton and materials
  const { model, scale, lift } = useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as Group;
    const tints: Record<string, string> = tintKey ? JSON.parse(tintKey) : {};
    const h: Hat | undefined = hatKey ? JSON.parse(hatKey) : undefined;
    // Hair go poke through the cap, so hide am under anything but a face cap
    const hideHair = !!h && h.type !== 'cap';
    clone.traverse((o) => {
      // Some packs hold a pistol; nobody dey carry gun for Kubwa
      if (/pistol|gun|sword|weapon/i.test(o.name)) o.visible = false;
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.frustumCulled = false;
      const recolor = (mat: Material) => {
        const c = (mat as MeshStandardMaterial).clone();
        const name = mat.name;
        if (skin && name === 'Skin') c.color.set(skin);
        else if (skin && name === 'Skin_Darker') c.color.set(darker(skin));
        else if (tints[name]) c.color.set(tints[name]);
        if (hideHair && /^Hair/.test(name)) c.visible = false;
        return c;
      };
      m.material = Array.isArray(m.material) ? m.material.map(recolor) : recolor(m.material);
    });
    clone.updateMatrixWorld(true);
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const scale = size.y > 0 ? HEIGHT / size.y : 1;

    const head = clone.getObjectByName('Head');
    if (h && head) {
      // Build the hat in model space on top of the head, then hang it on the head bone
      const top = new Vector3();
      head.getWorldPosition(top);
      const sink = h.type === 'afro' ? 0.06 : h.type === 'gele' ? 0.14 : h.type === 'cap' ? 0.1 : 0.12;
      top.y = box.max.y - sink / scale;
      const hatObj = hatMeshes(h);
      const inModel = new Matrix4().compose(top, hatObj.quaternion, new Vector3(1 / scale, 1 / scale, 1 / scale));
      new Matrix4().copy(head.matrixWorld).invert().multiply(inModel).decompose(hatObj.position, hatObj.quaternion, hatObj.scale);
      head.add(hatObj);
    }
    return { model: clone, scale, lift: -box.min.y * scale };
  }, [scene, skin, tintKey, hatKey]);

  const { actions } = useAnimations(animations, group);
  useEffect(() => {
    const a = actions[move] ?? actions.Idle;
    if (!a) return;
    a.reset().fadeIn(0.2).play();
    // Start everybody at a different point so a crowd no dey breathe in sync
    a.time = Math.random() * a.getClip().duration;
    return () => {
      a.fadeOut(0.2);
    };
  }, [actions, move]);

  return (
    <group ref={group} scale={scale} position-y={lift}>
      <primitive object={model} />
    </group>
  );
}

export const preloadHumans = (kinds: HumanKind[]) => kinds.forEach((k) => useGLTF.preload(url(k)));
