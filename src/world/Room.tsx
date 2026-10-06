import type { ThreeEvent } from '@react-three/fiber';
import { useContext, useState, type ReactNode } from 'react';
import { CellCtx } from './origin';
import { AREAS, homeTier, type HomeTier } from '../content/housing';
import { useGame } from '../store/game';
import { Person } from './Avatar';
import { Mansion } from './Mansion';
import { Prop } from './Prop';
import { Flat } from './Flat';
import { At, Shell, SpreadCtx, WallCutaway } from './Spread';
import { HOME_SCALE } from '../content/homeLayout';
import { cementFloor, Floor, marble, paint } from './Interior';
import { BoxGeometry, type BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';

export type V3 = [number, number, number];

const geoCache = new Map<string, BufferGeometry>();

/** Box with softly rounded edges (thin panels stay sharp). Geometries are shared between same-size boxes. */
function boxGeometry(s: V3): BufferGeometry {
  const key = s.map((n) => n.toFixed(3)).join(',');
  let g = geoCache.get(key);
  if (!g) {
    const min = Math.min(...s);
    g = min >= 0.08 ? new RoundedBoxGeometry(s[0], s[1], s[2], 2, Math.min(0.06, min * 0.18)) : new BoxGeometry(...s);
    geoCache.set(key, g);
  }
  return g;
}

export function Box({ p, s, c, r }: { p: V3; s: V3; c: string; r?: V3 }) {
  return (
    <mesh position={p} rotation={r} geometry={boxGeometry(s)} castShadow receiveShadow>
      <meshStandardMaterial color={c} roughness={0.78} />
    </mesh>
  );
}

export function Cyl({ p, r, h, c }: { p: V3; r: number; h: number; c: string }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, 20]} />
      <meshStandardMaterial color={c} roughness={0.7} />
    </mesh>
  );
}

/** Wraps furniture so tapping it opens its action menu. */
export function Tappable({ id, children }: { id: string; children: ReactNode }) {
  const [hover, setHover] = useState(false);
  const openMenu = useGame((s) => s.openMenu);
  const walkTo = useGame((s) => s.walkTo);
  // A place down the road: tapping it walks you there instead of opening its menu
  const cell = useContext(CellCtx);
  const far = cell ? !cell.current : false;
  const onDown = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A drag moves the camera; only a tap counts
    if (e.delta > 8) return;
    if (far) walkTo(e.point.x, e.point.z);
    else openMenu(id);
  };
  return (
    <group
      onClick={onDown}
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
    </group>
  );
}

/** One-room flat: self-con, room and parlour, mini flat. Furniture improves with the area and what you buy. */
function SelfCon({ onFloor }: { onFloor: (e: ThreeEvent<MouseEvent>) => void }) {
  const power = useGame((s) => s.power);
  const area = useGame((s) => s.area);
  const theme = AREAS[area].theme;
  // One-room life: plastic chairs until you buy sofa
  const upgraded = false;
  const ups = useGame((s) => s.homeUps ?? []);
  const has = (id: string) => ups.includes(id);
  // Kubwa get cheap tiles; Nyanya and Mararaba na bare cement
  const cement = area !== 'kubwa';
  const floorTex = cement ? paint('cement-floor', cementFloor) : paint(`cheap-tile-${theme.floor}`, marble(theme.floor, '#ffffff', '#00000040'));
  // Face-me-I-face-you: mattress for floor, no bed frame
  const floorBed = area === 'mararaba';
  return (
    <group>
      <Shell>
      <Floor x0={-4} z0={-3} x1={4} z1={3} tex={floorTex} tile={cement ? 3 : 1.2} y={0} rough={0.85} onFloor={onFloor} />
      {/* Clothes line with wash hanging */}
      <Cyl p={[-3.9, 1.0, 2.7]} r={0.02} h={2.0} c="#555" />
      <Cyl p={[-1.2, 1.0, 2.7]} r={0.02} h={2.0} c="#555" />
      <Box p={[-2.55, 1.95, 2.7]} s={[2.7, 0.01, 0.01]} c="#ddd" />
      {[['-3.4', '#e74c3c'], ['-2.8', '#2f7fd6'], ['-2.2', '#f1c40f'], ['-1.7', '#ecf0f1']].map(([x, c]) => (
        <Box key={x} p={[Number(x), 1.7, 2.7]} s={[0.4, 0.5, 0.02]} c={c} />
      ))}
      {/* Calendar and a wall clock */}
      <Box p={[0.2, 1.8, -2.98]} s={[0.45, 0.6, 0.02]} c="#f4f4f4" />
      <Box p={[0.2, 1.95, -2.97]} s={[0.4, 0.15, 0.02]} c="#c0392b" />
      <Cyl p={[-3.98, 2.1, -1.0]} r={0.16} h={0.03} c="#f4f4f4" />
      {/* Curtain by the window */}
      <Box p={[-2.6, 1.7, -2.95]} s={[0.35, 1.1, 0.04]} c={theme.rug} />
      {cement && (
        <>
          {/* Wall stains: rain don leak small */}
          <Box p={[2.6, 2.3, -2.99]} s={[0.9, 0.5, 0.01]} c="#cbb78f" />
          <Box p={[-3.99, 0.4, 1.8]} s={[0.01, 0.5, 1.2]} c="#cdbf9e" />
        </>
      )}
      {/* Bathroom tiles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 0.005, -2.2]} receiveShadow onClick={onFloor}>
        <planeGeometry args={[2, 1.6]} />
        <meshStandardMaterial color="#9ec3cf" />
      </mesh>
      {/* Back walls (cream paint, with the classic skirting) */}
      <Box p={[0, 1.4, -3.05]} s={[8, 2.8, 0.1]} c={theme.wall} />
      <Box p={[-4.05, 1.4, 0]} s={[0.1, 2.8, 6.2]} c={theme.wall2} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.8, 0.01, 1]} receiveShadow onClick={onFloor}>
        <planeGeometry args={[2.2, 1.6]} />
        <meshStandardMaterial color={theme.rug} />
      </mesh>
      </Shell>

      <At id="bed">
      <Tappable id="bed">
        {floorBed ? (
          <>
            <Box p={[-2.9, 0.1, -1.85]} s={[1.3, 0.2, 1.9]} c="#e2d9c8" />
            <Box p={[-2.9, 0.16, -1.5]} s={[1.32, 0.1, 1.1]} c={theme.bed} />
            <Box p={[-2.9, 0.24, -2.55]} s={[0.8, 0.1, 0.35]} c="#fafafa" />
          </>
        ) : (
          <>
            <Prop name="bedDouble" p={[-2.9, 0, -2.0]} s={1.0} tint={{ wood: '#5b3a21', carpet: theme.bed, carpetWhite: '#e9e4f2' }} />
          </>
        )}
      </Tappable>
      </At>

      <At id="cooler">
      <Tappable id="cooler">
        <Box p={[-0.7, 0.25, -2.6]} s={[0.8, 0.5, 0.5]} c="#c8312b" />
        <Box p={[-0.7, 0.54, -2.6]} s={[0.84, 0.08, 0.54]} c="#f4f4f4" />
        <Box p={[-0.7, 0.6, -2.6]} s={[0.4, 0.04, 0.08]} c="#f4f4f4" />
      </Tappable>
      </At>

      <At id="stove">
      <Tappable id="stove">
        <Box p={[0.8, 0.4, -2.65]} s={[1.0, 0.8, 0.5]} c="#7a5a3c" />
        <Box p={[0.8, 0.86, -2.65]} s={[0.8, 0.1, 0.42]} c="#2b2b2b" />
        <Cyl p={[0.62, 0.93, -2.65]} r={0.1} h={0.04} c="#555" />
        <Cyl p={[0.98, 0.93, -2.65]} r={0.1} h={0.04} c="#555" />
        <Cyl p={[0.62, 1.03, -2.65]} r={0.13} h={0.16} c="#b5b5b5" />
        {/* Gas cylinder */}
        <Cyl p={[1.55, 0.3, -2.7]} r={0.17} h={0.6} c="#2f8f4e" />
      </Tappable>
      </At>

      <At id="bucket">
      <Tappable id="bucket">
        <Cyl p={[2.5, 0.2, -2.6]} r={0.2} h={0.4} c="#2f6fd6" />
        <Cyl p={[2.5, 0.41, -2.6]} r={0.18} h={0.02} c="#8fc8ff" />
        <Box p={[2.85, 0.12, -2.65]} s={[0.25, 0.2, 0.25]} c="#f0c419" />
      </Tappable>
      </At>

      <At id="toilet">
      <Tappable id="toilet">
        <Prop name="toilet" p={[3.5, 0, -2.75]} s={1.05} />
      </Tappable>
      </At>

      <At id="tv">
      <Tappable id="tv">
        <Prop name="cabinetTelevision" p={[-3.65, 0, 1]} rot={Math.PI / 2} s={1.0} tint={{ wood: '#3d2a1a' }} />
        <Prop name="televisionVintage" p={[-3.68, 0.5, 1]} rot={Math.PI / 2} s={1.05} />
        {/* Sofa in better areas, red plastic chairs in Kubwa */}
        {(upgraded || has('sofa')) && (
          <Prop name="loungeSofa" p={[-1.5, 0, 1.0]} rot={-Math.PI / 2} s={1.05} tint={{ carpet: '#6b4f3a', wood: '#2b2018' }} />
        )}
        {!upgraded && !has('sofa') && [0.6, 1.4].map((z) => (
          <group key={z} position={[-1.7, 0, z]}>
            <Box p={[0, 0.42, 0]} s={[0.45, 0.06, 0.45]} c="#d62f2f" />
            <Box p={[0.2, 0.72, 0]} s={[0.06, 0.6, 0.45]} c="#d62f2f" />
            {[-0.18, 0.18].flatMap((x) => [-0.18, 0.18].map((zz) => (
              <Box key={`${x}${zz}`} p={[x, 0.2, zz]} s={[0.05, 0.4, 0.05]} c="#d62f2f" />
            )))}
          </group>
        ))}
      </Tappable>
      </At>

      <Shell>
      {(upgraded || has('ac')) && (
        <>
          {/* Split AC on the wall */}
          <Box p={[1.0, 2.35, -2.95]} s={[1.1, 0.32, 0.18]} c="#f4f4f4" />
          <Box p={[1.0, 2.22, -2.85]} s={[1.0, 0.03, 0.02]} c="#bbb" />
        </>
      )}
      {(upgraded || has('art')) && (
        <>
          {/* Wall art */}
          <Box p={[-3.98, 1.7, -0.6]} s={[0.03, 0.8, 1.1]} c="#2b2b2b" />
          <Box p={[-3.96, 1.7, -0.6]} s={[0.02, 0.66, 0.96]} c={AREAS[area].lux ? '#e8b04b' : '#3ccf8e'} />
        </>
      )}
      </Shell>
      <At x={-3.5} z={2.6}>
      {AREAS[area].lux && (
        <>
          {/* Potted plant and a coffee table */}
          <Cyl p={[-3.5, 0.2, 2.6]} r={0.2} h={0.4} c="#8a5a3b" />
          <mesh position={[-3.5, 0.75, 2.6]}>
            <dodecahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial color="#2e8b3a" flatShading />
          </mesh>
          <Box p={[-2.6, 0.25, 1.0]} s={[0.6, 0.06, 0.9]} c="#1f1f1f" />
        </>
      )}
      </At>

      {/* House upgrades you don buy */}
      <At id="bed">
      {has('mattress') && <Box p={[-2.9, 0.63, -1.85]} s={[1.42, 0.12, 2.0]} c="#f6f2ea" />}
      </At>
      <At id="tv">
      {has('smarttv') && (
        <group>
          <Box p={[-3.68, 1.15, 1]} s={[0.06, 0.95, 1.7]} c="#0d0d0d" />
          <mesh position={[-3.64, 1.15, 1]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.6, 0.86]} />
            <meshStandardMaterial color={power || has('inverter') ? '#3fb27f' : '#0b0b0b'} emissive={power || has('inverter') ? '#1d8a5a' : '#000'} emissiveIntensity={0.7} />
          </mesh>
        </group>
      )}
      </At>
      <At x={-3.6} z={-0.35}>
      {has('fridge') && (
        <group>
          <Prop name="kitchenFridge" p={[-3.65, 0, -0.35]} rot={Math.PI / 2} s={1.1} glossy />
        </group>
      )}
      </At>
      <At id="tv">
      {has('wifi') && (
        <group>
          <Box p={[-3.55, 0.64, 0.45]} s={[0.25, 0.06, 0.18]} c="#f4f4f4" />
          <Box p={[-3.45, 0.68, 0.45]} s={[0.03, 0.02, 0.03]} c="#2ecc71" />
        </group>
      )}
      {has('ps5') && <Box p={[-3.55, 0.78, 1.6]} s={[0.12, 0.36, 0.26]} c="#f4f4f4" />}
      {has('inverter') && (
        <group>
          <Box p={[-3.6, 0.3, 2.35]} s={[0.4, 0.6, 0.35]} c="#2c3e50" />
          <Box p={[-3.39, 0.45, 2.35]} s={[0.02, 0.06, 0.06]} c="#2ecc71" />
        </group>
      )}
      </At>
      <At x={4} z={2.9}>
      {has('generator') && (
        <group position={[5.0, 0, 2.9]}>
          <Box p={[0, 0.28, 0]} s={[0.75, 0.5, 0.48]} c="#e2b13c" />
          <Box p={[0, 0.03, 0]} s={[0.8, 0.06, 0.52]} c="#333" />
        </group>
      )}
      {has('cctv') && (
        <group position={[6.95, 1.95, 1.95]}>
          <Box p={[0, 0.05, 0]} s={[0.12, 0.12, 0.3]} c="#f4f4f4" />
          <Box p={[0, 0.05, -0.17]} s={[0.04, 0.04, 0.02]} c="#e74c3c" />
        </group>
      )}
      </At>

      {/* Standing fan */}
      <At x={2.6} z={0.6}>
      <group position={[2.6, 0, 0.6]}>
        <Cyl p={[0, 0.03, 0]} r={0.25} h={0.06} c="#333" />
        <Cyl p={[0, 0.6, 0]} r={0.03} h={1.2} c="#ccc" />
        <Cyl p={[0, 1.25, 0]} r={0.25} h={0.08} c="#e8e8e8" />
      </group>
      </At>

      {/* Door (open) */}
      <At x={4} z={1.85}>
      <Box p={[4.05, 1.0, 1.85]} s={[0.06, 2, 0.05]} c="#5b3a21" />
      <Box p={[4.5, 1.0, 1.35]} s={[0.9, 2, 0.06]} c="#7a4e2a" r={[0, -0.6, 0]} />
      </At>

    </group>
  );
}

/** Where the back and west walls stand, and the middle of the house, for the wall cut-away. */
function cutaway(tier: HomeTier) {
  const k = HOME_SCALE[tier];
  const west = tier === 'mansion' ? -8.72 : tier === 'flat' ? -6.72 : -4.1;
  return { xmin: west * k, zmin: -3.11 * k, cx: ((west + 4) / 2) * k, cz: 0 };
}

export function Room() {
  const walkTo = useGame((s) => s.walkTo);
  const area = useGame((s) => s.area);
  const tier = homeTier(area);
  const mansion = tier === 'mansion';

  const onFloor = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A drag moves the camera; only a tap counts
    if (e.delta > 8) return;
    walkTo(e.point.x, e.point.z);
  };

  return (
    <SpreadCtx.Provider value={HOME_SCALE[tier]}>
    <WallCutaway {...cutaway(tier)} />
    <group>
      {/* Ground: compound sand + tiled room floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, -0.02, 0.5]} receiveShadow onClick={onFloor}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={mansion ? '#6f9a52' : '#b98f5e'} />
      </mesh>
      <At x={4} z={2.9}>
      {/* Concrete compound slab outside the door */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5.2, 0.004, 1.2]} receiveShadow onClick={onFloor}>
        <planeGeometry args={[2.4, 5]} />
        <meshStandardMaterial color="#a7a39a" />
      </mesh>
      </At>

      {mansion ? <Mansion onFloor={onFloor} /> : tier === 'flat' ? <Flat onFloor={onFloor} /> : <SelfCon onFloor={onFloor} />}

      <At id="bench">
      <Tappable id="bench">
        <Box p={[3.6, 0.35, 3.3]} s={[1.6, 0.08, 0.4]} c="#8a6a45" />
        <Box p={[3.0, 0.17, 3.3]} s={[0.08, 0.34, 0.35]} c="#6b4f32" />
        <Box p={[4.2, 0.17, 3.3]} s={[0.08, 0.34, 0.35]} c="#6b4f32" />
        <group position={[3.2, 0, 3.35]} rotation={[0, Math.PI, 0]} scale={0.9}>
          <Person shirt="#7b4fb0" trousers="#3a3a3a" skin="#6b4430" move="Sit" />
        </group>
      </Tappable>
      </At>

      <At id="maishayi">
      <Tappable id="maishayi">
        {/* Mai Shayi kiosk: table, gas burner, kettle, Milo, Peak, Lipton, bread and eggs */}
        <Box p={[5.8, 0.45, 0]} s={[1.2, 0.08, 0.7]} c="#2c6e9b" />
        {[[-0.5, -0.28], [0.5, -0.28], [-0.5, 0.28], [0.5, 0.28]].map(([x, z]) => (
          <Box key={`${x}${z}`} p={[5.8 + x, 0.22, z]} s={[0.06, 0.45, 0.06]} c="#1f4f70" />
        ))}
        {/* Burner and the big kettle */}
        <Cyl p={[6.2, 0.52, -0.18]} r={0.13} h={0.06} c="#2b2b2b" />
        <Cyl p={[6.2, 0.64, -0.18]} r={0.1} h={0.18} c="#c9c9c9" />
        <Cyl p={[6.2, 0.75, -0.18]} r={0.05} h={0.04} c="#9a9a9a" />
        <Box p={[6.08, 0.66, -0.18]} s={[0.12, 0.025, 0.025]} c="#9a9a9a" r={[0, 0, 0.6]} />
        {/* Tins: Milo, Peak milk, Bournvita, and the Lipton box */}
        <Cyl p={[5.4, 0.57, -0.22]} r={0.05} h={0.14} c="#1d7a3a" />
        <Cyl p={[5.52, 0.57, -0.22]} r={0.05} h={0.14} c="#1f5fa8" />
        <Cyl p={[5.52, 0.645, -0.22]} r={0.05} h={0.01} c="#f4f4f4" />
        <Cyl p={[5.64, 0.57, -0.22]} r={0.05} h={0.14} c="#7a2a1e" />
        <Box p={[5.8, 0.55, -0.24]} s={[0.12, 0.1, 0.08]} c="#f2c230" />
        {/* Agege bread loaves */}
        <Box p={[5.5, 0.54, 0.15]} s={[0.32, 0.09, 0.14]} c="#e0a94f" />
        <Box p={[5.5, 0.62, 0.15]} s={[0.3, 0.06, 0.12]} c="#d39a45" />
        {/* Crate of eggs */}
        <Box p={[5.95, 0.51, 0.18]} s={[0.26, 0.03, 0.26]} c="#c9b48a" />
        {[-0.08, 0, 0.08].flatMap((x) => [-0.08, 0, 0.08].map((z) => (
          <mesh key={`${x}${z}`} position={[5.95 + x, 0.55, 0.18 + z]} scale={[1, 1.25, 1]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshStandardMaterial color="#f3e6cf" />
          </mesh>
        )))}
        {/* Cups */}
        <Cyl p={[5.72, 0.54, 0.02]} r={0.035} h={0.07} c="#f4f4f4" />
        <Cyl p={[5.8, 0.54, 0.02]} r={0.035} h={0.07} c="#e74c3c" />
        <group position={[6.75, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Mai Shayi: Hausa man in jalabiya and embroidered zanna cap, busy making tea */}
          <Person shirt="#6f9cc4" trousers="#6f9cc4" skin="#3d2416" hat={{ type: 'hula', color: '#8b1e3f', band: '#e2b84a' }} move="Interact" />
        </group>
        {/* Umbrella */}
        <Cyl p={[6.3, 1.1, 0.35]} r={0.03} h={2.2} c="#777" />
        <mesh position={[6.3, 2.2, 0.35]}>
          <coneGeometry args={[1.1, 0.4, 8]} />
          <meshStandardMaterial color="#e2a531" />
        </mesh>
      </Tappable>
      </At>

      <At id="gate">
      <Tappable id="gate">
        {/* Compound wall + blue metal gate */}
        <Box p={[6.95, 0.9, 1.95]} s={[0.25, 1.8, 0.25]} c="#cbbd9d" />
        <Box p={[6.95, 0.9, 3.75]} s={[0.25, 1.8, 0.25]} c="#cbbd9d" />
        <Box p={[6.95, 0.95, 2.85]} s={[0.08, 1.9, 1.5]} c="#2a5d9f" />
        {[2.3, 2.6, 2.9, 3.2, 3.5].map((z) => (
          <Box key={z} p={[6.9, 0.95, z]} s={[0.04, 1.8, 0.05]} c="#1c467a" />
        ))}
      </Tappable>
      </At>

      {/* Compound fence */}
      <Shell>
      <Box p={mansion ? [-1, 0.8, -4.1] : tier === 'flat' ? [0.2, 0.8, -4.1] : [2, 0.8, -4.1]} s={[mansion ? 17 : tier === 'flat' ? 14.6 : 11, 1.6, 0.15]} c="#cbbd9d" />
      </Shell>
    </group>
    </SpreadCtx.Provider>
  );
}
