import { EVENTS } from '../content/events';
import { formatNaira } from '../engine/clock';
import { visibleChoices } from '../engine/events';
import { eventContext, useGame } from '../store/game';

/** Random life events: pauses the game until you choose, then shows what happened. */
export function EventModal() {
  const eventId = useGame((s) => s.event);
  const result = useGame((s) => s.eventResult);
  const money = useGame((s) => s.money);
  const answer = useGame((s) => s.answerEvent);
  const close = useGame((s) => s.closeEvent);
  const event = EVENTS.find((e) => e.id === eventId);

  if (result) {
    return (
      <div className="event-backdrop">
        <div className="event card">
          <div className="event-emoji">{result.emoji}</div>
          <div className="event-title">{result.title}</div>
          <p className="event-text">{result.text}</p>
          {result.chips.length > 0 && (
            <div className="chips">
              {result.chips.map((c) => (
                <span key={c} className={`chip ${c.startsWith('-') ? 'neg' : c.startsWith('+') ? 'pos' : ''}`}>{c}</span>
              ))}
            </div>
          )}
          <button className="primary" onClick={close}>Continue</button>
        </div>
      </div>
    );
  }

  if (!event) return null;
  const danger = event.id.startsWith('accident') || event.id.startsWith('police') || event.id === 'raid';
  return (
    <div className="event-backdrop">
      <div className={`event card ${danger ? 'danger' : ''}`}>
        <div className="event-emoji">{event.emoji}</div>
        <div className="event-title">{event.title}</div>
        <p className="event-text">{event.text}</p>
        <div className="list">
          {visibleChoices(event, eventContext(useGame.getState(), useGame.getState().eventTrip)).map(({ c, i }) => {
            const short = (c.cost ?? 0) > money;
            return (
              <button key={c.label} className="action" disabled={short} onClick={() => answer(i)}>
                <span className="action-body">
                  <span>{c.label}</span>
                  {short ? (
                    <span className="muted small">You no get {formatNaira(c.cost!)}</span>
                  ) : c.cost && !c.label.includes('₦') ? (
                    <span className="muted small">{formatNaira(c.cost)}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
