import { useEffect } from 'react';
import { preloadEverything, usePreload } from '../preload';

const mb = (b: number) => (b / 1048576).toFixed(1);

/** First thing on launch: download the whole of Abuja once, with a progress bar. */
export function Loader() {
  const { done, total, ready, failed } = usePreload();
  useEffect(preloadEverything, []);
  if (ready) return null;
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 100;
  return (
    <div className="loader">
      <div className="loader-card">
        <div className="loader-title">🇳🇬 Abuja Life</div>
        <div className="small">Loading Abuja… {pct}%</div>
        <div className="loader-bar">
          <div className="loader-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="muted small">{mb(done)} / {mb(total)} MB · only the first time{failed ? ` · ${failed} retry later` : ''}</div>
      </div>
    </div>
  );
}
