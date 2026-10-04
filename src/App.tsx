import { ActionMenu, ActiveBanner, NeedsPanel, Toasts, TopBar } from './ui/Hud';
import { Labels } from './ui/Labels';
import { Phone } from './ui/Phone';
import { Start } from './ui/Start';
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
  return (
    <div className="app-root">
      <Scene />
      {started ? (
        <>
          <Labels />
          <div className="hud-top">
            <TopBar />
            <NeedsPanel />
            <Toasts />
          </div>
          <div className="hud-bottom">
            <ActiveBanner />
            <div className="hint muted small">Tap the floor to waka · Tap things to use am</div>
            <BottomNav />
          </div>
          <ActionMenu />
          <Phone />
        </>
      ) : (
        <Start />
      )}
    </div>
  );
}
