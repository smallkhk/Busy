import { useEffect } from 'react';
import { activityById } from '../content/activities';
import { setCompanionCheck, useGame } from '../store/game';
import { clockParts, formatNaira } from '../engine/clock';
import { avatarLabelPos } from '../world/labels';
import { joinRoom, refreshPresence, sendMove, setAppearance, startMultiplayer } from './multiplayer';
import { DEFAULT_LOOK, encodeLook } from '../content/fashion';
import { initSocial, setCashHandler, setIncomingHandler, useSocial } from './social';
import { useNet } from './useNet';
import { startCloud } from './cloud';
import { initAdmin, setAnnounceHandler } from './admin';
import { newsById } from '../content/world';

/** Room players share: your house is private; streets are per area. */
function roomFor(place: string, area: string, cell?: [number, number] | null): string | null {
  if (place === 'home') return null;
  if (place === 'street') return `street-${area}`;
  // Out on the road: everybody on the same block of road
  if (place === 'road') return cell ? `road-${cell[0]}-${cell[1]}` : null;
  return place;
}

/** Keeps the multiplayer connection in step with the game. Renders nothing. */
export function NetDirector() {
  useEffect(() => {
    const s = useGame.getState();
    startMultiplayer(s.name, s.shirt);
    setAppearance(s.shirt, encodeLook(s.look ?? DEFAULT_LOOK));
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
    setAnnounceHandler((a) => {
      const g = useGame.getState();
      const key = `ann-${a.id}`;
      if (g.flags?.[key]) return;
      const day = clockParts(g.time).day;
      const news = a.news ? newsById(a.news) : undefined;
      const running = g.news ?? [];
      useGame.setState({
        flags: { ...g.flags, [key]: day },
        news: news && !running.some((n) => n.id === news.id) ? [...running, { id: news.id, until: day + news.days - 1 }] : running,
      });
      g.toast(`📣 ${a.body}${news ? ` · 📰 ${news.headline}` : ''}`);
    });
    void initSocial(s.name, s.shirt).then(() => {
      startCloud();
      void initAdmin();
    });
    joinRoom(roomFor(s.place, s.area, s.cell));
    const unsub = useGame.subscribe((n, p) => {
      if (n.place !== p.place || n.area !== p.area || n.cell !== p.cell) joinRoom(roomFor(n.place, n.area, n.cell));
      if (n.look !== p.look || n.shirt !== p.shirt) setAppearance(n.shirt, encodeLook(n.look ?? DEFAULT_LOOK));
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
