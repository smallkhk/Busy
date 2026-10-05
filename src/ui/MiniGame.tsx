import { useEffect, useMemo, useRef, useState } from 'react';
import { activityById } from '../content/activities';
import { cookScore, DECOYS, inZone, markerAt, matchResult, MATCHES_TV, posRound, RECIPES, type Pick } from '../content/minigames';
import { formatNaira } from '../engine/clock';
import { useGame } from '../store/game';

type Done = (score: number) => void;

function Pos({ done }: { done: Done }) {
  const rounds = useMemo(() => [posRound(Math.random), posRound(Math.random), posRound(Math.random)], []);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const r = rounds[i];
  const pick = (n: number) => {
    const ok = n === r.answer;
    const total = right + (ok ? 1 : 0);
    setRight(total);
    setFlash(ok ? '✅ Correct!' : `❌ Na ${formatNaira(r.answer)}`);
    setTimeout(() => {
      setFlash(null);
      if (i + 1 >= rounds.length) done(total / rounds.length);
      else setI(i + 1);
    }, 700);
  };
  return (
    <>
      <p className="small">Customer {i + 1}/3 wan withdraw <b>{formatNaira(r.amount)}</b>. Charge na ₦100 for every ₦5,000. How much you go debit their card?</p>
      <div className="mg-options">
        {r.options.map((n) => (
          <button key={n} className="action" disabled={!!flash} onClick={() => pick(n)}>{formatNaira(n)}</button>
        ))}
      </div>
      {flash && <div className="mg-flash">{flash}</div>}
    </>
  );
}

const SPOTS = 12;
const WASH_SECONDS = 8;

function Wash({ done }: { done: Done }) {
  const [dirty, setDirty] = useState<boolean[]>(() => Array(SPOTS).fill(true));
  const [left, setLeft] = useState(WASH_SECONDS);
  const cleaned = dirty.filter((d) => !d).length;
  const finished = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (finished.current) return;
    if (left <= 0 || cleaned === SPOTS) {
      finished.current = true;
      setTimeout(() => done(cleaned / SPOTS), 400);
    }
  }, [left, cleaned, done]);
  return (
    <>
      <p className="small">Tap all the dirt before time finish! ⏱️ {Math.max(0, left)}s · {cleaned}/{SPOTS}</p>
      <div className="mg-car">
        {dirty.map((d, i) => (
          <button key={i} className={`mg-dirt ${d ? '' : 'clean'}`} onPointerDown={() => setDirty((x) => x.map((v, k) => (k === i ? false : v)))} aria-label="Dirt">
            {d ? '🟤' : '✨'}
          </button>
        ))}
      </div>
    </>
  );
}

function Cook({ done }: { done: Done }) {
  const recipe = useMemo(() => RECIPES[Math.floor(Math.random() * RECIPES.length)], []);
  const items = useMemo(() => [...recipe.needs, ...DECOYS.slice(0, 3)].sort(() => Math.random() - 0.5), [recipe]);
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <>
      <p className="small">Cook <b>{recipe.emoji} {recipe.name}</b>. Pick the {recipe.needs.length} correct things, no add rubbish 😂</p>
      <div className="mg-grid">
        {items.map((it) => (
          <button key={it} className={`action ${picked.includes(it) ? 'on' : ''}`} onClick={() => setPicked((p) => (p.includes(it) ? p.filter((x) => x !== it) : [...p, it]))}>
            {it}
          </button>
        ))}
      </div>
      <button className="primary" disabled={!picked.length} onClick={() => done(cookScore(recipe, picked))}>🔥 Start cooking</button>
    </>
  );
}

function Timing({ done, label }: { done: Done; label: string }) {
  const [pos, setPos] = useState(0);
  const [hits, setHits] = useState<boolean[]>([]);
  const start = useRef(performance.now());
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setPos(markerAt((performance.now() - start.current) / 1000, 0.9 + hits.length * 0.25));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hits.length]);
  const tap = () => {
    const next = [...hits, inZone(pos)];
    setHits(next);
    if (next.length >= 3) setTimeout(() => done(next.filter(Boolean).length / 3), 400);
  };
  return (
    <>
      <p className="small">Tap when the marker dey inside the green. {hits.map((h) => (h ? '✅' : '❌')).join(' ')}</p>
      <div className="mg-bar">
        <div className="mg-zone" />
        <div className="mg-marker" style={{ left: `${pos * 100}%` }} />
      </div>
      <button className="primary" disabled={hits.length >= 3} onPointerDown={tap}>{label}</button>
    </>
  );
}

function Predict({ done }: { done: Done }) {
  const match = useMemo(() => MATCHES_TV[Math.floor(Math.random() * MATCHES_TV.length)], []);
  const [res, setRes] = useState<{ pick: Pick; result: Pick; score: string } | null>(null);
  const choose = (pick: Pick) => setRes({ pick, ...matchResult(Math.random) });
  return (
    <>
      <p className="small"><b>{match.home}</b> vs <b>{match.away}</b>. Who go win? (No betting, na for bragging rights 😎)</p>
      {!res ? (
        <div className="mg-options">
          <button className="action" onClick={() => choose('home')}>{match.home.split(' ')[0]} Home win</button>
          <button className="action" onClick={() => choose('draw')}>🤝 Draw</button>
          <button className="action" onClick={() => choose('away')}>{match.away.split(' ')[0]} Away win</button>
        </div>
      ) : (
        <>
          <div className="mg-flash">Final score: {res.score} {res.pick === res.result ? '🎯 You call am!' : '😅 E no enter'}</div>
          <button className="primary" onClick={() => done(res.pick === res.result ? 1 : 0)}>Continue</button>
        </>
      )}
    </>
  );
}

const TITLES = { pos: '🏧 POS rush', wash: '🧽 Car wash', cook: '🍳 Kitchen time', timing: '🕺 Feel the beat', predict: '⚽ Predict the match' } as const;

/** Quick game before some activities. Your score changes the pay or the fun. */
export function MiniGame() {
  const mg = useGame((s) => s.minigame);
  const play = useGame((s) => s.playMinigame);
  if (!mg) return null;
  const a = activityById(mg.id);
  const done: Done = (score) => play(score);
  return (
    <div className="event-backdrop">
      <div className="event card minigame" key={mg.id}>
        <div className="event-title">{TITLES[mg.kind]}</div>
        <div className="muted small">{a?.label}{a?.pay ? ' · score high = more pay' : ''}</div>
        {mg.kind === 'pos' && <Pos done={done} />}
        {mg.kind === 'wash' && <Wash done={done} />}
        {mg.kind === 'cook' && <Cook done={done} />}
        {mg.kind === 'timing' && <Timing done={done} label={mg.id === 'conductor' ? '📢 "Nyanya! Mararaba!"' : '💃 Dance!'} />}
        {mg.kind === 'predict' && <Predict done={done} />}
        <button className="ghost" onClick={() => play(null)}>Skip game</button>
      </div>
    </div>
  );
}
