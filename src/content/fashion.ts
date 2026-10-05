export type Outfit = 'tee' | 'kaftan' | 'native' | 'jersey' | 'suit' | 'agbada';
export type Hair = 'short' | 'afro' | 'braids' | 'bald' | 'fila' | 'cap';

export const OUTFITS: { id: Outfit; name: string; emoji: string; cost: number; packaging: number; blurb: string }[] = [
  { id: 'tee', name: 'T-shirt & jeans', emoji: '👕', cost: 0, packaging: 0, blurb: 'Everyday Abuja hustle look.' },
  { id: 'jersey', name: 'Super Eagles jersey', emoji: '⚽', cost: 18000, packaging: 2, blurb: 'Green-white-green for match day 🇳🇬' },
  { id: 'native', name: 'Ankara native', emoji: '🎨', cost: 25000, packaging: 4, blurb: 'Friday wear. Bright print, sharp tailoring.' },
  { id: 'kaftan', name: 'Kaftan', emoji: '🥻', cost: 40000, packaging: 6, blurb: 'Clean long kaftan. Senator style.' },
  { id: 'suit', name: 'Office suit & tie', emoji: '🤵🏾', cost: 90000, packaging: 10, blurb: 'Ministry, interviews and contracts.' },
  { id: 'agbada', name: 'Agbada', emoji: '👑', cost: 180000, packaging: 15, blurb: 'Owambe king. Add fila cap for Hair. When you enter, everywhere go quiet.' },
];

export const HAIRS: { id: Hair; name: string; emoji: string }[] = [
  { id: 'short', name: 'Low cut', emoji: '💈' },
  { id: 'afro', name: 'Afro', emoji: '🌳' },
  { id: 'braids', name: 'Braids', emoji: '💇🏾‍♀️' },
  { id: 'bald', name: 'Clean shave', emoji: '🥚' },
  { id: 'fila', name: 'Fila cap', emoji: '🧢' },
  { id: 'cap', name: 'Face cap', emoji: '🧢' },
];

export const SKINS = ['#8d5524', '#6b4430', '#5a3825', '#3d2416', '#2b1a10'];

/** Barbing or a new hairdo. */
export const HAIR_COST = 3000;

export type Look = { outfit: Outfit; hair: Hair; skin: number };
export const DEFAULT_LOOK: Look = { outfit: 'tee', hair: 'short', skin: 2 };

/** Compact form for multiplayer presence, e.g. "agbada.fila.2". */
export const encodeLook = (l: Look) => `${l.outfit}.${l.hair}.${l.skin}`;
export function decodeLook(s: string | undefined): Look {
  const [o, h, k] = (s ?? '').split('.');
  const outfit = (OUTFITS.find((x) => x.id === o)?.id ?? 'tee') as Outfit;
  const hair = (HAIRS.find((x) => x.id === h)?.id ?? 'short') as Hair;
  const skin = Math.max(0, Math.min(SKINS.length - 1, Number(k) || 0));
  return { outfit, hair, skin: Number.isFinite(Number(k)) ? skin : DEFAULT_LOOK.skin };
}
