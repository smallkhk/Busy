import { canRun, MOVES, moveSupport, NO_POLITICS, OFFICES } from '../content/politics';
import { CLASS_ACTIVITIES, COURSES, fitnessLevel, GYM_FEE, GYM_DAYS, GYM_WORKOUT } from '../content/learning';
import { festivalOn, nextFestival } from '../content/festivals';
import { areaAllows, HOME_ITEMS } from '../content/homeup';
import { newsById, WEATHER } from '../content/world';
import { useShallow } from 'zustand/react/shallow';
import { JOBS, PHONE_ACTIVITIES, type Activity } from '../content/activities';
import { clockParts, formatClock, formatNaira } from '../engine/clock';
import { CALL_COST, CONTACTS, GIFT_COST, longLeg } from '../content/contacts';
import { BRAND_COOLDOWN_DAYS, BRAND_MIN_FOLLOWERS, brandPay, GAP_DANGER, POST_COOLDOWN_MIN, POSTS, realWealth } from '../content/gram';
import { AREAS, moveCost, PROPERTY_SELL_FEE, propertyValue, RENT_AREAS, rentOwed, type AreaId } from '../content/housing';
import { CHOP_ITEMS, HEADLINES, ridesFrom } from '../content/phoneapps';
import { blockReason, ridePlace, useGame, type PhoneApp } from '../store/game';
import { activityDetail } from './detail';
import { EgoBank } from './EgoBank';
import { BusinessApp, CareerCard } from './Career';
import { GistApp } from './GistApp';
import { LoveApp } from './LoveApp';
import { AccountApp, RankingsApp } from './CloudApps';
import { AdminApp } from './AdminApp';
import { useAdmin } from '../net/admin';
import { GoalsApp } from './Goals';
import { totalUnread, useSocial } from '../net/social';
import { MapView } from './MapView';

const APPS: { id: PhoneApp; name: string; emoji: string; color: string }[] = [
  // Everyday
  { id: 'bank', name: 'Ego Bank', emoji: '💜', color: '#4b1f86' },
  { id: 'gist', name: 'GistApp', emoji: '💬', color: '#1fa855' },
  { id: 'map', name: 'Map', emoji: '🗺️', color: '#6a4bc4' },
  { id: 'ride', name: 'Ride', emoji: '🚘', color: '#1f8a4c' },
  // Money and growth
  { id: 'jobs', name: 'Jobs', emoji: '💼', color: '#c27c1a' },
  { id: 'biz', name: 'Business', emoji: '🏪', color: '#0e7c86' },
  { id: 'learn', name: 'Learn & Gym', emoji: '📚', color: '#2f6b4a' },
  { id: 'politics', name: 'Politics', emoji: '🗳️', color: '#118a4c' },
  // Living
  { id: 'chop', name: 'ChopNow', emoji: '🛵', color: '#e8692c' },
  { id: 'house', name: 'Home & Rent', emoji: '🏠', color: '#8c5a2b' },
  { id: 'cars', name: 'Cars', emoji: '🚗', color: '#a8322d' },
  { id: 'style', name: 'Drip', emoji: '👗', color: '#b0408f' },
  // People
  { id: 'love', name: 'Abuja Love', emoji: '💕', color: '#e8336d' },
  { id: 'gram', name: 'AbujaGram', emoji: '📸', color: '#d6406f' },
  { id: 'contacts', name: 'Long Leg', emoji: '🦵', color: '#b8860b' },
  { id: 'chat', name: 'Calls', emoji: '📞', color: '#2f7fd6' },
  // Info
  { id: 'news', name: 'News', emoji: '📰', color: '#34495e' },
  { id: 'goals', name: 'Goals', emoji: '🎯', color: '#9a7b1c' },
  { id: 'rankings', name: 'Rankings', emoji: '🏆', color: '#c9a24a' },
  { id: 'account', name: 'Account', emoji: '⚙️', color: '#5f6670' },
  { id: 'admin', name: 'Admin', emoji: '🛡️', color: '#7a1f2b' },
];


function ActivityList({ items }: { items: Activity[] }) {
  const choose = useGame((s) => s.choose);
  const state = useGame(useShallow((s) => ({ time: s.time, money: s.money, power: s.power, active: s.active, packaging: s.packaging, pantry: s.pantry, cv: s.cv, area: s.area, rentLocked: s.rentLocked, unlocks: s.unlocks, grade: s.grade, hasCar: !!s.car, carId: s.car?.id, carFuel: s.car?.fuel, sick: s.sick, contacts: s.contacts, weather: s.weather, news: s.news, homeUps: s.homeUps, courses: s.courses, skills: s.skills, gymUntil: s.gymUntil })));
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

function NewsApp() {
  const day = useGame((s) => clockParts(s.time).day);
  const pantry = useGame((s) => s.pantry);
  const packaging = useGame((s) => s.packaging);
  const cv = useGame((s) => s.cv);
  const area = useGame((s) => s.area);
  const rentDueDay = useGame((s) => s.rentDueDay);
  const followers = useGame((s) => s.followers);
  const news = useGame((s) => s.news);
  const weather = useGame((s) => s.weather ?? 'sunny');
  const breaking = (news ?? []).filter((n) => n.until >= day).map((n) => ({ n, info: newsById(n.id) })).filter((x) => x.info);
  // A different set of headlines every day
  const headlines = HEADLINES.map((h, i) => ({ h, k: (i * 7 + day * 13) % HEADLINES.length })).sort((a, b) => a.k - b.k).slice(0, 5);
  return (
    <>
      <div className="balance">
        <div className="muted small">Your life today · Day {day}</div>
        <div className="small">🏠 {AREAS[area].home} · rent due Day {rentDueDay}</div>
        <div className="small">🧺 Foodstuff: {pantry} meals · 📄 CVs: {Math.min(cv, 3)}/3</div>
        <div className="small">👔 Packaging: {Math.round(packaging)} · 📸 {followers.toLocaleString('en-NG')} followers</div>
      </div>
      <FestivalLine day={day} />
      <div className="news-weather">{WEATHER[weather].emoji} Abuja weather now: <b>{WEATHER[weather].name}</b>{WEATHER[weather].trip > 1 ? ` · road trips ${Math.round((WEATHER[weather].trip - 1) * 100)}% slower` : ''}</div>
      <div className="list">
        {breaking.map(({ n, info }) => (
          <div key={n.id} className="news-item breaking">
            <span className="breaking-tag">BREAKING</span> {info!.headline}
            <div className="small">{info!.detail} · till Day {n.until}</div>
          </div>
        ))}
        {headlines.map(({ h }) => (
          <div key={h} className="news-item">{h}</div>
        ))}
      </div>
    </>
  );
}

function RideApp() {
  const place = useGame(ridePlace);
  return (
    <>
      <p className="muted small">Ride go carry you from your door. E cost pass bus, but e fast and you no go waka go bus stop 🚘</p>
      <ActivityList items={ridesFrom(place)} />
    </>
  );
}

function FestivalLine({ day }: { day: number }) {
  const today = festivalOn(day);
  const next = nextFestival(day);
  return (
    <div className="news-weather">
      {today ? <>{today.emoji} Today: <b>{today.name}</b>. {today.greeting}</> : <>📅 Next: {next.festival.emoji} <b>{next.festival.name}</b> in {next.inDays} day{next.inDays > 1 ? 's' : ''}</>}
    </div>
  );
}

function LearnApp() {
  const courses = useGame((s) => s.courses ?? {});
  const skills = useGame((s) => s.skills ?? []);
  const fitness = useGame((s) => s.fitness ?? 0);
  const gymUntil = useGame((s) => s.gymUntil ?? 0);
  const money = useGame((s) => s.money);
  const day = useGame((s) => clockParts(s.time).day);
  const g = useGame.getState();
  const lvl = fitnessLevel(fitness);
  return (
    <>
      <div className="balance">
        <div className="muted small">💪🏾 Fitness · {lvl.emoji} {lvl.name}</div>
        <div className="bar thin"><div className="fill good" style={{ width: `${fitness}%` }} /></div>
        <div className="muted small">{Math.round(fitness)}/100 · fit people get tired slower at work and fall sick less. Drops small every day.</div>
        {day <= gymUntil ? (
          <div className="small" style={{ marginTop: 6 }}>🏋🏾 Gym membership till Day {gymUntil}</div>
        ) : (
          <button className="primary" style={{ marginTop: 8, width: '100%' }} disabled={money < GYM_FEE} onClick={g.joinGym}>🏋🏾 Join gym · {formatNaira(GYM_FEE)} / {GYM_DAYS} days</button>
        )}
      </div>
      <ActivityList items={[GYM_WORKOUT]} />
      <div className="love-section">📚 Courses & skills</div>
      <div className="list">
        {COURSES.map((c) => {
          const done = courses[c.id];
          const grad = skills.includes(c.id);
          return (
            <div key={c.id} className={`contact ${grad ? 'owned' : ''}`}>
              <div className="contact-head">
                <span className="contact-emoji">{c.emoji}</span>
                <span className="action-body">
                  <span>{c.name}{grad ? ' 🎓' : ''}</span>
                  <span className="muted small">{c.where} · {c.classes} classes</span>
                  <span className="small">Unlocks: {c.unlocks}</span>
                </span>
              </div>
              {done !== undefined && !grad && (
                <div className="bar thin"><div className="fill good" style={{ width: `${(done / c.classes) * 100}%` }} /></div>
              )}
              {grad ? (
                <div className="muted small">✅ Graduated. Check 💼 Jobs for your new work</div>
              ) : done === undefined ? (
                <button className="ghost" disabled={money < c.fee} onClick={() => g.enroll(c.id)}>📝 Enroll · {formatNaira(c.fee)}</button>
              ) : (
                <ActivityList items={CLASS_ACTIVITIES.filter((a) => a.id === `class-${c.id}`)} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function PoliticsApp() {
  const p = useGame((s) => s.politics ?? NO_POLITICS);
  const money = useGame((s) => s.money);
  const packaging = useGame((s) => s.packaging);
  const contacts = useGame((s) => s.contacts);
  const day = useGame((s) => clockParts(s.time).day);
  const adOn = useGame((s) => Date.now() < (s.adBoostUntil ?? 0));
  const g = useGame.getState();
  const leg = longLeg(contacts);
  const current = p.office >= 0 ? OFFICES[p.office] : undefined;
  const c = p.campaign;
  return (
    <>
      <div className="balance">
        <div className="muted small">🗳️ Your political career</div>
        <div className="balance-amt" style={{ fontSize: 20 }}>{current ? `${current.emoji} ${current.name}` : 'Ordinary citizen'}</div>
        {current && <div className="small">Allowance {formatNaira(current.allowance)}/day · term ends Day {p.termEnds}</div>}
        <div className="muted small">🦵 Long Leg {leg} · 👔 Packaging {Math.round(packaging)}</div>
      </div>
      {c && (
        <div className="balance">
          <div className="muted small">Campaign for {OFFICES[c.target].name} · election Day {c.electionDay} ({Math.max(0, c.electionDay - day)} day{c.electionDay - day === 1 ? '' : 's'})</div>
          <div className="balance-amt" style={{ fontSize: 22 }}>{c.support}% support</div>
          <div className="bar thin"><div className={`fill ${c.support > 55 ? 'good' : c.support > 45 ? 'mid' : 'bad'}`} style={{ width: `${c.support}%` }} /></div>
          <div className="muted small">You need more than 50% (with small luck) to win.{adOn ? ' 📢 Your billboard dey add +2% every day.' : ' Tip: rent billboard for the Map make +2% every day.'}</div>
        </div>
      )}
      {c && (
        <div className="list">
          {MOVES.map((m) => {
            const cost = m.cost(c.target);
            const doneToday = c.done[m.id] === day;
            return (
              <button key={m.id} className="action" disabled={doneToday || money < cost} onClick={() => g.campaign(m.id)}>
                <span className="action-emoji">{m.emoji}</span>
                <span className="action-body">
                  <span>{m.label}</span>
                  <span className="muted small">{doneToday ? 'Done today' : `${cost ? formatNaira(cost) : 'Free'} · ${Math.round(m.minutes / 60)}h · +${moveSupport(m.id, { packaging, longLeg: leg })}%`} · {m.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div className="love-section">🏛️ Offices</div>
      <div className="list">
        {OFFICES.map((o, i) => {
          const reason = canRun(i, p, { longLeg: leg, packaging, money });
          const held = p.office === i;
          return (
            <div key={o.name} className={`contact ${held ? 'owned' : ''}`}>
              <div className="contact-head">
                <span className="contact-emoji">{o.emoji}</span>
                <span className="action-body">
                  <span>{o.name}{held ? ' ✅' : ''}</span>
                  <span className="muted small">Needs 🦵 {o.longLeg} · 👔 {o.packaging} · {o.appointed ? 'appointed by the President' : `form ${formatNaira(o.form)}`}</span>
                  <span className="small">Allowance {formatNaira(o.allowance)}/day</span>
                </span>
              </div>
              {(i === p.office + 1 || (i === p.office && !c)) && (
                <button className="ghost" disabled={!!reason} onClick={() => g.declare(i)}>
                  {reason ?? (o.appointed ? `🙏🏾 Lobby the President · ${formatNaira(o.form)}` : `🗳️ ${held ? 'Run for re-election' : 'Declare'} · ${formatNaira(o.form)}`)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function HomeShop() {
  const ups = useGame((s) => s.homeUps ?? []);
  const area = useGame((s) => s.area);
  const money = useGame((s) => s.money);
  const buy = useGame((s) => s.buyHomeItem);
  return (
    <>
      <div className="love-section">🛋️ Upgrade your house ({ups.length}/{HOME_ITEMS.length})</div>
      <div className="list">
        {HOME_ITEMS.map((i) => {
          const owned = ups.includes(i.id);
          const allowed = areaAllows(area, i);
          return (
            <button key={i.id} className={`action ${owned ? 'owned' : ''}`} disabled={owned || !allowed || money < i.cost} onClick={() => buy(i.id)}>
              <span className="action-emoji">{i.emoji}</span>
              <span className="action-body">
                <span>{i.name}{owned ? ' ✅' : ''}</span>
                <span className="muted small">{i.perk}</span>
                <span className="muted small">{owned ? 'E dey your house' : !allowed ? `Need ${AREAS[i.minArea].home} or better` : `${formatNaira(i.cost)} · 👔 +${i.packaging}`}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function PropertySection() {
  const properties = useGame((s) => s.properties ?? {});
  const area = useGame((s) => s.area);
  const money = useGame((s) => s.money);
  const day = useGame((s) => clockParts(s.time).day);
  const g = useGame.getState();
  const forSale = (Object.keys(AREAS) as AreaId[]).filter((id) => AREAS[id].own);
  return (
    <>
      <div className="love-section">🏡 Own your house</div>
      <div className="list">
        {forSale.map((id) => {
          const a = AREAS[id];
          const own = a.own!;
          const p = properties[id];
          const value = p ? propertyValue(p, day) : 0;
          return (
            <div key={id} className={`contact ${p ? 'owned' : ''}`}>
              <div className="contact-head">
                <span className="contact-emoji">{a.emoji}</span>
                <span className="action-body">
                  <span>{a.home}</span>
                  <span className="muted small">{a.blurb}</span>
                  <span className="small">
                    {!p
                      ? own.land
                        ? `Land ${formatNaira(own.land)} + build ${formatNaira(own.build!)} (${own.buildDays} days)`
                        : `Price ${formatNaira(own.price!)}`
                      : p.status === 'land'
                        ? '📜 Land dey your name. Build when you ready'
                        : p.status === 'building'
                          ? `🏗️ Building… ready Day ${p.readyDay}`
                          : area === id
                            ? '🔑 You dey live here'
                            : p.rentedOut
                              ? `💰 Rented out · ${formatNaira(own.rentOut)}/day`
                              : '🏠 Empty. Move in or rent am out'}
                  </span>
                  {p && <span className="muted small">Worth about {formatNaira(value)} now · 👔 +{a.packaging} when you live there</span>}
                </span>
              </div>
              <div className="contact-actions">
                {!p && (
                  <button className="ghost" disabled={money < (own.land ?? own.price ?? 0)} onClick={() => g.buyProperty(id)}>
                    {own.land ? `📜 Buy land ${formatNaira(own.land)}` : `🔑 Buy ${formatNaira(own.price!)}`}
                  </button>
                )}
                {p?.status === 'land' && <button className="ghost" disabled={money < own.build!} onClick={() => g.buildHouse(id)}>🏗️ Build {formatNaira(own.build!)}</button>}
                {p?.status === 'built' && area !== id && <button className="ghost" onClick={() => g.toggleRentOut(id)}>{p.rentedOut ? '🚪 End tenancy' : `💰 Rent out`}</button>}
                {p && p.status !== 'building' && area !== id && (
                  <button className="ghost" onClick={() => confirm(`Sell for about ${formatNaira(Math.round(value * (1 - PROPERTY_SELL_FEE)))}?`) && g.sellProperty(id)}>🤝 Sell</button>
                )}
              </div>
            </div>
          );
        })}
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
  const properties = useGame((s) => s.properties);
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
        {home.own ? (
          <div className="small">🔑 Na your own house. No landlord, no rent 🙌🏾</div>
        ) : (
          <>
            <div className="small">{status}</div>
            <button className="primary" style={{ marginTop: 10, width: '100%' }} disabled={left > 10 || owed > money} onClick={payRent}>
              {left > 10 ? `Rent ${formatNaira(home.rent)} / 30 days` : `Pay rent ${formatNaira(owed)}`}
            </button>
          </>
        )}
      </div>
      <HomeShop />
      <PropertySection />
      <p className="muted small">Move house: you go pay 2 months upfront + 10% agent fee. Better area = more 👔 and shorter road.</p>
      <div className="list">
        {(Object.keys(AREAS) as AreaId[]).filter((id) => id !== area && (RENT_AREAS.includes(id) || properties?.[id]?.status === 'built')).map((id) => {
          const a = AREAS[id];
          const cost = moveCost(id);
          return (
            <button key={id} className="action" disabled={cost > money || locked || (!home.own && left < 0)} onClick={() => moveTo(id)}>
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

function AppBody({ app }: { app: PhoneApp }) {
  switch (app) {
    case 'bank':
      return <EgoBank />;
    case 'chop':
      return (
        <>
          <p className="muted small">Order food anywhere. Rider go find you 🛵</p>
          <ActivityList items={CHOP_ITEMS} />
        </>
      );
    case 'ride':
      return <RideApp />;
    case 'news':
      return <NewsApp />;
    case 'goals':
      return <GoalsApp />;
    case 'biz':
      return <BusinessApp />;
    case 'gist':
      return <GistApp />;
    case 'love':
      return <LoveApp />;
    case 'learn':
      return <LearnApp />;
    case 'politics':
      return <PoliticsApp />;
    case 'account':
      return <AccountApp />;
    case 'admin':
      return <AdminApp />;
    case 'rankings':
      return <RankingsApp />;
    case 'jobs':
      return (
        <>
          <CareerCard />
          <p className="muted small">Side hustle for your area:</p>
          <ActivityList items={JOBS} />
        </>
      );
    case 'chat':
      return <ActivityList items={PHONE_ACTIVITIES} />;
    case 'map':
      return <MapView />;
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
  const unread = useSocial(totalUnread);
  const isAdmin = useAdmin((s) => s.isAdmin);
  if (!phone || phone === 'map' || phone === 'cars' || phone === 'style') return null;
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
            {APPS.filter((a) => a.id !== 'admin' || isAdmin).map((a) => (
              <button key={a.id} className="app-icon" onClick={() => openPhone(a.id)}>
                <span className="app-tile" style={{ background: a.color }}>
                  {a.emoji}
                  {a.id === 'gist' && unread > 0 && <span className="app-badge">{unread}</span>}
                </span>
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
