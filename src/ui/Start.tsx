import { useState } from 'react';
import { useGame } from '../store/game';
import { HAIRS, SKINS, type Hair } from '../content/fashion';

const SHIRTS = ['#2f9e6b', '#d6406f', '#2f7fd6', '#e2a531', '#7b4fb0', '#222222'];

export function Start() {
  const start = useGame((s) => s.start);
  const [name, setName] = useState('');
  const [shirt, setShirt] = useState(SHIRTS[0]);
  const [skin, setSkin] = useState(2);
  const [hair, setHair] = useState<Hair>('short');
  return (
    <div className="start">
      <div className="start-card card">
        <div className="logo">ABUJA<span>LIFE</span></div>
        <p className="tagline">Everybody for Abuja come from somewhere.<br />Na wetin you do when you land matter.</p>
        <div className="story muted small">
          You just land Abuja with <b>₦45,000</b> and one bag. Your cousin help you find one self-con for <b>Kubwa</b>.
          Chop, rest, hustle, and no let your needs reach zero.
        </div>
        <label className="field">
          <span className="small">Wetin be your name?</span>
          <input value={name} maxLength={16} placeholder="e.g. Musa, Ada, Tunde" onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field">
          <span className="small">Pick your shirt</span>
          <div className="swatches">
            {SHIRTS.map((c) => (
              <button
                key={c}
                className={`swatch ${c === shirt ? 'on' : ''}`}
                style={{ background: c }}
                onClick={() => setShirt(c)}
                aria-label={`Shirt colour ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="field">
          <span className="small">Skin tone</span>
          <div className="swatches">
            {SKINS.map((c, i) => (
              <button key={c} className={`swatch ${i === skin ? 'on' : ''}`} style={{ background: c }} onClick={() => setSkin(i)} aria-label={`Skin tone ${i + 1}`} />
            ))}
          </div>
        </div>
        <div className="field">
          <span className="small">Hair</span>
          <div className="swatches hair-pick">
            {HAIRS.slice(0, 4).map((h) => (
              <button key={h.id} className={`swatch emoji ${h.id === hair ? 'on' : ''}`} onClick={() => setHair(h.id)} aria-label={h.name} title={h.name}>{h.emoji}</button>
            ))}
          </div>
        </div>
        <button className="primary" onClick={() => start(name, shirt, { outfit: 'tee', hair, skin })}>Take land Abuja 🚀</button>
      </div>
    </div>
  );
}
