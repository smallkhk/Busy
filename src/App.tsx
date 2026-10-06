import { CheckpointModal, MissionPanel } from './ui/Hustle';
import { FlightPanel } from './ui/Flight';
import { ActionMenu, ActiveBanner, NeedsPanel, Toasts, TopBar, DriveButton, PoseBar } from './ui/Hud';
import { AudioDirector } from './audio/AudioDirector';
import { ChatBar } from './net/ChatBar';
import { NetDirector } from './net/NetDirector';
import { EventModal } from './ui/EventModal';
import { NearbyMenu } from './ui/GistApp';
import { CallOverlay } from './ui/CallOverlay';
import { NpcSheet } from './ui/NpcSheet';
import { CloudOffer } from './ui/CloudApps';
import { MiniGame } from './ui/MiniGame';
import { QuestPill } from './ui/Goals';
import { Labels } from './ui/Labels';
import { Phone } from './ui/Phone';
import { Start } from './ui/Start';
import { Loader } from './ui/Loader';
import { usePreload } from './preload';
import { lazy, Suspense, useEffect } from 'react';
import { useGame } from './store/game';
import { Scene } from './world/Scene';

// Only download the big map and the car showroom when you open them
const WorldMap = lazy(() => import('./ui/WorldMap').then((m) => ({ default: m.WorldMap })));
const Wardrobe = lazy(() => import('./ui/Wardrobe').then((m) => ({ default: m.Wardrobe })));
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
  // The clock follows real Abuja time: catch up when you open the game or come back to it
  useEffect(() => {
    if (!started) return;
    useGame.getState().syncClock();
    const back = () => document.visibilityState === 'visible' && useGame.getState().syncClock();
    document.addEventListener('visibilitychange', back);
    return () => document.removeEventListener('visibilitychange', back);
  }, [started]);
  // The 3D map replaces the scene while open (one WebGL canvas at a time on phones).
  const loaded = usePreload((s) => s.ready);
  const mapOpen = useGame((s) => s.phone === 'map');
  const showroomOpen = useGame((s) => s.phone === 'cars');
  const wardrobeOpen = useGame((s) => s.phone === 'style');
  return (
    <div className="app-root">
      <Loader />
      <AudioDirector />
      {/* The 3D world starts once everything is downloaded, so the download gets the whole phone */}
      {loaded && !mapOpen && !showroomOpen && !wardrobeOpen && <Scene />}
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
            <MissionPanel />
            <FlightPanel />
            <div className="action-row">
              <PoseBar />
              <DriveButton />
            </div>
            <ChatBar />
            <BottomNav />
          </div>
          <ActionMenu />
          <Phone />
          <Suspense fallback={<div className="loading-screen">Loading…</div>}>
            {mapOpen && <WorldMap />}
            {showroomOpen && <Showroom />}
            {wardrobeOpen && <Wardrobe />}
          </Suspense>
          <NearbyMenu />
          <NpcSheet />
          <EventModal />
          <MiniGame />
          <CheckpointModal />
          <CloudOffer />
          <CallOverlay />
        </>
      ) : (
        <Start />
      )}
    </div>
  );
}
