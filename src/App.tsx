import { ActionMenu, ActiveBanner, NeedsPanel, Toasts, TopBar } from './ui/Hud';
import { AudioDirector } from './audio/AudioDirector';
import { ChatBar } from './net/ChatBar';
import { NetDirector } from './net/NetDirector';
import { EventModal } from './ui/EventModal';
import { QuestPill } from './ui/Goals';
import { Labels } from './ui/Labels';
import { Phone } from './ui/Phone';
import { Start } from './ui/Start';
import { WorldMap } from './ui/WorldMap';
import { useGame } from './store/game';
import { Scene } from './world/Scene';

function BottomNav() {
  const openPhone = useGame((s) => s.openPhone);
  const phone = useGame((s) => s.phone);
  const reset = useGame((s) => s.reset);
  return (
    <nav className="bottomnav card">
      <button className={!phone ? 'on' : ''} onClick={() => openPhone(null)}>🏠<span>Home</span></button>
      <button className={phone && phone !== 'map' ? 'on' : ''} onClick={() => openPhone('home')}>📱<span>Phone</span></button>
      <button className={phone === 'map' ? 'on' : ''} onClick={() => openPhone('map')}>🗺️<span>Map</span></button>
      <button
        onClick={() => {
          if (confirm('Start a new life? Your current life go waka.')) reset();
        }}
      >
        🔄<span>New life</span>
      </button>
    </nav>
  );
}

export default function App() {
  const started = useGame((s) => s.started);
  // The 3D map replaces the scene while open (one WebGL canvas at a time on phones).
  const mapOpen = useGame((s) => s.phone === 'map');
  return (
    <div className="app-root">
      <AudioDirector />
      {!mapOpen && <Scene />}
      {started ? (
        <>
          <NetDirector />
          <Labels />
          <div className="hud-top">
            <TopBar />
            <NeedsPanel />
            <QuestPill />
            <Toasts />
          </div>
          <div className="hud-bottom">
            <ActiveBanner />
            <ChatBar />
            <BottomNav />
          </div>
          <ActionMenu />
          <Phone />
          {mapOpen && <WorldMap />}
          <EventModal />
        </>
      ) : (
        <Start />
      )}
    </div>
  );
}
