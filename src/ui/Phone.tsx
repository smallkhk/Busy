import { useShallow } from 'zustand/react/shallow';
import { JOBS, PHONE_ACTIVITIES, type Activity } from '../content/activities';
import { clockParts, formatClock, formatNaira } from '../engine/clock';
import { CALL_COST, CONTACTS, GIFT_COST, longLeg } from '../content/contacts';
import { BRAND_COOLDOWN_DAYS, BRAND_MIN_FOLLOWERS, brandPay, GAP_DANGER, POST_COOLDOWN_MIN, POSTS, realWealth } from '../content/gram';
import { AREAS, moveCost, rentOwed, type AreaId } from '../content/housing';
import { blockReason, useGame, type PhoneApp } from '../store/game';
import { activityDetail } from './detail';

const APPS: { id: PhoneApp; name: string; emoji: string; color: string }[] = [
  { id: 'bank', name: 'Bank', emoji: '🏦', color: '#1f7a5a' },
  { id: 'jobs', name: 'Jobs', emoji: '💼', color: '#c27c1a' },
  { id: 'chat', name: 'Chat', emoji: '💬', color: '#2f7fd6' },
  { id: 'map', name: 'Map', emoji: '🗺️', color: '#6a4bc4' },
  { id: 'gram', name: 'AbujaGram', emoji: '📸', color: '#d6406f' },
  { id: 'house', name: 'Rent', emoji: '🏠', color: '#8c5a2b' },
  { id: 'contacts', name: 'Long Leg', emoji: '🦵', color: '#b8860b' },
];

const PLACES = [
  { place: 'home', name: 'Your area', emoji: '🏠', open: true, note: 'Bus/taxi from any motor park' },
  { place: 'wuse', name: 'Wuse Market', emoji: '🛍️', open: true, note: 'Bus ₦700 · 1h' },
  { place: 'jabi', name: 'Jabi Lake Mall', emoji: '🌊', open: true, note: 'Taxi ₦3,500 · 45m' },
  { place: 'secretariat', name: 'Federal Secretariat', emoji: '🏛️', open: true, note: 'Bus ₦900 · 1h 15m' },
  { place: '', name: 'Wuse 2 lounge', emoji: '🍸', open: false, note: '' },
  { place: '', name: 'Maitama', emoji: '💎', open: false, note: '' },
];

function ActivityList({ items }: { items: Activity[] }) {
  const choose = useGame((s) => s.choose);
  const state = useGame(useShallow((s) => ({ time: s.time, money: s.money, power: s.power, active: s.active, packaging: s.packaging, pantry: s.pantry, cv: s.cv, area: s.area, rentLocked: s.rentLocked, unlocks: s.unlocks })));
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
  const area = useGame((s) => s.area);
  const rentDueDay = useGame((s) => s.rentDueDay);
  const txns = useGame((s) => s.txns);
  return (
    <>
      <div className="balance">
        <div className="muted small">Available balance</div>
        <div className="balance-amt">{formatNaira(money)}</div>
        <div className="muted small">🏠 {AREAS[area].home} · rent due Day {rentDueDay}</div>
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

function HouseApp() {
  const area = useGame((s) => s.area);
  const rentDueDay = useGame((s) => s.rentDueDay);
  const locked = useGame((s) => s.rentLocked);
  const money = useGame((s) => s.money);
  const day = useGame((s) => clockParts(s.time).day);
  const payRent = useGame((s) => s.payRent);
  const moveTo = useGame((s) => s.moveTo);
  const home = AREAS[area];
  const left = rentDueDay - day;
  const owed = rentOwed(area, day, rentDueDay);
  const status = locked
    ? '🔒 Landlord don lock your door!'
    : left < 0
      ? `⚠️ Rent don pass due by ${-left} day${left < -1 ? 's' : ''} (+10% penalty)`
      : left === 0
        ? '⚠️ Rent due today'
        : `Next rent: Day ${rentDueDay} (${left} day${left > 1 ? 's' : ''})`;
  return (
    <>
      <div className={`balance ${locked || left < 0 ? 'overdue' : ''}`}>
        <div className="muted small">You dey stay</div>
        <div className="balance-amt" style={{ fontSize: 22 }}>{home.emoji} {home.home}</div>
        <div className="small">{status}</div>
        <button className="primary" style={{ marginTop: 10, width: '100%' }} disabled={left > 10 || owed > money} onClick={payRent}>
          {left > 10 ? `Rent ${formatNaira(home.rent)} / 30 days` : `Pay rent ${formatNaira(owed)}`}
        </button>
      </div>
      <p className="muted small">Move house: you go pay 2 months upfront + 10% agent fee. Better area = more 👔 and shorter road.</p>
      <div className="list">
        {(Object.keys(AREAS) as AreaId[]).filter((id) => id !== area).map((id) => {
          const a = AREAS[id];
          const cost = moveCost(id);
          return (
            <button key={id} className="action" disabled={cost > money || locked || left < 0} onClick={() => moveTo(id)}>
              <span className="action-emoji">{a.emoji}</span>
              <span className="action-body">
                <span>{a.home}</span>
                <span className="muted small">{a.blurb}</span>
                <span className="muted small">
                  {formatNaira(a.rent)}/30 days · 👔{a.packaging >= home.packaging ? '+' : ''}{a.packaging - home.packaging} · road {Math.round(a.commute * 100)}% · Move: {formatNaira(cost)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function ContactsApp() {
  const contacts = useGame((s) => s.contacts);
  const money = useGame((s) => s.money);
  const day = useGame((s) => clockParts(s.time).day);
  const call = useGame((s) => s.callContact);
  const gift = useGame((s) => s.giftContact);
  const favour = useGame((s) => s.askFavour);
  const score = longLeg(contacts);
  return (
    <>
      <div className="balance">
        <div className="muted small">Your Long Leg</div>
        <div className="balance-amt">🦵 {score}</div>
        <div className="bar" style={{ marginTop: 6 }}>
          <div className="fill good" style={{ width: `${score}%` }} />
        </div>
        <div className="muted small" style={{ marginTop: 6 }}>Who you know for Abuja. Call people, dash them gift, then ask for favour.</div>
      </div>
      <div className="list">
        {CONTACTS.map((c) => {
          const cs = contacts[c.id];
          if (!cs) {
            return (
              <div key={c.id} className="contact locked">
                <span className="contact-emoji">❔</span>
                <span className="action-body">
                  <span>Unknown {'⭐'.repeat(c.influence)}</span>
                  <span className="muted small">Hint: {c.where}</span>
                </span>
              </div>
            );
          }
          const f = c.favour;
          const coolingDays = cs.lastFavourDay !== undefined ? f.cooldownDays - (day - cs.lastFavourDay) : 0;
          return (
            <div key={c.id} className="contact">
              <div className="contact-head">
                <span className="contact-emoji">{c.emoji}</span>
                <span className="action-body">
                  <span>{c.name} <span className="small">{'⭐'.repeat(c.influence)}</span></span>
                  <span className="muted small">{c.role}</span>
                </span>
              </div>
              <div className="bar thin">
                <div className={`fill ${cs.rel >= f.minRel ? 'good' : 'mid'}`} style={{ width: `${cs.rel}%` }} />
              </div>
              <div className="contact-actions">
                <button className="ghost" disabled={cs.lastCallDay === day || money < CALL_COST} onClick={() => call(c.id)}>📞 Call</button>
                <button className="ghost" disabled={money < GIFT_COST} onClick={() => gift(c.id)}>🎁 ₦5k</button>
                <button className="ghost" disabled={cs.rel < f.minRel || coolingDays > 0} onClick={() => favour(c.id)}>
                  🙏 {cs.rel < f.minRel ? `Need ${f.minRel}` : coolingDays > 0 ? `${coolingDays}d` : 'Favour'}
                </button>
              </div>
              <div className="muted small">Favour: {f.label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function GramApp() {
  const name = useGame((s) => s.name);
  const followers = useGame((s) => s.followers);
  const packaging = useGame((s) => s.packaging);
  const money = useGame((s) => s.money);
  const area = useGame((s) => s.area);
  const place = useGame((s) => s.place);
  const time = useGame((s) => s.time);
  const lastPostAt = useGame((s) => s.lastPostAt);
  const lastBrandDay = useGame((s) => s.lastBrandDay);
  const posts = useGame((s) => s.posts);
  const post = useGame((s) => s.post);
  const brandDeal = useGame((s) => s.brandDeal);
  const real = realWealth(money, area);
  const gap = Math.round(packaging - real);
  const wait = Math.ceil((POST_COOLDOWN_MIN - (time - lastPostAt)) / 60);
  const day = clockParts(time).day;
  const brandReady = followers >= BRAND_MIN_FOLLOWERS && day - lastBrandDay >= BRAND_COOLDOWN_DAYS;
  return (
    <>
      <div className="gram-profile">
        <div className="gram-avatar">{name.slice(0, 1).toUpperCase()}</div>
        <div>
          <div className="gram-handle">@{name.toLowerCase().replace(/\s+/g, '')}_abuja</div>
          <div><b>{followers.toLocaleString('en-NG')}</b> <span className="muted small">followers</span></div>
        </div>
      </div>
      <div className="gap-card">
        <div className="gap-row"><span className="small">👔 Packaging</span><div className="bar thin"><div className="fill good" style={{ width: `${packaging}%` }} /></div><span className="small">{Math.round(packaging)}</span></div>
        <div className="gap-row"><span className="small">💰 Real life</span><div className="bar thin"><div className="fill mid" style={{ width: `${real}%` }} /></div><span className="small">{real}</span></div>
        <div className={`small ${gap > GAP_DANGER ? 'danger-text' : 'muted'}`}>
          {gap > GAP_DANGER ? `⚠️ Fake life alert! You dey form pass your pocket by ${gap}. Exposure fit happen 💀` : gap > 10 ? 'You dey form small. E never reach wahala.' : 'You dey keep am real 👌'}
        </div>
      </div>
      <div className="list">
        {POSTS.map((p) => {
          const where = p.where && !p.where.includes(place);
          const reason = wait > 0 ? `Post again in ${wait}h` : where ? 'Go the place first' : p.cost > money ? `Need ${formatNaira(p.cost)}` : null;
          return (
            <button key={p.id} className="action" disabled={!!reason} onClick={() => post(p.id)}>
              <span className="action-emoji">{p.emoji}</span>
              <span className="action-body">
                <span>{p.label}{p.fake ? ' 🤫' : ''}</span>
                <span className="muted small">{reason ?? `${formatNaira(p.cost)} · ~${p.baseFollowers}+ followers${p.packaging ? ` · +${p.packaging} 👔` : ''}`}</span>
              </span>
            </button>
          );
        })}
        <button className="action" disabled={!brandReady} onClick={brandDeal}>
          <span className="action-emoji">💼</span>
          <span className="action-body">
            <span>Brand deal</span>
            <span className="muted small">
              {followers < BRAND_MIN_FOLLOWERS ? `Unlock at ${BRAND_MIN_FOLLOWERS} followers` : brandReady ? `Promote a jollof spot: ${formatNaira(brandPay(followers))}` : 'No DM yet. Check back later'}
            </span>
          </span>
        </button>
      </div>
      {posts.length > 0 && (
        <div className="feed">
          {posts.map((p) => (
            <div key={p.at} className="feed-post">
              <span className="feed-pic">{p.emoji}</span>
              <span className="small">{p.caption}<br /><span className="muted">+{p.gain} followers · Day {clockParts(p.at).day}</span></span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function MapApp() {
  const place = useGame((s) => s.place);
  const area = useGame((s) => s.area);
  const here = place === 'street' ? 'home' : place;
  return (
    <>
      <p className="muted small">Go any bus stop or motor park to travel. Rush hour (7–9am, 5–7pm) go make the trip long 🚗</p>
      <div className="list">
        {PLACES.map((p) => (
          <div key={p.name} className={`place ${p.open ? '' : 'locked'}`}>
            <span>{p.emoji} {p.place === 'home' ? `${AREAS[area].name} (your area)` : p.name}</span>
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
    case 'contacts':
      return <ContactsApp />;
    case 'house':
      return <HouseApp />;
    case 'gram':
      return <GramApp />;
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
