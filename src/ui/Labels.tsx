import { activityById, INTERACTABLES } from '../content/activities';
import { useSocial } from '../net/social';
import { useNet } from '../net/useNet';
import { contactById } from '../content/contacts';
import { npcsAt } from '../content/npcs';
import { clockParts } from '../engine/clock';
import { useGame } from '../store/game';
import { registerLabel } from '../world/labels';
import { homeTier } from '../content/housing';
import { useFlightView } from '../world/places/Flight';

/** Emoji chips over furniture and the player's name tag. Positioned by LabelSync in the scene. */
export function Labels() {
  const place = useGame((s) => s.place);
  const mansion = useGame((s) => homeTier(s.area) === 'mansion');
  const name = useGame((s) => s.name);
  const openMenu = useGame((s) => s.openMenu);
  const openNpc = useGame((s) => s.openNpc);
  const contacts = useGame((s) => s.contacts);
  const active = useGame((s) => s.active);
  const activity = active ? activityById(active.id) : undefined;
  const players = useNet((s) => s.players);
  const bubbles = useNet((s) => s.bubbles);
  // Re-render each game tick so chat bubbles expire on time
  useGame((s) => Math.floor(s.time));
  const now = Date.now();
  const { hour, day } = clockParts(useGame.getState().time);
  const npcs = npcsAt(place, hour, day);
  // Looking at the plane from outside: no chips floating in the sky
  const outside = useFlightView((s) => s.out) && place === 'cabin';
  if (outside) return null;
  return (
    <div className="labels">
      {INTERACTABLES.filter((i) => i.place === place && (!i.mansion || mansion)).map((i) => (
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
      {npcs.map(({ id }) => {
        const c = contactById(id);
        const known = !!contacts[id];
        return (
          <div
            key={id}
            ref={registerLabel(`n:${id}`)}
            className={`nametag label npc ${known ? '' : 'stranger'}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              openNpc(id);
            }}
          >
            {known ? `${c?.emoji} ${c?.name}` : '❓ Stranger'}
          </div>
        );
      })}
      {!activity?.away && (
        <div ref={registerLabel('avatar')} className="nametag label">
          {bubbles.me && bubbles.me.until > now && <span className="bubble">{bubbles.me.text}</span>}
          {activity?.sleep ? '💤' : name}
        </div>
      )}
      {Object.values(players).filter((p) => !p.hidden).map((p) => (
        <div
          key={p.id}
          ref={registerLabel(`p:${p.id}`)}
          className="nametag label remote"
          onPointerDown={(e) => {
            e.stopPropagation();
            useSocial.setState({ nearbyMenu: p.id });
          }}
        >
          {bubbles[p.id] && bubbles[p.id].until > now && <span className="bubble">{bubbles[p.id].text}</span>}
          {p.name}
        </div>
      ))}
    </div>
  );
}
