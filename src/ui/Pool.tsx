import { useEffect, useRef, useState } from 'react';
import { aimGuide, cpuShot, groupOf, judge, L, left, moving, newLog, newMatch, POCKET_R, POCKETS, R, shoot, step, W, type Match, type ShotLog } from '../content/pool';

const COLORS: Record<number, string> = {
  1: '#f2c230', 2: '#2a5db0', 3: '#d63031', 4: '#6c3483', 5: '#e67e22', 6: '#1e8449', 7: '#7b241c', 8: '#111111',
};
const ballColor = (n: number) => COLORS[n > 8 ? n - 8 : n] ?? '#ffffff';

const OPPONENTS = ['Emeka (bar champion)', 'Big Tunde', 'Chairman Musa', 'Aunty Bisi', 'Kelvin "Snooker"', 'Ifeanyi'];

/** Rail thickness around the cloth, in table units. */
const RAIL = 0.07;

/**
 * Full-screen 8-ball pool. You play solids or stripes against the bar's
 * player. Drag back from anywhere and let go: the white goes the other way,
 * harder the more you pull. Calls `done(1)` for a win, `done(0)` for a loss.
 */
export function PoolGame({ done, stake }: { done: (score: number) => void; stake: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const match = useRef<Match>(newMatch(Math.random, Math.random() < 0.5 ? 'you' : 'cpu'));
  const log = useRef<ShotLog>(newLog());
  const rolling = useRef(false);
  /** Where the shot go: angle on the table (radians). Starts pointing up at the rack. */
  const aimAngle = useRef(-Math.PI / 2);
  const aiming = useRef(false);
  /** Power from the bar (0..1) while you dey pull am; null when you no touch am. */
  const pull = useRef<number | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [power, setPower] = useState(0);
  const [, redraw] = useState(0);
  const [opponent] = useState(() => OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)]);
  const [skill] = useState(() => 0.55 + Math.random() * 0.3);
  const scale = useRef(200);
  const finished = useRef(false);

  // Size the table to the screen: portrait, rails included
  useEffect(() => {
    const fit = () => {
      const el = wrap.current;
      const c = canvas.current;
      if (!el || !c) return;
      const s = Math.min(el.clientWidth / (W + 2 * RAIL), el.clientHeight / (L + 2 * RAIL));
      scale.current = s;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      c.width = (W + 2 * RAIL) * s * dpr;
      c.height = (L + 2 * RAIL) * s * dpr;
      c.style.width = `${(W + 2 * RAIL) * s}px`;
      c.style.height = `${(L + 2 * RAIL) * s}px`;
      c.getContext('2d')!.setTransform(dpr * s, 0, 0, dpr * s, RAIL * dpr * s, RAIL * dpr * s);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // The loop: roll the balls, judge the shot, let the computer play, draw
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let cpuWait = 0.9;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const m = match.current;
      if (rolling.current) {
        for (let t = 0; t < dt; t += 1 / 240) step(m.balls, 1 / 240, log.current);
        if (!moving(m.balls)) {
          rolling.current = false;
          judge(m, log.current);
          cpuWait = 1.1;
          redraw((x) => x + 1);
          if (m.winner && !finished.current) {
            finished.current = true;
            window.setTimeout(() => done(m.winner === 'you' ? 1 : 0), 1800);
          }
        }
      } else if (!m.winner && m.turn === 'cpu') {
        cpuWait -= dt;
        if (cpuWait <= 0) {
          const s = cpuShot(m, skill, Math.random);
          log.current = newLog();
          shoot(m.balls, s.angle, s.power);
          rolling.current = true;
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** The shot you dey line up: always the aim, power from the bar (a small preview when you no pull). */
  const aim = () => ({ angle: aimAngle.current, power: pull.current ?? 0.25 });

  /** Point the cue from the white ball toward where your finger dey on the table. */
  const aimAt = (clientX: number, clientY: number) => {
    const c = canvas.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = (clientX - r.left) / scale.current - RAIL;
    const y = (clientY - r.top) / scale.current - RAIL;
    const cue = match.current.balls[0];
    if (Math.hypot(x - cue.x, y - cue.y) < 0.01) return;
    aimAngle.current = Math.atan2(y - cue.y, x - cue.x);
  };

  /** Power from how far down the bar your finger dey. */
  const pullTo = (clientY: number) => {
    const b = bar.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientY - r.top) / r.height));
    pull.current = p;
    setPower(p);
  };
  const release = () => {
    const p = pull.current;
    pull.current = null;
    setPower(0);
    if (p === null || p < 0.04 || !myTurn()) return;
    log.current = newLog();
    shoot(match.current.balls, aimAngle.current, p);
    rolling.current = true;
  };
  const nudge = (deg: number) => (aimAngle.current += (deg * Math.PI) / 180);

  function draw() {
    const c = canvas.current;
    if (!c) return;
    const g = c.getContext('2d')!;
    const m = match.current;
    // Rails and cloth
    g.fillStyle = '#5b3a21';
    g.fillRect(-RAIL, -RAIL, W + 2 * RAIL, L + 2 * RAIL);
    g.fillStyle = '#7a5032';
    g.fillRect(-RAIL * 0.45, -RAIL * 0.45, W + RAIL * 0.9, L + RAIL * 0.9);
    const felt = g.createRadialGradient(W / 2, L / 2, 0.1, W / 2, L / 2, 1.2);
    felt.addColorStop(0, '#1f8f55');
    felt.addColorStop(1, '#126b3e');
    g.fillStyle = felt;
    g.fillRect(0, 0, W, L);
    // Head string and spots
    g.strokeStyle = 'rgba(255,255,255,0.18)';
    g.lineWidth = 0.004;
    g.beginPath();
    g.moveTo(0, L * 0.75);
    g.lineTo(W, L * 0.75);
    g.stroke();
    // Diamonds on the rails
    g.fillStyle = '#f1e2c0';
    for (let i = 1; i < 4; i++) for (const y of [-RAIL * 0.72, L + RAIL * 0.72]) circle(g, (W * i) / 4, y, 0.008);
    for (let i = 1; i < 8; i++) if (i !== 4) for (const x of [-RAIL * 0.72, W + RAIL * 0.72]) circle(g, x, (L * i) / 8, 0.008);
    // Pockets
    g.fillStyle = '#0b0b0b';
    for (const [px, py] of POCKETS) circle(g, px, py, POCKET_R * 0.95);
    // Aim guide
    const shot = m.turn === 'you' && !rolling.current && !m.winner ? aim() : null;
    const cue = m.balls[0];
    if (shot) {
      const gd = aimGuide(m.balls, shot.angle);
      g.setLineDash([0.02, 0.015]);
      g.strokeStyle = 'rgba(255,255,255,0.75)';
      g.lineWidth = 0.005;
      g.beginPath();
      g.moveTo(cue.x, cue.y);
      g.lineTo(gd.x, gd.y);
      g.stroke();
      g.setLineDash([]);
      g.strokeStyle = 'rgba(255,255,255,0.8)';
      g.beginPath();
      g.arc(gd.x, gd.y, R, 0, Math.PI * 2);
      g.stroke();
      if (gd.hit) {
        // Where the ball you hit go travel
        const nx = gd.hit.x - gd.x;
        const ny = gd.hit.y - gd.y;
        const nl = Math.hypot(nx, ny) || 1;
        g.strokeStyle = 'rgba(255,240,150,0.85)';
        g.beginPath();
        g.moveTo(gd.hit.x, gd.hit.y);
        g.lineTo(gd.hit.x + (nx / nl) * 0.25, gd.hit.y + (ny / nl) * 0.25);
        g.stroke();
      }
      // The cue stick, pulled back by the power
      const back = 0.05 + shot.power * 0.18;
      const sx = cue.x - Math.cos(shot.angle) * (R + back);
      const sy = cue.y - Math.sin(shot.angle) * (R + back);
      g.strokeStyle = '#d9b26a';
      g.lineWidth = 0.016;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(sx - Math.cos(shot.angle) * 0.9, sy - Math.sin(shot.angle) * 0.9);
      g.stroke();
      g.strokeStyle = '#2b2b2b';
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(sx - Math.cos(shot.angle) * 0.03, sy - Math.sin(shot.angle) * 0.03);
      g.stroke();
      g.lineCap = 'butt';
    }
    // Balls with a shadow, a stripe band and a shine
    for (const b of m.balls) {
      if (b.potted) continue;
      g.fillStyle = 'rgba(0,0,0,0.3)';
      circle(g, b.x + 0.006, b.y + 0.008, R);
      if (b.n === 0) {
        g.fillStyle = '#f7f5ee';
        circle(g, b.x, b.y, R);
      } else if (b.n > 8) {
        g.fillStyle = '#f7f5ee';
        circle(g, b.x, b.y, R);
        g.save();
        g.beginPath();
        g.arc(b.x, b.y, R, 0, Math.PI * 2);
        g.clip();
        g.fillStyle = ballColor(b.n);
        g.fillRect(b.x - R, b.y - R * 0.55, 2 * R, R * 1.1);
        g.restore();
      } else {
        g.fillStyle = ballColor(b.n);
        circle(g, b.x, b.y, R);
      }
      if (b.n !== 0) {
        g.fillStyle = '#ffffff';
        circle(g, b.x, b.y, R * 0.45);
        g.fillStyle = '#111';
        g.font = `bold ${R * 0.62}px sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(String(b.n), b.x, b.y + R * 0.04);
      }
      g.fillStyle = 'rgba(255,255,255,0.45)';
      circle(g, b.x - R * 0.35, b.y - R * 0.35, R * 0.22);
    }
  }

  const myTurn = () => match.current.turn === 'you' && !rolling.current && !match.current.winner;

  const m = match.current;
  const tray = (who: 'you' | 'cpu') => {
    const g = m.groups[who];
    if (!g) return <span className="muted small">open table</span>;
    const nums = m.balls.filter((b) => b.n !== 0 && groupOf(b.n) === g).map((b) => b.n);
    return (
      <span className="pool-tray">
        {nums.map((n) => {
          const gone = m.balls.find((b) => b.n === n)!.potted;
          return (
            <i key={n} className={gone ? 'gone' : ''} style={{ background: n > 8 ? `linear-gradient(#f7f5ee 22%, ${ballColor(n)} 22% 78%, #f7f5ee 78%)` : ballColor(n) }} />
          );
        })}
        {left(m.balls, g) === 0 && <i style={{ background: '#111' }} />}
      </span>
    );
  };

  return (
    <div className="pool">
      <div className="pool-top">
        <div className={`pool-player ${m.turn === 'you' ? 'on' : ''}`}>
          <b>You</b>
          {tray('you')}
        </div>
        <div className="pool-stake">🎱 ₦{(stake * 2).toLocaleString('en-NG')} pot</div>
        <div className={`pool-player right ${m.turn === 'cpu' ? 'on' : ''}`}>
          <b>{opponent}</b>
          {tray('cpu')}
        </div>
      </div>
      <div className="pool-note">{m.note}</div>
      <div className="pool-play">
        <div
          className="pool-table"
          ref={wrap}
          onPointerDown={(e) => {
            if (!myTurn()) return;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            aiming.current = true;
            aimAt(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => aiming.current && aimAt(e.clientX, e.clientY)}
          onPointerUp={() => (aiming.current = false)}
          onPointerCancel={() => (aiming.current = false)}
        >
          <canvas ref={canvas} />
        </div>
        <div className="pool-side">
          <span className="pool-side-label">POWER</span>
          <div
            className={`pool-power ${myTurn() ? '' : 'off'}`}
            ref={bar}
            onPointerDown={(e) => {
              if (!myTurn()) return;
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              pullTo(e.clientY);
            }}
            onPointerMove={(e) => pull.current !== null && pullTo(e.clientY)}
            onPointerUp={release}
            onPointerCancel={() => {
              pull.current = null;
              setPower(0);
            }}
          >
            <div className="pool-power-fill" style={{ height: `${power * 100}%` }} />
            <div className="pool-power-cue" style={{ top: `${power * 100}%` }} />
          </div>
          <span className="pool-side-label">{Math.round(power * 100)}%</span>
        </div>
      </div>
      <div className="pool-fine">
        <button className="ghost" onClick={() => nudge(-2)}>⏪</button>
        <button className="ghost" onClick={() => nudge(-0.4)}>◀</button>
        <span className="muted small">Touch table to aim · pull bar down to shoot</span>
        <button className="ghost" onClick={() => nudge(0.4)}>▶</button>
        <button className="ghost" onClick={() => nudge(2)}>⏩</button>
      </div>
    </div>
  );
}

function circle(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
