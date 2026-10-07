import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { registerSW } from './settings';

registerSW();

// Dev only: let browser test scripts reach the live game store (never in the built game)
if (import.meta.env.DEV) {
  void Promise.all([import('./store/game'), import('./content/activities')]).then(([g, a]) => Object.assign(window, { __game: g.useGame, __entry: a.ENTRY_SPOT }));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
