import { useGLTF } from '@react-three/drei';
import { create } from 'zustand';
import { FILES, VERSION } from 'virtual:asset-list';

/**
 * Shortly after launch the phone quietly downloads every 3D model once and keeps
 * it (Cache Storage, which the service worker serves from), then every model is
 * prepared in the background. No loading screen: you play while it downloads. After that, no place ever stops to load: walking into the airport,
 * the campus or a mansion is instant, even without network.
 */
const CACHE = `abuja-models-${VERSION}`;
const TOTAL = FILES.reduce((n, [, b]) => n + b, 0);
const url = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const usePreload = create<{ done: number; total: number; ready: boolean; failed: number }>(() => ({ done: 0, total: TOTAL, ready: false, failed: 0 }));

let started = false;

export function preloadEverything() {
  if (started) return;
  started = true;
  void run();
}

async function run() {
  const store = 'caches' in window ? await caches.open(CACHE).catch(() => null) : null;
  // Ask the phone not to clear our files when space is low
  void navigator.storage?.persist?.().catch(() => false);
  // Old versions of the models: delete them
  if (store) void caches.keys().then((keys) => keys.filter((k) => k.startsWith('abuja-models-') && k !== CACHE).forEach((k) => void caches.delete(k)));

  let done = 0;
  let failed = 0;
  const queue = [...FILES];
  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      const [path, bytes] = item;
      const u = url(path);
      try {
        const hit = store && (await store.match(u));
        if (!hit) {
          const res = await fetch(u);
          if (!res.ok) throw new Error(String(res.status));
          if (store) await store.put(u, res.clone());
          await res.arrayBuffer();
        }
      } catch {
        failed++;
      }
      done += bytes;
      usePreload.setState({ done, failed });
    }
  };
  // Two at a time: the game you dey play keeps most of the network
  await Promise.all(Array.from({ length: 2 }, worker));
  usePreload.setState({ ready: true });
  // Prepare every model (from the phone's copy) a few at a time, so the game no freeze
  const rest = FILES.map(([path]) => url(path));
  const step = () => {
    for (const u of rest.splice(0, 4)) useGLTF.preload(u);
    if (rest.length) window.setTimeout(step, 60);
  };
  step();
}
