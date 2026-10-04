import { useShallow } from 'zustand/react/shallow';
import { JOBS, PHONE_ACTIVITIES, type Activity } from '../content/activities';
import { clockParts, formatClock, formatNaira } from '../engine/clock';
import { blockReason, useGame, type PhoneApp } from '../store/game';
import { activityDetail } from './detail';

const APPS: { id: PhoneApp; name: string; emoji: string; color: string }[] = [
  { id: 'bank', name: 'Bank', emoji: '🏦', color: '#1f7a5a' },
  { id: 'jobs', name: 'Jobs', emoji: '💼', color: '#c27c1a' },
  { id: 'chat', name: 'Chat', emoji: '💬', color: '#2f7fd6' },
  { id: 'map', name: 'Map', emoji: '🗺️', color: '#6a4bc4' },
  { id: 'gram', name: 'AbujaGram', emoji: '📸', color: '#d6406f' },
];

const PLACES = [
  { place: 'home', name: 'Kubwa (your area)', emoji: '🏠', open: true, note: 'Bus stop for Kubwa street' },
  { place: 'wuse', name: 'Wuse Market', emoji: '🛍️', open: true, note: 'Bus ₦700 · 1h' },
  { place: 'jabi', name: 'Jabi Lake Mall', emoji: '🌊', open: true, note: 'Taxi ₦3,500 · 45m' },
  { place: 'secretariat', name: 'Federal Secretariat', emoji: '🏛️', open: true, note: 'Bus ₦900 · 1h 15m' },
  { place: '', name: 'Wuse 2 lounge', emoji: '🍸', open: false, note: '' },
  { place: '', name: 'Maitama', emoji: '💎', open: false, note: '' },
];

function ActivityList({ items }: { items: Activity[] }) {
  const choose = useGame((s) => s.choose);
  const state = useGame(useShallow((s) => ({ time: s.time, money: s.money, power: s.power, active: s.active, packaging: s.packaging, pantry: s.pantry, cv: s.cv })));
  return (
    <div className="list">
      {items.map((a) => {
        const reason = blockReason(a, state);
        return (
          <button key={a.id} className="action" disabled={!!reason} onClick={() => choose(a.id)}>
            <span className="action-emoji">{a.emoji}</span>
            <span className="action-body">
              <span>{a.label}</span>
              <span className="muted small">
                {reason ?? activityDetail(a, state)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Bank() {
  const money = useGame((s) => s.money);
  const pantry = useGame((s) => s.pantry);
  const packaging = useGame((s) => s.packaging);
  const cv = useGame((s) => s.cv);
  const txns = useGame((s) => s.txns);
  return (
    <>
      <div className="balance">
        <div className="muted small">Available balance</div>
        <div className="balance-amt">{formatNaira(money)}</div>
        <div className="muted small">🏠 Rent paid till Day 365 · ₦850,000/yr</div>
        <div className="muted small">🧺 Foodstuff: {pantry} meals · 👔 Packaging: {Math.round(packaging)} · 📄 CVs: {Math.min(cv, 3)}/3</div>
      </div>
      <div className="list">
        {txns.slice(0, 12).map((t, i) => (
          <div key={i} className="txn">
            <span>
              {t.label}
              <span className="muted small"> · Day {clockParts(t.at).day}, {formatClock(t.at)}</span>
            </span>
            <span className={t.amount >= 0 ? 'pos' : 'neg'}>
              {t.amount >= 0 ? '+' : '−'}{formatNaira(Math.abs(t.amount))}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function MapApp() {
  const place = useGame((s) => s.place);
  const here = place === 'street' ? 'home' : place;
  return (
    <>
      <p className="muted small">Go any bus stop or motor park to travel. Rush hour (7–9am, 5–7pm) go make the trip long 🚗</p>
      <div className="list">
        {PLACES.map((p) => (
          <div key={p.name} className={`place ${p.open ? '' : 'locked'}`}>
            <span>{p.emoji} {p.name}</span>
            <span className="small">{!p.open ? '🔒 Coming soon' : p.place === here ? '📍 You dey here' : p.note}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function AppBody({ app }: { app: PhoneApp }) {
  switch (app) {
    case 'bank':
      return <Bank />;
    case 'jobs':
      return (
        <>
          <p className="muted small">Small small jobs for now. Build your Long Leg 🦵 to unlock better ones.</p>
          <ActivityList items={JOBS} />
        </>
      );
    case 'chat':
      return <ActivityList items={PHONE_ACTIVITIES} />;
    case 'map':
      return <MapApp />;
    case 'gram':
      return (
        <div className="empty">
          <div style={{ fontSize: 42 }}>📸👔</div>
          <p>AbujaGram dey come soon.</p>
          <p className="muted small">Packaging go matter for here. Na who look rich dey get invite 😏</p>
        </div>
      );
    default:
      return null;
  }
}

export function Phone() {
  const phone = useGame((s) => s.phone);
  const openPhone = useGame((s) => s.openPhone);
  const time = useGame((s) => Math.floor(s.time));
  if (!phone) return null;
  const current = APPS.find((a) => a.id === phone);
  return (
    <div className="sheet-backdrop" onPointerDown={() => openPhone(null)}>
      <div className="phone" onPointerDown={(e) => e.stopPropagation()}>
        <div className="phone-status">
          <span>{formatClock(time)}</span>
          <span>MTN 4G ▮▮▮</span>
        </div>
        {phone === 'home' ? (
          <div className="app-grid">
            {APPS.map((a) => (
              <button key={a.id} className="app-icon" onClick={() => openPhone(a.id)}>
                <span className="app-tile" style={{ background: a.color }}>{a.emoji}</span>
                <span className="small">{a.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="app">
            <div className="app-head">
              <button className="ghost" onClick={() => openPhone('home')}>‹ Back</button>
              <span>{current?.emoji} {current?.name}</span>
              <span />
            </div>
            <div className="app-body">
              <AppBody app={phone} />
            </div>
          </div>
        )}
        <button className="home-bar" onClick={() => openPhone(null)} aria-label="Close phone" />
      </div>
    </div>
  );
}
