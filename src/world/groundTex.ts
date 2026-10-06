import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

/**
 * Painted ground instead of flat colour: grass with darker tufts and bare
 * patches, or Abuja red earth with grass growing through. Drawn once on a
 * canvas and tiled; each plane size gets its own repeat.
 */
export type GroundKind = 'grass' | 'earth';

const SIZE = 256;
/** World units one tile of the texture covers. */
const TILE = 7;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function paint(kind: GroundKind): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const g = c.getContext('2d');
  if (!g) return null;
  const r = rng(kind === 'grass' ? 7 : 13);
  const base = kind === 'grass' ? '#7ba757' : '#b47a4a';
  g.fillStyle = base;
  g.fillRect(0, 0, SIZE, SIZE);
  // Soft blotches of lighter and darker ground, wrapped so the tile repeats cleanly
  const blob = (x: number, y: number, rad: number, color: string) => {
    for (const dx of [-SIZE, 0, SIZE])
      for (const dy of [-SIZE, 0, SIZE]) {
        const grd = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
        grd.addColorStop(0, color);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd;
        g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
      }
  };
  const tones = kind === 'grass' ? ['rgba(150,190,100,0.55)', 'rgba(70,115,55,0.5)', 'rgba(170,150,95,0.35)'] : ['rgba(200,140,90,0.5)', 'rgba(140,85,50,0.5)', 'rgba(110,150,70,0.55)'];
  for (let i = 0; i < 26; i++) blob(r() * SIZE, r() * SIZE, 20 + r() * 50, tones[i % tones.length]);
  // Blades of grass and little stones
  for (let i = 0; i < 900; i++) {
    const x = r() * SIZE;
    const y = r() * SIZE;
    if (kind === 'grass' || r() < 0.35) {
      g.strokeStyle = r() < 0.5 ? 'rgba(60,105,45,0.6)' : 'rgba(145,190,95,0.6)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 4);
      g.stroke();
    } else {
      g.fillStyle = r() < 0.5 ? 'rgba(90,55,35,0.5)' : 'rgba(225,180,140,0.5)';
      g.fillRect(x, y, 1.5, 1.5);
    }
  }
  return c;
}

const canvases = new Map<GroundKind, HTMLCanvasElement | null>();
const maps = new Map<string, Texture>();

/** A ground texture tiled for a plane of w × h world units (null when there is no DOM, e.g. tests). */
export function groundMap(kind: GroundKind, w: number, h: number): Texture | null {
  const key = `${kind}:${w}x${h}`;
  const hit = maps.get(key);
  if (hit) return hit;
  if (!canvases.has(kind)) canvases.set(kind, paint(kind));
  const canvas = canvases.get(kind);
  if (!canvas) return null;
  const t = new CanvasTexture(canvas);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(w / TILE, h / TILE);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  maps.set(key, t);
  return t;
}

/** Green-looking colours get grass, the rest red earth. */
export function kindForColor(color: string): GroundKind {
  const n = parseInt(color.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  return g > r ? 'grass' : 'earth';
}
