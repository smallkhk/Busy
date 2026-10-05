import { activityById, INTERACTABLES } from '../content/activities';
import { useNet } from '../net/useNet';
import { useGame } from '../store/game';
import { registerLabel } from '../world/labels';

/** Emoji chips over furniture and the player's name tag. Positioned by LabelSync in the scene. */
export function Labels() {
  const place = useGame((s) => s.place);
  const name = useGame((s) => s.name);
  const openMenu = useGame((s) => s.openMenu);
  const active = useGame((s) => s.active);
  const activity = active ? activityById(active.id) : undefined;
  const players = useNet((s) => s.players);
  const bubbles = useNet((s) => s.bubbles);
  // Re-render each game tick so chat bubbles expire on time
  useGame((s) => Math.floor(s.time));
  const now = Date.now();
  return (
    <div className="labels">
      {INTERACTABLES.filter((i) => i.place === place).map((i) => (
        <button
          key={i.id}
          ref={registerLabel(i.id)}
          className="obj-chip label"
          aria-label={i.name}
          onPointerDown={(e) => {
            e.stopPropagation();
            openMenu(i.id);
          }}
        >
          {i.emoji}
        </button>
      ))}
      {!activity?.away && (
        <div ref={registerLabel('avatar')} className="nametag label">
          {bubbles.me && bubbles.me.until > now && <span className="bubble">{bubbles.me.text}</span>}
          {activity?.sleep ? '💤' : name}
        </div>
      )}
      {Object.values(players).filter((p) => !p.hidden).map((p) => (
        <div key={p.id} ref={registerLabel(`p:${p.id}`)} className="nametag label remote">
          {bubbles[p.id] && bubbles[p.id].until > now && <span className="bubble">{bubbles[p.id].text}</span>}
          {p.name}
        </div>
      ))}
    </div>
  );
}
