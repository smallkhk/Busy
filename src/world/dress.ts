import type { Hair, Outfit } from '../content/fashion';
import { darker, type Hat, type HumanKind } from './HumanModel';

export type DressInput = {
  shirt: string;
  trousers?: string;
  outfit?: Outfit;
  hair?: Hair;
  skin?: string;
  /** Use the women's models. */
  woman?: boolean;
  hat?: Hat;
  /** Force a model (e.g. 'worker' for road crew). */
  kind?: HumanKind;
};

export type Dress = { kind: HumanKind; tint: Record<string, string>; hat?: Hat };

const BLACK_HAIR = '#141010';
const MEN_HAIR = { Hair: BLACK_HAIR, Eyebrows: BLACK_HAIR };
const WOMEN_HAIR = { Hair_Brown: BLACK_HAIR, Hair_Blond: BLACK_HAIR, Brown: BLACK_HAIR };

/** Same colour top and trousers with embroidery: kaftan, jalabiya, agbada, ankara. */
const kaftan = (c: string, embroidery = darker(c, 0.62)): Dress => ({ kind: 'suit', tint: { ...MEN_HAIR, Suit: c, White: c, Tie: embroidery } });

const hash = (s: string) => [...s].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);

/** Pick a model and colours so each person looks like who dem be. */
export function dressFor(d: DressInput): Dress {
  const shirt = d.shirt;
  const pants = d.trousers ?? '#24324a';
  let out: Dress;
  if (d.woman) {
    if (d.kind === 'w_suit' || d.outfit === 'suit') out = { kind: 'w_suit', tint: { ...WOMEN_HAIR, Black: '#1f2a36', White: '#f4f4f4' } };
    else if (d.kind === 'w_casual' || (d.trousers && d.trousers !== shirt)) out = { kind: 'w_casual', tint: { ...WOMEN_HAIR, White: shirt, Orange: pants, Grey: '#2a2a2a' } };
    else out = { kind: 'w_formal', tint: { ...WOMEN_HAIR, Red: BLACK_HAIR, LimeGreen: shirt, Gold: darker(shirt, 0.6) } };
  } else {
    switch (d.outfit) {
      case 'suit':
        out = { kind: 'suit', tint: { ...MEN_HAIR, Suit: '#1f2a36', Tie: '#1b6b3a' } };
        break;
      case 'agbada':
        out = { ...kaftan('#f2ead8', '#c9a23a'), hat: { type: 'hula', color: '#f2ead8', band: '#c9a23a' } };
        break;
      case 'kaftan':
        out = { ...kaftan(shirt), hat: { type: 'hula', color: '#f4f1ec' } };
        break;
      case 'native':
        out = kaftan('#e07a1f', '#2c3e8c');
        break;
      case 'jersey':
        out = { kind: 'casual_hoodie', tint: { ...MEN_HAIR, Purple: '#0f8a3c', White: '#f4f4f4', LightBlue: '#f4f4f4' } };
        break;
      default:
        if (d.kind === 'worker') out = { kind: 'worker', tint: { ...MEN_HAIR, Worker_Vest: shirt } };
        else if (d.kind === 'suit') out = { kind: 'suit', tint: { ...MEN_HAIR, Suit: shirt, Tie: darker(shirt, 0.5) } };
        else if (d.trousers && d.trousers === shirt) out = kaftan(shirt);
        else if (d.kind === 'casual_2' || d.kind === 'casual_hoodie' || d.kind === 'beach') out = casual(d.kind, shirt, pants);
        else out = casual(hash(shirt + pants) % 3 === 2 ? 'casual_hoodie' : 'casual_2', shirt, pants);
    }
    if (d.hair === 'bald' && d.skin) out.tint = { ...out.tint, Hair: d.skin };
    if (d.hair === 'fila' && !out.hat) out.hat = { type: 'fila', color: darker(shirt, 0.8) };
    if (d.hair === 'cap') out.hat = { type: 'cap', color: '#c0392b' };
    if (d.hair === 'afro' && !out.hat) out.hat = { type: 'afro', color: BLACK_HAIR };
  }
  if (d.hat) out.hat = d.hat;
  return out;
}

function casual(kind: 'casual_2' | 'casual_hoodie' | 'beach', shirt: string, pants: string): Dress {
  if (kind === 'casual_hoodie') return { kind, tint: { ...MEN_HAIR, Purple: shirt, LightBlue: pants } };
  if (kind === 'beach') return { kind, tint: { ...MEN_HAIR, LightBrown: shirt, Red_Dark: pants } };
  return { kind, tint: { ...MEN_HAIR, LightBrown: shirt, LightBlue: pants } };
}
