import { useEffect } from 'react';
import { activityById } from '../content/activities';
import { setCompanionCheck, useGame } from '../store/game';
import { formatNaira } from '../engine/clock';
import { avatarLabelPos } from '../world/labels';
import { joinRoom, refreshPresence, sendMove, startMultiplayer } from './multiplayer';
import { initSocial, setCashHandler, setIncomingHandler, useSocial } from './social';
import { useNet } from './useNet';
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
    setCashHandler((from, amount, note) => {
      useGame.getState().adjustMoney(amount, `Transfer from ${from?.name ?? 'a friend'}`);
      useGame.getState().toast(`💸 ${from?.name ?? 'Your friend'} send you ${formatNaira(amount)}${note ? `: "${note}"` : ''}`);
    });
    // A friend standing in the same place as you
    setCompanionCheck(() => {
      const { friends, addedMe } = useSocial.getState();
      const buddy = Object.values(useNet.getState().players).find((p) => !p.hidden && (friends.includes(p.id) || addedMe.includes(p.id)));
      return buddy?.name;
    });
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
