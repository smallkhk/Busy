import { useShallow } from 'zustand/react/shallow';
import { JOBS, PHONE_ACTIVITIES, type Activity } from '../content/activities';
import { clockParts, formatClock, formatNaira } from '../engine/clock';
import { NEED_META } from '../engine/needs';
import { blockReason, useGame, type PhoneApp } from '../store/game';

const APPS: { id: PhoneApp; name: string; emoji: string; color: string }[] = [
  { id: 'bank', name: 'Bank', emoji: '🏦', color: '#1f7a5a' },
  { id: 'jobs', name: 'Jobs', emoji: '💼', color: '#c27c1a' },
  { id: 'chat', name: 'Chat', emoji: '💬', color: '#2f7fd6' },
  { id: 'map', name: 'Map', emoji: '🗺️', color: '#6a4bc4' },
  { id: 'gram', name: 'AbujaGram', emoji: '📸', color: '#d6406f' },
];

const PLACES = [
  { name: 'Kubwa (your self-con)', emoji: '🏠', open: true },
  { name: 'Wuse Market', emoji: '🛍️', open: false },
  { name: 'Jabi Lake Mall', emoji: '🌊', open: false },
  { name: 'Wuse 2 lounge', emoji: '🍸', open: false },
  { name: 'Federal Secretariat', emoji: '🏛️', open: false },
  { name: 'Maitama', emoji: '💎', open: false },
];

function ActivityList({ items }: { items: Activity[] }) {
  const choose = useGame((s) => s.choose);
  const state = useGame(useShallow((s) => ({ time: s.time, money: s.money, power: s.power, active: s.active })));
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
                {reason ?? [
                  a.minutes >= 60 ? `${a.minutes / 60}h` : `${a.minutes}m`,
                  a.pay ? `Pay ${formatNaira(a.pay)}` : a.cost ? formatNaira(a.cost) : '',
                  ...Object.entries(a.gains).map(([k, v]) => `${v! > 0 ? '+' : ''}${v} ${NEED_META[k as keyof typeof NEED_META].emoji}`),
                ].filter(Boolean).join(' · ')}
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
  const txns = useGame((s) => s.txns);
  return (
    <>
      <div className="balance">
        <div className="muted small">Available balance</div>
        <div className="balance-amt">{formatNaira(money)}</div>
        <div className="muted small">🏠 Rent paid till Day 365 · ₦850,000/yr</div>
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
      return (
        <div className="list">
          {PLACES.map((p) => (
            <div key={p.name} className={`place ${p.open ? '' : 'locked'}`}>
              <span>{p.emoji} {p.name}</span>
              <span className="small">{p.open ? '📍 You dey here' : '🔒 Coming soon'}</span>
            </div>
          ))}
        </div>
      );
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
