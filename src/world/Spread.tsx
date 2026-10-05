import { useFrame } from '@react-three/fiber';
import { createContext, useContext, useRef, type ReactNode } from 'react';
import { Box3, type Group, type Mesh } from 'three';
import { anchorOf } from '../content/homeLayout';

/** How much the house is spread out (see HOME_SCALE). */
export const SpreadCtx = createContext(1);

/** Every Shell group on screen, so walls can be cut away when the camera goes behind them. */
const shells = new Set<Group>();
let shellsVersion = 0;

/** Walls and floors: stretched with the house. */
export function Shell({ children }: { children: ReactNode }) {
  const k = useContext(SpreadCtx);
  return (
    <group
      scale={[k, 1, k]}
      ref={(g) => {
        if (g) shells.add(g);
        else for (const s of shells) if (!s.parent) shells.delete(s);
        shellsVersion++;
      }}
    >
      {children}
    </group>
  );
}

/**
 * Furniture: moves out with its anchor but keeps its real size.
 * Give `id` for a tappable home item, or `x`/`z` for anything else.
 */
export function At({ id, x = 0, z = 0, children }: { id?: string; x?: number; z?: number; children: ReactNode }) {
  const k = useContext(SpreadCtx) - 1;
  const [ax, az] = id ? anchorOf(id) : [x, z];
  return <group position={[ax * k, 0, az * k]}>{children}</group>;
}

const box = new Box3();

/**
 * When you turn the camera round to the back or the west side, the walls on that
 * side (and the pictures on them) drop away so you still see inside.
 */
export function WallCutaway({ xmin, zmin, cx, cz }: { xmin: number; zmin: number; cx: number; cz: number }) {
  const lists = useRef<{ v: number; back: Mesh[]; west: Mesh[] }>({ v: -1, back: [], west: [] });
  useFrame(({ camera }) => {
    const l = lists.current;
    if (l.v !== shellsVersion) {
      l.v = shellsVersion;
      l.back = [];
      l.west = [];
      for (const s of shells) {
        if (!s.parent) continue;
        s.updateWorldMatrix(true, true);
        s.traverse((o) => {
          const m = o as Mesh;
          if (!m.isMesh) return;
          box.setFromObject(m);
          if (box.max.y - box.min.y < 0.05) return; // floors stay
          if (box.max.z < zmin + 0.35) l.back.push(m);
          else if (box.max.x < xmin + 0.35) l.west.push(m);
        });
      }
    }
    const hideBack = camera.position.z < cz - 1;
    const hideWest = camera.position.x < cx - 1;
    for (const m of l.back) m.visible = !hideBack;
    for (const m of l.west) m.visible = !hideWest;
  });
  return null;
}
