import { useEffect } from 'react';
import { activityById } from '../content/activities';
import { useGame } from '../store/game';
import { avatarLabelPos } from '../world/labels';
import { joinRoom, refreshPresence, sendMove, startMultiplayer } from './multiplayer';
import { initSocial, setIncomingHandler } from './social';
import { startCloud } from './cloud';

/** Room players share: your house is private; streets are per area. */
function roomFor(place: string, area: string): string | null {
  if (place === 'home') return null;
  if (place === 'street') return `street-${area}`;
  return place;
}

/** Keeps the multiplayer connection in step with the game. Renders nothing. */
export function NetDirector() {
  useEffect(() => {
    const s = useGame.getState();
    startMultiplayer(s.name, s.shirt);
    setIncomingHandler((from, body) => useGame.getState().toast(`💬 ${from?.name ?? 'Somebody'}: ${body.slice(0, 40)}`));
    void initSocial(s.name, s.shirt).then(() => startCloud());
    joinRoom(roomFor(s.place, s.area));
    const unsub = useGame.subscribe((n, p) => {
      if (n.place !== p.place || n.area !== p.area) joinRoom(roomFor(n.place, n.area));
    });
    const move = window.setInterval(() => {
      const g = useGame.getState();
      const a = g.active ? activityById(g.active.id) : undefined;
      sendMove(avatarLabelPos.x, avatarLabelPos.z, !!a?.away);
    }, 300);
    const presence = window.setInterval(refreshPresence, 15000);
    return () => {
      unsub();
      clearInterval(move);
      clearInterval(presence);
    };
  }, []);
  return null;
}
