import type { ThreeEvent } from '@react-three/fiber';
import { AREAS } from '../content/housing';
import { clockParts, daylight } from '../engine/clock';
import { useGame } from '../store/game';
import { Art, Floor, marble, paint, Sconce, TRIM, WOOD } from './Interior';
import { Box, Cyl, Tappable } from './Room';
import { At, Shell } from './Spread';
import { HouseProp, Prop } from './Prop';

/** A proper flat (Gwarinpa, Garki, Wuse 2, your Kuje bungalow): bedroom, kitchen, bathroom, parlour, dining and a small study. */
export function Flat({ onFloor }: { onFloor: (e: ThreeEvent<MouseEvent>) => void }) {
  const area = useGame((s) => s.area);
  const power = useGame((s) => s.power);
  const ups = useGame((s) => s.homeUps ?? []);
  const night = useGame((s) => daylight(clockParts(Math.floor(s.time / 10) * 10).minuteOfDay) < 0.35);
  const has = (id: string) => ups.includes(id);
  const theme = AREAS[area].theme;
  const lux = !!AREAS[area].lux;
  // Light dey only when NEPA bring am, or when you get inverter
  const lit = night && (power || has('inverter'));
  const tvOn = power || has('inverter');

  const tile = paint(`flat-tile-${theme.floor}`, marble(theme.floor, '#ffffff', '#00000033'));
  const white = paint('flat-white', marble('#eef0f2', '#c9ccd2', '#cfd2d8'));
  const sofa = lux ? '#3d4a5c' : '#7a5236';
  const KITCHEN = lux ? { wood: '#f3f1ec', woodDark: '#d9d4c9' } : { wood: '#d9c6a5', woodDark: '#b8a17c' };

  return (
    <group>
      <Shell>
      {/* ---------- Floors ---------- */}
      <Floor x0={-6.6} z0={-3} x1={4} z1={2.9} tex={tile} tile={1.4} rough={0.35} onFloor={onFloor} />
      <Floor x0={-1.3} z0={-3} x1={4} z1={-0.8} tex={white} y={0.006} tile={1.2} onFloor={onFloor} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.6, 0.01, 1.0]} receiveShadow onClick={onFloor}>
        <planeGeometry args={[2.2, 1.6]} />
        <meshStandardMaterial color={theme.rug} roughness={0.9} />
      </mesh>

      {/* ---------- Walls ---------- */}
      <Box p={[-1.3, 1.3, -3.05]} s={[10.7, 2.6, 0.12]} c={theme.wall} />
      <Box p={[-6.66, 1.3, -0.05]} s={[0.12, 2.6, 6.1]} c={theme.wall2} />
      <Box p={[-1.3, 0.08, -2.98]} s={[10.7, 0.16, 0.03]} c={TRIM} />
      <Box p={[-1.3, 0.05, 2.92]} s={[10.7, 0.1, 0.08]} c={TRIM} />
      <Box p={[4.0, 0.05, -1.2]} s={[0.08, 0.1, 3.6]} c={TRIM} />
      {/* Inside walls, cut low */}
      <Box p={[-3.2, 0.6, -0.2]} s={[1.6, 1.2, 0.1]} c={theme.wall2} />
      <Box p={[-1.3, 0.6, -2.0]} s={[0.1, 1.2, 2.0]} c={theme.wall2} />
      <Box p={[1.95, 0.6, -2.0]} s={[0.1, 1.2, 2.0]} c="#cfe0e5" />
      <Box p={[3.3, 0.6, -0.8]} s={[1.4, 1.2, 0.1]} c="#cfe0e5" />
      <Box p={[-4.2, 0.6, -1.6]} s={[0.1, 1.2, 2.8]} c={theme.wall2} />
      <Box p={[-5.9, 0.6, 0.3]} s={[1.4, 1.2, 0.1]} c={theme.wall2} />

      {/* Window, lights and art */}
      <Box p={[-1.8, 1.7, -2.97]} s={[1.2, 0.9, 0.02]} c="#9fd3f0" />
      <Box p={[-1.8, 1.7, -2.95]} s={[1.3, 0.04, 0.03]} c="#f4f4f4" />
      {[-5.4, -3.6, 0.2, 3.0].map((x) => <Sconce key={x} p={[x, 1.9, -2.96]} lit={lit} />)}
      <Art p={[-6.58, 1.5, 1.6]} w={0.8} h={0.6} c1={theme.rug} c2="#f4f1ec" rotY={Math.PI / 2} />
      <Art p={[-3.0, 1.85, -2.96]} w={0.8} h={0.5} c1="#2f6b4a" c2="#e8b04b" />

      </Shell>
      {/* ---------- Bedroom ---------- */}
      <At id="bed">
      <Tappable id="bed">
          <HouseProp name="Bed_King" p={[-2.9, 0, -1.95]} s={1.05} tint={{ Wood: WOOD, Red: theme.bed, DarkRed: theme.bed, White: '#f1eee8' }} />
          {has('mattress') && <Box p={[-2.9, 0.5, -2.0]} s={[1.5, 0.05, 1.8]} c="#ece7dd" />}
        </Tappable>
      <Box p={[-3.9, 0.25, -2.75]} s={[0.36, 0.5, 0.36]} c={WOOD} />
      <mesh position={[-3.9, 0.65, -2.75]}>
        <cylinderGeometry args={[0.09, 0.12, 0.16, 14]} />
        <meshStandardMaterial color="#fff1cf" emissive="#ffc46b" emissiveIntensity={lit ? 1.4 : 0.05} />
      </mesh>
      {/* Wardrobe */}
      <Box p={[-1.75, 0.95, -2.7]} s={[0.7, 1.9, 0.55]} c="#8a6a4a" />
      <Box p={[-1.75, 0.95, -2.42]} s={[0.02, 1.8, 0.02]} c="#3a2a1c" />
      {(lux || has('ac')) && <Box p={[-2.9, 2.25, -2.92]} s={[1.0, 0.3, 0.18]} c="#f4f4f4" />}
      </At>

      {/* ---------- Kitchen ---------- */}
      <At id="cooler">
      <Tappable id="cooler">
          {has('fridge') ? (
            <Prop name="kitchenFridge" p={[-0.75, 0, -2.8]} s={1.15} glossy />
          ) : (
            <>
              <Box p={[-0.7, 0.25, -2.6]} s={[0.8, 0.5, 0.5]} c="#c8312b" />
              <Box p={[-0.7, 0.54, -2.6]} s={[0.84, 0.08, 0.54]} c="#f4f4f4" />
            </>
          )}
        </Tappable>
      </At>
      <At id="stove">
      <Tappable id="stove">
          <Prop name="kitchenCabinetDrawer" p={[0.1, 0, -2.66]} tint={KITCHEN} />
          <Prop name="kitchenStove" p={[0.79, 0, -2.66]} tint={KITCHEN} />
          <Prop name="kitchenSink" p={[1.48, 0, -2.66]} tint={KITCHEN} />
          <Prop name="kitchenCabinetUpper" p={[0.1, 1.35, -2.86]} tint={KITCHEN} />
          <Prop name="kitchenCabinetUpper" p={[1.48, 1.35, -2.86]} tint={KITCHEN} />
          <Cyl p={[0.79, 0.3, -2.1]} r={0.16} h={0.55} c="#2f8f4e" />
        </Tappable>
      </At>

      {/* ---------- Bathroom ---------- */}
      <At id="bucket">
      <Tappable id="bucket">
          <Prop name={lux ? 'shower' : 'showerRound'} p={[2.48, 0, -2.55]} s={1.05} />
          <Cyl p={[3.05, 0.15, -2.75]} r={0.16} h={0.3} c="#2f6fd6" />
        </Tappable>
      </At>
      <At id="toilet">
      <Tappable id="toilet">
          <Prop name="toilet" p={[3.62, 0, -2.75]} s={1.1} />
        </Tappable>
      <Box p={[3.55, 0.42, -1.2]} s={[0.5, 0.84, 0.38]} c={WOOD} />
      <Box p={[3.55, 0.86, -1.2]} s={[0.52, 0.05, 0.4]} c="#f4f4f4" />
      </At>

      {/* ---------- Parlour ---------- */}
      <At id="tv">
      <Tappable id="tv">
          <Prop name="cabinetTelevision" p={[-3.85, 0, 1.0]} rot={Math.PI / 2} s={1.2} tint={{ wood: '#3d2a1a' }} />
          {has('smarttv') ? (
            <>
              <Prop name="televisionModern" p={[-3.92, 0.6, 1.0]} rot={Math.PI / 2} s={1.6} />
              <mesh position={[-3.83, 1.0, 1.0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[1.6, 0.82]} />
                <meshStandardMaterial color={tvOn ? '#3fb27f' : '#0b0b0b'} emissive={tvOn ? '#1d8a5a' : '#000'} emissiveIntensity={0.8} />
              </mesh>
            </>
          ) : (
            <>
              <Prop name="televisionVintage" p={[-3.85, 0.6, 1.0]} rot={Math.PI / 2} s={1.1} />
            </>
          )}
          {has('ps5') && <Box p={[-3.8, 0.66, 1.65]} s={[0.12, 0.3, 0.26]} c="#f4f4f4" />}
          {/* Three-seater and an armchair */}
          <HouseProp name="Couch_Large2" p={[-1.35, 0, 1.0]} rot={-Math.PI / 2} s={0.9} tint={{ Couch_Beige: sofa, Couch_BeigeDark: sofa }} />
          <HouseProp name="Couch_Small1" p={[-2.6, 0, 2.45]} rot={Math.PI} s={0.95} tint={{ Couch_Blue: sofa, Black: '#2b2018' }} />
          <Prop name="tableCoffee" p={[-2.6, 0, 1.0]} rot={Math.PI / 2} s={1.1} tint={{ wood: '#5a3e2a' }} />
        </Tappable>
      </At>
      {/* Ceiling fan */}
      <At x={-2.4} z={1.0}>
      <group position={[-2.4, 2.4, 1.0]}>
        <Cyl p={[0, 0, 0]} r={0.08} h={0.12} c="#e8e8e8" />
        <Box p={[0, -0.04, 0]} s={[1.2, 0.02, 0.14]} c="#e8e8e8" />
        <Box p={[0, -0.04, 0]} s={[0.14, 0.02, 1.2]} c="#e8e8e8" />
      </group>
      </At>
      <At x={-3.85} z={2.6}>
      <HouseProp name="Houseplant_7" p={[-3.7, 0, 2.55]} s={1.7} />
      </At>
      <At id="tv">
      {has('wifi') && (
        <group>
          <Box p={[-3.8, 0.64, 0.25]} s={[0.25, 0.06, 0.18]} c="#f4f4f4" />
          <Box p={[-3.7, 0.68, 0.25]} s={[0.03, 0.02, 0.03]} c="#2ecc71" />
        </group>
      )}
      </At>
      <At x={0.6} z={2.5}>
      {has('inverter') && (
        <group>
          <Box p={[0.6, 0.3, 2.5]} s={[0.4, 0.6, 0.35]} c="#2c3e50" />
          <Box p={[0.81, 0.45, 2.5]} s={[0.02, 0.06, 0.06]} c="#2ecc71" />
        </group>
      )}

      </At>
      {/* ---------- Dining ---------- */}
      <At x={-5.4} z={-1.4}>
        <Prop name="table" p={[-5.4, 0, -1.4]} s={1.1} tint={{ wood: WOOD }} />
        {[-0.35, 0.35].map((x) => (
          <group key={x}>
            <Prop name="chairCushion" p={[-5.4 + x, 0, -2.05]} s={1.05} tint={{ wood: WOOD, carpet: theme.rug }} />
            <Prop name="chairCushion" p={[-5.4 + x, 0, -0.75]} rot={Math.PI} s={1.05} tint={{ wood: WOOD, carpet: theme.rug }} />
          </group>
        ))}
        <Prop name="plantSmall1" p={[-5.4, 0.55, -1.4]} s={1.6} tint={{ plant: '#2f8f3a' }} />
      </At>
      <At x={-6.3} z={-3}>
        <HouseProp name="Houseplant_4" p={[-6.3, 0, -2.7]} s={1.9} />
      </At>

      {/* ---------- Small study ---------- */}
      <At x={-5.4} z={1.6}>
        <Prop name="desk" p={[-5.4, 0, 0.7]} s={1.1} tint={{ wood: '#8a6a4a' }} />
        <Prop name="computerScreen" p={[-5.4, 0.66, 0.6]} s={1.2} />
        <Prop name="chairDesk" p={[-5.4, 0, 1.3]} rot={Math.PI} s={1.0} />
        <Prop name="bookcaseOpen" p={[-6.4, 0, 1.9]} rot={Math.PI / 2} s={1.1} tint={{ wood: '#7a5a3c' }} />
        <Prop name="books" p={[-6.35, 0.75, 1.9]} rot={Math.PI / 2} s={1.6} />
      </At>

      {/* ---------- Front door ---------- */}
      <At x={4} z={1.85}>
      <Box p={[4.05, 1.0, 1.85]} s={[0.06, 2, 0.05]} c="#5b3a21" />
      <Box p={[4.5, 1.0, 1.35]} s={[0.9, 2, 0.06]} c="#7a4e2a" r={[0, -0.6, 0]} />
      </At>

      <Shell>
      {lit && <pointLight position={[-5.4, 2.0, -0.6]} intensity={6} distance={5} decay={1.6} color="#ffd9a0" />}
      </Shell>
    </group>
  );
}
