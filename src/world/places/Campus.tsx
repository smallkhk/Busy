import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { ReactElement } from 'react';
import { CAMPUS } from '../../content/campus';
import { CAFE_CHAIR_TOP, CAFE_TABLES, CAMPUS_BENCH_TOP, CAMPUS_BENCHES, EXAM_CHAIR_TOP, LIB_CHAIR_TOP, LIB_TAKEN, LT_TAKEN, ltSeat, SEAT_BASE, type Seat } from '../../content/seats';
import { useGame } from '../../store/game';
import { useSettings } from '../../settings';
import { Person } from '../Avatar';
import { Box, Cyl, Tappable } from '../Room';
import { Car, Tree, Walkers, type Walker } from '../Street';
import { groundMap } from '../groundTex';
import { Flag, Ground } from './common';

type P2 = [number, number];

function useWalk() {
  const walkTo = useGame((s) => s.walkTo);
  return (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 8) return;
    walkTo(e.point.x, e.point.z);
  };
}

/** Name board floating over a building. */
function Sign({ p, text }: { p: [number, number, number]; text: string }) {
  return (
    <Html position={p} center zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}>
      <div className="block-name campus-sign">{text}</div>
    </Html>
  );
}

/** Windows on the two faces the camera sees (+z front and +x side). */
function Windows({ w, d, h, floors, c = '#6d8fa8' }: { w: number; d: number; h: number; floors: number; c?: string }) {
  const fh = h / floors;
  const out: ReactElement[] = [];
  for (let f = 0; f < floors; f++) {
    const y = f * fh + fh * 0.55;
    const n = Math.max(1, Math.floor(w / 1.3));
    for (let i = 0; i < n; i++) out.push(<Box key={`z${f}${i}`} p={[-w / 2 + (i + 0.5) * (w / n), y, d / 2 + 0.01]} s={[0.6, fh * 0.42, 0.03]} c={c} />);
    const m = Math.max(1, Math.floor(d / 1.4));
    for (let i = 0; i < m; i++) out.push(<Box key={`x${f}${i}`} p={[w / 2 + 0.01, y, -d / 2 + (i + 0.5) * (d / m)]} s={[0.03, fh * 0.42, 0.6]} c={c} />);
  }
  return <>{out}</>;
}

/** A campus block: walls, roof slab, windows, a door facing `rot`. */
function Building({ p, w, d, h, floors = 2, wall, roof, rot = 0, columns }: { p: P2; w: number; d: number; h: number; floors?: number; wall: string; roof: string; rot?: number; columns?: boolean }) {
  return (
    <group position={[p[0], 0, p[1]]} rotation={[0, rot, 0]}>
      <Box p={[0, h / 2, 0]} s={[w, h, d]} c={wall} />
      <Box p={[0, h + 0.15, 0]} s={[w + 0.4, 0.3, d + 0.4]} c={roof} />
      <Windows w={w} d={d} h={h} floors={floors} />
      <Box p={[0, 1.1, d / 2 + 0.02]} s={[1.6, 2.2, 0.05]} c="#4a3626" />
      <Box p={[0, 0.06, d / 2 + 0.9]} s={[3, 0.12, 1.6]} c="#cfc8b8" />
      {columns &&
        Array.from({ length: 6 }, (_, i) => <Cyl key={i} p={[-w / 2 + 0.8 + (i * (w - 1.6)) / 5, h / 2, d / 2 + 0.7]} r={0.22} h={h} c="#f4f0e6" />)}
      {columns && <Box p={[0, h - 0.2, d / 2 + 0.7]} s={[w, 0.4, 1.4]} c="#f4f0e6" />}
    </group>
  );
}

function Palm({ p }: { p: P2 }) {
  return (
    <group position={[p[0], 0, p[1]]}>
      <Cyl p={[0, 1.6, 0]} r={0.1} h={3.2} c="#7a5a3a" />
      {[0, 1, 2, 3, 4].map((k) => (
        <Box key={k} p={[Math.cos((k * 2 * Math.PI) / 5) * 0.55, 3.15, Math.sin((k * 2 * Math.PI) / 5) * 0.55]} s={[1.2, 0.06, 0.32]} r={[0, -(k * 2 * Math.PI) / 5, -0.35]} c="#3f8a3a" />
      ))}
    </group>
  );
}

/** Concrete footpath strip on the grass. */
function Path({ a, b, w = 2.4 }: { a: P2; b: P2; w?: number }) {
  const walk = useWalk();
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  return (
    <mesh position={[(a[0] + b[0]) / 2, 0.02, (a[1] + b[1]) / 2]} rotation={[-Math.PI / 2, 0, -Math.atan2(dz, dx)]} receiveShadow onClick={walk}>
      <planeGeometry args={[len, w]} />
      <meshStandardMaterial color="#d9d3c4" />
    </mesh>
  );
}

/** A wooden bench with two legs (top at `top`). */
function Bench({ x, z, top, rot = 0, len = 1.6 }: { x: number; z: number; top: number; rot?: number; len?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box p={[0, top - 0.03, 0]} s={[len, 0.06, 0.38]} c="#8a6a45" />
      <Box p={[0, top + 0.25, -0.2]} s={[len, 0.4, 0.05]} c="#7a5a3a" />
      {[-len / 2 + 0.1, len / 2 - 0.1].map((dx) => (
        <Box key={dx} p={[dx, (top - 0.06) / 2, 0]} s={[0.07, top - 0.06, 0.34]} c="#5b3a21" />
      ))}
    </group>
  );
}

/** A plastic chair (top at `top`), facing −z when `back`. */
function Chair({ x, z, top, back = true, c = '#c0392b' }: { x: number; z: number; top: number; back?: boolean; c?: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, back ? Math.PI : 0, 0]}>
      <Box p={[0, top - 0.03, 0]} s={[0.42, 0.06, 0.42]} c={c} />
      <Box p={[0, top + 0.25, -0.2]} s={[0.42, 0.45, 0.05]} c={c} />
      {[-0.17, 0.17].flatMap((dx) => [-0.17, 0.17].map((dz) => <Box key={`${dx}${dz}`} p={[dx, (top - 0.06) / 2, dz]} s={[0.04, top - 0.06, 0.04]} c={c} />))}
    </group>
  );
}

/** A student sitting on a real seat. */
function SeatedStudent({ seat, shirt, woman }: { seat: Seat; shirt: string; woman?: boolean }) {
  return (
    <group position={[seat.x, seat.y - SEAT_BASE, seat.z]} rotation={[0, seat.rot, 0]}>
      <Person shirt={shirt} woman={woman} trousers={woman ? undefined : '#2d2d2d'} move="Sit" />
    </group>
  );
}

/** Seated (or standing) students to fill the place. */
type Student = { p: [number, number, number]; shirt: string; woman?: boolean; rot?: number };

function Students({ list, sit }: { list: Student[]; sit?: boolean }) {
  return (
    <>
      {list.map((s, i) => (
        <group key={i} position={s.p} rotation={[0, s.rot ?? Math.PI, 0]} scale={0.9}>
          <Person shirt={s.shirt} woman={s.woman} trousers={s.woman ? undefined : '#2d2d2d'} move={sit ? 'Sit' : 'Idle'} />
        </group>
      ))}
    </>
  );
}

// ---------------- The gate on the city grid ----------------

/** UniAbuja from the road: a long fence, the big gate arch, and the campus rising behind. */
export function UniGate() {
  return (
    <group>
      <Ground color="#7aa555" />
      <Box p={[0, 0.02, 5.2]} s={[9, 0.04, 2.4]} c="#d9d3c4" />
      {/* Fence along the road with the gate in the middle */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box p={[side * 10.5, 0.9, 4]} s={[15, 1.8, 0.3]} c="#e9e2d0" />
          <Box p={[side * 17.8, 0.9, -5.5]} s={[0.3, 1.8, 19]} c="#e9e2d0" />
        </group>
      ))}
      <Tappable id="uni-gate">
        {[-3, 3].map((x) => (
          <group key={x}>
            <Box p={[x, 2.2, 4]} s={[0.9, 4.4, 0.9]} c="#f1ece0" />
            <Box p={[x, 4.5, 4]} s={[1.2, 0.3, 1.2]} c="#1f4f7a" />
          </group>
        ))}
        <Box p={[0, 4.9, 4]} s={[7.6, 1.1, 0.7]} c="#1f4f7a" />
        <Box p={[0, 4.9, 4.37]} s={[6.6, 0.4, 0.03]} c="#f4f4f4" />
        <Box p={[0, 0.9, 4]} s={[5, 1.8, 0.08]} c="#2d3a45" />
        <group position={[-3.8, 0, 5]}>
          <Person shirt="#2b2b2b" trousers="#2b2b2b" skin="#3d2416" />
        </group>
        <group position={[5.2, 0, 5.3]}>
          <Box p={[0, 0.7, 0]} s={[2.6, 1.1, 1]} c="#1f4f7a" />
          <Box p={[0, 0.95, 0]} s={[2.62, 0.3, 1.02]} c="#9ad0ec" />
        </group>
      </Tappable>
      <Sign p={[0, 6.4, 4]} text="🎓 UNIVERSITY OF ABUJA" />
      {/* The campus behind the fence */}
      <Building p={[0, -9]} w={12} d={6} h={7} floors={3} wall="#f4f0e6" roof="#1f4f7a" columns />
      <Building p={[-10, -4]} w={8} d={6} h={5} wall="#e8dcc4" roof="#7a2b2b" />
      <Building p={[10, -4]} w={8} d={6} h={6} wall="#d4c6a8" roof="#1f4f7a" />
      <Building p={[-12, -12]} w={6} d={8} h={6} floors={3} wall="#efe0c8" roof="#5b4636" />
      <Building p={[12, -12]} w={6} d={8} h={6} floors={3} wall="#e9d2c2" roof="#5b4636" />
      {[-15, -6, 6, 15].map((x) => (
        <Palm key={x} p={[x, 2.4]} />
      ))}
    </group>
  );
}

// ---------------- The campus inside ----------------

const STROLLERS: Walker[] = [
  { from: -22, to: 22, z: 4.6, speed: 0.8, shirt: '#2c5e8a' },
  { from: 20, to: -20, z: 3.4, speed: 0.7, shirt: '#c0392b', woman: true },
  { from: -18, to: 18, z: -13.4, speed: 0.6, shirt: '#16a085' },
  { from: 16, to: -16, z: -14.6, speed: 0.75, shirt: '#8e44ad', woman: true },
  { from: -10, to: 10, z: 9.2, speed: 0.5, shirt: '#f39c12', woman: true },
];

export function CampusGrounds() {
  const low = useSettings((s) => s.quality === 'low');
  const walk = useWalk();
  return (
    <group>
      {/* Grass to the horizon, the compound lawn on top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -6]} receiveShadow onClick={walk}>
        <planeGeometry args={[220, 200]} />
        <meshStandardMaterial map={groundMap('grass', 220, 200)} roughness={1} />
      </mesh>
      {/* Fence round the compound */}
      <Box p={[0, 0.9, -27]} s={[68, 1.8, 0.3]} c="#e9e2d0" />
      <Box p={[-34, 0.9, -7]} s={[0.3, 1.8, 40]} c="#e9e2d0" />
      <Box p={[34, 0.9, -7]} s={[0.3, 1.8, 40]} c="#e9e2d0" />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * 18.5, 0.9, 13.6]} s={[31, 1.8, 0.3]} c="#e9e2d0" />
      ))}

      {/* Paths: the main avenue, two cross paths and the ways into buildings */}
      <Path a={[0, 13.5]} b={[0, -16.5]} w={3} />
      <Path a={[-30, 4]} b={[30, 4]} />
      <Path a={[-30, -14]} b={[30, -14]} />
      <Path a={[-23, -12]} b={[-23, -1]} w={1.6} />
      <Path a={[23, -12]} b={[23, -1]} w={1.6} />
      <Path a={[-12, -4]} b={[-12, 4]} w={1.8} />
      <Path a={[12, -4]} b={[12, 4]} w={1.8} />
      <Path a={[-14, -19]} b={[-14, -14]} w={1.6} />
      <Path a={[14, -19]} b={[14, -14]} w={1.6} />

      {/* Gate */}
      <Tappable id="campus-gate">
        {[-2.6, 2.6].map((x) => (
          <Box key={x} p={[x, 2, 13.6]} s={[0.8, 4, 0.8]} c="#f1ece0" />
        ))}
        <Box p={[0, 4.2, 13.6]} s={[6.2, 0.8, 0.6]} c="#1f4f7a" />
      </Tappable>
      <Sign p={[0, 5.4, 13.6]} text="Main gate" />

      {/* Senate with flags and a fountain on the lawn */}
      <Tappable id="senate">
        <Building p={CAMPUS.senate} w={16} d={6} h={8} floors={3} wall="#f4f0e6" roof="#1f4f7a" columns />
      </Tappable>
      <Sign p={[0, 9.4, CAMPUS.senate[1]]} text="🏛️ Senate building" />
      {[-6, -2, 2, 6].map((x) => (
        <Flag key={x} x={x} z={-15.6} h={4} />
      ))}

      <Tappable id="lt-door">
        <group position={[CAMPUS.lt[0], 0, CAMPUS.lt[1]]}>
          <Box p={[0, 2.6, 0]} s={[11, 5.2, 8]} c="#e8dcc4" />
          <mesh position={[0, 2.6, 4]} castShadow>
            <cylinderGeometry args={[5.5, 5.5, 5.2, 24, 1, false, -Math.PI / 2, Math.PI]} />
            <meshStandardMaterial color="#e2d3b6" />
          </mesh>
          <Box p={[0, 5.35, 0]} s={[11.4, 0.3, 8.4]} c="#7a2b2b" />
          <Box p={[0, 1.2, 9.45]} s={[2.4, 2.4, 0.1]} c="#4a3626" />
          <Box p={[0, 3.6, 9.4]} s={[5, 0.6, 0.1]} c="#1f4f7a" />
        </group>
      </Tappable>
      <Sign p={[CAMPUS.lt[0], 6.6, CAMPUS.lt[1]]} text="🎓 Lecture Theatre (LT 1000)" />

      <Tappable id="lib-door">
        <Building p={CAMPUS.library} w={11} d={8} h={7} floors={3} wall="#d4c6a8" roof="#1f4f7a" columns />
      </Tappable>
      <Sign p={[CAMPUS.library[0], 8.4, CAMPUS.library[1]]} text="📚 University library" />

      <Tappable id="faculty-science">
        <Building p={CAMPUS.science} w={9} d={6} h={5} wall="#dfe8ee" roof="#2f6b4a" rot={Math.PI / 2} />
      </Tappable>
      <Sign p={[CAMPUS.science[0], 6.2, CAMPUS.science[1]]} text="🔬 Faculty of Science" />
      <Tappable id="faculty-eng">
        <Building p={CAMPUS.engineering} w={9} d={6} h={5} wall="#e6d5bd" roof="#8a5a2b" rot={Math.PI / 2} />
      </Tappable>
      <Sign p={[CAMPUS.engineering[0], 6.2, CAMPUS.engineering[1]]} text="🏗️ Engineering" />
      <Tappable id="faculty-law">
        <Building p={CAMPUS.law} w={9} d={6} h={5} wall="#efe4cf" roof="#7a2b2b" rot={-Math.PI / 2} columns />
      </Tappable>
      <Sign p={[CAMPUS.law[0], 6.2, CAMPUS.law[1]]} text="⚖️ Faculty of Law" />
      <Tappable id="faculty-med">
        <Building p={CAMPUS.medicine} w={9} d={6} h={5} wall="#f4f6f7" roof="#1f8a4c" rot={-Math.PI / 2} />
      </Tappable>
      <Sign p={[CAMPUS.medicine[0], 6.2, CAMPUS.medicine[1]]} text="🩺 Health Sciences" />

      <Tappable id="cafeteria">
        <Building p={CAMPUS.cafeteria} w={9} d={5} h={3.4} floors={1} wall="#f0d7a0" roof="#c0392b" />
        {[-2.5, 0, 2.5].map((x) => (
          <group key={x} position={[CAMPUS.cafeteria[0] + x, 0, CAMPUS.cafeteria[1] + 4]}>
            <Cyl p={[0, 0.45, 0]} r={0.5} h={0.06} c="#f4f4f4" />
            <Cyl p={[0, 0.22, 0]} r={0.06} h={0.44} c="#777" />
            <Cyl p={[0, 1.4, 0]} r={0.04} h={1.9} c="#777" />
            <mesh position={[0, 2.3, 0]}>
              <coneGeometry args={[1, 0.45, 12]} />
              <meshStandardMaterial color={x ? '#c0392b' : '#f1c40f'} />
            </mesh>
          </group>
        ))}
      </Tappable>
      <Sign p={[CAMPUS.cafeteria[0], 4.8, CAMPUS.cafeteria[1]]} text="🍛 Cafeteria" />

      <Tappable id="sub">
        <Building p={CAMPUS.sub} w={10} d={6} h={4.2} floors={2} wall="#e4ecf2" roof="#8e44ad" />
        <Box p={[CAMPUS.sub[0], 3.6, CAMPUS.sub[1] + 3.05]} s={[6, 0.6, 0.06]} c="#8e44ad" />
      </Tappable>
      <Sign p={[CAMPUS.sub[0], 5.6, CAMPUS.sub[1]]} text="🎤 Student Union (SUB)" />

      <Tappable id="hostel-boys">
        <Building p={CAMPUS.boys} w={13} d={6} h={7} floors={3} wall="#efe0c8" roof="#5b4636" rot={Math.PI / 2} />
      </Tappable>
      <Sign p={[CAMPUS.boys[0], 8.2, CAMPUS.boys[1]]} text="🏠 Boys hostel" />
      <Tappable id="hostel-girls">
        <Building p={CAMPUS.girls} w={13} d={6} h={7} floors={3} wall="#f2d0d6" roof="#5b4636" rot={-Math.PI / 2} />
      </Tappable>
      <Sign p={[CAMPUS.girls[0], 8.2, CAMPUS.girls[1]]} text="🏠 Girls hostel" />

      {/* Sports field */}
      <Tappable id="sports-field">
        <Box p={[CAMPUS.field[0], 0.03, CAMPUS.field[1]]} s={[12, 0.04, 7]} c="#4f9a46" />
        <Box p={[CAMPUS.field[0], 0.06, CAMPUS.field[1]]} s={[0.1, 0.02, 7]} c="#f4f4f4" />
        {[-6, 6].map((x) => (
          <group key={x} position={[CAMPUS.field[0] + x, 0, CAMPUS.field[1]]}>
            <Box p={[0, 0.6, -1]} s={[0.08, 1.2, 0.08]} c="#f4f4f4" />
            <Box p={[0, 0.6, 1]} s={[0.08, 1.2, 0.08]} c="#f4f4f4" />
            <Box p={[0, 1.2, 0]} s={[0.08, 0.08, 2.1]} c="#f4f4f4" />
          </group>
        ))}
      </Tappable>
      <Sign p={[CAMPUS.field[0], 2, CAMPUS.field[1] - 3]} text="⚽ Sports field" />

      <Tappable id="chapel">
        <group position={[CAMPUS.chapel[0], 0, CAMPUS.chapel[1]]}>
          <Box p={[0, 2, 0]} s={[6, 4, 5]} c="#f4f1ec" />
          <mesh position={[0, 5.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[4.4, 2.6, 4]} />
            <meshStandardMaterial color="#7a2b2b" />
          </mesh>
          <Box p={[0, 7.4, 2]} s={[0.15, 1.4, 0.15]} c="#d8a53a" />
          <Box p={[0, 7.6, 2]} s={[0.8, 0.15, 0.15]} c="#d8a53a" />
          <Box p={[0, 1.1, 2.52]} s={[1.4, 2.2, 0.05]} c="#4a3626" />
        </group>
      </Tappable>
      <Sign p={[CAMPUS.chapel[0], 9, CAMPUS.chapel[1]]} text="⛪ Chapel" />
      <Tappable id="campus-mosque">
        <group position={[CAMPUS.mosque[0], 0, CAMPUS.mosque[1]]}>
          <Box p={[0, 2, 0]} s={[6, 4, 5]} c="#f4efe4" />
          <mesh position={[0, 4, 0]} castShadow>
            <sphereGeometry args={[2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#2f6b4a" />
          </mesh>
          <Cyl p={[3.6, 3.5, 1.8]} r={0.3} h={7} c="#f4efe4" />
          <mesh position={[3.6, 7.4, 1.8]}>
            <coneGeometry args={[0.35, 0.9, 10]} />
            <meshStandardMaterial color="#2f6b4a" />
          </mesh>
        </group>
      </Tappable>
      <Sign p={[CAMPUS.mosque[0], 8.6, CAMPUS.mosque[1]]} text="🕌 Mosque" />

      <Tappable id="bookshop">
        <Box p={[CAMPUS.bookshop[0], 1.1, CAMPUS.bookshop[1]]} s={[3, 2.2, 2]} c="#f4e7a8" />
        <Box p={[CAMPUS.bookshop[0], 2.3, CAMPUS.bookshop[1] + 0.5]} s={[3.4, 0.1, 1.4]} c="#2980b9" />
        <Box p={[CAMPUS.bookshop[0], 0.9, CAMPUS.bookshop[1] + 1.02]} s={[2, 1.2, 0.04]} c="#2d3a45" />
      </Tappable>

      {/* Trees, palms and parked cars */}
      {[-8, -4, 4, 8].flatMap((z) => [-2.6, 2.6].map((x) => <Palm key={`${x}${z}`} p={[x, z + 2]} />))}
      {[[-20, -20], [20, -20], [-30, -6], [30, -6], [-20, 10], [20, 10], [-5, -24], [5, -24], [-30, 12], [30, 12]].map(([x, z]) => (
        <Tree key={`${x}${z}`} p={[x, 0, z]} s={1.2} />
      ))}
      {!low &&
        [-7, -4.5, 4.5, 7].map((x, i) => (
          <group key={x} position={[x, 0, -16.2]} rotation={[0, Math.PI / 2, 0]}>
            <Car body={['#16171b', '#b9bcc2', '#f4f4f4', '#8b1e3f'][i]} kind={i === 0 ? 'gls' : 'sedan'} />
          </group>
        ))}

      {/* Benches to sit on, and chairs round the cafeteria tables */}
      {CAMPUS_BENCHES.map(([x, z, back]) => (
        <Bench key={`${x}${z}`} x={x} z={z} top={CAMPUS_BENCH_TOP} rot={back ? Math.PI : 0} />
      ))}
      {CAFE_TABLES.flatMap(([x, z]) => [
        <Chair key={`a${x}`} x={x} z={z + 0.8} top={CAFE_CHAIR_TOP} />,
        <Chair key={`b${x}`} x={x} z={z - 0.85} top={CAFE_CHAIR_TOP} back={false} c="#f1c40f" />,
      ])}
      <SeatedStudent seat={{ x: CAFE_TABLES[0][0], z: CAFE_TABLES[0][1] + 0.85, y: CAFE_CHAIR_TOP, rot: Math.PI }} shirt="#2980b9" />
      <SeatedStudent seat={{ x: CAFE_TABLES[0][0], z: CAFE_TABLES[0][1] - 0.85, y: CAFE_CHAIR_TOP, rot: 0 }} shirt="#e74c3c" woman />

      {/* Students about */}
      <Walkers walkers={low ? STROLLERS.slice(0, 2) : STROLLERS} />
      <Students
        list={[
          ...([
          { p: [-10, 0, 10.4], shirt: '#2980b9', rot: 0 },
          { p: [-9, 0, 10.6], shirt: '#e74c3c', woman: true, rot: Math.PI },
          { p: [11, 0, 9.6], shirt: '#27ae60', rot: Math.PI / 2 },
          { p: [-3, 0, -12], shirt: '#f1c40f', woman: true, rot: 0 },
          ] as Student[]),
          ...(low ? [] : ([
            { p: [3, 0, -6], shirt: '#ecf0f1', rot: -Math.PI / 2 },
            { p: [-21, 0, -6], shirt: '#9b59b6', woman: true, rot: Math.PI / 2 },
            { p: [21, 0, -7], shirt: '#34495e', rot: -Math.PI / 2 },
          ] as Student[])),
        ]}
      />
    </group>
  );
}

/** The campus lawn around a building you are inside, so no sky shows under the room. */
function Outside() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
      <planeGeometry args={[140, 140]} />
      <meshStandardMaterial map={groundMap('grass', 140, 140)} roughness={1} />
    </mesh>
  );
}

// ---------------- Inside the lecture theatre ----------------

/** Rows of long desks with benches; you stand in the gaps between them. */
function Rows({ x0, x1 }: { x0: number; x1: number }) {
  return (
    <>
      {[-0.7, 0.8, 2.3, 3.8].map((z, i) => (
        <group key={z}>
          <Box p={[(x0 + x1) / 2, 0.08 + i * 0.06, z + 0.2]} s={[x1 - x0 + 0.4, 0.16 + i * 0.12, 1.4]} c="#8a6a45" />
          <Box p={[(x0 + x1) / 2, 0.75 + i * 0.12, z]} s={[x1 - x0, 0.06, 0.5]} c="#6b4a2f" />
          <Box p={[(x0 + x1) / 2, 0.45 + i * 0.12, z + 0.5]} s={[x1 - x0, 0.06, 0.32]} c="#5b3a21" />
        </group>
      ))}
    </>
  );
}

export function LectureHall() {
  const low = useSettings((s) => s.quality === 'low');
  const walk = useWalk();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} receiveShadow onClick={walk}>
        <planeGeometry args={[18, 11]} />
        <meshStandardMaterial color="#b98a5a" />
      </mesh>
      {/* Back wall with the board and screen, left wall */}
      <Box p={[0, 2.2, -4.2]} s={[18, 4.4, 0.3]} c="#efe6d6" />
      <Box p={[-9.1, 2.2, 1]} s={[0.3, 4.4, 10.6]} c="#e8dcc4" />
      <Box p={[-1, 2.2, -4.02]} s={[7, 2.2, 0.06]} c="#f8f8f4" />
      <Box p={[5, 2.6, -4.02]} s={[3.4, 2, 0.06]} c="#dfe8f2" />
      <Sign p={[-1, 3.9, -4]} text="LT 1000 · GST 101: Use of English" />
      {/* Stage and podium with the lecturer */}
      <Box p={[0, 0.12, -3]} s={[12, 0.24, 2]} c="#7a5a3a" />
      <Box p={[2.2, 0.75, -2.6]} s={[0.8, 1.1, 0.6]} c="#5b3a21" />
      <group position={[2.2, 0.24, -3.2]} rotation={[0, 0, 0]}>
        <Person shirt="#f2ead8" trousers="#2b2b2b" outfit="agbada" move="Interact" />
      </group>

      <Tappable id="lt-seats">
        <Rows x0={-2.5} x1={1.8} />
        <Rows x0={2.8} x1={7.2} />
      </Tappable>
      <Tappable id="lt-exam">
        {[-7.6, -6.2, -4.8].flatMap((x) => [0.4, 2, 3.6].map((z) => (
          <group key={`${x}${z}`}>
            <Box p={[x, 0.7, z]} s={[0.9, 0.06, 0.6]} c="#8a6a45" />
            <Box p={[x, 0.35, z]} s={[0.1, 0.7, 0.1]} c="#555" />
            <Chair x={x} z={z + 0.55} top={EXAM_CHAIR_TOP} c="#3a3d42" />
          </group>
        )))}
      </Tappable>
      <Tappable id="lt-exit">
        <Box p={[7.6, 0.02, 5.8]} s={[1.8, 0.04, 1.2]} c="#7a2b2b" />
      </Tappable>
      <Sign p={[7.6, 1.6, 5.8]} text="🚪 EXIT" />
      <Outside />

      {/* Students in their seats, on the benches */}
      {(low ? LT_TAKEN.slice(0, 4) : LT_TAKEN).map(([row, x, shirt, woman]) => (
        <SeatedStudent key={`${row}${x}`} seat={ltSeat(row, x)} shirt={shirt} woman={woman} />
      ))}
    </group>
  );
}

// ---------------- Inside the library ----------------

const BOOK_COLORS = ['#8b1e3f', '#1f4f7a', '#2f6b4a', '#c9a24a', '#5b3a21', '#7a2b2b', '#34495e'];

function Shelf({ p, rot = 0, len = 4 }: { p: [number, number, number]; rot?: number; len?: number }) {
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <Box p={[0, 1.4, 0]} s={[len, 2.8, 0.5]} c="#6b4a2f" />
      {[0.5, 1.2, 1.9, 2.5].flatMap((y, r) =>
        Array.from({ length: Math.floor(len / 0.5) }, (_, i) => (
          <Box key={`${r}${i}`} p={[-len / 2 + 0.25 + i * 0.5, y, 0.27]} s={[0.42, 0.45, 0.06]} c={BOOK_COLORS[(i * 3 + r) % BOOK_COLORS.length]} />
        )),
      )}
    </group>
  );
}

export function LibraryHall() {
  const low = useSettings((s) => s.quality === 'low');
  const walk = useWalk();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]} receiveShadow onClick={walk}>
        <planeGeometry args={[18, 11]} />
        <meshStandardMaterial color="#9fb3a8" />
      </mesh>
      <Box p={[0, 2.4, -5.2]} s={[18, 4.8, 0.3]} c="#efe6d6" />
      <Box p={[-9.1, 2.4, 0.3]} s={[0.3, 4.8, 11]} c="#e8dcc4" />
      <Sign p={[0, 4.4, -5]} text="📚 SILENCE PLEASE" />
      {/* Shelves along the back wall and rows on the left */}
      {[-6, -1.5, 3, 7].map((x) => (
        <Shelf key={x} p={[x, 0, -4.7]} />
      ))}
      {[-3.6, -1.2, 1.2, 3.6].map((z) => (
        <Shelf key={z} p={[-7.4, 0, z]} rot={Math.PI / 2} len={2} />
      ))}
      <Tappable id="lib-tables">
        {[-0.5, 2.2].flatMap((z) => [-3, -0.6].map((x) => (
          <group key={`${x}${z}`}>
            <Box p={[x, 0.75, z]} s={[1.8, 0.08, 1.1]} c="#8a6a45" />
            <Box p={[x, 0.37, z]} s={[0.12, 0.74, 0.12]} c="#5b3a21" />
            <Cyl p={[x + 0.6, 0.95, z - 0.3]} r={0.08} h={0.3} c="#d8a53a" />
            {[-0.5, 0.5].map((dx) => (
              <Box key={dx} p={[x + dx, 0.45, z + 0.75]} s={[0.5, 0.06, 0.5]} c="#3a3d42" />
            ))}
          </group>
        )))}
      </Tappable>
      <Tappable id="lib-desk">
        <Box p={[5, 0.55, -1.2]} s={[3, 1.1, 0.8]} c="#5b3a21" />
        <Box p={[5, 1.15, -1.2]} s={[3.1, 0.08, 0.9]} c="#8a6a45" />
        {[3.8, 5, 6.2].map((x) => (
          <Box key={x} p={[x, 1.45, -1.45]} s={[0.6, 0.45, 0.05]} c="#1b1a22" />
        ))}
        <group position={[5, 0, -2.1]}>
          <Person shirt="#7a2b2b" woman hat={{ type: 'gele', color: '#7a2b2b', band: '#d8a53a' }} move="Idle" />
        </group>
      </Tappable>
      <Tappable id="lib-exit">
        <Box p={[7.6, 0.02, 5.4]} s={[1.8, 0.04, 1.2]} c="#7a2b2b" />
      </Tappable>
      <Sign p={[7.6, 1.6, 5.4]} text="🚪 EXIT" />
      <Outside />
      {/* Readers in the chairs at the tables */}
      {(low ? LIB_TAKEN.slice(0, 2) : LIB_TAKEN).map(([x, z, shirt, woman]) => (
        <SeatedStudent key={`${x}${z}`} seat={{ x, z: z + 0.8, y: LIB_CHAIR_TOP, rot: Math.PI }} shirt={shirt} woman={woman} />
      ))}
    </group>
  );
}

export const CAMPUS_SCENES = { campus: CampusGrounds, lt: LectureHall, unilib: LibraryHall } as const;
