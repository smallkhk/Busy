import { Vector3 } from 'three';
import { npcsAt, NPCS } from '../content/npcs';
import { clockParts } from '../engine/clock';
import { useGame } from '../store/game';
import { Person } from './Avatar';

/** Label anchors above each contact's head, keyed by contact id. */
export const npcLabelPos = new Map<string, Vector3>();

/** Contacts you fit bump into, standing where they hang out at this hour. */
export function Npcs() {
  const place = useGame((s) => s.place);
  const hour = useGame((s) => clockParts(s.time).hour);
  const day = useGame((s) => clockParts(s.time).day);
  const openNpc = useGame((s) => s.openNpc);
  const here = npcsAt(place, hour, day);
  npcLabelPos.clear();
  for (const { id, spot } of here) npcLabelPos.set(id, new Vector3(spot.pos[0], 1.75, spot.pos[1]));
  return (
    <>
      {here.map(({ id, spot }) => (
        <group
          key={id}
          position={[spot.pos[0], 0, spot.pos[1]]}
          rotation={[0, Math.PI / 4, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (e.delta > 8) return;
            openNpc(id);
          }}
        >
          <Person shirt={NPCS[id].shirt} trousers={NPCS[id].trousers} {...NPCS[id].look} />
        </group>
      ))}
    </>
  );
}
