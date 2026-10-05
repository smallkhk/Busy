import { ContactShadows, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import { DEFAULT_LOOK, HAIR_COST, HAIRS, OUTFITS, SKINS, type Hair, type Outfit } from '../content/fashion';
import { formatNaira } from '../engine/clock';
import { useGame } from '../store/game';
import { Person } from '../world/Avatar';

const SHIRT_COLORS = ['#2f9e6b', '#d6406f', '#2f7fd6', '#e2a531', '#7b4fb0', '#222222', '#f4f4f4', '#8b1e3f', '#c9a24a', '#16a085'];

/** Full-screen wardrobe: spin your character, try outfits and hair, then buy. */
export function Wardrobe() {
  const look = useGame((s) => s.look ?? DEFAULT_LOOK);
  const wardrobe = useGame((s) => s.wardrobe ?? ['tee']);
  const shirt = useGame((s) => s.shirt);
  const money = useGame((s) => s.money);
  const discount = useGame((s) => (s.skills ?? []).includes('tailoring') ? 0.8 : 1);
  const g = useGame.getState();
  const [outfit, setOutfit] = useState<Outfit>(look.outfit);
  const [hair, setHair] = useState<Hair>(look.hair);
  const [tab, setTab] = useState<'clothes' | 'hair' | 'colour'>('clothes');
  const o = OUTFITS.find((x) => x.id === outfit)!;
  const price = Math.round(o.cost * discount);
  const owned = wardrobe.includes(outfit);
  const wearing = look.outfit === outfit;

  return (
    <div className="showroom">
      <Canvas shadows dpr={[1, 2]} className="showroom-canvas">
        <PerspectiveCamera makeDefault position={[0, 0.9, 5.4]} fov={34} />
        <OrbitControls target={[0, -0.22, 0]} enablePan={false} minDistance={2.5} maxDistance={7} maxPolarAngle={Math.PI / 2.05} autoRotate autoRotateSpeed={1.8} />
        <color attach="background" args={['#1b1620']} />
        <ambientLight intensity={0.6} />
        <spotLight position={[2, 5, 3]} angle={0.5} penumbra={0.6} intensity={60} castShadow />
        <pointLight position={[-2, 2, -2]} intensity={6} color="#e8336d" />
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <cylinderGeometry args={[0.9, 0.95, 0.06, 48]} />
          <meshStandardMaterial color="#2a2530" metalness={0.5} roughness={0.4} />
        </mesh>
        <group position={[0, -0.47, 0]}>
          <Person shirt={shirt} outfit={outfit} hair={hair} skin={SKINS[look.skin]} />
        </group>
        <ContactShadows position={[0, -0.465, 0]} opacity={0.6} scale={3} blur={2} far={1.5} />
      </Canvas>

      <div className="world-top">
        <span className="world-title">👗 Abuja Drip <span className="muted small">· drag to spin</span></span>
        <button className="world-close" onClick={() => g.openPhone(null)} aria-label="Close wardrobe">✕</button>
      </div>

      <div className="showroom-sheet card">
        <div className="love-tabs">
          <button className={tab === 'clothes' ? 'on' : ''} onClick={() => setTab('clothes')}>👕 Clothes</button>
          <button className={tab === 'hair' ? 'on' : ''} onClick={() => setTab('hair')}>💈 Hair</button>
          <button className={tab === 'colour' ? 'on' : ''} onClick={() => setTab('colour')}>🎨 Colour</button>
        </div>
        {tab === 'clothes' && (
          <>
            <div className="drip-grid">
              {OUTFITS.map((x) => (
                <button key={x.id} className={`drip-item ${outfit === x.id ? 'on' : ''}`} onClick={() => setOutfit(x.id)}>
                  <span className="drip-emoji">{x.emoji}</span>
                  <span className="small">{x.name}</span>
                  <span className="muted small">{wardrobe.includes(x.id) ? (look.outfit === x.id ? 'Wearing' : 'Owned') : formatNaira(Math.round(x.cost * discount))}</span>
                </button>
              ))}
            </div>
            <div className="muted small">{o.blurb}{o.packaging ? ` · 👔 +${o.packaging}` : ''}</div>
            {owned ? (
              <button className="primary" disabled={wearing} onClick={() => g.wearOutfit(outfit)}>{wearing ? '✅ You dey wear am' : '👕 Wear am'}</button>
            ) : (
              <button className="primary" disabled={money < price} onClick={() => g.buyOutfit(outfit)}>{money < price ? `Need ${formatNaira(price)}` : `🛍️ Buy & wear · ${formatNaira(price)}${discount < 1 ? ' (tailor discount)' : ''}`}</button>
            )}
          </>
        )}
        {tab === 'hair' && (
          <>
            <div className="drip-grid">
              {HAIRS.map((x) => (
                <button key={x.id} className={`drip-item ${hair === x.id ? 'on' : ''}`} onClick={() => setHair(x.id)}>
                  <span className="drip-emoji">{x.emoji}</span>
                  <span className="small">{x.name}</span>
                  {look.hair === x.id && <span className="muted small">Current</span>}
                </button>
              ))}
            </div>
            <button className="primary" disabled={hair === look.hair || money < HAIR_COST} onClick={() => g.setHair(hair)}>
              {hair === look.hair ? '✅ Na your hair be this' : `💈 Do am · ${formatNaira(HAIR_COST)}`}
            </button>
          </>
        )}
        {tab === 'colour' && (
          <>
            <div className="muted small">Colour for your shirt, kaftan, native or agbada (free to change)</div>
            <div className="showroom-paints">
              {SHIRT_COLORS.map((c) => (
                <button key={c} className={shirt === c ? 'on' : ''} style={{ background: c }} onClick={() => g.setShirt(c)} aria-label={`Colour ${c}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
