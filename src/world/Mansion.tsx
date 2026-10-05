import type { ThreeEvent } from '@react-three/fiber';
import { carById } from '../content/cars';
import { daylight, clockParts } from '../engine/clock';
import { useGame } from '../store/game';
import { CarModel } from './CarModel';
import { Box, Cyl, Tappable } from './Room';
import { At, Shell } from './Spread';
import { Art, carpet, concrete, Floor, GOLD, marble, paint, Sconce, TRIM } from './Interior';
import { HouseProp, Prop } from './Prop';

/** Big-money house for Maitama, Asokoro and Guzape: many rooms, marble, and toys. */

const WALL = '#a9bdb0';
const WALL_IN = '#c3d2c7';
const CAP = '#2a2e33';

/** Furniture colours: black frames, red fabric, white kitchen. */
const WHITE_KITCHEN = { wood: '#f3f1ec', woodDark: '#d9d4c9', metal: '#bfc4c9' };
const PLANT = { plant: '#2f8f3a', wood: '#f2f2f2', woodDark: '#d9d9d9' };
const KING_BED = { Red: '#a3141c', DarkRed: '#7d0f15', Wood: '#18181b', White: '#f1eee8', Grey: '#2a2a2e' };
const DARK_WOOD = { wood: '#4a2e1c', woodDark: '#3a2416', carpet: '#a3141c', metal: '#c9a24a' };

/** Inside wall, cut low for the dollhouse view, with a dark cap on top. */
function LowWall({ x, z, w, d, h = 1.15, c = WALL_IN }: { x: number; z: number; w: number; d: number; h?: number; c?: string }) {
  return (
    <>
      <Box p={[x, h / 2, z]} s={[w, h, d]} c={c} />
      <Box p={[x, h + 0.015, z]} s={[w + 0.02, 0.03, d + 0.02]} c={CAP} />
    </>
  );
}

/** Round dining table with four cushioned chairs facing it. */
function DiningSet({ x, z }: { x: number; z: number }) {
  return (
    <group>
      <HouseProp name="Table_RoundSmall" p={[x, 0, z]} s={1.15} tint={{ Wood: '#4a2e1c' }} />
      <HouseProp name="Houseplant_2" p={[x, 0.51, z]} s={1.6} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        const dx = Math.sin(a) * 0.85;
        const dz = Math.cos(a) * 0.85;
        return <HouseProp key={i} name="Chair_2" p={[x + dx, 0, z + dz]} rot={Math.atan2(-dx, -dz)} s={1.05} tint={{ Wood_Dark: '#3a2416', Cushin: '#a3141c' }} />;
      })}
    </group>
  );
}

// ---------------- The house ----------------

export function Mansion({ onFloor }: { onFloor: (e: ThreeEvent<MouseEvent>) => void }) {
  const car = useGame((s) => s.car);
  const ups = useGame((s) => s.homeUps ?? []);
  const night = useGame((s) => daylight(clockParts(Math.floor(s.time / 10) * 10).minuteOfDay) < 0.35);
  // Big man house get gen and inverter: light no dey go
  const lit = night;
  const c = car ? carById(car.id) : undefined;

  const darkMarble = paint('dark-marble', marble('#1d1f24', '#a8aeb8', '#0b0c0e'));
  const whiteTile = paint('white-tile', marble('#eceef1', '#c2c6cd', '#cdd0d6'));
  const red = paint('red-carpet', carpet);
  const slab = paint('garage', concrete);

  return (
    <group>
      <Shell>
        {/* ---------- Floors ---------- */}
        <Floor x0={-8.6} z0={-3} x1={4} z1={2.9} tex={darkMarble} rough={0.18} reflect onFloor={onFloor} />
        <Floor x0={-1.3} z0={-3} x1={4} z1={-0.8} tex={whiteTile} y={0.006} tile={1.6} rough={0.2} onFloor={onFloor} />
        <Floor x0={2.1} z0={-0.6} x1={4} z1={1.0} tex={whiteTile} y={0.006} tile={1.6} rough={0.2} onFloor={onFloor} />
        <Floor x0={-8.4} z0={-2.8} x1={-4.5} z1={0.1} tex={red} y={0.008} tile={3.9} rough={0.9} onFloor={onFloor} />
        <Floor x0={-8.6} z0={0.4} x1={-4.2} z1={2.9} tex={slab} y={0.008} tile={2.2} rough={0.9} onFloor={onFloor} />
        <Floor x0={-4.0} z0={-2.3} x1={-1.6} z1={-0.45} tex={red} y={0.01} tile={2.4} rough={0.9} onFloor={onFloor} />

        {/* ---------- Outer walls (back and side), full height ---------- */}
        <Box p={[-2.3, 1.3, -3.05]} s={[12.7, 2.6, 0.12]} c={WALL} />
        <Box p={[-8.66, 1.3, -0.05]} s={[0.12, 2.6, 6.1]} c={WALL} />
        <Box p={[-2.3, 2.62, -3.05]} s={[12.72, 0.04, 0.14]} c={CAP} />
        <Box p={[-8.66, 2.62, -0.05]} s={[0.14, 0.04, 6.12]} c={CAP} />
        <Box p={[-2.3, 0.08, -2.98]} s={[12.7, 0.16, 0.03]} c={TRIM} />
        <Box p={[-8.59, 0.08, -0.05]} s={[0.03, 0.16, 6.1]} c={TRIM} />
        {/* Front edge is cut away (dollhouse view); a low kerb shows the line */}
        <Box p={[-2.3, 0.05, 2.92]} s={[12.7, 0.1, 0.08]} c={TRIM} />
        <Box p={[4.0, 0.05, -1.2]} s={[0.08, 0.1, 3.6]} c={TRIM} />

        {/* ---------- Inside walls ---------- */}
        <LowWall x={-3.2} z={-0.2} w={1.6} d={0.1} />
        <LowWall x={-1.3} z={-2.0} w={0.1} d={2.0} />
        <mesh position={[2.0, 0.9, -2.15]}>
          <boxGeometry args={[0.05, 1.8, 1.7]} />
          <meshStandardMaterial color="#bfe6f2" transparent opacity={0.3} roughness={0.05} />
        </mesh>
        <LowWall x={3.3} z={-0.8} w={1.4} d={0.1} />
        <LowWall x={-4.2} z={-1.6} w={0.1} d={2.8} />
        <LowWall x={-4.2} z={2.6} w={0.1} d={0.6} />
        <LowWall x={-7.6} z={0.3} w={2.0} d={0.1} />
        <LowWall x={-4.75} z={0.3} w={1.0} d={0.1} />

        {/* ---------- Wall lights, art and the AC ---------- */}
        {[-7.6, -5.2, -3.6, -2.2, -0.2, 1.6, 3.4].map((x) => <Sconce key={x} p={[x, 1.9, -2.96]} lit={lit} />)}
        {[-2.0, 1.6].map((z) => <Sconce key={z} p={[-8.57, 1.9, z]} rotY={Math.PI / 2} lit={lit} />)}
        <Art p={[-6.4, 1.6, -2.96]} w={1.6} h={0.9} c1="#e8b04b" c2="#8b1e3f" />
        <Art p={[-2.9, 1.85, -2.96]} w={1.1} h={0.6} c1="#2f6b4a" c2="#e8e2d0" />
        <Art p={[-8.57, 1.5, -1.2]} w={0.8} h={1.0} c1="#1f4f7a" c2="#c9a24a" rotY={Math.PI / 2} />
        <Box p={[-2.9, 2.3, -2.92]} s={[1.0, 0.28, 0.18]} c="#f4f4f4" />
        <Box p={[-8.55, 1.0, 1.65]} s={[0.04, 1.6, 2.2]} c="#8a8f95" />
      </Shell>

      {/* ---------- Master bedroom ---------- */}
      <At id="bed">
        <Tappable id="bed">
          <HouseProp name="Bed_King" p={[-2.9, 0, -1.95]} s={1.15} tint={KING_BED} />
          {ups.includes('mattress') && <Box p={[-2.9, 0.5, -2.0]} s={[1.6, 0.05, 1.9]} c="#ece7dd" />}
        </Tappable>
        {[-4.15, -1.65].map((x) => (
          <group key={x}>
            <HouseProp name="NightStand_2" p={[x, 0, -2.78]} s={1.1} tint={{ Wood: '#18181b', Metal: GOLD }} />
            <HouseProp name="Light_Desk" p={[x, 0.46, -2.78]} s={1.3} tint={{ Black: GOLD }} glow={lit ? 2.5 : 0.2} />
          </group>
        ))}
        <HouseProp name="Houseplant_4" p={[-1.65, 0, -0.55]} s={2.2} />
      </At>

      {/* ---------- Kitchen ---------- */}
      <At id="cooler">
        <Tappable id="cooler">
          <Prop name="kitchenFridgeLarge" p={[-0.75, 0, -2.7]} s={1.1} glossy />
        </Tappable>
      </At>
      <At id="stove">
        <Tappable id="stove">
          <Prop name="kitchenCabinetDrawer" p={[0.0, 0, -2.66]} tint={WHITE_KITCHEN} />
          <Prop name="kitchenStove" p={[0.69, 0, -2.66]} tint={WHITE_KITCHEN} />
          <Prop name="kitchenSink" p={[1.38, 0, -2.66]} tint={WHITE_KITCHEN} />
          <Prop name="hoodModern" p={[0.69, 1.3, -2.78]} />
          <Prop name="kitchenCabinetUpperDouble" p={[0.0, 1.35, -2.86]} tint={WHITE_KITCHEN} />
          <Prop name="kitchenCabinetUpperDouble" p={[1.38, 1.35, -2.86]} tint={WHITE_KITCHEN} />
          <Prop name="kitchenCoffeeMachine" p={[-0.12, 0.72, -2.7]} />
        </Tappable>
      </At>
      {/* Kitchen island with bar stools */}
      <At x={0.6} z={-1.15}>
        {[-0.09, 0.6, 1.29].map((x) => <Prop key={x} name="kitchenBar" p={[x, 0, -1.25]} rot={Math.PI} tint={WHITE_KITCHEN} />)}
        <Box p={[0.6, 0.69, -1.25]} s={[2.15, 0.04, 0.42]} c="#16171a" />
        {[-0.05, 0.6, 1.25].map((x) => <Prop key={x} name="stoolBar" p={[x, 0, -0.78]} rot={Math.PI} tint={{ carpet: '#16171a', wood: '#c9a24a' }} />)}
      </At>

      {/* ---------- Bathroom ---------- */}
      <At id="bucket">
        <Tappable id="bucket">
          <Prop name="shower" p={[2.48, 0, -2.55]} s={1.05} />
        </Tappable>
      </At>
      <At id="toilet">
        <Tappable id="toilet">
          <Prop name="toilet" p={[3.68, 0, -2.75]} s={1.1} />
        </Tappable>
        <Prop name="bathroomSinkSquare" p={[3.05, 0.1, -2.78]} />
        <Prop name="bathroomMirror" p={[3.05, 1.15, -2.95]} s={1.1} />
        <Prop name="plantSmall3" tint={PLANT} p={[3.85, 0, -1.1]} s={2.4} />
      </At>
      {/* Jacuzzi corner */}
      <At id="jacuzzi">
        <Tappable id="jacuzzi">
          <group position={[3.05, 0, 0.2]}>
            <Cyl p={[0, 0.25, 0]} r={0.8} h={0.5} c="#f4f4f4" />
            <Cyl p={[0, 0.5, 0]} r={0.84} h={0.04} c="#d9dde2" />
            <mesh position={[0, 0.47, 0]}>
              <cylinderGeometry args={[0.66, 0.66, 0.05, 40]} />
              <meshStandardMaterial color="#5ec8e6" emissive="#2a9fc4" emissiveIntensity={lit ? 1.2 : 0.35} roughness={0.02} metalness={0.1} />
            </mesh>
            {/* Step and towels */}
            <Box p={[-0.95, 0.08, 0.2]} s={[0.3, 0.16, 0.6]} c="#e9e9ee" />
            <Box p={[0.5, 0.56, -0.62]} s={[0.35, 0.06, 0.2]} c="#f8f8f8" />
            <HouseProp name="Houseplant_6" p={[0.9, 0, -0.7]} s={1.5} />
          </group>
        </Tappable>
      </At>

      {/* ---------- Living room ---------- */}
      <At id="tv">
        <Tappable id="tv">
          {/* Feature wall with LED strip, big screen and tall speakers */}
          <Box p={[-4.12, 1.05, 1.0]} s={[0.1, 2.1, 2.6]} c="#141619" />
          {[-0.15, 0.2, 1.8, 2.15].map((z) => <Box key={z} p={[-4.06, 1.05, z]} s={[0.02, 2.1, 0.05]} c="#2a2d33" />)}
          <mesh position={[-4.05, 2.08, 1.0]}>
            <boxGeometry args={[0.03, 0.04, 2.5]} />
            <meshStandardMaterial color="#5ab4ff" emissive="#2f8fff" emissiveIntensity={3} />
          </mesh>
          <mesh position={[-4.05, 0.05, 1.0]}>
            <boxGeometry args={[0.03, 0.03, 2.5]} />
            <meshStandardMaterial color="#5ab4ff" emissive="#2f8fff" emissiveIntensity={2} />
          </mesh>
          <Prop name="cabinetTelevision" p={[-3.85, 0, 1.0]} rot={Math.PI / 2} s={1.35} tint={{ wood: '#16171a' }} />
          <Prop name="televisionModern" p={[-3.95, 0.68, 1.0]} rot={Math.PI / 2} s={1.9} />
          <mesh position={[-3.86, 1.17, 1.0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.95, 1.0]} />
            <meshStandardMaterial color="#2f7fd6" emissive="#1f5fa8" emissiveIntensity={1.1} />
          </mesh>
          {[-0.2, 2.2].map((z) => <Prop key={z} name="speaker" p={[-3.85, 0, z]} rot={Math.PI / 2} s={1.25} tint={{ wood: '#16171a' }} />)}
          {ups.includes('ps5') && <Box p={[-3.8, 0.55, 1.6]} s={[0.12, 0.3, 0.26]} c="#f4f4f4" />}
          {/* Red sofas round the rug */}
          <HouseProp name="Couch_Large1" p={[-1.3, 0, 1.0]} rot={-Math.PI / 2} tint={{ Red: '#b0141d', DarkRed: '#7d0f15' }} />
          <HouseProp name="Couch_Medium1" p={[-2.75, 0, 2.5]} rot={Math.PI} s={0.95} tint={{ Couch_Blue: '#b0141d', Black: '#141416' }} />
          <Prop name="tableCoffeeGlass" p={[-2.75, 0, 1.0]} rot={Math.PI / 2} s={1.15} tint={{ metal: GOLD }} />
          <HouseProp name="Light_Stand1" p={[-3.7, 0, -0.5]} s={1.05} tint={{ LightMetal: '#16171a' }} glow={lit ? 2.5 : 0.3} />
        </Tappable>
      </At>
      <At x={-2.7} z={1.0}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.7, 0.012, 1.0]} receiveShadow onClick={onFloor}>
          <circleGeometry args={[1.2, 48]} />
          <meshStandardMaterial color={GOLD} roughness={0.8} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.7, 0.014, 1.0]} receiveShadow onClick={onFloor}>
          <circleGeometry args={[1.05, 48]} />
          <meshStandardMaterial color="#1b1b1f" roughness={0.95} />
        </mesh>
      </At>
      {/* Aquarium on the bedroom wall */}
      <At x={-2.6} z={0.05}>
        <group position={[-2.6, 0, 0.08]}>
          <Box p={[0, 0.32, 0]} s={[1.2, 0.64, 0.4]} c="#141518" />
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[1.16, 0.62, 0.36]} />
            <meshStandardMaterial color="#47c1e0" emissive="#1c8fb5" emissiveIntensity={lit ? 1.4 : 0.5} transparent opacity={0.7} roughness={0.05} />
          </mesh>
          <Box p={[0, 0.68, 0]} s={[1.1, 0.06, 0.32]} c="#d9c48f" />
          {[-0.35, 0.05, 0.3].map((x, i) => <Box key={x} p={[x, 0.85 + (i % 2) * 0.15, 0]} s={[0.12, 0.06, 0.03]} c={['#ffd23a', '#ff8c2a', '#ff4d6d'][i]} />)}
          <Cyl p={[-0.2, 0.85, 0.05]} r={0.03} h={0.3} c="#2e8b3a" />
        </group>
      </At>
      {/* Grand piano with its bench */}
      <At id="piano">
        <Tappable id="piano">
          <group position={[1.1, 0, 0.4]} rotation={[0, -0.5, 0]}>
            <mesh position={[0, 0.75, 0]} castShadow>
              <cylinderGeometry args={[0.62, 0.62, 0.26, 3, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color="#0b0b0c" roughness={0.15} metalness={0.2} />
            </mesh>
            <Box p={[0, 0.75, 0.3]} s={[1.24, 0.26, 0.6]} c="#0b0b0c" />
            <Box p={[0, 1.05, -0.1]} s={[1.1, 0.02, 0.9]} c="#0b0b0c" r={[0.55, 0, 0]} />
            <Box p={[0, 0.82, 0.64]} s={[1.0, 0.05, 0.14]} c="#f4f4f4" />
            <Box p={[0, 0.85, 0.6]} s={[1.0, 0.02, 0.06]} c="#111" />
            {[-0.5, 0.5].flatMap((x) => [-0.1, 0.5].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.31, z]} r={0.04} h={0.62} c="#0b0b0c" />))}
            <Box p={[0, 0.27, 1.0]} s={[0.7, 0.07, 0.32]} c="#0b0b0c" />
            {[-0.3, 0.3].map((x) => <Box key={x} p={[x, 0.13, 1.0]} s={[0.05, 0.26, 0.28]} c="#0b0b0c" />)}
          </group>
        </Tappable>
      </At>
      {/* Pool table with pockets and a cue */}
      <At id="pooltable">
        <Tappable id="pooltable">
          <group position={[0.6, 0, 2.35]}>
            <Box p={[0, 0.66, 0]} s={[1.9, 0.16, 1.05]} c="#4a2e1c" />
            <Box p={[0, 0.75, 0]} s={[1.7, 0.02, 0.85]} c="#1f7a3f" />
            {[-0.82, 0, 0.82].flatMap((x) => [-0.4, 0.4].map((z) => <Cyl key={`p${x}${z}`} p={[x, 0.76, z]} r={0.05} h={0.02} c="#0b0b0c" />))}
            {[-0.8, 0.8].flatMap((x) => [-0.42, 0.42].map((z) => <Box key={`${x}${z}`} p={[x, 0.29, z]} s={[0.14, 0.58, 0.14]} c="#3a2416" />))}
            {['#f4f4f4', '#e74c3c', '#f1c40f', '#2f7fd6', '#111', '#8e44ad'].map((col, i) => (
              <mesh key={col} position={[-0.45 + (i % 3) * 0.12 + Math.floor(i / 3) * 0.6, 0.8, (i % 2) * 0.12 - 0.06]} castShadow>
                <sphereGeometry args={[0.04, 12, 10]} />
                <meshStandardMaterial color={col} roughness={0.2} />
              </mesh>
            ))}
            <Box p={[0.1, 0.79, 0.25]} s={[1.3, 0.02, 0.02]} c="#d9b48a" r={[0, 0.25, 0]} />
          </group>
        </Tappable>
      </At>
      <At x={-3.85} z={2.6}><HouseProp name="Houseplant_7" p={[-3.65, 0, 2.55]} s={2.0} /></At>
      <At x={1.8} z={-0.5}><HouseProp name="Houseplant_4" p={[1.85, 0, -0.45]} s={2.0} /></At>

      {/* ---------- Dining room ---------- */}
      <At x={-7.4} z={-1.4}><DiningSet x={-7.4} z={-1.4} /></At>
      <At x={-5.5} z={-1.4}><DiningSet x={-5.5} z={-1.4} /></At>
      <At x={-6.4} z={-3}><Prop name="cabinetTelevisionDoors" p={[-6.4, 0, -2.8]} s={1.4} tint={DARK_WOOD} /></At>
      <At x={-8.2} z={-3}><HouseProp name="Houseplant_7" p={[-8.15, 0, -2.6]} s={2.0} /></At>
      <At x={-4.6} z={-3}><HouseProp name="Houseplant_8" p={[-4.6, 0, -2.7]} s={1.4} /></At>
      {/* Chandelier */}
      <At x={-6.4} z={-1.4}>
        <HouseProp name="Light_Chandelier" p={[-6.4, 1.95, -1.4]} s={2.2} tint={{ Grey: GOLD }} glow={lit ? 3 : 0.4} />
        <Cyl p={[-6.4, 2.45, -1.4]} r={0.02} h={0.3} c={GOLD} />
        <mesh position={[-6.4, 2.25, -1.4]}>
          <octahedronGeometry args={[0.24, 0]} />
          <meshStandardMaterial color="#fff2c8" emissive="#ffcf6b" emissiveIntensity={lit ? 3 : 0.4} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[-6.4 + Math.sin(i) * 0.35, 2.15, -1.4 + Math.cos(i) * 0.35]}>
            <sphereGeometry args={[0.05, 8, 6]} />
            <meshStandardMaterial color="#fff2c8" emissive="#ffcf6b" emissiveIntensity={lit ? 3 : 0.4} />
          </mesh>
        ))}
      </At>

      {/* ---------- Garage ---------- */}
      {[-7.6, -5.4].map((x) => (
        <At key={x} x={x} z={2.6}>
          <Box p={[x, 0.012, 2.6]} s={[0.06, 0.01, 0.6]} c="#f2c230" />
        </At>
      ))}
      <At x={-6.6} z={1.7}>
        {/* Family cars always dey garage; your own motor parks in front */}
        <group position={[-6.6, 0, 0.6]}>
          <CarModel kind="gwagon" paint="#16171a" />
        </group>
        <group position={[-6.6, 0, 2.75]}>
          <CarModel kind="sedan" paint="#e8b04b" />
        </group>
        {c ? (
          <group position={[-6.6, 0, 1.75]}>
            <CarModel kind={c.model} paint={car?.paint ?? c.color} lights={lit} />
          </group>
        ) : (
          <group position={[-6.6, 0, 1.7]}>
            {/* Empty bay: tools while you save for motor */}
            <Box p={[-1.6, 0.6, -0.9]} s={[0.6, 1.2, 0.4]} c="#c0392b" />
            <Prop name="cardboardBoxClosed" p={[0.4, 0, -0.6]} s={1.4} />
          </group>
        )}
        <Prop name="washer" p={[-8.2, 0, 0.75]} rot={Math.PI / 2} s={1.1} />
      </At>

      {/* ---------- Front doors (glass, open) ---------- */}
      <At x={4} z={1.85}>
        <Box p={[4.05, 1.1, 1.2]} s={[0.08, 2.2, 0.08]} c={TRIM} />
        <Box p={[4.05, 1.1, 2.5]} s={[0.08, 2.2, 0.08]} c={TRIM} />
        <mesh position={[4.4, 1.05, 1.55]} rotation={[0, -0.9, 0]}>
          <boxGeometry args={[0.6, 2.0, 0.04]} />
          <meshStandardMaterial color="#9fd3f0" transparent opacity={0.4} />
        </mesh>
      </At>

      {/* Night lights: dining, bedroom, living and garage (rich man gen no dey off) */}
      {lit && (
        <Shell>
          <pointLight position={[-6.4, 2.0, -1.4]} intensity={8} distance={6} decay={1.6} color="#ffd9a0" />
          <pointLight position={[-2.9, 2.0, -1.6]} intensity={6} distance={5} decay={1.6} color="#ffd9a0" />
          <pointLight position={[-0.6, 2.2, 1.3]} intensity={12} distance={8} decay={1.5} color="#ffe0b0" />
          <pointLight position={[-6.4, 2.0, 1.6]} intensity={5} distance={5} decay={1.6} color="#e8f0ff" />
        </Shell>
      )}
    </group>
  );
}
