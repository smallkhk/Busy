import { contactById, GIFT_COST } from '../content/contacts';
import { npcLine, TALK_REL } from '../content/npcs';
import { clockParts } from '../engine/clock';
import { useGame } from '../store/game';

/** Talk to a contact you bump into in the world. */
export function NpcSheet() {
  const id = useGame((s) => s.npcMenu);
  const cs = useGame((s) => (id ? s.contacts[id] : undefined));
  const money = useGame((s) => s.money);
  const day = useGame((s) => clockParts(s.time).day);
  const busy = useGame((s) => !!s.active);
  const { openNpc, introduce, talkTo, giftContact, askFavour } = useGame.getState();
  const c = id ? contactById(id) : undefined;
  if (!id || !c) return null;
  const close = () => openNpc(null);
  const f = c.favour;
  const cooling = cs?.lastFavourDay !== undefined ? f.cooldownDays - (day - cs.lastFavourDay) : 0;
  return (
    <div className="sheet-backdrop" onPointerDown={close}>
      <div className="sheet card npc-sheet" onPointerDown={(e) => e.stopPropagation()}>
        <div className="sheet-title">
          <span className="npc-face">{cs ? c.emoji : '❓'}</span>
          <span>
            {cs ? c.name : 'Stranger'}
            {cs && <div className="muted small">{c.role} · 🦵 {Math.round(cs.rel)}</div>}
          </span>
        </div>
        <p className="npc-line">{npcLine(id, cs?.rel)}</p>
        {!cs ? (
          <button className="action" onClick={() => introduce(id)}>
            <span className="action-emoji">🤝</span>
            <span className="action-body"><span>Introduce yourself</span><span className="muted small">Add {'⭐'.repeat(c.influence)} contact to your Long Leg</span></span>
          </button>
        ) : (
          <div className="list">
            <button className="action" disabled={busy || cs.lastTalkDay === day} onClick={() => { talkTo(id); close(); }}>
              <span className="action-emoji">🗣️</span>
              <span className="action-body"><span>Gist with {c.name}</span><span className="muted small">{cs.lastTalkDay === day ? 'Una don gist today' : `15 min · +12 💬 · 🦵 +${TALK_REL}`}</span></span>
            </button>
            <button className="action" disabled={money < GIFT_COST} onClick={() => giftContact(id)}>
              <span className="action-emoji">🎁</span>
              <span className="action-body"><span>Dash am gift</span><span className="muted small">₦5,000</span></span>
            </button>
            <button className="action" disabled={cs.rel < f.minRel || cooling > 0} onClick={() => { askFavour(id); close(); }}>
              <span className="action-emoji">🙏</span>
              <span className="action-body"><span>{f.label}</span><span className="muted small">{cs.rel < f.minRel ? `Need 🦵 ${f.minRel} with ${c.name}` : cooling > 0 ? `Ask again in ${cooling} days` : 'E fit help you now'}</span></span>
            </button>
          </div>
        )}
        <button className="ghost" onClick={close}>Waka go</button>
      </div>
    </div>
  );
}
