import { useState } from 'react';
import { useGame } from '../store/game';

const SHIRTS = ['#2f9e6b', '#d6406f', '#2f7fd6', '#e2a531', '#7b4fb0', '#222222'];

export function Start() {
  const start = useGame((s) => s.start);
  const [name, setName] = useState('');
  const [shirt, setShirt] = useState(SHIRTS[0]);
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
        <button className="primary" onClick={() => start(name, shirt)}>Take land Abuja 🚀</button>
      </div>
    </div>
  );
}
