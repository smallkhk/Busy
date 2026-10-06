import type { ReactElement } from 'react';
import type { Place } from '../content/activities';
import { homeTier, type AreaId } from '../content/housing';
import type { HoodStyle, Rect } from './Neighborhood';
import { Room } from './Room';
import { Street } from './Street';
import { Hospital } from './places/Hospital';
import { JabiLake } from './places/JabiLake';
import { Lounge } from './places/Lounge';
import { Secretariat } from './places/Secretariat';
import { WuseMarket } from './places/WuseMarket';
import { Airport, Asokoro, Garki, Maitama, Mararaba, Nyanya, Utako } from './places/Districts';
import { Park, Stadium } from './places/Landmarks';
import { UniGate } from './places/Campus';

const PLACES: Place[] = ['home', 'street', 'wuse', 'jabi', 'secretariat', 'lounge', 'hospital', 'maitama', 'asokoro', 'garki', 'nyanya', 'airport', 'utako', 'mararaba', 'park', 'stadium', 'uniabuja', 'campus', 'lt', 'unilib', 'road', 'cabin', 'lagos'];

/** Each place gets its own neighbourhood layout. */
export const SEEDS = Object.fromEntries(PLACES.map((p, i) => [p, 11 + i * 37])) as Record<Place, number>;

/** Spots the filler houses must avoid in each scene (big props, lakes, the road). */
export const CLEAR: Partial<Record<Place, Rect[]>> = {
  home: [[-5, -4.5, 9, 7]],
  street: [[-12, -6, 8.6, 4.6], [-15, -19, 10, -14]],
  jabi: [[-8.6, -8, 8.6, 4.6], [-5, -16, 15, -3]],
  stadium: [[-8.6, -8, 8.6, 4.6], [-9, -13, 5, -1]],
  airport: [[-8.6, -8, 8.6, 4.6], [-15, -10.5, 18, -5.5]],
  lounge: [[-8.6, -8, 8.6, 4.6]],
};

/** What the surrounding blocks look like: towers downtown, big houses in Maitama, face-me-I-face-you in Nyanya. */
const STYLE: Partial<Record<Place, HoodStyle>> = {
  maitama: 'rich',
  asokoro: 'rich',
  secretariat: 'city',
  garki: 'city',
  utako: 'city',
  wuse: 'city',
  hospital: 'city',
  airport: 'city',
  nyanya: 'poor',
  mararaba: 'poor',
};

export function hoodStyle(place: Place, area: AreaId): HoodStyle {
  if (place === 'home' || place === 'street') {
    const tier = homeTier(area);
    return tier === 'mansion' ? 'rich' : tier === 'room' ? 'poor' : 'mixed';
  }
  return STYLE[place] ?? 'mixed';
}

export const SCENES: Partial<Record<Place, () => ReactElement>> = {
  home: Room,
  street: Street,
  wuse: WuseMarket,
  jabi: JabiLake,
  secretariat: Secretariat,
  lounge: Lounge,
  hospital: Hospital,
  maitama: Maitama,
  asokoro: Asokoro,
  garki: Garki,
  nyanya: Nyanya,
  airport: Airport,
  utako: Utako,
  mararaba: Mararaba,
  park: Park,
  stadium: Stadium,
  uniabuja: UniGate,
};

