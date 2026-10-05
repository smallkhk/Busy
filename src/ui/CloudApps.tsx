import { useEffect, useState } from 'react';
import { formatNaira } from '../engine/clock';
import { acceptOffer, fetchBoard, formatCode, loadFromCode, netWorth, saveNow, useCloud, type Metric, type Row } from '../net/cloud';
import { useSocial } from '../net/social';
import { useGame } from '../store/game';
import { isIOS, promptInstall, useInstall, useSettings } from '../settings';

const ago = (t: number | null) => {
  if (!t) return 'never';
  const s = Math.round((Date.now() - t) / 1000);
  return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} hr ago`;
};

function InstallCard() {
  const { canInstall, installed } = useInstall();
  if (installed) return <p className="small">✅ Abuja Life don install for this phone.</p>;
  return (
    <div className="balance">
      <div className="muted small">📲 Install as app</div>
      <div className="small">Open am from your home screen like real app, full screen and faster.</div>
      {canInstall ? (
        <button className="primary" style={{ marginTop: 8, width: '100%' }} onClick={() => void promptInstall()}>📲 Install Abuja Life</button>
      ) : isIOS() ? (
        <div className="small" style={{ marginTop: 6 }}>On iPhone: tap <b>Share</b> ⬆️ for Safari, then <b>Add to Home Screen</b>.</div>
      ) : (
        <div className="small" style={{ marginTop: 6 }}>Open your browser menu ⋮ and tap <b>Install app</b> or <b>Add to Home screen</b>.</div>
      )}
    </div>
  );
}

function QualityToggle() {
  const { quality, setQuality } = useSettings();
  return (
    <>
      <div className="love-tabs">
        <button className={quality === 'high' ? 'on' : ''} onClick={() => setQuality('high')}>✨ High</button>
        <button className={quality === 'low' ? 'on' : ''} onClick={() => setQuality('low')}>⚡ Low (faster)</button>
      </div>
      <p className="muted small">Low graphics: fewer houses, simpler shadows and lighter screen. Use am if your phone dey hot or slow.</p>
    </>
  );
}

/** ⚙️ Account: cloud save and moving your life to another phone. */
export function AccountApp() {
  const { status, lastSaved, code } = useCloud();
  const social = useSocial((s) => s.status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);
  const run = async (fn: () => Promise<string | null>, ok: string) => {
    setBusy(true);
    const e = await fn();
    setBusy(false);
    setMsg(e ?? ok);
  };
  return (
    <>
      <div className="balance">
        <div className="muted small">☁️ Cloud save</div>
        <div className="balance-amt" style={{ fontSize: 20 }}>
          {social !== 'ready' ? 'Offline' : status === 'needs-setup' ? 'Never set up' : `Saved ${ago(lastSaved)}`}
        </div>
        <div className="muted small">Your life dey save online every minute and when you close the game.</div>
        <button className="primary" style={{ marginTop: 10, width: '100%' }} disabled={busy || social !== 'ready'} onClick={() => void run(saveNow, '✅ Saved!')}>
          {busy ? 'Saving…' : '☁️ Save now'}
        </button>
      </div>
      {code && (
        <div className="balance">
          <div className="muted small">🔑 Your recovery code</div>
          <div className="cloud-code">{formatCode(code)}</div>
          <div className="muted small">Write am down! If you change phone or clear your browser, enter this code to continue this same life.</div>
          <button className="ghost" style={{ marginTop: 8, width: '100%' }} onClick={() => void navigator.clipboard?.writeText(formatCode(code)).then(() => setMsg('📋 Code don copy'))}>📋 Copy code</button>
        </div>
      )}
      <InstallCard />
      <div className="love-section">🎮 Graphics</div>
      <QualityToggle />
      <div className="love-section">📲 Continue on this phone</div>
      <input className="ad-input" value={input} maxLength={9} placeholder="ABCD-2345" onChange={(e) => setInput(e.target.value)} />
      <button className="ghost" style={{ width: '100%', marginTop: 8 }} disabled={busy || input.length < 8} onClick={() => confirm('This go replace the life for this phone. Continue?') && void run(() => loadFromCode(input), '✅ Life don load!')}>
        Load my life
      </button>
      {msg && <p className="small">{msg}</p>}
    </>
  );
}

const METRICS: { id: Metric; label: string; fmt: (r: Row) => string }[] = [
  { id: 'net_worth', label: '💰 Richest', fmt: (r) => formatNaira(r.net_worth) },
  { id: 'long_leg', label: '🦵 Long Leg', fmt: (r) => String(r.long_leg) },
  { id: 'followers', label: '📸 Followers', fmt: (r) => r.followers.toLocaleString('en-NG') },
  { id: 'packaging', label: '👔 Packaging', fmt: (r) => String(r.packaging) },
];

/** 🏆 Rankings: who be the biggest for Abuja. */
export function RankingsApp() {
  const [metric, setMetric] = useState<Metric>('net_worth');
  const [weekly, setWeekly] = useState(false);
  const [rows, setRows] = useState<Row[] | string | null>(null);
  const uid = useSocial((s) => s.uid);
  const worth = useGame((s) => netWorth(s));
  useEffect(() => {
    let live = true;
    setRows(null);
    void saveNow().then(() => fetchBoard(metric, weekly)).then((r) => live && setRows(r));
    return () => {
      live = false;
    };
  }, [metric, weekly]);
  const m = METRICS.find((x) => x.id === metric)!;
  return (
    <>
      <div className="muted small">Your net worth: <b>{formatNaira(worth)}</b> (money + savings + car + business + property − loan)</div>
      <div className="love-tabs rank-tabs">
        {METRICS.map((x) => (
          <button key={x.id} className={metric === x.id ? 'on' : ''} onClick={() => setMetric(x.id)}>{x.label}</button>
        ))}
      </div>
      <div className="love-tabs">
        <button className={!weekly ? 'on' : ''} onClick={() => setWeekly(false)}>All time</button>
        <button className={weekly ? 'on' : ''} onClick={() => setWeekly(true)}>This week</button>
      </div>
      {rows === null && <p className="muted small">Loading rankings…</p>}
      {typeof rows === 'string' && <p className="muted small">{rows}</p>}
      {Array.isArray(rows) && rows.length === 0 && <p className="muted small">Nobody never rank yet. Be the first! 🏁</p>}
      {Array.isArray(rows) && (
        <div className="list">
          {rows.map((r, i) => (
            <div key={r.user_id} className={`rank-row ${r.user_id === uid ? 'me' : ''}`}>
              <span className="rank-pos">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
              <span className="gist-avatar" style={{ width: 30, height: 30, background: r.shirt, fontSize: 13 }}>{r.name.slice(0, 1).toUpperCase()}</span>
              <span className="rank-name">{r.name}{r.user_id === uid ? ' (you)' : ''}<span className="muted small"> · Day {r.day}</span></span>
              <b>{m.fmt(r)}</b>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/** Asks which life to keep when the cloud has a newer one. */
export function CloudOffer() {
  const offer = useCloud((s) => s.offer);
  const day = useGame((s) => Math.floor(s.time / 1440) + 1);
  if (!offer) return null;
  return (
    <div className="event-backdrop">
      <div className="event card">
        <div className="event-emoji">☁️</div>
        <div className="event-title">Cloud save found</div>
        <p className="event-text">Your online save dey for Day {offer.day}. This phone dey Day {day}. Which one you wan continue?</p>
        <button className="primary" onClick={() => acceptOffer(true)}>Load Day {offer.day} from cloud</button>
        <button className="ghost" onClick={() => acceptOffer(false)}>Keep this phone (Day {day})</button>
      </div>
    </div>
  );
}
