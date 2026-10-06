import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * `virtual:asset-list`: every 3D model in public/models with its size, so the game
 * can download them all on launch (with a progress bar) and keep them on the phone.
 * The version changes whenever a model is added, removed or changed.
 */
function assetList(): Plugin {
  const id = 'virtual:asset-list';
  const root = join(process.cwd(), 'public');
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
  return {
    name: 'asset-list',
    resolveId: (s) => (s === id ? '\0' + id : undefined),
    load(s) {
      if (s !== '\0' + id) return;
      const files = walk(join(root, 'models'))
        .filter((f) => f.endsWith('.glb'))
        .sort()
        .map((f) => [relative(root, f).split('\\').join('/'), statSync(f).size] as [string, number]);
      const hash = createHash('sha1');
      for (const [f] of files) hash.update(f).update(readFileSync(join(root, f)));
      return `export const FILES = ${JSON.stringify(files)};\nexport const VERSION = ${JSON.stringify(hash.digest('hex').slice(0, 10))};`;
    },
  };
}

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/Busy/").
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), assetList()],
  build: {
    // Big libraries in their own files: they rarely change, so phones keep them cached between updates
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/three/')) return 'three';
          if (id.includes('@react-three') || id.includes('three-stdlib')) return 'r3f';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          return undefined;
        },
      },
    },
  },
});
