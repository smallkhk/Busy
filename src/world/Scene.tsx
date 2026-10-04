import { OrthographicCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Color } from 'three';
import { clockParts, daylight } from '../engine/clock';
import { useGame } from '../store/game';
import { Avatar } from './Avatar';
import { Room } from './Room';

const CENTER: [number, number, number] = [1.4, 0, 0.4];

function GameLoop() {
  const tick = useGame((s) => s.tick);
  useFrame((_, dt) => tick(dt));
  return null;
}

function IsoCamera() {
  const { size } = useThree();
  const zoom = Math.min(size.width / 10.5, size.height / 9);
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

function Lights() {
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
      {power && <pointLight position={[0, 2.5, 0]} intensity={light > 0.7 ? 3 : 14} distance={9} decay={1.6} color="#ffd9a0" />}
      {/* Mai Shayi's lantern keeps the kiosk lit at night */}
      <pointLight position={[5.8, 1.6, 0.2]} intensity={light > 0.5 ? 0 : 6} distance={4} color="#ffb347" />
    </>
  );
}

export function Scene() {
  return (
    <Canvas shadows dpr={[1, 2]} className="scene">
      <IsoCamera />
      <Lights />
      <GameLoop />
      <Room />
      <Avatar />
    </Canvas>
  );
}
