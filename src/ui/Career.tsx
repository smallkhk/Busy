import { useState } from 'react';
import { badDayChance, BUSINESSES, dailyNet, MAX_BIZ_LEVEL, MAX_STAFF, profitMultiplier, TIER_NAMES, upgradeCost, wageOf, type Business, type BizTier } from '../content/business';
import { GRADES, promotionBlock } from '../content/career';
import { longLeg } from '../content/contacts';
import { clockParts, formatNaira } from '../engine/clock';
import { useGame } from '../store/game';

/** Civil service progress, shown on top of the Jobs app. */
export function CareerCard() {
  const cv = useGame((s) => s.cv);
  const grade = useGame((s) => s.grade);
  const shifts = useGame((s) => s.gradeShifts);
  const contacts = useGame((s) => s.contacts);
  const packaging = useGame((s) => s.packaging);
  const promote = useGame((s) => s.promote);
  if (cv < 3) {
    return (
      <div className="balance">
        <div className="muted small">🏛️ Government work</div>
        <div className="small">Submit CV for Federal Secretariat ({Math.min(cv, 3)}/3) to get contract staff work. Then you fit climb reach Director 📈</div>
      </div>
    );
  }
  const cur = GRADES[grade];
  const next = GRADES[grade + 1];
  const block = promotionBlock(grade, shifts, longLeg(contacts), packaging);
  return (
    <div className="balance">
      <div className="muted small">🏛️ Your civil service grade</div>
      <div className="balance-amt" style={{ fontSize: 20 }}>{cur.title}</div>
      <div className="small">{formatNaira(cur.pay)} per office shift (Secretariat, 8–10am resumption)</div>
      {next && (
        <>
          <div className="small" style={{ marginTop: 8 }}>Next: <b>{next.title}</b> · {formatNaira(next.pay)}/shift</div>
          <div className="bar thin"><div className="fill good" style={{ width: `${Math.min(100, (shifts / next.shifts) * 100)}%` }} /></div>
          <div className="muted small">{shifts}/{next.shifts} shifts · 🦵 {next.longLeg} · 👔 {next.packaging}</div>
        </>
      )}
      <button className="primary" style={{ marginTop: 10, width: '100%' }} disabled={!!block} onClick={promote}>
        {block ?? '📈 Apply for promotion'}
      </button>
    </div>
  );
}

export function BusinessApp() {
  const owned = useGame((s) => s.businesses);
  const money = useGame((s) => s.money);
  const contacts = useGame((s) => s.contacts);
  const packaging = useGame((s) => s.packaging);
  const day = useGame((s) => clockParts(s.time).day);
  const buy = useGame((s) => s.buyBusiness);
  const upgrade = useGame((s) => s.upgradeBusiness);
  const setStaff = useGame((s) => s.setStaff);
  const ll = longLeg(contacts);
  const [tier, setTier] = useState<BizTier>('small');
  const mine = BUSINESSES.filter((b) => owned[b.id]);
  const card = (b: Business) => {
    const o = owned[b.id];
    const staff = o?.staff ?? 0;
    const lo = dailyNet(b, { level: o?.level ?? 1, staff }, 0, false);
    const hi = dailyNet(b, { level: o?.level ?? 1, staff }, 1, false);
    const closed = o?.closedUntil !== undefined && day < o.closedUntil;
    const req = b.requires?.longLeg && ll < b.requires.longLeg ? `Need 🦵 ${b.requires.longLeg}` : b.requires?.packaging && packaging < b.requires.packaging ? `Need 👔 ${b.requires.packaging}` : null;
    return (
      <div key={b.id} className={`contact ${o ? 'owned' : ''}`}>
        <div className="contact-head">
          <span className="contact-emoji">{b.emoji}</span>
          <span className="action-body">
            <span>{b.name} {o && <span className="small">{'⭐'.repeat(o.level)}</span>}</span>
            <span className="muted small">{b.blurb}</span>
            <span className="small">{formatNaira(lo)}–{formatNaira(hi)} per day{o ? ' after wages' : ''}{closed ? ' · 🔒 closed by task force' : ''}</span>
          </span>
        </div>
        {o && (
          <div className="biz-staff">
            <span className="small">🧑🏾‍🍳 Extra staff: {staff}/{MAX_STAFF[b.tier]} · {formatNaira(wageOf(b))}/day each · bad-day risk {Math.round(badDayChance(staff) * 100)}%</span>
            <span className="biz-staff-btns">
              <button className="ghost" disabled={staff <= 0} onClick={() => setStaff(b.id, -1)} aria-label="Sack worker">−</button>
              <button className="ghost" disabled={staff >= MAX_STAFF[b.tier]} onClick={() => setStaff(b.id, 1)} aria-label="Hire worker">+</button>
            </span>
          </div>
        )}
        {!o ? (
          <button className="ghost" disabled={!!req || money < b.cost} onClick={() => buy(b.id)}>
            {req ?? `Start am · ${formatNaira(b.cost)}`}
          </button>
        ) : o.level < MAX_BIZ_LEVEL ? (
          <button className="ghost" disabled={money < upgradeCost(b, o.level)} onClick={() => upgrade(b.id)}>
            📈 Expand to level {o.level + 1} · {formatNaira(upgradeCost(b, o.level))} (×{profitMultiplier(o.level + 1).toFixed(1)} profit)
          </button>
        ) : (
          <div className="muted small">🏆 Max level</div>
        )}
      </div>
    );
  };
  return (
    <>
      <p className="muted small">Your business go pay you every morning, even when you dey sleep 😴💰. Hire staff to sell more and watch the shop, but wages no dey wait. Bad days happen: theft, NEPA, slow market.</p>
      {mine.length > 0 && (
        <>
          <div className="love-section">Your businesses</div>
          <div className="list">{mine.map(card)}</div>
        </>
      )}
      <div className="love-tabs">
        {(Object.keys(TIER_NAMES) as BizTier[]).map((t) => (
          <button key={t} className={tier === t ? 'on' : ''} onClick={() => setTier(t)}>{TIER_NAMES[t]}</button>
        ))}
      </div>
      <div className="list">{BUSINESSES.filter((b) => b.tier === tier && !owned[b.id]).map(card)}</div>
    </>
  );
}
