import { ActionMenu, ActiveBanner, NeedsPanel, Toasts, TopBar } from './ui/Hud';
import { AudioDirector } from './audio/AudioDirector';
import { ChatBar } from './net/ChatBar';
import { NetDirector } from './net/NetDirector';
import { EventModal } from './ui/EventModal';
import { NearbyMenu } from './ui/GistApp';
import { NpcSheet } from './ui/NpcSheet';
import { CloudOffer } from './ui/CloudApps';
import { MiniGame } from './ui/MiniGame';
import { QuestPill } from './ui/Goals';
import { Labels } from './ui/Labels';
import { Phone } from './ui/Phone';
import { Start } from './ui/Start';
import { lazy, Suspense } from 'react';
import { useGame } from './store/game';
import { Scene } from './world/Scene';

// Only download the big map and the car showroom when you open them
const WorldMap = lazy(() => import('./ui/WorldMap').then((m) => ({ default: m.WorldMap })));
const Showroom = lazy(() => import('./ui/Showroom').then((m) => ({ default: m.Showroom })));

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
  const showroomOpen = useGame((s) => s.phone === 'cars');
  return (
    <div className="app-root">
      <AudioDirector />
      {!mapOpen && !showroomOpen && <Scene />}
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
          <Suspense fallback={<div className="loading-screen">Loading…</div>}>
            {mapOpen && <WorldMap />}
            {showroomOpen && <Showroom />}
          </Suspense>
          <NearbyMenu />
          <NpcSheet />
          <EventModal />
          <MiniGame />
          <CloudOffer />
        </>
      ) : (
        <Start />
      )}
    </div>
  );
}
