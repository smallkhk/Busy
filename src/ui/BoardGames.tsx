import { useEffect, useState } from 'react';
import { ayoCpu, ayoScore, legal, newAyo, play, type Ayo } from '../content/ayo';
import { apply, dark, draughtsCpu, draughtsScore, movesFor, newDraughts, type Draughts, type Move } from '../content/draughts';
import { canPlay, goMarket, newWhot, playCard, SHAPE_EMOJI, SHAPES, top, whotCpu, whotScore, type Card, type Shape, type Whot } from '../content/whot';

type Done = (score: number) => void;

const OPPONENTS = ['Baba Sule', 'Mama Nkechi', 'Uncle Femi', 'Danladi', 'Kelechi', 'Alhaji Bello', 'Ngozi', 'Chinedu'];
const useOpponent = () => useState(() => OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)])[0];

/** Header shared by the board games: who dey play, the pot, the message. */
function Head({ you, them, mine, note, stake }: { you: string; them: string; mine: boolean; note: string; stake: number }) {
  return (
    <>
      <div className="pool-top">
        <div className={`pool-player ${mine ? 'on' : ''}`}>
          <b>You</b>
          <span className="muted small">{you}</span>
        </div>
        <div className="pool-stake">{stake ? `💰 ₦${(stake * 2).toLocaleString('en-NG')} pot` : '🤝 Friendly'}</div>
        <div className={`pool-player right ${!mine ? 'on' : ''}`}>
          <b>{them}</b>
        </div>
      </div>
      <div className="pool-note">{note}</div>
    </>
  );
}

/** When the game finishes, wait small so you see the result, then report. */
function useFinish(over: boolean, score: number, done: Done) {
  useEffect(() => {
    if (!over) return;
    const t = window.setTimeout(() => done(score), 2200);
    return () => window.clearTimeout(t);
  }, [over, score, done]);
}

// ---------------- Ayo ----------------
export function AyoGame({ done, stake }: { done: Done; stake: number }) {
  const opp = useOpponent();
  const [g, setG] = useState<Ayo>(() => newAyo(Math.random() < 0.5 ? 0 : 1));
  const [last, setLast] = useState<number | null>(null);
  useFinish(g.over, ayoScore(g), done);
  useEffect(() => {
    if (g.over || g.turn !== 1) return;
    const t = window.setTimeout(() => {
      const m = ayoCpu(g, Math.random);
      setLast(m);
      setG(play(g, m));
    }, 1100);
    return () => window.clearTimeout(t);
  }, [g]);
  const ok = g.turn === 0 && !g.over ? legal(g) : [];
  const pit = (i: number) => (
    <button key={i} className={`ayo-pit ${ok.includes(i) ? 'can' : ''} ${last === i ? 'last' : ''}`} onClick={() => { if (!ok.includes(i)) return; setLast(i); setG(play(g, i)); }}>
      <span className="ayo-seeds">
        {Array.from({ length: Math.min(g.pits[i], 14) }, (_, k) => <i key={k} />)}
      </span>
      <b>{g.pits[i]}</b>
    </button>
  );
  return (
    <div className="pool">
      <Head you={`🫘 ${g.store[0]} seeds`} them={`${opp} · 🫘 ${g.store[1]}`} mine={g.turn === 0} note={g.note} stake={stake} />
      <div className="ayo-board">
        <div className="ayo-row">{[11, 10, 9, 8, 7, 6].map(pit)}</div>
        <div className="ayo-row">{[0, 1, 2, 3, 4, 5].map(pit)}</div>
      </div>
      <div className="pool-help muted small">Tap one of your holes (bottom row). Seeds go round to the right. If your last seed make 2 or 3 for their side, you chop am.</div>
    </div>
  );
}

// ---------------- Whot ----------------
function WhotCard({ c, onClick, dim }: { c: Card; onClick?: () => void; dim?: boolean }) {
  const face = (
    <>
      <span className="wn">{c.n}</span>
      <span className="ws">{SHAPE_EMOJI[c.s]}</span>
      <span className="wn r">{c.n}</span>
    </>
  );
  // A card you no fit play is just a picture, not a disabled button (so e no go grey)
  return onClick ? (
    <button className={`whot-card ${c.s}`} onClick={onClick}>{face}</button>
  ) : (
    <div className={`whot-card ${c.s} ${dim ? 'dim' : ''}`}>{face}</div>
  );
}

export function WhotGame({ done, stake }: { done: Done; stake: number }) {
  const opp = useOpponent();
  const [g, setG] = useState<Whot>(() => newWhot(Math.random, Math.random() < 0.5 ? 0 : 1));
  const [asking, setAsking] = useState<number | null>(null);
  useFinish(g.over, whotScore(g), done);
  useEffect(() => {
    if (g.over || g.turn !== 1) return;
    const t = window.setTimeout(() => {
      const m = whotCpu(g);
      setG(m.id === null ? goMarket(g) : playCard(g, m.id, m.call));
    }, 1200);
    return () => window.clearTimeout(t);
  }, [g]);
  const mine = g.turn === 0 && !g.over;
  const t = top(g);
  return (
    <div className="pool">
      <Head you={`🃏 ${g.hands[0].length} cards`} them={`${opp} · 🃏 ${g.hands[1].length}`} mine={g.turn === 0} note={g.note} stake={stake} />
      <div className="whot-table">
        <div className="whot-backs">
          {g.hands[1].map((c) => <span key={c.id} className="whot-back" />)}
        </div>
        <div className="whot-mid">
          <button className="whot-market" onClick={() => mine && setG(goMarket(g))}>
            <span>🛒</span>
            <b>Market</b>
            <small>{g.market.length} left</small>
          </button>
          <div className="whot-pile">
            <WhotCard c={t} />
            {g.call && <div className="whot-call">Need: {SHAPE_EMOJI[g.call]} {g.call}</div>}
          </div>
        </div>
        <div className="whot-hand">
          {g.hands[0].map((c) => {
            const ok = mine && canPlay(g, c);
            return <WhotCard key={c.id} c={c} dim={!ok} onClick={ok ? () => (c.s === 'whot' ? setAsking(c.id) : setG(playCard(g, c.id))) : undefined} />;
          })}
        </div>
      </div>
      {asking !== null && (
        <div className="whot-ask card">
          <b>🃏 Whot! Which shape you want?</b>
          <div className="whot-shapes">
            {SHAPES.map((s: Shape) => (
              <button key={s} className="action" onClick={() => { setG(playCard(g, asking, s)); setAsking(null); }}>
                {SHAPE_EMOJI[s]} {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="pool-help muted small">Match the shape or number. 1 hold on · 2 pick two · 8 suspension · 14 general market · 20 Whot (call any shape). No card? Go market.</div>
    </div>
  );
}

// ---------------- Draughts ----------------
export function DraughtsGame({ done, stake }: { done: Done; stake: number }) {
  const opp = useOpponent();
  const [g, setG] = useState<Draughts>(() => newDraughts());
  const [sel, setSel] = useState<number | null>(null);
  const [last, setLast] = useState<Move | null>(null);
  useFinish(g.over, draughtsScore(g), done);
  useEffect(() => {
    if (g.over || g.turn !== 1) return;
    const t = window.setTimeout(() => {
      const m = draughtsCpu(g, Math.random);
      setLast(m);
      setG(apply(g, m));
    }, 900);
    return () => window.clearTimeout(t);
  }, [g]);
  const moves = g.turn === 0 && !g.over ? movesFor(g) : [];
  const from = new Set(moves.map((m) => m.from));
  const targets = sel !== null ? moves.filter((m) => m.from === sel) : [];
  const tap = (i: number) => {
    if (from.has(i)) return setSel(i);
    const m = targets.find((x) => x.path[x.path.length - 1] === i);
    if (m) {
      setLast(m);
      setSel(null);
      setG(apply(g, m));
    }
  };
  const left = (s: 0 | 1) => g.board.filter((p) => p?.side === s).length;
  const trail = new Set(last ? [last.from, ...last.path] : []);
  return (
    <div className="pool">
      <Head you={`⚫ ${left(0)} pieces`} them={`${opp} · ⚪ ${left(1)}`} mine={g.turn === 0} note={g.note} stake={stake} />
      <div className="dr-wrap">
        <div className="dr-board">
          {g.board.map((p, i) => {
            const isTarget = targets.some((m) => m.path[m.path.length - 1] === i);
            return (
              <button
                key={i}
                className={`dr-sq ${sel === i ? 'sel' : ''} ${isTarget ? 'target' : ''} ${from.has(i) && sel === null ? 'can' : ''}`}
                style={{ background: sel === i ? '#b8892f' : isTarget ? '#3d8b5a' : dark(i) ? (trail.has(i) ? '#9a7040' : '#7a5032') : '#e9d9b4' }}
                onClick={() => tap(i)}
              >
                {p && <span className={`dr-piece s${p.side} ${p.king ? 'king' : ''}`}>{p.king ? '👑' : ''}</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="pool-help muted small">Tap your piece, then the square. If you fit chop, you must chop. Reach the end and you become king 👑.</div>
    </div>
  );
}
