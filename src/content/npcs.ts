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
  // ---------------- People around Abuja ----------------
  iyabo: {
    shirt: '#e67e22',
    look: { woman: true, hat: { type: 'gele', color: '#e67e22', band: '#27ae60' } },
    spots: [{ place: 'wuse', pos: [-2.6, 1.6], hours: [7, 18] }],
    lines: {
      stranger: '"Customer! Wetin you wan buy? Rice, beans, garri, I get everything!"',
      cold: '"Ehen, you don come back. Your foodstuff don finish?"',
      warm: '"My customer! I keep the fresh tomato for you today."',
      close: '"My own pikin! Take this extra pepper, no pay."',
    },
  },
  nkechi: {
    shirt: '#ffffff',
    look: { woman: true },
    spots: [{ place: 'hospital', pos: [1.4, 1.6], hours: [8, 17], days: WEEKDAYS }],
    lines: {
      stranger: '"Hello, you dey okay? You look like person wey never sleep."',
      cold: '"You again? Hope say you dey take the drugs well."',
      warm: '"How body? Come, make I check your BP small."',
      close: '"My favourite patient! Anything you feel, call me straight."',
    },
  },
  yakubu: {
    shirt: '#1f3a5f',
    trousers: '#1f3a5f',
    look: { hat: { type: 'cap', color: '#1f3a5f' } },
    spots: [{ place: 'garki', pos: [1.8, 1.8], hours: [9, 18] }],
    lines: {
      stranger: '"Oga, where you dey go? Show me your particulars."',
      cold: '"Ehen, na you. You dey behave yourself?"',
      warm: '"My friend! This area dey calm today, no wahala."',
      close: '"My guy! If anybody disturb you for Abuja, just call Yakubu."',
    },
  },
  hauwa: {
    shirt: '#16a085',
    look: { woman: true },
    spots: [{ place: 'nyanya', pos: [-2.4, 1.6], hours: [8, 19] }],
    lines: {
      stranger: '"Salaam! You wan join our adashe? Na ₦2,000 every week."',
      cold: '"You don pay this week contribution?"',
      warm: '"My person! Your turn for adashe dey near o."',
      close: '"My person! You be the most faithful member for the whole group."',
    },
  },
  obinna: {
    shirt: '#2d3436',
    spots: [{ place: 'utako', pos: [1.4, 1.8], hours: [9, 19] }],
    lines: {
      stranger: '"Bros, you need phone? iPhone, Samsung, I get all, UK used!"',
      cold: '"You don ready to change that your phone?"',
      warm: '"My customer! New stock land this morning, come check."',
      close: '"My padi! For you, na wholesale price."',
    },
  },
  bala: {
    shirt: '#27ae60',
    trousers: '#1e1e1e',
    spots: [
      { place: 'stadium', pos: [-2.2, 1.6], hours: [7, 11] },
      { place: 'stadium', pos: [-2.2, 1.6], hours: [16, 19] },
    ],
    lines: {
      stranger: '"You get leg? Run two rounds make I see!"',
      cold: '"You still dey come training? Belle don dey come out o."',
      warm: '"Captain! Your first touch don improve well well."',
      close: '"My star player! Scout dey come next week, be ready."',
    },
  },
  zainab: {
    shirt: '#9b59b6',
    look: { woman: true },
    spots: [
      { place: 'park', pos: [1.6, 1.8], hours: [9, 18], days: [0, 6] },
      { place: 'park', pos: [1.6, 1.8], hours: [13, 18] },
    ],
    lines: {
      stranger: '"Hi! You like art? This one na Zuma Rock at sunset."',
      cold: '"You don come check my new painting?"',
      warm: '"Come siddon, let me sketch you small."',
      close: '"My muse! Your portrait na my best work."',
    },
  },
  ifeanyi: {
    shirt: '#ffffff',
    trousers: '#1b2633',
    look: { hat: { type: 'cap', color: '#1b2633' } },
    spots: [{ place: 'airport', pos: [1.2, 1.8], hours: [6, 20] }],
    lines: {
      stranger: '"Good day. You dey travel today? Zuma Air flight dey on time o."',
      cold: '"Ah, the passenger again. Where you dey fly go this time?"',
      warm: '"My friend! Next time wey you fly, tell me, I go greet you for cockpit."',
      close: '"Co-pilot! Anything you need for this airport, na my side."',
    },
  },
  dauda: {
    shirt: '#c0392b',
    spots: [{ place: 'mararaba', pos: [-2.4, 1.6], hours: [7, 20] }],
    lines: {
      stranger: '"Who be this? You no be from this side. Wetin you want?"',
      cold: '"Ehen, you again. You don pay your ticket for union?"',
      warm: '"My person! Any boy disturb you, tell me."',
      close: '"Chairman friend! This Mararaba na your house."',
    },
  },
  // ---------------- Benin City ----------------
  osagie: {
    shirt: '#f4f1ec',
    trousers: '#f4f1ec',
    look: { outfit: 'agbada', hat: { type: 'fila', color: '#b0281f', band: '#d8a53a' } },
    spots: [{ place: 'benin', pos: [-14, -3.2], hours: [10, 16] }],
    lines: {
      stranger: '"Who you be? For this palace, you must greet well before you talk o."',
      cold: '"Ehen, the visitor from Abuja. You don learn how to greet?"',
      warm: '"My son! Come, make I show you where the bronze plaques dey."',
      close: '"Our own pikin! Any time you come Benin, the palace door open for you."',
    },
  },
  efe: {
    shirt: '#e84393',
    look: { woman: true },
    spots: [{ place: 'benin', pos: [-7, -31.6], hours: [9, 18] }],
    lines: {
      stranger: '"Hey! You no be UNIBEN student. You dey visit?"',
      cold: '"Abuja person! You don follow my page?"',
      warm: '"Bestie! Come enter my video, Benin people go love you."',
      close: '"My Abuja G! Next time you come, na my house you go stay."',
    },
  },
  mamaosas: {
    shirt: '#c0392b',
    look: { woman: true, hat: { type: 'gele', color: '#c0392b', band: '#f1c40f' } },
    spots: [{ place: 'benin', pos: [-11, 8.4], hours: [7, 21] }],
    lines: {
      stranger: '"Customer! Banga dey, owo soup dey, starch dey hot!"',
      cold: '"You don come again? Siddon, make I serve you."',
      warm: '"My pikin from Abuja! I keep fresh fish for you today."',
      close: '"My own pikin! Your food dey ready before you even reach."',
    },
  },
  ehi: {
    shirt: '#ffffff',
    spots: [{ place: 'benin', pos: [-17, 12.4], hours: [8, 17], days: [1, 2, 3, 4, 5] }],
    lines: {
      stranger: '"Good day. You dey come for clinic? Queue dey that side."',
      cold: '"You again? Hope say you dey take the drugs."',
      warm: '"My friend! Come, let me check your BP quickly."',
      close: '"Anything you feel for Benin, call me straight."',
    },
  },
  ize: {
    shirt: '#6b4a2f',
    spots: [{ place: 'benin', pos: [6.8, -6.4], hours: [8, 17] }],
    lines: {
      stranger: '"Welcome to Igun Street. Na bronze we dey cast since our great-grandfathers."',
      cold: '"You come back! You wan buy bronze this time?"',
      warm: '"My friend! Come see this new one. E take me two weeks."',
      close: '"My brother! You fit carry my work go anywhere for Nigeria."',
    },
  },
  // ---------------- Lagos ----------------
  kemi: {
    shirt: '#e84393',
    look: { woman: true },
    spots: [{ place: 'lagos', pos: [20.5, 6.6], hours: [10, 18] }],
    lines: {
      stranger: '"Hi babe! Abeg move small, I dey shoot content 📸… wait, you no be Lagos person?"',
      cold: '"Ah, Abuja person! You don follow me for Gram?"',
      warm: '"Bestie! Come enter this video, your face go blow 😂"',
      close: '"My Abuja plug! Next brand deal wey I get, we go share am."',
    },
  },
  chief: {
    shirt: '#f4e3c1',
    trousers: '#f4e3c1',
    look: { outfit: 'agbada', hat: { type: 'fila', color: '#7a1f2b', band: '#d8a53a' } },
    spots: [{ place: 'lagos', pos: [23, -3.4], hours: [17, 24] }],
    lines: {
      stranger: '"Who be this one? You no fit just waka come my front like that o."',
      cold: '"Ehen, the Abuja boy. Wetin you dey sell?"',
      warm: '"My son! Come siddon, order anything. Na Chief dey pay."',
      close: '"My right hand! Any container wey land, your share dey inside."',
    },
  },
  basira: {
    shirt: '#c0392b',
    look: { woman: true, hat: { type: 'gele', color: '#c0392b', band: '#f1c40f' } },
    spots: [{ place: 'lagos', pos: [-2.6, -6.4], hours: [7, 21] }],
    lines: {
      stranger: '"Customer, wetin you go chop? Amala dey, ewedu dey, ponmo plenty!"',
      cold: '"You don come back? Siddon, I go serve you."',
      warm: '"My pikin from Abuja! I keep orisirisi for you today."',
      close: '"My own pikin! You no go pay today, just chop."',
    },
  },
  seun: {
    shirt: '#2d3436',
    spots: [{ place: 'lagos', pos: [3, -30.6], hours: [9, 18] }],
    lines: {
      stranger: '"Hey! You dey into tech? We dey hire, but only cracked people 😎"',
      cold: '"Bro, you don check that link I send you?"',
      warm: '"My guy! Investors dey visit this week. Come help me with the demo."',
      close: '"Co-founder energy! Anything wey we build, your name dey inside."',
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
