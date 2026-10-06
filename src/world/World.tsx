import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useMemo } from 'react';
import { PLACE_NAMES, type Place } from '../content/activities';
import { AREA_OF_CELL, landmarkAt, LANDMARK_NAMES, CELL_X, CELL_Z, COLS, currentCell, inGrid, placeAt, ROAD_HALF, ROAD_Z, ROWS, type Cell } from '../content/worldmap';
import { AREAS, placeLabel, type AreaId } from '../content/housing';
import { useGame } from '../store/game';
import { useSettings } from '../settings';
import { Neighborhood, type HoodStyle, type Rect } from './Neighborhood';
import { CLEAR, hoodStyle, SCENES } from './placeScenes';
import { LANDMARK_SCENES } from './places/CityLandmarks';
import { CellCtx } from './origin';
import { groundMap, type GroundKind } from './groundTex';
import { Tree } from './Street';
import { CarModel } from './CarModel';
import { Person } from './Avatar';
import { Box } from './Room';
import { carById } from '../content/cars';

const ROAD_W = ROAD_HALF * 2 + 0.4;
/** Real ground: grass in most of town, red earth with grass in the poorer edges. */
const GROUND: Record<HoodStyle, GroundKind> = { rich: 'grass', mixed: 'grass', poor: 'earth', city: 'grass' };

/** Tap anywhere on the ground or road: walk there along the roads. */
function useWalkHere() {
  const walkTo = useGame((s) => s.walkTo);
  return (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A drag moves the camera; only a tap counts
    if (e.delta > 8) return;
    walkTo(e.point.x, e.point.z);
  };
}

/** Blocks between places: whose area it is decides the houses. */
function cellStyle(cell: Cell, place: Place | null, area: AreaId): HoodStyle {
  if (place) return hoodStyle(place, area);
  // Somebody else's area street looks like that area: mansions in Maitama, face-me-I-face-you in Nyanya
  const other = AREA_OF_CELL[cell.join(',')] as AreaId | undefined;
  if (other) return hoodStyle('street', other);
  return 'mixed';
}

function Block({ cell, offset, current, full, area }: { cell: Cell; offset: [number, number]; current: boolean; full: boolean; area: AreaId }) {
  const low = useSettings((s) => s.quality === 'low');
  const walk = useWalkHere();
  const place = inGrid(cell) ? placeAt(cell, area) : null;
  const landmark = inGrid(cell) && !place ? landmarkAt(cell) : null;
  const PlaceScene = place ? SCENES[place] : landmark ? LANDMARK_SCENES[landmark] : undefined;
  const style = landmark ? 'rich' : cellStyle(cell, place, area);
  const info = useMemo(() => ({ current, ground: [CELL_X, CELL_Z] as [number, number] }), [current]);
  const seed = 101 + cell[0] * 53 + cell[1] * 211;
  // Landmarks keep their grounds open; only a few houses at the edges
  const clear: Rect[] = place ? (CLEAR[place] ?? [[-8.6, -8, 8.6, 4.6]]) : landmark ? [[-12, -15, 12, 6]] : [];
  // Big name over every block so you know where you dey
  const other = AREA_OF_CELL[cell.join(',')] as AreaId | undefined;
  const name = place ? placeLabel(place, area, PLACE_NAMES) : landmark ? LANDMARK_NAMES[landmark] : other ? `${AREAS[other].name} street` : null;
  return (
    <group position={[offset[0], 0, offset[1]]}>
      {name && (
        // Standing at the corner of the block, by the road
        <Html position={[-CELL_X / 2 + 6, 3.2, ROAD_Z - 2.4]} center zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`block-name ${current ? 'here' : ''}`}>{name}</div>
        </Html>
      )}
      <CellCtx.Provider value={info}>
        {!inGrid(cell) ? (
          // Bush beyond the city
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow onClick={walk}>
              <planeGeometry args={[CELL_X, CELL_Z]} />
              <meshStandardMaterial map={groundMap('grass', CELL_X, CELL_Z)} color="#e6f0d8" roughness={1} />
            </mesh>
            {Array.from({ length: 10 }, (_, i) => (
              <Tree key={i} p={[((seed * (i + 3)) % 40) - 20, 0, ((seed * (i + 7)) % 34) - 17]} s={1 + (i % 3) * 0.3} />
            ))}
          </>
        ) : (
          <>
            {/* Landmarks are light and tall: always drawn, so you see them from down the road */}
            {landmark && PlaceScene && <PlaceScene />}
            {place && PlaceScene && full ? (
              <PlaceScene />
            ) : (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow onClick={walk}>
                <planeGeometry args={[CELL_X, CELL_Z]} />
                <meshStandardMaterial map={groundMap(GROUND[style], CELL_X, CELL_Z)} roughness={1} />
              </mesh>
            )}
            <Neighborhood
              seed={seed}
              style={style}
              clear={clear}
              extent={CELL_X / 2 - (low ? 4 : 2.5)}
              near={place ? -5.5 : ROAD_Z - 2.6}
              far={-CELL_Z / 2 + 1.5}
              front={ROAD_Z + 2.2}
              frontFar={CELL_Z / 2 - 1}
              roadZ={ROAD_Z}
            />
          </>
        )}
      </CellCtx.Provider>
    </group>
  );
}

/** Asphalt with a dashed middle line and walkways, as one strip. */
function RoadStrip({ x, z, len, along }: { x: number; z: number; len: number; along: 'x' | 'z' }) {
  const walk = useWalkHere();
  const rot: [number, number, number] = [-Math.PI / 2, 0, along === 'x' ? 0 : Math.PI / 2];
  const dashes = Math.floor(len / 3);
  return (
    <group position={[x, 0, z]}>
      <mesh rotation={rot} position={[0, 0.006, 0]} receiveShadow onClick={walk}>
        <planeGeometry args={[len, ROAD_W]} />
        <meshStandardMaterial color="#3a3d42" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} rotation={rot} position={along === 'x' ? [0, 0.012, side * (ROAD_W / 2 + 0.4)] : [side * (ROAD_W / 2 + 0.4), 0.012, 0]} receiveShadow onClick={walk}>
          <planeGeometry args={[len, 0.8]} />
          <meshStandardMaterial color="#bdb6a8" />
        </mesh>
      ))}
      {Array.from({ length: dashes }, (_, i) => {
        const t = -len / 2 + (i + 0.5) * (len / dashes);
        return (
          <mesh key={i} rotation={rot} position={along === 'x' ? [t, 0.01, 0] : [0, 0.01, t]}>
            <planeGeometry args={[1.1, 0.1]} />
            <meshStandardMaterial color="#f2f2f2" />
          </mesh>
        );
      })}
    </group>
  );
}

/** The road grid around you: east-west in front of every block, north-south between them. */
function Roads({ center }: { center: Cell }) {
  const strips: { key: string; x: number; z: number; len: number; along: 'x' | 'z' }[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    const row = center[1] + dr;
    if (row < 0 || row >= ROWS) continue;
    for (let dc = -1; dc <= 1; dc++) {
      const col = center[0] + dc;
      if (col < 0 || col >= COLS) continue;
      strips.push({ key: `ew${col},${row}`, x: dc * CELL_X, z: dr * CELL_Z + ROAD_Z, len: CELL_X, along: 'x' });
      // North-south roads on both edges of the block, from the road above down to this block's road
      for (const side of [-0.5, 0.5]) {
        const zTop = row === 0 ? -CELL_Z / 2 + 2 : ROAD_Z - CELL_Z;
        const z0 = dr * CELL_Z + zTop;
        const z1 = dr * CELL_Z + ROAD_Z;
        strips.push({ key: `ns${col + side},${row}`, x: (dc + side) * CELL_X, z: (z0 + z1) / 2, len: z1 - z0 - ROAD_W, along: 'z' });
      }
    }
  }
  // Neighbouring blocks share their edge roads
  const unique = [...new Map(strips.map((s) => [s.key, s])).values()];
  return (
    <>
      {unique.map(({ key, ...s }) => (
        <RoadStrip key={key} {...s} />
      ))}
    </>
  );
}

/**
 * The connected city around you: your block in the middle, the next blocks around it,
 * and the roads that join them. Far blocks only show houses, not their places.
 */
export function WorldCells() {
  const low = useSettings((s) => s.quality === 'low');
  const area = useGame((s) => s.area);
  const key = useGame((s) => currentCell(s)?.join(',') ?? '');
  if (!key) return null;
  const center = key.split(',').map(Number) as Cell;
  const blocks: { cell: Cell; dc: number; dr: number }[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      // Low quality skips the corner blocks
      if (low && dc !== 0 && dr !== 0) continue;
      if (!inGrid([center[0] + dc, center[1] + dr]) && dc !== 0 && dr !== 0) continue;
      blocks.push({ cell: [center[0] + dc, center[1] + dr], dc, dr });
    }
  return (
    <>
      {blocks.map(({ cell, dc, dr }) => (
        <Block key={cell.join(',')} cell={cell} offset={[dc * CELL_X, dr * CELL_Z]} current={dc === 0 && dr === 0} full={(dc === 0 && dr === 0) || (!low && (dc === 0 || dr === 0))} area={area} />
      ))}
      <Roads center={center} />
      <ParkedCar center={center} />
      <MissionMarker center={center} />
      {/* Bush all the way to the horizon, so no sky shows under the far blocks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[CELL_X * 9, CELL_Z * 9]} />
        <meshStandardMaterial map={groundMap('grass', CELL_X * 9, CELL_Z * 9)} color="#dfe9d0" roughness={1} />
      </mesh>
    </>
  );
}

/** Your car where you left it on the road (at home it sits by your gate instead). */
function ParkedCar({ center }: { center: Cell }) {
  const parked = useGame((s) => (s.driving ? null : s.parked));
  const car = useGame((s) => s.car);
  const enter = useGame((s) => s.enterCar);
  const c = car ? carById(car.id) : undefined;
  if (!parked || !c) return null;
  const dc = parked.cell[0] - center[0];
  const dr = parked.cell[1] - center[1];
  if (Math.abs(dc) > 1 || Math.abs(dr) > 1) return null;
  return (
    <group
      position={[parked.pos[0] + dc * CELL_X, 0, parked.pos[1] + dr * CELL_Z]}
      rotation={[0, parked.rot - Math.PI / 2, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 8) return;
        enter();
      }}
    >
      <CarModel kind={c.model} paint={car?.paint ?? c.color} />
    </group>
  );
}

/** Hustle job on the map: a glowing beam where to go, the passenger waiting by the road. */
function MissionMarker({ center }: { center: Cell }) {
  const m = useGame((s) => s.mission);
  if (!m) return null;
  const stop = m.stage === 'pickup' ? m.pickup : m.dropoff;
  const x = stop.at[0] - center[0] * CELL_X;
  const z = stop.at[1] - center[1] * CELL_Z;
  // Only draw it in the blocks we draw
  if (Math.abs(x) > CELL_X * 1.6 || Math.abs(z) > CELL_Z * 1.6) return null;
  const color = m.stage === 'pickup' ? '#2ecc71' : '#e8b04b';
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 6, 20, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.1, 1.5, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {m.stage === 'pickup' && !m.food && (
        <group position={[0, 0, -1.6]}>
          <Person shirt="#8e44ad" woman={m.who.name.includes('Aunty') || m.who.name.includes('Mama') || m.who.name.includes('Hajia') || m.who.name.includes('girl')} move="Wave" />
        </group>
      )}
      {m.stage === 'pickup' && m.food && (
        <group position={[0, 0, -1.6]}>
          <Box p={[0, 0.45, 0]} s={[1.2, 0.9, 0.6]} c="#7a5a3a" />
          <Box p={[0, 1.05, 0]} s={[0.4, 0.3, 0.4]} c="#e8692c" />
        </group>
      )}
      <Html position={[0, 6.6, 0]} center zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`block-name mission-tag ${m.stage}`}>
          {m.stage === 'pickup' ? (m.food ? `🥡 Collect: ${m.food}` : `${m.who.emoji} Pick ${m.who.name}`) : `📍 Drop: ${m.dropoff.name}`}
        </div>
      </Html>
    </group>
  );
}
