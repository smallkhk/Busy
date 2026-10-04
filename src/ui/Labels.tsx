import { activityById, INTERACTABLES } from '../content/activities';
import { useGame } from '../store/game';
import { registerLabel } from '../world/labels';

/** Emoji chips over furniture and the player's name tag. Positioned by LabelSync in the scene. */
export function Labels() {
  const place = useGame((s) => s.place);
  const name = useGame((s) => s.name);
  const openMenu = useGame((s) => s.openMenu);
  const active = useGame((s) => s.active);
  const activity = active ? activityById(active.id) : undefined;
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
          {activity?.sleep ? '💤' : name}
        </div>
      )}
    </div>
  );
}
