import { useEffect, useState } from 'react';
import { formatNaira } from '../engine/clock';
import { CHECKPOINT_BRIBE, CHECKPOINT_DELAY, hustleById, HUSTLES, LEVEL_XP, riderLevel } from '../content/missions';
import { useGame } from '../store/game';

/** Seconds left on the trip, ticking every quarter second. */
function useSecondsLeft(deadline?: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [deadline]);
  return deadline ? Math.ceil((deadline - now) / 1000) : null;
}

/** On a shift: who to pick, where to go, how much time, and the buttons. */
export function MissionPanel() {
  const shift = useGame((s) => s.shift);
  const m = useGame((s) => s.mission);
  const g = useGame.getState();
  const left = useSecondsLeft(m?.deadline);
  if (!shift || !m) return null;
  const job = hustleById(shift.kind)!;
  return (
    <div className="card mission-panel">
      <div className="mission-head">
        <span>{job.emoji} {job.name}</span>
        {left !== null && <span className={`mission-timer ${left < 0 ? 'late' : ''}`}>⏱️ {left >= 0 ? `${left}s` : `${-left}s late`}</span>}
      </div>
      <div className="small">
        {m.stage === 'pickup'
          ? m.food
            ? `🥡 Collect ${m.food} at ${m.pickup.name}, deliver to ${m.dropoff.name}`
            : `${m.who.emoji} Go pick ${m.who.name} at ${m.pickup.name} → going ${m.dropoff.name}`
          : m.food
            ? `🥡 Deliver ${m.food} to ${m.dropoff.name} before e cold`
            : `${m.who.emoji} ${m.who.name} dey your back. Carry am go ${m.dropoff.name}`}
      </div>
      <div className="muted small">💰 Fare {formatNaira(m.fare)} · on time = full pay + maybe tip</div>
      <div className="mission-btns">
        <button className="primary" onClick={g.navigate}>🧭 Go {m.stage === 'pickup' ? 'to pickup' : 'to drop-off'}</button>
        <button className="ghost" onClick={() => g.endShift()}>🏁 End shift</button>
      </div>
    </div>
  );
}

/** Police stop you on the road. */
export function CheckpointModal() {
  const on = useGame((s) => s.checkpoint);
  const answer = useGame((s) => s.answerCheckpoint);
  if (!on) return null;
  return (
    <div className="event-backdrop">
      <div className="event card">
        <div className="event-title">👮 Police checkpoint!</div>
        <p>"Oga stop there! Particulars? Wetin you carry? …Find something for the boys na."</p>
        <div className="list">
          <button className="primary" onClick={() => answer(true)}>💸 Settle them ({formatNaira(CHECKPOINT_BRIBE)})</button>
          <button className="ghost" onClick={() => answer(false)}>🪪 Show papers (lose {CHECKPOINT_DELAY}s)</button>
        </div>
      </div>
    </div>
  );
}

/** 🛵 Hustle app: your rider level and the jobs you can start. */
export function HustleApp() {
  const hustle = useGame((s) => s.hustle ?? { xp: 0, trips: 0, earned: 0 });
  const shift = useGame((s) => s.shift);
  const money = useGame((s) => s.money);
  const outside = useGame((s) => s.place !== 'home' && !s.active);
  const driving = useGame((s) => s.driving);
  const hasCar = useGame((s) => !!s.car);
  const g = useGame.getState();
  const level = riderLevel(hustle.xp);
  const into = hustle.xp % LEVEL_XP;
  return (
    <>
      <div className="balance">
        <div className="muted small">🏍️ Rider level</div>
        <div className="school-title">Level {level}</div>
        <div className="bar thin"><div className="fill good" style={{ width: `${(into / LEVEL_XP) * 100}%` }} /></div>
        <div className="muted small">{hustle.trips} trips · {formatNaira(hustle.earned)} earned · {LEVEL_XP - into} XP to next level</div>
      </div>
      {shift && <p className="small">✅ You dey on shift. Check the panel for your job, or end shift there.</p>}
      {!outside && !shift && <p className="muted small">🚪 Comot go outside first, then start a shift.</p>}
      <div className="list">
        {HUSTLES.map((h) => {
          const locked = level < h.level;
          const needCar = h.vehicle === 'car' && !driving;
          return (
            <div key={h.id} className="contact">
              <div className="contact-head">
                <span className="contact-emoji">{h.emoji}</span>
                <span className="action-body">
                  <span>{h.name}</span>
                  <span className="muted small">{h.blurb}</span>
                  <span className="small">{h.rent ? `Hire: ${formatNaira(h.rent)} per shift` : 'Your own car (fuel na your own)'}</span>
                </span>
              </div>
              <button
                className={locked || needCar ? 'ghost' : 'primary'}
                disabled={!!shift || !outside || locked || money < h.rent || needCar}
                onClick={() => g.startShift(h.id)}
              >
                {locked ? `🔒 Level ${h.level}` : needCar ? (hasCar ? '🚗 Enter your motor first' : '🚗 Buy a car first') : `▶️ Start shift`}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
