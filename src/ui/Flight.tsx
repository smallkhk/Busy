import { useEffect, useState } from 'react';
import { AIRLINE, flightProgress, flightStatus, minutesToLanding } from '../content/flights';
import { useGame } from '../store/game';
import { useFlightView } from '../world/places/Flight';

/** In the air: flight number, ABV → LOS with the plane moving along, time to landing, and inside/outside view. */
export function FlightPanel() {
  const f = useGame((s) => s.flight);
  const inCabin = useGame((s) => s.place === 'cabin');
  const { out, setOut } = useFlightView();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!f) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [f]);
  // Back on the ground: look from inside again next time
  useEffect(() => {
    if (!inCabin) setOut(false);
  }, [inCabin, setOut]);
  if (!f || !inCabin) return null;
  const p = flightProgress(f, now);
  const mins = minutesToLanding(f, now);
  return (
    <div className="card flight-panel">
      <div className="flight-top muted small">
        <span>{AIRLINE} {f.no} · {f.cls === 'business' ? 'Business' : 'Economy'}</span>
        <span>5N-ZMA</span>
      </div>
      <div className="flight-route">
        <b>{f.from}</b>
        <div className="flight-bar">
          <div className="flight-fill" style={{ width: `${p * 100}%` }} />
          <span className="flight-plane" style={{ left: `${p * 100}%` }}>✈️</span>
        </div>
        <b>{f.to}</b>
      </div>
      <div className="small">{p < 1 ? `${mins} min to landing` : 'Landed 🛬'} · {flightStatus(f, now)}</div>
      <div className="mission-btns">
        <button className={out ? 'ghost' : 'primary'} onClick={() => setOut(false)}>💺 Cabin</button>
        <button className={out ? 'primary' : 'ghost'} onClick={() => setOut(true)}>👀 Outside</button>
      </div>
    </div>
  );
}
