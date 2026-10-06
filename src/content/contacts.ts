import type { Effect } from '../engine/events';

export type Favour = {
  label: string;
  /** Relationship needed before they go help you. */
  minRel: number;
  cooldownDays: number;
  text: string;
  effect: Effect & { unlock?: string };
};

export type Contact = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  /** 1–5: how much doors this person fit open. */
  influence: number;
  /** Hint shown before you meet them. */
  where: string;
  favour: Favour;
  /** Neighbourhood people: knowing them adds Long Leg but never makes the 100% harder to reach. */
  local?: boolean;
};

export const CONTACTS: Contact[] = [
  {
    id: 'garba',
    name: 'Mallam Garba',
    emoji: '👳🏾‍♂️',
    role: 'Messenger for Secretariat. E know everybody.',
    influence: 2,
    where: 'Chop for the Secretariat buka',
    favour: { label: 'Show me shortcut', minRel: 40, cooldownDays: 7, text: 'E carry your CV pass back door 😏', effect: { cv: 1 } },
  },
  {
    id: 'chinedu',
    name: 'Chinedu',
    emoji: '🧑🏾‍💼',
    role: 'Your old classmate, now admin officer for ministry',
    influence: 3,
    where: 'Old friends dey show face for street',
    favour: { label: 'Push my CV', minRel: 50, cooldownDays: 30, text: '"I don drop your name for director table." Ministry don dey call you 📞', effect: { cv: 3 } },
  },
  {
    id: 'okafor',
    name: 'Mrs. Okafor',
    emoji: '👩🏾‍💼',
    role: 'HR manager for the mall phone shop',
    influence: 3,
    where: 'She like to shop for Jabi Lake Mall',
    favour: { label: 'Recommend me for the phone shop', minRel: 50, cooldownDays: 60, text: '"Come resume Monday. Tell them say na me send you." No packaging needed 🙌', effect: { unlock: 'phoneshop' } },
  },
  {
    id: 'ade',
    name: 'Barrister Ade',
    emoji: '⚖️',
    role: 'Lawyer wey dey your compound',
    influence: 3,
    where: 'Neighbours wey dey gist for compound',
    favour: { label: 'Talk to my landlord', minRel: 45, cooldownDays: 30, text: 'E write landlord letter with big grammar. Landlord give you 2 more weeks 📜', effect: { rentGraceDays: 14 } },
  },
  {
    id: 'alhaji',
    name: 'Alhaji Sani',
    emoji: '🧔🏾',
    role: 'Big contractor. Im phone no dey stop ring.',
    influence: 5,
    where: 'Big men dey owambe',
    favour: { label: 'Give me small contract', minRel: 60, cooldownDays: 14, text: '"Supply 20 office chairs for ministry." You deliver am, collect your cut 💰', effect: { money: 80000 } },
  },
  {
    id: 'aisha',
    name: 'Aisha',
    emoji: '🧕🏾',
    role: 'Visa officer for one embassy for Maitama',
    influence: 3,
    where: 'People wey dey do visa interview for Maitama',
    favour: { label: 'Help me with visa appointment', minRel: 50, cooldownDays: 60, text: '"Your appointment don move forward. Come with complete documents." No need to form big man 🛂', effect: { unlock: 'visa-interview' } },
  },
  {
    id: 'hon',
    name: 'Hon. Danjuma',
    emoji: '🎩',
    role: 'House of Reps member. Im convoy dey make noise for Asokoro',
    influence: 5,
    where: 'Big men dey play golf for Asokoro',
    favour: { label: 'Attach me to constituency project', minRel: 60, cooldownDays: 21, text: '"Supply 50 bags of cement for the borehole project." Your cut land 💰🏗️', effect: { money: 150000 } },
  },
  {
    id: 'amaka',
    name: 'Amaka',
    emoji: '👩🏾‍🎓',
    role: '300L Law student, debate club president. She go be SAN one day.',
    influence: 2,
    where: 'UniAbuja: moot court, debate club or the library',
    favour: { label: 'Share her past questions', minRel: 40, cooldownDays: 5, text: 'She send you neat past questions with answers 📑', effect: { cv: 2 } },
  },
  {
    id: 'tunde',
    name: 'Tunde',
    emoji: '👨🏾‍💻',
    role: 'CS student, tech bro and SUG aspirant. E know every lecturer.',
    influence: 2,
    where: 'UniAbuja: tutorials, cafeteria or departmental party',
    favour: { label: 'Connect you to internship', minRel: 50, cooldownDays: 10, text: 'E link you with fintech internship. Small money land 💸', effect: { money: 20000, cv: 2 } },
  },
  // ---------------- People around Abuja ----------------
  {
    id: 'iyabo',
    name: 'Mama Iyabo',
    emoji: '👩🏾‍🌾',
    role: 'Foodstuff queen for Wuse Market. She know every price.',
    influence: 2,
    where: 'Wuse Market, by the foodstuff stalls',
    favour: { label: 'Bag me foodstuff (Mama price)', minRel: 35, cooldownDays: 7, text: 'She fill bag with rice, beans and pepper for half price 🧺', effect: { pantry: 6, money: -3000 } },
    local: true,
  },
  {
    id: 'nkechi',
    name: 'Dr. Nkechi',
    emoji: '👩🏾‍⚕️',
    role: 'Doctor for General Hospital. Always on call, never sleep.',
    influence: 3,
    where: 'General Hospital, weekdays',
    favour: { label: 'Check me well (free)', minRel: 45, cooldownDays: 7, text: '"Drink water, rest, no stress." She check you free and give you vitamin 💊', effect: { needs: { energy: 30, hygiene: 10, fun: 5 } } },
    local: true,
  },
  {
    id: 'yakubu',
    name: 'Sergeant Yakubu',
    emoji: '👮🏾‍♂️',
    role: 'Police sergeant for Garki Area 1 division.',
    influence: 3,
    where: 'Garki Area 1, by the motor park',
    favour: { label: 'Clean my name for station', minRel: 50, cooldownDays: 14, text: '"I don talk to them. Nobody go disturb you again." Police heat drop 🚔', effect: { heat: -40 } },
    local: true,
  },
  {
    id: 'hauwa',
    name: 'Hajia Hauwa',
    emoji: '🧕🏾',
    role: 'Runs the biggest adashe (thrift) for Nyanya market.',
    influence: 2,
    where: 'Nyanya market',
    favour: { label: 'Collect my adashe turn', minRel: 40, cooldownDays: 14, text: 'Na your turn for the adashe! She count the money give you 💵', effect: { money: 25000 } },
    local: true,
  },
  {
    id: 'obinna',
    name: 'Obinna Banex',
    emoji: '📱',
    role: 'Phone and laptop dealer for Utako. E fit find any gadget.',
    influence: 2,
    where: 'Utako, by the tech hub',
    favour: { label: 'Give me phone supply deal', minRel: 45, cooldownDays: 10, text: 'E give you 5 phones to sell for your people. Your profit land 📱💸', effect: { money: 20000 } },
    local: true,
  },
  {
    id: 'bala',
    name: 'Coach Bala',
    emoji: '🧑🏾‍🏫',
    role: 'Football coach for National Stadium. E train Super Eagles players before.',
    influence: 2,
    where: 'National Stadium, morning and evening training',
    favour: { label: 'Put me for amateur match', minRel: 40, cooldownDays: 7, text: 'You play 30 minutes, score one goal. Crowd shout your name ⚽📈', effect: { needs: { fun: 25, energy: -15 }, followersPct: 8 } },
    local: true,
  },
  {
    id: 'zainab',
    name: 'Zainab',
    emoji: '👩🏾‍🎨',
    role: 'Painter wey dey sell art for Millennium Park.',
    influence: 1,
    where: 'Millennium Park, afternoons and weekends',
    favour: { label: 'Paint my portrait', minRel: 35, cooldownDays: 14, text: 'She paint you like Oba, post am for Gram. People dey ask who you be 🎨', effect: { followersPct: 12, needs: { fun: 15 } } },
    local: true,
  },
  {
    id: 'ifeanyi',
    name: 'Captain Ifeanyi',
    emoji: '👨🏾‍✈️',
    role: 'Zuma Air pilot. E don fly to 40 countries.',
    influence: 4,
    where: 'Nnamdi Azikiwe Airport, by the departure hall',
    favour: { label: 'Connect me to cargo work', minRel: 55, cooldownDays: 14, text: 'E connect you to airport cargo agent. You carry the paperwork, collect your cut ✈️💰', effect: { money: 45000, cv: 1 } },
    local: true,
  },
  {
    id: 'dauda',
    name: 'Chairman Dauda',
    emoji: '🏍️',
    role: 'Okada union chairman for Mararaba. Area boys dey hear im word.',
    influence: 2,
    where: 'Mararaba, by the okada stand',
    favour: { label: 'Make area boys leave me alone', minRel: 40, cooldownDays: 14, text: '"Nobody go touch you for this side again." Police and agbero heat drop 🤝', effect: { heat: -15, needs: { social: 10 } } },
    local: true,
  },
];

export const contactById = (id: string) => CONTACTS.find((c) => c.id === id);

export type ContactState = { rel: number; lastFavourDay?: number; lastCallDay?: number; lastGiftDay?: number; lastTalkDay?: number; /** Last day you knelt to greet them. */ lastGreetDay?: number };

export const FIRST_MEET_REL = 30;
export const CALL_COST = 200;
export const GIFT_COST = 5000;

const MAX_LONG_LEG = CONTACTS.filter((c) => !c.local).reduce((sum, c) => sum + 100 * c.influence, 0);

/** 0–100: weighted by how much each person can open doors for you. */
export function longLeg(contacts: Record<string, ContactState>): number {
  const total = CONTACTS.reduce((sum, c) => sum + (contacts[c.id]?.rel ?? 0) * c.influence, 0);
  return Math.min(100, Math.round((total / MAX_LONG_LEG) * 100));
}
