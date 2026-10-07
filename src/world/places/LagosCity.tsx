import { Html } from '@react-three/drei';
import { type ThreeEvent } from '@react-three/fiber';
import type { ReactElement } from 'react';
import { DANFO_AT, LAGOON, LAGOS_CITY, LAGOS_ROADS, LINK_BRIDGE_Z, THIRD_MAINLAND_Z } from '../../content/lagosCity';
import { useGame } from '../../store/game';
import { Person } from '../Avatar';
import { Neighborhood, type HoodStyle, type Rect } from '../Neighborhood';
import { Box, Cyl, Tappable } from '../Room';
import { Car, Danfo, Tree } from '../Street';

type P2 = [number, number];

function useWalk() {
  const walkTo = useGame((s) => s.walkTo);
  return (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 8) return;
    walkTo(e.point.x, e.point.z);
  };
}

function Sign({ p, text }: { p: [number, number, number]; text: string }) {
  return (
    <Html position={p} center zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}>
      <div className="block-name campus-sign">{text}</div>
    </Html>
  );
}

function Block({ p, w, d, h, wall, roof = '#5f6670', glass = '#6d8fa8' }: { p: P2; w: number; d: number; h: number; wall: string; roof?: string; glass?: string }) {
  const wins: ReactElement[] = [];
  for (let y = 1; y < h - 0.4; y += 1.2) for (let x = -w / 2 + 0.7; x < w / 2 - 0.3; x += 1.2) wins.push(<Box key={`${x}${y}`} p={[x, y, d / 2 + 0.01]} s={[0.6, 0.55, 0.03]} c={glass} />);
  for (let y = 1; y < h - 0.4; y += 1.2) for (let z = -d / 2 + 0.7; z < d / 2 - 0.3; z += 1.2) wins.push(<Box key={`s${z}${y}`} p={[w / 2 + 0.01, y, z]} s={[0.03, 0.55, 0.6]} c={glass} />);
  return (
    <group position={[p[0], 0, p[1]]}>
      <Box p={[0, h / 2, 0]} s={[w, h, d]} c={wall} />
      <Box p={[0, h + 0.12, 0]} s={[w + 0.3, 0.24, d + 0.3]} c={roof} />
      {wins}
    </group>
  );
}

function Fill({ at, style, seed, extent, near, far, front, frontFar, clear }: { at: P2; style: HoodStyle; seed: number; extent: number; near: number; far: number; front: number; frontFar: number; clear: Rect[] }) {
  return (
    <group position={[at[0], 0, at[1]]}>
      <Neighborhood seed={seed} style={style} extent={extent} near={near} far={far} front={front} frontFar={frontFar} clear={clear} roadZ={0} />
    </group>
  );
}

/** Roads: Ikorodu-style east–west road, two north–south roads, and the lagoon. */
function RoadsAndLagoon() {
  const walk = useWalk();
  const out: ReactElement[] = [];
  const road = (key: string, x: number, z: number, len: number, alongZ: boolean) =>
    out.push(
      <mesh key={key} rotation={[-Math.PI / 2, 0, alongZ ? Math.PI / 2 : 0]} position={[x, 0.011, z]} receiveShadow onClick={walk}>
        <planeGeometry args={[len, 3.6]} />
        <meshStandardMaterial color="#3a3a3e" />
      </mesh>,
    );
  road('ew', -13, LAGOS_ROADS.ew, 94, false);
  road('ns-main', LAGOS_ROADS.nsMain, -24, 48, true);
  road('ns-island', LAGOS_ROADS.nsIsland, -24, 48, true);
  for (let x = -58; x <= 32; x += 3) out.push(<Box key={`d${x}`} p={[x, 0.02, LAGOS_ROADS.ew]} s={[1.2, 0.01, 0.1]} c="#f2c230" />);
  const [l0, l1] = LAGOON;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(l0 + l1) / 2, -0.005, -30]}>
        <planeGeometry args={[l1 - l0, 60]} />
        <meshStandardMaterial color="#3a7ea8" roughness={0.3} />
      </mesh>
      {out}
    </>
  );
}

/** Third Mainland Bridge: a long deck on pillars across the lagoon, with cars stuck in go-slow. */
function ThirdMainland() {
  const z = THIRD_MAINLAND_Z;
  return (
    <group>
      <Box p={[38, 0.7, z]} s={[18, 0.3, 3.4]} c="#b9bec4" />
      <Box p={[38, 0.95, z - 1.6]} s={[18, 0.3, 0.12]} c="#d9dde2" />
      <Box p={[38, 0.95, z + 1.6]} s={[18, 0.3, 0.12]} c="#d9dde2" />
      {[30, 34, 38, 42, 46].map((x) => <Box key={x} p={[x, 0.3, z]} s={[0.6, 0.6, 2]} c="#8b9096" />)}
      {[[31, '#c0392b'], [35, '#f4f4f4'], [39, '#2e6fa8'], [43, '#20232a']].map(([x, c]) => (
        <group key={x as number} position={[x as number, 0.85, z - 0.7]}>
          <Car body={c as string} />
        </group>
      ))}
      <group position={[37, 0.85, z + 0.8]} rotation={[0, Math.PI, 0]}>
        <Danfo />
      </group>
    </group>
  );
}

/** Lekki-Ikoyi Link Bridge: cable-stayed deck with one tall pylon. */
function LinkBridge() {
  const z = LINK_BRIDGE_Z;
  const cables: ReactElement[] = [];
  for (const dx of [-7, -5, -3, 3, 5, 7]) {
    const len = Math.hypot(dx, 7);
    const ang = Math.atan2(7, dx);
    cables.push(<Box key={dx} p={[38 + dx / 2, 0.8 + 3.5, z]} s={[len, 0.05, 0.05]} r={[0, 0, ang > Math.PI / 2 ? ang - Math.PI : ang]} c="#e8ebee" />);
  }
  return (
    <group>
      <Box p={[38, 0.7, z]} s={[18, 0.3, 3]} c="#cfd3d6" />
      <Box p={[38, 4.6, z]} s={[0.7, 8, 0.7]} c="#eef1f4" />
      {cables}
      <group position={[34, 0.85, z]}>
        <Car body="#8b1e3f" />
      </group>
    </group>
  );
}

function DanfoStop({ at }: { at: P2 }) {
  return (
    <group position={[at[0] + 1.6, 0, at[1]]}>
      <Box p={[0, 1.1, 0]} s={[0.08, 2.2, 0.08]} c="#555" />
      <Box p={[0, 2.1, 0]} s={[1.2, 0.5, 0.05]} c="#f2c230" />
    </group>
  );
}

function Oshodi() {
  const [x, z] = LAGOS_CITY.oshodi;
  return (
    <Tappable id="oshodi">
      <Box p={[x, 3, z]} s={[14, 0.3, 7]} c="#d9dde2" />
      {[-6, -2, 2, 6].flatMap((dx) => [-3, 3].map((dz) => <Cyl key={`${dx}${dz}`} p={[x + dx, 1.5, z + dz]} r={0.15} h={3} c="#8b9096" />))}
      {[-4, 0, 4].map((dx) => (
        <group key={dx} position={[x + dx, 0, z]} rotation={[0, Math.PI / 2, 0]}>
          <Danfo />
        </group>
      ))}
      <Box p={[x, 3.4, z + 3.4]} s={[8, 0.6, 0.1]} c="#118a4c" />
    </Tappable>
  );
}

function ComputerVillage() {
  const [x, z] = LAGOS_CITY.cv;
  const shops: ReactElement[] = [];
  const ads = ['#2980b9', '#e74c3c', '#27ae60', '#8e44ad', '#f39c12'];
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 2; j++)
      shops.push(
        <group key={`${i}${j}`}>
          <Block p={[x - 8 + i * 4, z - 3 + j * 4.5]} w={3.4} d={3} h={2.6 + ((i + j) % 2) * 1.2} wall="#e6e2d6" roof="#5f6670" />
          <Box p={[x - 8 + i * 4, 2.2, z - 1.45 + j * 4.5]} s={[3, 0.6, 0.05]} c={ads[(i + j) % ads.length]} />
        </group>,
      );
  return <Tappable id="computer-village">{shops}</Tappable>;
}

function Shrine() {
  const [x, z] = LAGOS_CITY.shrine;
  return (
    <Tappable id="shrine">
      <Box p={[x, 2, z]} s={[12, 4, 7]} c="#2b2b2b" />
      {['#c0392b', '#f1c40f', '#27ae60'].map((c, i) => <Box key={c} p={[x - 4 + i * 4, 2, z + 3.52]} s={[4, 4, 0.04]} c={c} />)}
      <Box p={[x, 4.2, z]} s={[12.4, 0.4, 7.4]} c="#1b1a22" />
    </Tappable>
  );
}

function YabaHub() {
  const [x, z] = LAGOS_CITY.yaba;
  return (
    <Tappable id="yaba-hub">
      <Block p={[x, z]} w={10} d={6} h={7} wall="#2d3a4a" roof="#1b2633" glass="#7fd0e8" />
      <Box p={[x, 7.6, z + 2.6]} s={[5, 0.8, 0.1]} c="#00b894" />
    </Tappable>
  );
}

function Unilag() {
  const [x, z] = LAGOS_CITY.unilag;
  return (
    <Tappable id="unilag">
      <Box p={[x - 4, 2, z + 4]} s={[0.8, 4, 0.8]} c="#e9e2d2" />
      <Box p={[x + 4, 2, z + 4]} s={[0.8, 4, 0.8]} c="#e9e2d2" />
      <Box p={[x, 4.2, z + 4]} s={[9.6, 0.8, 0.8]} c="#2b4a8a" />
      <Block p={[x - 5, z - 3]} w={7} d={5} h={6} wall="#efe8da" roof="#2b4a8a" />
      <Block p={[x + 5, z - 4]} w={6} d={4} h={9} wall="#e9e2d2" roof="#2b4a8a" />
    </Tappable>
  );
}

/** National Theatre: the round "military cap" building. */
function Theatre() {
  const [x, z] = LAGOS_CITY.theatre;
  return (
    <Tappable id="national-theatre">
      <Cyl p={[x, 1.6, z]} r={6.5} h={3.2} c="#d9d2c4" />
      <mesh position={[x, 3.6, z]}>
        <cylinderGeometry args={[4, 7.2, 0.9, 40]} />
        <meshStandardMaterial color="#6b6f75" />
      </mesh>
      <Cyl p={[x, 4.4, z]} r={3.6} h={0.8} c="#8b9096" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <Box key={i} p={[x + Math.cos(a) * 5.6, 3.75, z + Math.sin(a) * 5.6]} s={[0.25, 0.25, 3]} r={[0, -a, 0]} c="#cfd3d6" />;
      })}
    </Tappable>
  );
}

/** Tafawa Balewa Square: grandstand, white arches and horse statues. */
function Tbs() {
  const [x, z] = LAGOS_CITY.tbs;
  return (
    <Tappable id="tbs">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, z]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#c9c4b8" />
      </mesh>
      <Box p={[x, 1.6, z - 4.6]} s={[12, 3.2, 1.6]} c="#e9e2d2" />
      {[-4, 0, 4].map((dx) => (
        <group key={dx}>
          <Box p={[x + dx - 1, 2.2, z + 4]} s={[0.4, 4.4, 0.4]} c="#f4f4f4" />
          <Box p={[x + dx + 1, 2.2, z + 4]} s={[0.4, 4.4, 0.4]} c="#f4f4f4" />
          <Box p={[x + dx, 4.5, z + 4]} s={[2.4, 0.4, 0.4]} c="#f4f4f4" />
        </group>
      ))}
      {[-2.5, 2.5].map((dx) => (
        <group key={dx} position={[x + dx, 0, z + 1]}>
          <Box p={[0, 0.4, 0]} s={[1.6, 0.8, 0.8]} c="#d9d2c4" />
          <Box p={[0, 1.2, 0]} s={[1, 0.5, 0.35]} c="#8a5a2b" />
          <Box p={[0.55, 1.55, 0]} s={[0.25, 0.5, 0.2]} c="#8a5a2b" />
        </group>
      ))}
    </Tappable>
  );
}

/** Lekki Conservation Centre: forest with the high canopy walkway. */
function Lcc() {
  const [x, z] = LAGOS_CITY.lcc;
  return (
    <Tappable id="lcc">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, z]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#3f7d3a" />
      </mesh>
      {([[-4, -3], [-1, -2], [3, -3.5], [4, 1], [-4, 2], [0, 2.5], [2, -1]] as P2[]).map(([dx, dz]) => <Tree key={`${dx}${dz}`} p={[x + dx, 0, z + dz]} s={1.4} />)}
      <Box p={[x, 3.4, z]} s={[10, 0.12, 0.6]} r={[0, 0.35, 0]} c="#8a6a45" />
      {[-4, 0, 4].map((dx) => <Box key={dx} p={[x + dx, 1.7, z - dx * 0.36]} s={[0.15, 3.4, 0.15]} c="#5b3a21" />)}
    </Tappable>
  );
}

/** Everything new in Lagos: lagoon, bridges, mainland and Island landmarks, danfo stops and houses. */
export function LagosCity({ low }: { low: boolean }) {
  const C = LAGOS_CITY;
  return (
    <group>
      <RoadsAndLagoon />
      <ThirdMainland />
      <Sign p={[38, 2.4, THIRD_MAINLAND_Z]} text="🌉 THIRD MAINLAND BRIDGE" />
      <LinkBridge />
      <Sign p={[38, 9.4, LINK_BRIDGE_Z]} text="🌉 LEKKI-IKOYI LINK BRIDGE" />
      {DANFO_AT.map((at) => <DanfoStop key={`${at[0]}${at[1]}`} at={at} />)}
      <Oshodi />
      <Sign p={[C.oshodi[0], 4.4, C.oshodi[1] + 3.5]} text="🚏 OSHODI" />
      <ComputerVillage />
      <Sign p={[C.cv[0], 5, C.cv[1] + 3]} text="📱 COMPUTER VILLAGE" />
      <Shrine />
      <Sign p={[C.shrine[0], 5.2, C.shrine[1] + 3.5]} text="🎷 NEW AFRIKA SHRINE" />
      <YabaHub />
      <Sign p={[C.yaba[0], 8.6, C.yaba[1] + 3]} text="💻 YABA TECH HUB" />
      <Unilag />
      <Sign p={[C.unilag[0], 5.6, C.unilag[1] + 4.4]} text="🎓 UNIVERSITY OF LAGOS" />
      <Theatre />
      <Sign p={[C.theatre[0], 6, C.theatre[1]]} text="🎭 NATIONAL THEATRE" />
      <Tbs />
      <Sign p={[C.tbs[0], 5.4, C.tbs[1] + 4]} text="🏟️ TAFAWA BALEWA SQUARE" />
      <Lcc />
      <Sign p={[C.lcc[0], 4.6, C.lcc[1] + 4]} text="🌳 LEKKI CONSERVATION CENTRE" />
      <group position={[C.yaba[0] + 6, 0, C.yaba[1] + 6.5]}>
        <Person shirt="#2d3436" move="Idle" />
      </group>

      {/* Houses: mainland along the main road north, and the Island */}
      <Fill
        at={[0, LAGOS_ROADS.ew]}
        style="city"
        seed={61}
        extent={low ? 40 : 58}
        near={-2.2}
        far={-20}
        front={2.2}
        frontFar={9}
        clear={[[-60, -18, -44, -4], [-28, -18, -12, -4], [-8, -18, 8, -4], [10, -18, 27, -4], [-47, -40, -41, 40], [30, -40, 60, 40], [1, 0, 19, 14], [-60, 4, -44, 20]]}
      />
      <Fill at={[52, LAGOS_ROADS.ew]} style="rich" seed={83} extent={8} near={-2.2} far={-20} front={2.2} frontFar={22} clear={[[-8, -16, 8, -4], [-8, 6, 8, 20], [-7, -40, -3, 40], [-12, -40, -9, 40]]} />
    </group>
  );
}
