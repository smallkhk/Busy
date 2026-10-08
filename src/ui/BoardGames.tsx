import { useEffect, useState, type JSX } from 'react';
import { cellOf, HOME, HOME_COL, ludoCpu, ludoScore, moveSeed, movable, newLudo, rollDie, SAFE, START, TRACK, type Ludo } from '../content/ludo';
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

// ---------------- Ludo ----------------
const LUDO_COLOR: Record<0 | 1, string> = { 0: '#d63031', 1: '#f2c230' };
const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
/** Yard circles: [row, col] of the 4 seats in each corner yard. */
const YARD: Record<0 | 1, [number, number][]> = {
  0: [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]],
  1: [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
};

export function LudoGame({ done, stake }: { done: Done; stake: number }) {
  const opp = useOpponent();
  const [g, setG] = useState<Ludo>(() => newLudo(Math.random() < 0.5 ? 0 : 1));
  const [rolling, setRolling] = useState(false);
  useFinish(g.over, ludoScore(g), done);
  const throwDie = () => {
    setRolling(true);
    window.setTimeout(() => {
      setRolling(false);
      setG((x) => rollDie(x, 1 + Math.floor(Math.random() * 6)));
    }, 450);
  };
  // The computer throws and moves by itself
  useEffect(() => {
    if (g.over || g.turn !== 1 || rolling) return;
    const t = window.setTimeout(() => {
      if (g.roll === null) throwDie();
      else setG(moveSeed(g, ludoCpu(g)));
    }, 750);
    return () => window.clearTimeout(t);
  }, [g, rolling]);
  // Only one seed fit move: move am for you
  const can = g.turn === 0 && !g.over ? movable(g) : [];
  useEffect(() => {
    if (g.turn !== 0 || g.roll === null || can.length !== 1) return;
    const t = window.setTimeout(() => setG(moveSeed(g, can[0])), 600);
    return () => window.clearTimeout(t);
  }, [g, can]);
  const home = (s: 0 | 1) => g.seeds[s].filter((x) => x === HOME).length;
  const cells: JSX.Element[] = [];
  const homeCols = new Map<string, 0 | 1>();
  for (const s of [0, 1] as const) HOME_COL[s].forEach(([r, c]) => homeCols.set(`${r},${c}`, s));
  const trackIdx = new Map(TRACK.map(([r, c], i) => [`${r},${c}`, i]));
  for (let r = 0; r < 15; r++)
    for (let c = 0; c < 15; c++) {
      const k = `${r},${c}`;
      const t = trackIdx.get(k);
      const hc = homeCols.get(k);
      let bg = 'transparent';
      if (t !== undefined) bg = t === START[0] ? LUDO_COLOR[0] : t === START[1] ? LUDO_COLOR[1] : '#fbf6ea';
      if (hc !== undefined) bg = LUDO_COLOR[hc];
      const star = t !== undefined && SAFE.has(t) && t !== START[0] && t !== START[1];
      cells.push(
        <div key={k} className="ludo-cell" style={{ gridRow: r + 1, gridColumn: c + 1, background: bg }}>
          {star && '★'}
        </div>,
      );
    }
  // Seeds: on the board (grouped when two share a square) or in the yard
  const pieces: JSX.Element[] = [];
  for (const s of [0, 1] as const)
    g.seeds[s].forEach((step, i) => {
      const at = step === HOME ? null : cellOf(s, step);
      const pos: [number, number] = at ? [at[0] + 0.5, at[1] + 0.5] : step === HOME ? [7.5 + (s === 0 ? 0.6 : -0.6), 7.5 + (i - 1.5) * 0.35] : [YARD[s][i][0] + 0.5, YARD[s][i][1] + 0.5];
      const mine = s === 0 && can.includes(i);
      const dup = at ? g.seeds[s].slice(0, i).filter((x) => x === step).length : 0;
      pieces.push(
        <button
          key={`${s}${i}`}
          className={`ludo-seed ${mine ? 'can' : ''} ${step === HOME ? 'home' : ''}`}
          style={{ left: `${((pos[1] + dup * 0.18) / 15) * 100}%`, top: `${((pos[0] - dup * 0.18) / 15) * 100}%`, background: LUDO_COLOR[s] }}
          onClick={() => mine && setG(moveSeed(g, i))}
        />,
      );
    });
  return (
    <div className="pool">
      <Head you={`🔴 ${home(0)}/4 home`} them={`${opp} · 🟡 ${home(1)}/4`} mine={g.turn === 0} note={g.note} stake={stake} />
      <div className="dr-wrap">
        <div className="ludo-board">
          <div className="ludo-yard" style={{ gridRow: '10 / 16', gridColumn: '1 / 7', background: LUDO_COLOR[0] }} />
          <div className="ludo-yard" style={{ gridRow: '1 / 7', gridColumn: '10 / 16', background: LUDO_COLOR[1] }} />
          <div className="ludo-yard" style={{ gridRow: '1 / 7', gridColumn: '1 / 7', background: '#2a7fd6' }} />
          <div className="ludo-yard" style={{ gridRow: '10 / 16', gridColumn: '10 / 16', background: '#1e9e5a' }} />
          <div className="ludo-centre" style={{ gridRow: '7 / 10', gridColumn: '7 / 10' }} />
          {cells}
          {(Object.keys(YARD) as unknown as (0 | 1)[]).flatMap((s) => YARD[s].map(([r, c], i) => <span key={`y${s}${i}`} className="ludo-spot" style={{ left: `${((c + 0.5) / 15) * 100}%`, top: `${((r + 0.5) / 15) * 100}%` }} />))}
          {pieces}
        </div>
      </div>
      <div className="ludo-bar">
        <button className={`ludo-die ${rolling ? 'spin' : ''}`} disabled={g.turn !== 0 || g.roll !== null || g.over || rolling} onClick={throwDie}>
          {g.roll ? DICE[g.roll - 1] : '🎲'}
        </button>
        <span className="muted small">{g.turn === 0 && g.roll === null && !g.over ? 'Tap the die to roll' : can.length > 1 ? 'Tap the seed you wan move' : ''}</span>
      </div>
      <div className="pool-help muted small">6 to bring seed out · 6 or knocking a seed = roll again · ★ and start squares are safe · exact number to enter home.</div>
    </div>
  );
}
