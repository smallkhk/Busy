import { useState } from 'react';
import { ASK_OUT_AT, DATE_TIERS, MATCHES, matchById, officialPartner, PROPOSE_AFTER_DAYS, RING_COST, STAGE_NAMES, stageOf, WEDDING_COST } from '../content/dating';
import { clockParts, formatNaira } from '../engine/clock';
import { useGame } from '../store/game';

function Profile({ id }: { id: string }) {
  const m = matchById(id)!;
  const l = useGame((s) => s.loves?.[id]);
  const money = useGame((s) => s.money);
  const day = useGame((s) => clockParts(s.time).day);
  const hasPartner = useGame((s) => !!officialPartner(s.loves ?? {}));
  const g = useGame.getState();
  if (!l) return null;
  const stage = stageOf(l);
  const daysOfficial = l.sinceDay !== undefined ? day - l.sinceDay : 0;
  return (
    <>
      <div className="balance love-card">
        <div className="love-face">{m.emoji}</div>
        <div className="balance-amt" style={{ fontSize: 22 }}>{m.name}, {m.age}</div>
        <div className="muted small">{m.job}</div>
        <div className="small" style={{ marginTop: 4 }}>{STAGE_NAMES[stage]}</div>
        <div className="bar thin"><div className="fill love" style={{ width: `${l.interest}%` }} /></div>
        <div className="muted small">💕 {Math.round(l.interest)}/100</div>
      </div>
      <div className="list">
        <button className="action" disabled={l.lastTextDay === day} onClick={() => g.textLove(id)}>
          <span className="action-emoji">💬</span>
          <span className="action-body"><span>Gist on chat</span><span className="muted small">{l.lastTextDay === day ? 'Una don gist today' : '₦200 data · 💕 +6'}</span></span>
        </button>
        <div className="love-section">📅 Take {m.name} out {l.interest < 25 && <span className="muted small">(gist small first)</span>}</div>
        {DATE_TIERS.map((t) => (
          <button key={t.id} className="action" disabled={l.interest < 25 || l.lastDateDay === day || money < t.cost} onClick={() => g.dateLove(id, t.id)}>
            <span className="action-emoji">{t.emoji}</span>
            <span className="action-body"><span>{t.label}</span><span className="muted small">{formatNaira(t.cost)} · {Math.round(t.minutes / 60)}h{l.lastDateDay === day ? ' · one date per day' : ''}</span></span>
          </button>
        ))}
        {!l.official && (
          <button className="action" disabled={hasPartner} onClick={() => g.askOut(id)}>
            <span className="action-emoji">❤️</span>
            <span className="action-body"><span>Ask {m.name} to be official</span><span className="muted small">{hasPartner ? 'You don get partner already' : l.interest < ASK_OUT_AT ? `Better wait till 💕 ${ASK_OUT_AT}` : 'E fit say yes now!'}</span></span>
          </button>
        )}
        {l.official && !l.engaged && (
          <button className="action" disabled={money < RING_COST} onClick={() => g.propose(id)}>
            <span className="action-emoji">💍</span>
            <span className="action-body"><span>Propose (meet the family)</span><span className="muted small">Ring {formatNaira(RING_COST)} · {daysOfficial < PROPOSE_AFTER_DAYS ? `wait ${PROPOSE_AFTER_DAYS - daysOfficial} more days` : 'need 💕 85'}</span></span>
          </button>
        )}
        {l.engaged && !l.married && (
          <button className="action" disabled={money < WEDDING_COST} onClick={() => g.wed(id)}>
            <span className="action-emoji">💒</span>
            <span className="action-body"><span>Do the wedding</span><span className="muted small">{formatNaira(WEDDING_COST)} · aso-ebi, hall, jollof · 👔 +15</span></span>
          </button>
        )}
        {!l.married && (
          <button className="ghost" onClick={() => confirm(`Break up with ${m.name}?`) && g.breakUp(id)}>💔 End am</button>
        )}
      </div>
    </>
  );
}

export function LoveApp() {
  const swiped = useGame((s) => s.swiped ?? []);
  const loves = useGame((s) => s.loves ?? {});
  const packaging = useGame((s) => s.packaging);
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<'discover' | 'matches'>(Object.keys(loves).length ? 'matches' : 'discover');
  if (open && loves[open]) {
    return (
      <>
        <button className="ghost" onClick={() => setOpen(null)}>‹ All matches</button>
        <Profile id={open} />
      </>
    );
  }
  const next = MATCHES.find((m) => !swiped.includes(m.id));
  return (
    <>
      <div className="love-tabs">
        <button className={tab === 'discover' ? 'on' : ''} onClick={() => setTab('discover')}>🔥 Discover</button>
        <button className={tab === 'matches' ? 'on' : ''} onClick={() => setTab('matches')}>💕 Matches ({Object.keys(loves).length})</button>
      </div>
      {tab === 'discover' ? (
        next ? (
          <div className="balance love-card">
            <div className="love-face">{next.emoji}</div>
            <div className="balance-amt" style={{ fontSize: 22 }}>{next.name}, {next.age}</div>
            <div className="muted small">{next.job}</div>
            <p className="small">"{next.bio}"</p>
            <div className="muted small">Your 👔 {Math.round(packaging)}{packaging < next.standard ? ' · e fit no like you back 😬' : ' · you get chance ✨'}</div>
            <div className="love-swipe">
              <button className="ghost" onClick={() => useGame.getState().swipe(next.id, false)} aria-label="Pass">❌</button>
              <button className="primary" onClick={() => useGame.getState().swipe(next.id, true)} aria-label="Like">💚</button>
            </div>
          </div>
        ) : (
          <p className="muted small">You don see everybody for your area. Check your matches 💕</p>
        )
      ) : (
        <div className="list">
          {Object.entries(loves).length === 0 && <p className="muted small">No match yet. Go Discover and like people 💚</p>}
          {Object.entries(loves).map(([id, l]) => {
            const m = matchById(id)!;
            return (
              <button key={id} className="action" onClick={() => setOpen(id)}>
                <span className="action-emoji">{m.emoji}</span>
                <span className="action-body"><span>{m.name}</span><span className="muted small">{STAGE_NAMES[stageOf(l)]} · 💕 {Math.round(l.interest)}</span></span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
