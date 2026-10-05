import { ContactShadows, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useState } from 'react';
import { CARS, PAINTS, repairCost, RESALE, RESPRAY_COST, START_FUEL, TANK } from '../content/cars';
import { sfx, unlockAudio } from '../audio/sound';
import { formatNaira } from '../engine/clock';
import { useGame } from '../store/game';
import { CarModel } from '../world/CarModel';

function Stage({ kind, paint, lights }: { kind: (typeof CARS)[number]['model']; paint: string; lights: boolean }) {
  const [spin, setSpin] = useState(true);
  const { size } = useThree();
  // Phones are tall: step back, and aim low so the car sits above the info card
  const portrait = size.width < size.height;
  const d = portrait ? 5.6 : 3.4;
  return (
    <>
      <PerspectiveCamera makeDefault position={[d, d * 0.55, d]} fov={portrait ? 48 : 40} />
      <OrbitControls
        target={[0, portrait ? -0.9 : 0.4, 0]}
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={spin}
        autoRotateSpeed={1.6}
        onStart={() => setSpin(false)}
      />
      <color attach="background" args={['#14161b']} />
      <fog attach="fog" args={['#14161b', 8, 18]} />
      <ambientLight intensity={0.55} />
      <spotLight position={[4, 7, 3]} angle={0.5} penumbra={0.6} intensity={120} castShadow shadow-mapSize={[1024, 1024]} />
      <spotLight position={[-5, 5, -3]} angle={0.6} penumbra={0.8} intensity={50} color="#a9c8ff" />
      <pointLight position={[0, 3, -4]} intensity={8} color="#e8b04b" />
      {/* Turntable */}
      <mesh position={[0, -0.03, 0]} receiveShadow>
        <cylinderGeometry args={[2.0, 2.05, 0.06, 64]} />
        <meshStandardMaterial color="#2a2d33" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.92, 2.0, 64]} />
        <meshBasicMaterial color="#e8b04b" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1b1e24" />
      </mesh>
      <group key={kind}>
        <CarModel kind={kind} paint={paint} lights={lights} />
      </group>
      <ContactShadows position={[0, 0.005, 0]} opacity={0.6} scale={5} blur={2.4} far={2} />
    </>
  );
}

/** Full-screen 3D car showroom: spin the car, pick paint, then buy. */
export function Showroom() {
  const car = useGame((s) => s.car);
  const money = useGame((s) => s.money);
  const g = useGame.getState();
  const startAt = Math.max(0, CARS.findIndex((c) => c.id === car?.id));
  const [i, setI] = useState(startAt);
  const c = CARS[i];
  const mine = car?.id === c.id;
  const [paint, setPaint] = useState(mine ? (car?.paint ?? c.color) : c.color);
  const [lights, setLights] = useState(false);
  const owned = car ? CARS.find((x) => x.id === car.id) : undefined;
  const tradeIn = owned && !mine ? Math.round(owned.price * RESALE) : 0;
  const cost = c.price - tradeIn;

  const go = (d: number) => {
    const n = (i + d + CARS.length) % CARS.length;
    setI(n);
    const next = CARS[n];
    setPaint(car?.id === next.id ? (car?.paint ?? next.color) : next.color);
    setLights(false);
  };

  return (
    <div className="showroom">
      <Canvas shadows dpr={[1, 2]} className="showroom-canvas">
        <Stage kind={c.model} paint={paint} lights={lights} />
      </Canvas>

      <div className="world-top">
        <span className="world-title">🚘 Abuja Motors <span className="muted small">· drag to spin, pinch to zoom</span></span>
        <button className="world-close" onClick={() => g.openPhone(null)} aria-label="Close showroom">✕</button>
      </div>

      <div className="showroom-nav">
        <button onClick={() => go(-1)} aria-label="Previous car">‹</button>
        <button onClick={() => go(1)} aria-label="Next car">›</button>
      </div>

      <div className="showroom-sheet card">
        <div className="showroom-title">
          <span>{c.emoji} {c.name}</span>
          {mine && <span className="chip pos">Your car</span>}
        </div>
        <div className="muted small">{c.blurb}</div>
        <div className="showroom-stats">
          <span>💰 {formatNaira(c.price)}</span>
          <span>👔 +{c.packaging}</span>
          <span>⛽ {c.litresPer100}L/100km</span>
          <span>💺 {c.seats}</span>
          <span>🏁 {c.topSpeed} km/h</span>
        </div>
        <div className="showroom-paints">
          {PAINTS.map((p) => (
            <button key={p} className={paint === p ? 'on' : ''} style={{ background: p }} onClick={() => setPaint(p)} aria-label={`Paint ${p}`} />
          ))}
        </div>
        <div className="showroom-fun">
          <button className="ghost" onClick={() => setLights((l) => !l)}>💡 {lights ? 'Lights off' : 'Lights'}</button>
          <button className="ghost" onClick={() => { unlockAudio(); sfx.horn(); }}>📯 Horn</button>
        </div>
        {mine && car ? (
          <>
            <div className="small">Condition {car.condition}% · ⛽ {(car.fuel ?? START_FUEL).toFixed(0)}L / {TANK}L</div>
            <div className="showroom-buy">
              {paint !== (car.paint ?? c.color) && (
                <button className="primary" disabled={money < RESPRAY_COST} onClick={() => g.resprayCar(paint)}>🎨 Respray {formatNaira(RESPRAY_COST)}</button>
              )}
              <button className="ghost" disabled={car.condition >= 100 || money < repairCost(car.condition)} onClick={g.repairCar}>🔧 Service {formatNaira(repairCost(car.condition))}</button>
              <button className="ghost" onClick={() => confirm('Sell your car?') && g.sellCar()}>🤝 Sell</button>
            </div>
          </>
        ) : (
          <div className="showroom-buy">
            <button className="primary" disabled={cost > money} onClick={() => g.buyCar(c.id, paint)}>
              {cost > money ? `Need ${formatNaira(cost)}` : cost >= 0 ? `🔑 Buy · ${formatNaira(cost)}${tradeIn ? ' after trade-in' : ''}` : `🔑 Swap · collect ${formatNaira(-cost)} change`}
            </button>
          </div>
        )}
        <div className="showroom-dots">
          {CARS.map((x, k) => <span key={x.id} className={k === i ? 'on' : ''} />)}
        </div>
      </div>
    </div>
  );
}
