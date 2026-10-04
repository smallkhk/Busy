import { useState } from 'react';
import { longLeg } from '../content/contacts';
import { ACHIEVEMENTS, TUTORIAL } from '../content/goals';
import { AREAS } from '../content/housing';
import { clockParts, formatNaira } from '../engine/clock';
import { useGame } from '../store/game';
import { shareCard, type CardData } from './shareCard';

const gameUrl = () => `${location.host}${location.pathname}`.replace(/\/$/, '');

/** Current tutorial step, shown under the needs bars until the tutorial is done. */
export function QuestPill() {
  const goals = useGame((s) => s.goals);
  const openPhone = useGame((s) => s.openPhone);
  const step = TUTORIAL.find((g) => !goals.includes(g.id));
  if (!step) return null;
  const done = TUTORIAL.filter((g) => goals.includes(g.id)).length;
  return (
    <button className="quest card" onClick={() => openPhone('goals')}>
      <span className="quest-emoji">{step.emoji}</span>
      <span className="quest-body">
        <b>🎯 {step.title}</b>
        <span className="small muted">{step.hint}</span>
      </span>
      <span className="small quest-count">{done}/{TUTORIAL.length}</span>
    </button>
  );
}

export function GoalsApp() {
  const s = useGame();
  const [status, setStatus] = useState('');
  const day = clockParts(s.time).day;
  const doneCount = s.goals.length;
  const total = TUTORIAL.length + ACHIEVEMENTS.length;
  const card: CardData = {
    name: s.name,
    day,
    money: formatNaira(s.money + s.savings),
    home: AREAS[s.area].home,
    packaging: Math.round(s.packaging),
    longLeg: longLeg(s.contacts),
    followers: s.followers,
    goals: `${doneCount}/${total}`,
    url: gameUrl(),
  };
  const text = `${s.name} don survive ${day} days for Abuja 💪 ${card.money}, 👔 ${card.packaging}, 🦵 ${card.longLeg}. Your own turn: https://${card.url}`;

  return (
    <>
      <div className="balance">
        <div className="muted small">Show your guys how far you don reach</div>
        <div className="share-buttons">
          <button
            className="primary"
            onClick={async () => {
              try {
                const r = await shareCard(card, text);
                setStatus(r === 'shared' ? 'Shared! 🙌' : 'Picture don save. Post am for your status 📲');
              } catch {
                setStatus('Share no work for this phone. Use WhatsApp button 👇');
              }
            }}
          >
            📸 Share picture
          </button>
          <a className="ghost wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
            💬 WhatsApp
          </a>
        </div>
        {status && <div className="small">{status}</div>}
      </div>

      <div className="goal-section">🎯 Starter guide</div>
      <div className="list">
        {TUTORIAL.map((g) => {
          const done = s.goals.includes(g.id);
          return (
            <div key={g.id} className={`goal ${done ? 'done' : ''}`}>
              <span className="goal-emoji">{done ? '✅' : g.emoji}</span>
              <span className="action-body">
                <span>{g.title}</span>
                <span className="muted small">{done ? 'Done' : g.hint} · +{formatNaira(g.reward)}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="goal-section">🏆 Achievements · {s.goals.filter((id) => id.startsWith('a-')).length}/{ACHIEVEMENTS.length}</div>
      <div className="goal-grid">
        {ACHIEVEMENTS.map((g) => {
          const done = s.goals.includes(g.id);
          return (
            <div key={g.id} className={`badge ${done ? 'done' : ''}`} title={g.hint}>
              <span className="badge-emoji">{done ? g.emoji : '🔒'}</span>
              <span className="badge-title">{g.title}</span>
              <span className="badge-hint">{g.hint}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
