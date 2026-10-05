import { useState } from 'react';
import { useGame } from '../store/game';
import { HAIRS, SKINS, type Hair } from '../content/fashion';
import { DREAMS, EDUCATIONS, familyById, ORIGINS, rollBirth, type Birth, type Dream, type Education, type Origin } from '../content/birth';
import { AREAS } from '../content/housing';
import { carById } from '../content/cars';
import { formatNaira } from '../engine/clock';

const SHIRTS = ['#2f9e6b', '#d6406f', '#2f7fd6', '#e2a531', '#7b4fb0', '#222222'];

function Choices<T extends string>({ items, value, onPick }: { items: { id: T; name: string; emoji: string }[]; value: T | null; onPick: (id: T) => void }) {
  return (
    <div className="choices">
      {items.map((x) => (
        <button key={x.id} className={`choice ${value === x.id ? 'on' : ''}`} onClick={() => onPick(x.id)}>
          <span>{x.emoji}</span> {x.name}
        </button>
      ))}
    </div>
  );
}

export function Start() {
  const start = useGame((s) => s.start);
  const [step, setStep] = useState<'you' | 'ask' | 'born'>('you');
  const [name, setName] = useState('');
  const [shirt, setShirt] = useState(SHIRTS[0]);
  const [skin, setSkin] = useState(2);
  const [hair, setHair] = useState<Hair>('short');
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [education, setEducation] = useState<Education | null>(null);
  const [dream, setDream] = useState<Dream | null>(null);
  const [birth, setBirth] = useState<Birth | null>(null);

  if (step === 'born' && birth) {
    const fam = familyById(birth.family);
    const home = AREAS[birth.area];
    const edu = EDUCATIONS.find((e) => e.id === birth.education);
    const org = ORIGINS.find((o) => o.id === birth.origin);
    const car = fam.car ? carById(fam.car) : undefined;
    return (
      <div className="start">
        <div className="start-card card born">
          <div className="born-emoji">{fam.emoji}</div>
          <div className="born-title"><b>{fam.born}</b></div>
          <div className="muted small">{fam.name}</div>
          <div className="story muted small">{fam.story}</div>
          <div className="born-facts">
            <div><span>💵</span> {formatNaira(fam.money)} for your pocket</div>
            <div><span>{home.emoji}</span> {home.home}</div>
            <div><span>📅</span> Rent paid for {fam.rentPaidCycles * 30} days{home.rent ? ` · then ${formatNaira(home.rent)} / 30 days` : ''}</div>
            {car && <div><span>{car.emoji}</span> {car.name} for compound</div>}
            {edu && <div><span>{edu.emoji}</span> {edu.perk}</div>}
            {org && org.outfit !== 'tee' && <div><span>{org.emoji}</span> {org.greet}! Your people pack clothes from home for you</div>}
          </div>
          <button className="primary" onClick={() => start(name, shirt, { outfit: 'tee', hair, skin }, birth)}>Begin my Abuja life 🚀</button>
        </div>
      </div>
    );
  }

  if (step === 'ask') {
    const ready = origin && education && dream;
    return (
      <div className="start">
        <div className="start-card card">
          <div className="born-title">Small questions before you land ✈️</div>
          <div className="field">
            <span className="small">Which side you come from?</span>
            <Choices items={ORIGINS} value={origin} onPick={setOrigin} />
          </div>
          <div className="field">
            <span className="small">How far you go for school?</span>
            <Choices items={EDUCATIONS} value={education} onPick={setEducation} />
          </div>
          <div className="field">
            <span className="small">Wetin bring you Abuja?</span>
            <Choices items={DREAMS} value={dream} onPick={setDream} />
          </div>
          <p className="muted small">Rich or poor? Na God dey decide where person born 🎲</p>
          <button
            className="primary"
            disabled={!ready}
            onClick={() => {
              if (!origin || !education || !dream) return;
              setBirth(rollBirth({ origin, education, dream }));
              setStep('born');
            }}
          >
            {ready ? 'See where I born 🎲' : 'Answer all three'}
          </button>
          <button className="ghost small" onClick={() => setStep('you')}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="start">
      <div className="start-card card">
        <div className="logo">ABUJA<span>LIFE</span></div>
        <p className="tagline">Everybody for Abuja come from somewhere.<br />Na wetin you do when you land matter.</p>
        <div className="story muted small">
          Some people land Abuja with nothing, some land with Daddy money. You no go know your own until you born.
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
        <button className="primary" onClick={() => setStep('ask')}>Next ➜</button>
      </div>
    </div>
  );
}
