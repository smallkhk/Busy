import { OrthographicCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, type ReactElement } from 'react';
import { Color, Vector3 } from 'three';
import { clockParts, daylight } from '../engine/clock';
import { useGame } from '../store/game';
import { Avatar } from './Avatar';
import { Room } from './Room';
import { Street } from './Street';
import { Hospital } from './places/Hospital';
import { JabiLake } from './places/JabiLake';
import { Lounge } from './places/Lounge';
import { Secretariat } from './places/Secretariat';
import { WuseMarket } from './places/WuseMarket';
import { INTERACTABLES, type Place } from '../content/activities';
import { avatarLabelPos, labelEls } from './labels';

const CENTERS: Record<Place, [number, number, number]> = {
  home: [1.4, 0, 0.4],
  street: [-0.6, 0, -1.2],
  wuse: [-1.0, 0, 0],
  jabi: [-0.6, 0, -0.8],
  secretariat: [0, 0, -0.6],
  lounge: [-0.2, 0, -0.6],
  hospital: [-0.4, 0, -0.6],
};

const SCENES: Record<Place, () => ReactElement> = {
  home: Room,
  street: Street,
  wuse: WuseMarket,
  jabi: JabiLake,
  secretariat: Secretariat,
  lounge: Lounge,
  hospital: Hospital,
};

function GameLoop() {
  const tick = useGame((s) => s.tick);
  useFrame((_, dt) => tick(dt));
  return null;
}

const LABEL_POS = new Map(INTERACTABLES.map((i) => [i.id, new Vector3(...i.label)]));
const tmp = new Vector3();

/** Projects world label anchors to screen space and moves the DOM labels there. */
function LabelSync() {
  useFrame(({ camera, size }) => {
    for (const [key, el] of labelEls) {
      const world = key === 'avatar' ? avatarLabelPos : LABEL_POS.get(key);
      if (!world) continue;
      tmp.copy(world).project(camera);
      const x = ((tmp.x + 1) / 2) * size.width;
      const y = ((1 - tmp.y) / 2) * size.height;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }
  });
  return null;
}

function IsoCamera({ place }: { place: Place }) {
  const { size } = useThree();
  const CENTER = CENTERS[place];
  const span = place === 'home' ? 10.5 : 12.5;
  const zoom = Math.min(size.width / span, size.height / 9);
  return (
    <OrthographicCamera
      makeDefault
      zoom={zoom}
      position={[CENTER[0] + 12, 11, CENTER[2] + 12]}
      onUpdate={(c) => c.lookAt(...CENTER)}
      near={-50}
      far={100}
    />
  );
}

const NIGHT_SKY = new Color('#0b1626');
const DAY_SKY = new Color('#8fc6e8');
const DUSK = new Color('#f2a65a');

function Lights({ place }: { place: Place }) {
  // Re-render lights once per in-game ~10 minutes, not every frame.
  const bucket = useGame((s) => Math.floor(s.time / 10));
  const power = useGame((s) => s.power);
  const { scene } = useThree();
  const { minuteOfDay, hour } = clockParts(bucket * 10);
  const light = daylight(minuteOfDay);

  const sky = useMemo(() => {
    const c = NIGHT_SKY.clone().lerp(DAY_SKY, light);
    if ((hour >= 17 && hour < 20) || (hour >= 5 && hour < 8)) c.lerp(DUSK, 0.35 * (1 - Math.abs(light - 0.5) * 2));
    return c;
  }, [light, hour]);

  useEffect(() => {
    scene.background = sky;
  }, [scene, sky]);

  return (
    <>
      <ambientLight intensity={0.25 + light * 0.45} color={light > 0.2 ? '#fff6e8' : '#7d8fbf'} />
      <directionalLight
        position={[6, 12, 4]}
        intensity={0.15 + light * 1.4}
        color={light < 0.6 && light > 0 ? '#ffc58a' : '#fff'}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {place === 'home' && power && <pointLight position={[0, 2.5, 0]} intensity={light > 0.7 ? 3 : 14} distance={9} decay={1.6} color="#ffd9a0" />}
      {/* Mai Shayi's lantern keeps the kiosk lit at night */}
      {place === 'home' && <pointLight position={[5.8, 1.6, 0.2]} intensity={light > 0.5 ? 0 : 6} distance={4} color="#ffb347" />}
    </>
  );
}

export function Scene() {
  const place = useGame((s) => s.place);
  const PlaceScene = SCENES[place];
  return (
    <Canvas shadows dpr={[1, 2]} className="scene">
      <IsoCamera key={place} place={place} />
      <Lights place={place} />
      <GameLoop />
      <LabelSync />
      <PlaceScene />
      <Avatar />
    </Canvas>
  );
}
