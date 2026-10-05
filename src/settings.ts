import { create } from 'zustand';

export type Quality = 'high' | 'low';

/** Weak phones (few CPU cores or little memory) start in low graphics. */
export function detectQuality(): Quality {
  if (typeof navigator === 'undefined') return 'high';
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 4 || mem <= 3 ? 'low' : 'high';
}

const KEY = 'abuja-life-quality';
const saved = (): Quality | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'low' || v === 'high' ? v : null;
  } catch {
    return null;
  }
};

export const useSettings = create<{ quality: Quality; setQuality: (q: Quality) => void }>((set) => ({
  quality: saved() ?? detectQuality(),
  setQuality: (quality) => {
    try {
      localStorage.setItem(KEY, quality);
    } catch {
      /* private mode: just keep it for this visit */
    }
    set({ quality });
  },
}));

// ---------------- Install as app ----------------
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: InstallEvent | null = null;
export const useInstall = create<{ canInstall: boolean; installed: boolean }>(() => ({ canInstall: false, installed: false }));

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    useInstall.setState({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => useInstall.setState({ canInstall: false, installed: true }));
  if (window.matchMedia?.('(display-mode: standalone)').matches) useInstall.setState({ installed: true });
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  useInstall.setState({ canInstall: false, installed: outcome === 'accepted' });
  return outcome === 'accepted';
}

export const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Registers the service worker in the built game only. */
export function registerSW() {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {}));
}
