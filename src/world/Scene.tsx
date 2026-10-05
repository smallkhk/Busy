import { MapControls, OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import type { MapControls as MapControlsImpl, OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Neighborhood } from './Neighborhood';
import { WorldCells } from './World';
import { onOriginShift } from './origin';
import { CLEAR, hoodStyle, SEEDS } from './placeScenes';
import { Room } from './Room';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Color, type DirectionalLight, MOUSE, Object3D, PMREMGenerator, TOUCH, Vector3, type AmbientLight, type InstancedMesh } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { clockParts, daylight } from '../engine/clock';
import { useGame } from '../store/game';
import { useSettings } from '../settings';
import { festivalOn } from '../content/festivals';
import { Avatar } from './Avatar';
import { INTERACTABLES, type Place } from '../content/activities';
import { homeTier, type AreaId } from '../content/housing';
import { COMPOUND, HOME_SCALE, homeLabel } from '../content/homeLayout';
import { avatarLabelPos, labelEls } from './labels';
import { RemotePlayers, remoteLabelPos } from '../net/RemotePlayers';
import { Npcs, npcLabelPos } from './Npcs';


function GameLoop() {
  const tick = useGame((s) => s.tick);
  useFrame((_, dt) => tick(dt));
  return null;
}

const LABEL_POS = new Map(INTERACTABLES.map((i) => [i.id, new Vector3(...i.label)]));
const HOME_IDS = new Set(INTERACTABLES.filter((i) => i.place === 'home').map((i) => i.id));
/** Home labels move with the spread-out house, so cache them per area. */
const homeLabels = new Map<string, Map<string, Vector3>>();
function homeLabelPos(area: AreaId) {
  let m = homeLabels.get(area);
  if (!m) {
    m = new Map(INTERACTABLES.filter((i) => HOME_IDS.has(i.id)).map((i) => [i.id, new Vector3(...homeLabel(area, i.id, i.label))]));
    homeLabels.set(area, m);
  }
  return m;
}
const tmp = new Vector3();

/** Projects world label anchors to screen space and moves the DOM labels there. */
function LabelSync() {
  useFrame(({ camera, size }) => {
    const g = useGame.getState();
    const home = g.place === 'home' ? homeLabelPos(g.area) : null;
    for (const [key, el] of labelEls) {
      const world = key === 'avatar' ? avatarLabelPos : key.startsWith('p:') ? remoteLabelPos.get(key.slice(2)) : key.startsWith('n:') ? npcLabelPos.get(key.slice(2)) : (home?.get(key) ?? LABEL_POS.get(key));
      if (!world) continue;
      tmp.copy(world).project(camera);
      const x = ((tmp.x + 1) / 2) * size.width;
      const y = ((1 - tmp.y) / 2) * size.height;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }
  });
  return null;
}

/** Iso camera for the streets and districts: drag around and pinch to zoom. It follows you when you waka off screen. */
/**
 * Camera for the connected city: isometric, follows you down the road, and you
 * fit drag to look around or pinch to see more of town.
 */
function WorldCamera() {
  const { size, camera } = useThree();
  const controls = useRef<MapControlsImpl>(null);
  const start = useGame.getState().pos;
  const span = 12.5;
  const zoom = Math.min(size.width / span, size.height / 9);

  // Walking into the next block moves the origin: move the camera with it
  useEffect(
    () =>
      onOriginShift((dx, dz) => {
        const c = controls.current;
        camera.position.x -= dx;
        camera.position.z -= dz;
        if (c) {
          c.target.x -= dx;
          c.target.z -= dz;
          c.update();
        }
      }),
    [camera],
  );

  // Keep you on screen while you walk, and settle on you for a moment after
  const settle = useRef(0);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c) return;
    if (useGame.getState().target) settle.current = 1.2;
    else if (settle.current > 0) settle.current -= dt;
    else return;
    // Frame-rate independent easing; faster when you are near the edge of the screen
    tmp.copy(avatarLabelPos).project(camera);
    const edge = Math.max(Math.abs(tmp.x), Math.abs(tmp.y));
    const k = 1 - Math.exp(-dt * (edge > 0.5 ? 6 : 3));
    const dx = (avatarLabelPos.x - c.target.x) * k;
    const dz = (avatarLabelPos.z - c.target.z) * k;
    c.target.x += dx;
    c.target.z += dz;
    camera.position.x += dx;
    camera.position.z += dz;
    c.update();
  });

  return (
    <>
      <OrthographicCamera makeDefault zoom={zoom} position={[start[0] + 12, 11, start[1] + 12]} near={-60} far={160} />
      <MapControls
        ref={controls}
        target={[start[0], 0, start[1]]}
        enableRotate={false}
        enableDamping
        dampingFactor={0.12}
        screenSpacePanning={false}
        minZoom={zoom * 0.3}
        maxZoom={zoom * 2.2}
      />
    </>
  );
}

/** Middle of each house size (before spreading) and how wide it is on screen. */
const HOME_VIEW = {
  room: { center: [0.6, 0.2], width: 9.5 },
  flat: { center: [-1.2, 0.1], width: 11.5 },
  mansion: { center: [-2.0, 0.0], width: 14 },
} as const;

/**
 * At home the camera is real 3D: one finger turns round the house, two fingers
 * pinch to zoom and drag to move. Taps still walk you around.
 */
function HomeCamera() {
  const { size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const tier = useGame((s) => homeTier(s.area));
  const k = HOME_SCALE[tier];
  const view = HOME_VIEW[tier];
  const target: [number, number, number] = [view.center[0] * k, 0, view.center[1] * k];
  const fov = 40;
  const vHalf = (fov / 2) * (Math.PI / 180);
  const hHalf = Math.atan(Math.tan(vHalf) * (size.width / size.height));
  // Fit most of the house across the screen; pinch to see the rest
  const width = view.width * k * (tier === 'mansion' ? 0.72 : 0.9);
  const dist = Math.max(width / 2 / Math.tan(hHalf), (width * 0.55) / 2 / Math.tan(vHalf), 9);
  const dir = new Vector3(1, 1.3, 1).normalize().multiplyScalar(dist);
  const reach = view.width * k * 0.45;

  // Keep the view on the house when you drag far
  const clamp = () => {
    const c = controls.current;
    if (!c) return;
    const t = c.target;
    const cx = Math.max(target[0] - reach, Math.min(target[0] + reach, t.x));
    const cz = Math.max(target[2] - reach * 0.6, Math.min(target[2] + reach * 0.6, t.z));
    if (cx !== t.x || cz !== t.z || t.y !== 0) {
      c.object.position.x += cx - t.x;
      c.object.position.z += cz - t.z;
      t.set(cx, 0, cz);
    }
  };

  return (
    <>
      <PerspectiveCamera makeDefault fov={fov} near={0.3} far={220} position={[target[0] + dir.x, dir.y, target[2] + dir.z]} />
      <OrbitControls
        ref={controls}
        target={target}
        enableDamping
        dampingFactor={0.1}
        minDistance={4}
        maxDistance={dist * 1.6}
        minPolarAngle={0.25}
        maxPolarAngle={1.32}
        screenSpacePanning={false}
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
        mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
        onChange={clamp}
      />
    </>
  );
}

/**
 * The house look: soft room reflections on marble and glass, shadow in the corners
 * (ambient occlusion), and glow from lamps, LED strips and the TV.
 */
function HomeLook() {
  const { gl, scene } = useThree();
  const high = useSettings((s) => s.quality === 'high');
  const night = useGame((s) => daylight(clockParts(Math.floor(s.time / 30) * 30).minuteOfDay) < 0.3);
  useEffect(() => {
    const pm = new PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  useEffect(() => {
    scene.environmentIntensity = night ? 0.12 : 0.4;
  }, [scene, night]);
  if (!high) return null;
  return (
    <EffectComposer multisampling={4}>
      <N8AO aoRadius={0.7} distanceFalloff={0.8} intensity={2.2} quality="medium" />
      <Bloom luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.55} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
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
    <instancedMesh ref={ref} args={[undefined, undefined, (storm ? RAIN_DROPS : RAIN_DROPS / 2) / (useSettings.getState().quality === 'low' ? 2 : 1)]}>
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

/** Bunting and lights strung over the road on festival days. */
function FestivalDecor({ colors, night }: { colors: string[]; night: boolean }) {
  const bulbs = useMemo(() => {
    const out: { x: number; y: number; z: number; c: string }[] = [];
    for (const z of [-2.3, 3.9]) {
      for (let i = 0; i <= 48; i++) {
        const x = -12 + i * 0.5;
        // Sagging string between poles every 6 units
        const t = ((x + 12) % 6) / 6;
        out.push({ x, y: 2.7 - Math.sin(t * Math.PI) * 0.35, z, c: colors[i % colors.length] });
      }
    }
    return out;
  }, [colors]);
  return (
    <group>
      {[-12, -6, 0, 6, 12].flatMap((x) =>
        [-2.3, 3.9].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.4, z]}>
            <cylinderGeometry args={[0.04, 0.05, 2.8, 8]} />
            <meshStandardMaterial color="#666" />
          </mesh>
        )),
      )}
      {bulbs.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]}>
          <coneGeometry args={[0.12, 0.22, 3]} />
          <meshStandardMaterial color={b.c} emissive={night ? b.c : '#000'} emissiveIntensity={night ? 1.4 : 0} />
        </mesh>
      ))}
    </group>
  );
}

const GREY_SKY = new Color('#7c8a96');
const NIGHT_SKY = new Color('#1f3356');
const DAY_SKY = new Color('#8fc6e8');
const DUSK = new Color('#f2a65a');

function Lights({ place }: { place: Place }) {
  const low = useSettings((s) => s.quality === 'low');
  // Re-render lights once per in-game ~10 minutes, not every frame.
  const bucket = useGame((s) => Math.floor(s.time / 10));
  const power = useGame((s) => s.power);
  const weather = useGame((s) => s.weather ?? 'sunny');
  const k = useGame((s) => HOME_SCALE[homeTier(s.area)]);
  const { scene } = useThree();
  const { minuteOfDay, hour } = clockParts(bucket * 10);
  const dim = { sunny: 1, cloudy: 0.82, rain: 0.62, storm: 0.45 }[weather];
  const light = daylight(minuteOfDay) * dim;
  // Sun angle: 0 at 6am, π at 6pm; at night the "sun" is the moon, low and cool
  const sunAngle = Math.min(Math.PI - 0.25, Math.max(0.25, ((minuteOfDay - 360) / 720) * Math.PI));
  const sun: [number, number, number] = [Math.cos(sunAngle) * 14, 4 + Math.sin(sunAngle) * 14, 7];

  // Out in town the sun's shadow box follows you down the road
  const sunRef = useRef<DirectionalLight>(null);
  useFrame(() => {
    const l = sunRef.current;
    if (!l || place === 'home') return;
    l.position.set(avatarLabelPos.x + sun[0], sun[1], avatarLabelPos.z + sun[2]);
    l.target.position.set(avatarLabelPos.x, 0, avatarLabelPos.z);
    l.target.updateMatrixWorld();
  });

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
      {/* Sky fill from above, warm bounce from the ground. Nights stay moonlit so you fit still see your screen */}
      <hemisphereLight args={[light > 0.2 ? '#cfe8ff' : '#8fa3d6', '#8a6a45', 0.7 + light * 0.1]} />
      <ambientLight intensity={0.42 - light * 0.12} color={light > 0.2 ? '#fff6e8' : '#9fb0dc'} />
      {/* The sun: rises in the east, crosses the sky, sets warm in the west */}
      <directionalLight
        ref={sunRef}
        position={sun}
        intensity={0.6 + light * 1.65}
        color={light === 0 ? '#c9d6ff' : light < 0.6 ? '#ffb877' : '#fff4e0'}
        castShadow
        shadow-mapSize={low ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
      />
      {place === 'home' && power && <pointLight position={[0, 2.5, 0]} intensity={light > 0.7 ? 3 : 14} distance={11} decay={1.6} color="#ffd9a0" />}
      {/* Mai Shayi's lantern keeps the kiosk lit at night */}
      {place === 'home' && <pointLight position={[5.8 + COMPOUND[0] * (k - 1), 1.6, 0.2 + COMPOUND[1] * (k - 1)]} intensity={light > 0.5 ? 0 : 6} distance={4} color="#ffb347" />}
    </>
  );
}

export function Scene() {
  const low = useSettings((s) => s.quality === 'low');
  const fest = useGame((s) => festivalOn(clockParts(s.time).day));
  const night = useGame((s) => daylight(clockParts(Math.floor(s.time / 30) * 30).minuteOfDay) < 0.3);
  const place = useGame((s) => s.place);
  const weather = useGame((s) => s.weather ?? 'sunny');
  const wet = weather === 'rain' || weather === 'storm';
  const tier = useGame((s) => (place === 'home' ? homeTier(s.area) : 'x'));
  const style = useGame((s) => hoodStyle(place, s.area));
  return (
    <Canvas key={low ? 'low' : 'high'} shadows={low ? true : 'soft'} dpr={low ? 1 : [1, 2]} gl={{ antialias: !low, powerPreference: 'high-performance' }} className="scene">
      {place === 'home' ? <HomeCamera key={tier} /> : <WorldCamera />}
      {place === 'home' && <HomeLook />}
      <Lights place={place} />
      <GameLoop />
      <LabelSync />
      {place === 'home' ? (
        <>
          <Room />
          <Neighborhood key={`home${tier}`} style={style} extent={low ? 15 : 26} far={low ? -13 : -19} frontFar={low ? 11 : 17} seed={SEEDS.home} clear={tier === 'mansion' ? [[-10, -4.5, 9, 7]] : tier === 'flat' ? [[-8, -4.5, 9, 7]] : CLEAR.home} near={-4.6} />
        </>
      ) : (
        <WorldCells />
      )}
      <Avatar />
      <RemotePlayers />
      {fest && fest.decor.length > 0 && place !== 'home' && <FestivalDecor colors={fest.decor} night={night} />}
      <Npcs />
      {wet && place !== 'home' && <Rain storm={weather === 'storm'} />}
      {weather === 'storm' && <Lightning />}
    </Canvas>
  );
}
