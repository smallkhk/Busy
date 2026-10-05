import { OrthographicCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { Color, Object3D, Vector3, type AmbientLight, type InstancedMesh } from 'three';
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
import { Airport, Asokoro, Garki, Maitama, Mararaba, Nyanya, Utako } from './places/Districts';
import { Park, Stadium } from './places/Landmarks';
import { INTERACTABLES, type Place } from '../content/activities';
import { avatarLabelPos, labelEls } from './labels';
import { RemotePlayers, remoteLabelPos } from '../net/RemotePlayers';
import { Npcs, npcLabelPos } from './Npcs';

const CENTERS: Record<Place, [number, number, number]> = {
  home: [1.4, 0, 0.4],
  street: [-0.6, 0, -1.2],
  wuse: [-1.0, 0, 0],
  jabi: [-0.6, 0, -0.8],
  secretariat: [0, 0, -0.6],
  lounge: [-0.2, 0, -0.6],
  hospital: [-0.4, 0, -0.6],
  maitama: [-0.4, 0, -0.6],
  asokoro: [-0.4, 0, -0.6],
  garki: [-0.4, 0, -0.6],
  nyanya: [-0.4, 0, -0.6],
  airport: [-0.4, 0, -0.6],
  utako: [-0.4, 0, -0.6],
  mararaba: [-0.4, 0, -0.6],
  park: [-0.4, 0, -0.6],
  stadium: [-0.4, 0, -0.6],
};

const SCENES: Record<Place, () => ReactElement> = {
  home: Room,
  street: Street,
  wuse: WuseMarket,
  jabi: JabiLake,
  secretariat: Secretariat,
  lounge: Lounge,
  hospital: Hospital,
  maitama: Maitama,
  asokoro: Asokoro,
  garki: Garki,
  nyanya: Nyanya,
  airport: Airport,
  utako: Utako,
  mararaba: Mararaba,
  park: Park,
  stadium: Stadium,
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
      const world = key === 'avatar' ? avatarLabelPos : key.startsWith('p:') ? remoteLabelPos.get(key.slice(2)) : key.startsWith('n:') ? npcLabelPos.get(key.slice(2)) : LABEL_POS.get(key);
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

const RAIN_DROPS = 500;
const dummy = new Object3D();

/** Falling rain around the camera's view. Storms rain harder and flash lightning. */
function Rain({ storm }: { storm: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  const drops = useMemo(
    () => Array.from({ length: RAIN_DROPS }, () => ({ x: (Math.random() - 0.5) * 26, y: Math.random() * 12, z: (Math.random() - 0.5) * 18, v: 9 + Math.random() * 5 })),
    [],
  );
  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const speed = storm ? 1.5 : 1;
    drops.forEach((d, i) => {
      d.y -= d.v * speed * Math.min(dt, 0.05);
      if (d.y < 0) d.y += 12;
      dummy.position.set(d.x + (storm ? d.y * 0.15 : 0), d.y, d.z);
      dummy.rotation.set(0, 0, storm ? 0.15 : 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, storm ? RAIN_DROPS : RAIN_DROPS / 2]}>
      <boxGeometry args={[0.02, 0.35, 0.02]} />
      <meshBasicMaterial color="#b9d3ee" transparent opacity={0.55} />
    </instancedMesh>
  );
}

function Lightning() {
  const ref = useRef<AmbientLight>(null);
  const next = useRef(3);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    if (t > next.current) next.current = t + 4 + Math.random() * 8;
    const since = next.current - t;
    ref.current.intensity = since > 3.8 ? 2.5 : 0;
  });
  return <ambientLight ref={ref} intensity={0} color="#dfe8ff" />;
}

const GREY_SKY = new Color('#7c8a96');
const NIGHT_SKY = new Color('#0b1626');
const DAY_SKY = new Color('#8fc6e8');
const DUSK = new Color('#f2a65a');

function Lights({ place }: { place: Place }) {
  // Re-render lights once per in-game ~10 minutes, not every frame.
  const bucket = useGame((s) => Math.floor(s.time / 10));
  const power = useGame((s) => s.power);
  const weather = useGame((s) => s.weather ?? 'sunny');
  const { scene } = useThree();
  const { minuteOfDay, hour } = clockParts(bucket * 10);
  const dim = { sunny: 1, cloudy: 0.82, rain: 0.62, storm: 0.45 }[weather];
  const light = daylight(minuteOfDay) * dim;
  // Sun angle: 0 at 6am, π at 6pm; at night the "sun" is the moon, low and cool
  const sunAngle = Math.min(Math.PI - 0.25, Math.max(0.25, ((minuteOfDay - 360) / 720) * Math.PI));
  const sun: [number, number, number] = [Math.cos(sunAngle) * 14, 4 + Math.sin(sunAngle) * 14, 7];

  const sky = useMemo(() => {
    const c = NIGHT_SKY.clone().lerp(DAY_SKY, light);
    if ((hour >= 17 && hour < 20) || (hour >= 5 && hour < 8)) c.lerp(DUSK, 0.35 * (1 - Math.abs(light - 0.5) * 2));
    if (dim < 1) c.lerp(GREY_SKY, (1 - dim) * light);
    return c;
  }, [light, hour, dim]);

  useEffect(() => {
    scene.background = sky;
  }, [scene, sky]);

  return (
    <>
      {/* Sky fill from above, warm bounce from the ground */}
      <hemisphereLight args={[light > 0.2 ? '#cfe8ff' : '#5a6f9e', '#8a6a45', 0.25 + light * 0.55]} />
      <ambientLight intensity={0.12 + light * 0.18} color={light > 0.2 ? '#fff6e8' : '#7d8fbf'} />
      {/* The sun: rises in the east, crosses the sky, sets warm in the west */}
      <directionalLight
        position={sun}
        intensity={0.15 + light * 2.1}
        color={light < 0.6 && light > 0 ? '#ffb877' : '#fff4e0'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
      />
      {place === 'home' && power && <pointLight position={[0, 2.5, 0]} intensity={light > 0.7 ? 3 : 14} distance={9} decay={1.6} color="#ffd9a0" />}
      {/* Mai Shayi's lantern keeps the kiosk lit at night */}
      {place === 'home' && <pointLight position={[5.8, 1.6, 0.2]} intensity={light > 0.5 ? 0 : 6} distance={4} color="#ffb347" />}
    </>
  );
}

export function Scene() {
  const place = useGame((s) => s.place);
  const weather = useGame((s) => s.weather ?? 'sunny');
  const wet = weather === 'rain' || weather === 'storm';
  const PlaceScene = SCENES[place];
  return (
    <Canvas shadows="soft" dpr={[1, 2]} className="scene">
      <IsoCamera key={place} place={place} />
      <Lights place={place} />
      <GameLoop />
      <LabelSync />
      <PlaceScene />
      <Avatar />
      <RemotePlayers />
      <Npcs />
      {wet && place !== 'home' && <Rain storm={weather === 'storm'} />}
      {weather === 'storm' && <Lightning />}
    </Canvas>
  );
}
