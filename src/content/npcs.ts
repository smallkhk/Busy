import type { Place } from './common';
import type { Outfit } from './fashion';
import type { Hat, HumanKind } from '../world/HumanModel';

/** Where a contact physically hangs out. `days` uses day % 7 (0 = Sunday). */
export type NpcSpot = { place: Place; pos: [number, number]; hours: [number, number]; days?: number[] };

export type Npc = {
  shirt: string;
  trousers?: string;
  /** How they dress on the map. */
  look?: { woman?: boolean; outfit?: Outfit; hat?: Hat; kind?: HumanKind };
  spots: NpcSpot[];
  /** What they say when you walk up, by how close una be. */
  lines: { stranger: string; cold: string; warm: string; close: string };
};

const WEEKDAYS = [1, 2, 3, 4, 5];

export const NPCS: Record<string, Npc> = {
  garba: {
    shirt: '#ecf0f1',
    trousers: '#ecf0f1',
    look: { hat: { type: 'hula', color: '#f4f1ec', band: '#1f6f4a' } },
    spots: [{ place: 'secretariat', pos: [-1.2, 0.2], hours: [8, 17], days: WEEKDAYS }],
    lines: {
      stranger: '"Salaam alaikum. You dey find which office? I fit show you road."',
      cold: '"Ah, you again. How the CV matter dey go?"',
      warm: '"My friend! Director don come today. Make you dress well tomorrow o."',
      close: '"My person! Anything you need for this Secretariat, just tell Garba."',
    },
  },
  chinedu: {
    shirt: '#2e6fa8',
    spots: [
      { place: 'secretariat', pos: [1.8, 1.0], hours: [9, 16], days: WEEKDAYS },
      { place: 'lounge', pos: [-2.4, 1.2], hours: [20, 24], days: [5, 6] },
      { place: 'street', pos: [-4.5, 0.4], hours: [16, 19], days: [0] },
    ],
    lines: {
      stranger: '"Wait… is that you?! Na me Chinedu! We do JSS together!"',
      cold: '"Guy, you no dey call person again. Abuja don change you?"',
      warm: '"Bros! Ministry work dey stress me but we move. You don chop?"',
      close: '"My guy! Anything I hear for office, you go first know. Na we we."',
    },
  },
  okafor: {
    shirt: '#8e44ad',
    trousers: '#2c3e50',
    spots: [{ place: 'jabi', pos: [-1.8, 0.4], hours: [11, 19] }],
    lines: {
      stranger: '"Excuse me, you know where the phone shop dey for this mall?"',
      cold: '"Oh, hello. Remind me your name again?"',
      warm: '"Ah! My dear. You dey look sharp today. Still looking for work?"',
      close: '"My dear! Come, make I buy you ice cream. How your life?"',
    },
  },
  ade: {
    shirt: '#1b1a22',
    trousers: '#1b1a22',
    look: { kind: 'suit' },
    spots: [
      { place: 'street', pos: [-2.0, 0.6], hours: [7, 9] },
      { place: 'street', pos: [-2.0, 0.6], hours: [18, 21] },
    ],
    lines: {
      stranger: '"Good evening, neighbour. I be Barrister Ade, Flat 3. Welcome to the compound."',
      cold: '"Neighbour. I trust say you dey pay your rent as at when due."',
      warm: '"My learned friend! Any wahala with landlord, my door dey open."',
      close: '"Ah, my brother! Come, sit. Make I tell you how I win case today."',
    },
  },
  alhaji: {
    shirt: '#f4f1ec',
    trousers: '#f4f1ec',
    look: { outfit: 'agbada' },
    spots: [
      { place: 'lounge', pos: [2.2, 1.0], hours: [21, 24] },
      { place: 'maitama', pos: [1.2, 0.8], hours: [13, 16] },
    ],
    lines: {
      stranger: '"Young man, you dey look like person wey sabi hustle. Wetin be your name?"',
      cold: '"Hmm. Me I no dey forget face, but I don forget your name."',
      warm: '"Ah! Our boy! Come greet these people. Contract season dey come o."',
      close: '"My son! Anything you want, call me direct. No pass through my PA."',
    },
  },
  aisha: {
    shirt: '#16a085',
    trousers: '#2c3e50',
    look: { woman: true, kind: 'w_suit' },
    spots: [{ place: 'maitama', pos: [-2.6, 0.6], hours: [8, 14], days: WEEKDAYS }],
    lines: {
      stranger: '"Next! Oh sorry, you no dey the queue? Me na Aisha, I dey work for embassy."',
      cold: '"Documents complete? No be me dey decide visa o."',
      warm: '"Ah you! Make sure your bank statement fat before you come o 😄"',
      close: '"My friend! Come, I go tell you exactly wetin dem dey ask for interview."',
    },
  },
  hon: {
    shirt: '#118a4c',
    trousers: '#f4f1ec',
    look: { outfit: 'kaftan' },
    spots: [{ place: 'asokoro', pos: [0.9, 0.6], hours: [9, 15], days: WEEKDAYS }],
    lines: {
      stranger: '"Ehen? You be my constituent? Remember me for 2027 o! Hon. Danjuma."',
      cold: '"My PA go attend to you. I get meeting."',
      warm: '"Ah, my supporter! Your people go benefit from the next project."',
      close: '"You na my boy! Come Monday, we go discuss that supply contract."',
    },
  },
  amaka: {
    shirt: '#7a1f3d',
    trousers: '#1b1a22',
    look: { woman: true },
    spots: [
      { place: 'lt', pos: [-2.5, 2.4], hours: [9, 14], days: WEEKDAYS },
      { place: 'unilib', pos: [-3.6, 2.6], hours: [15, 21] },
      { place: 'campus', pos: [15, 9], hours: [16, 20], days: [5, 6] },
    ],
    lines: {
      stranger: '"Hi! You dey this lecture too? Abeg you get biro? Mine don finish."',
      cold: '"Oh hey. You read for the test?"',
      warm: '"Coursemate! Come join our study group for library tonight."',
      close: '"My padi! When I become SAN, you go be my first client 😂"',
    },
  },
  tunde: {
    shirt: '#16a085',
    trousers: '#2d2d2d',
    spots: [
      { place: 'campus', pos: [-9, 9], hours: [12, 15] },
      { place: 'unilib', pos: [3, 2.8], hours: [9, 12], days: WEEKDAYS },
      { place: 'lt', pos: [3.2, 3.6], hours: [14, 17], days: WEEKDAYS },
    ],
    lines: {
      stranger: '"Bros, you be fresher? Vote Tunde for SUG next session o! 😎"',
      cold: '"Ah, how far? You don register your courses?"',
      warm: '"My guy! I get gist about the HOD. Come cafeteria make we yarn."',
      close: '"Chairman! Anything you need for this school, na me and you."',
    },
  },
};

/** Contacts standing at `place` at this hour of this day. */
export function npcsAt(place: Place, hour: number, day: number): { id: string; spot: NpcSpot }[] {
  const out: { id: string; spot: NpcSpot }[] = [];
  for (const [id, npc] of Object.entries(NPCS)) {
    const spot = npc.spots.find((s) => s.place === place && hour >= s.hours[0] && hour < s.hours[1] && (!s.days || s.days.includes(day % 7)));
    if (spot) out.push({ id, spot });
  }
  return out;
}

export const npcLine = (id: string, rel: number | undefined) => {
  const l = NPCS[id]?.lines;
  if (!l) return '';
  if (rel === undefined) return l.stranger;
  return rel >= 70 ? l.close : rel >= 40 ? l.warm : l.cold;
};

/** Talking face to face: once a day per person. */
export const TALK_REL = 4;
export const TALK_MINUTES = 15;
