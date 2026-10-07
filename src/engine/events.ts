import type { Place } from '../content/common';
import type { Needs } from './needs';

export type EventContext = {
  place: Place;
  hour: number;
  day: number;
  money: number;
  power: boolean;
  /** Contacts you don meet. */
  met?: string[];
  /** Packaging minus real wealth: high means fake life. */
  gap?: number;
  followers?: number;
  /** Rent due date don pass and door never lock. */
  rentOverdue?: boolean;
  /** Business ids you own. */
  owned?: string[];
  /** Your civil service grade (0 = GL 04). */
  grade?: number;
  /** Your car condition 0–100, undefined if you no get car. */
  carCondition?: number;
  /** Ego Loan repayment date don pass. */
  loanOverdue?: boolean;
  /** Id of the trip in progress, for commute events. */
  trip?: string;
  /** Police suspicion 0–100. */
  heat?: number;
  /** Long Leg score 0–100. */
  longLeg?: number;
  packaging?: number;
  weather?: 'sunny' | 'cloudy' | 'rain' | 'storm';
  /** Story flags, with the day each was set. */
  flags?: Record<string, number>;
  /** Your official partner (Abuja Love id). */
  partner?: string;
  /** How many people you dey date at once. */
  dating?: number;
  /** You took someone on a date wey pass your pocket. */
  fakeLife?: boolean;
  /** House upgrades you own. */
  homeUps?: string[];
  /** Political office you hold (-1 = none). */
  office?: number;
  campaigning?: boolean;
  votesBought?: boolean;
  /** Today's festival id (sallah, christmas, …). */
  festival?: string;
  /** Areas where you get land or a building in progress. */
  landAt?: string[];
  area?: string;
};

export type Effect = {
  money?: number;
  needs?: Partial<Needs>;
  packaging?: number;
  pantry?: number;
  cv?: number;
  /** Game minutes lost. */
  minutes?: number;
  power?: boolean;
  /** Push the rent due date back. */
  rentGraceDays?: number;
  /** Meet a new contact (or get closer to one you know). */
  meet?: string;
  /** Relationship changes, by contact id. */
  rel?: Record<string, number>;
  /** Percent change in AbujaGram followers. */
  followersPct?: number;
  /** Relationship change with every contact you know. */
  relAll?: number;
  /** Pay off the Ego Loan from your balance. */
  payLoan?: boolean;
  /** Fix your car back to 100. */
  carRepair?: boolean;
  /** Shut a business you own for some days. */
  closeBusiness?: { id: string; days: number };
  /** Police suspicion change. */
  heat?: number;
  /** Damage to your car condition. */
  carWear?: number;
  /** Litres into your car tank. */
  fuel?: number;
  /** Love change with your partner. */
  partnerLove?: number;
  /** Campaign support change (percentage points). */
  support?: number;
  /** Story flags to set (remembered with today's day). */
  flag?: string | string[];
};

/** Weight can depend on who you be: Long Leg, Packaging, police heat… */
export type Outcome = { weight?: number | ((c: EventContext) => number); text: string; effect?: Effect };
export type Choice = { label: string; cost?: number; outcomes: Outcome[]; /** Hide the choice unless this holds. */ when?: (c: EventContext) => boolean };

export type GameEvent = {
  id: string;
  emoji: string;
  title: string;
  text: string;
  /** Shows as an incoming phone call from this person. */
  caller?: string;
  /** 'idle' fires while you dey free; 'commute' fires in the middle of a road trip. */
  trigger: 'idle' | 'commute';
  weight: number;
  when?: (c: EventContext) => boolean;
  /** Game hours before it can fire again. */
  cooldownHours?: number;
  /** Only fires in this city outside Abuja. Away from Abuja, only that city's events (and phone calls) fire. */
  city?: Place;
  choices: Choice[];
};

export type Rand = () => number;

function weighted<T>(items: T[], weightOf: (t: T) => number, rand: Rand): T | undefined {
  const total = items.reduce((sum, t) => sum + weightOf(t), 0);
  if (total <= 0) return undefined;
  let r = rand() * total;
  for (const t of items) {
    r -= weightOf(t);
    if (r < 0) return t;
  }
  return items[items.length - 1];
}

/** Picks an eligible event, or undefined if none qualifies. `history` maps event id to the game minute it last fired. */
export function pickEvent(
  events: GameEvent[],
  trigger: GameEvent['trigger'],
  ctx: EventContext,
  history: Record<string, number>,
  now: number,
  rand: Rand = Math.random,
): GameEvent | undefined {
  const eligible = events.filter((e) => {
    if (e.trigger !== trigger) return false;
    if (e.when && !e.when(ctx)) return false;
    const last = history[e.id];
    return last === undefined || now - last >= (e.cooldownHours ?? 24) * 60;
  });
  return weighted(eligible, (e) => e.weight, rand);
}

export function resolveChoice(choice: Choice, rand: Rand = Math.random, ctx?: EventContext): Outcome {
  const weightOf = (o: Outcome) => Math.max(0, typeof o.weight === 'function' ? (ctx ? o.weight(ctx) : 1) : (o.weight ?? 1));
  return weighted(choice.outcomes, weightOf, rand) ?? choice.outcomes[0];
}

/** Choices you fit pick, with their original index (answerEvent takes that index). */
export const visibleChoices = (e: GameEvent, ctx: EventContext) =>
  e.choices.map((c, i) => ({ c, i })).filter(({ c }) => !c.when || c.when(ctx));

export const HEAT_LEVELS = [
  { min: 0, name: 'Normal', emoji: '🙂' },
  { min: 20, name: 'Suspicious', emoji: '👀' },
  { min: 50, name: 'Known', emoji: '📋' },
  { min: 80, name: 'Wanted', emoji: '🚨' },
] as const;
export const heatLevel = (heat: number) => [...HEAT_LEVELS].reverse().find((l) => heat >= l.min)!;

/** Human summary of an effect, e.g. "-₦5,000 · +20 💬 · 1h lost". */
export function effectChips(effect: Effect | undefined, cost = 0, needEmoji: Record<string, string> = {}): string[] {
  const chips: string[] = [];
  const money = (effect?.money ?? 0) - cost;
  if (money) chips.push(`${money > 0 ? '+' : '-'}₦${Math.abs(money).toLocaleString('en-NG')}`);
  for (const [k, v] of Object.entries(effect?.needs ?? {})) if (v) chips.push(`${v > 0 ? '+' : ''}${v} ${needEmoji[k] ?? k}`);
  if (effect?.packaging) chips.push(`${effect.packaging > 0 ? '+' : ''}${effect.packaging} 👔`);
  if (effect?.pantry) chips.push(`${effect.pantry > 0 ? '+' : ''}${effect.pantry} 🧺`);
  if (effect?.cv) chips.push(`+${effect.cv} 📄`);
  if (effect?.minutes) chips.push(`${effect.minutes >= 60 ? `${Math.round((effect.minutes / 60) * 10) / 10}h` : `${effect.minutes}m`} lost ⏳`);
  if (effect?.power === false) chips.push('Light cut 🕯️');
  if (effect?.followersPct) chips.push(`${effect.followersPct > 0 ? '+' : ''}${effect.followersPct}% 📸 followers`);
  if (effect?.closeBusiness) chips.push(`Business closed ${effect.closeBusiness.days} days 🔒`);
  if (effect?.carRepair) chips.push('Car don fix 🔧');
  if (effect?.support) chips.push(`🗳️ Support ${effect.support > 0 ? '+' : ''}${effect.support}%`);
  if (effect?.partnerLove) chips.push(`${effect.partnerLove > 0 ? '+' : ''}${effect.partnerLove} 💕`);
  if (effect?.fuel) chips.push(`+${effect.fuel}L ⛽`);
  if (effect?.carWear) chips.push(`Car condition -${effect.carWear} 🚗`);
  if (effect?.heat) chips.push(`🚨 Police heat ${effect.heat > 0 ? '+' : ''}${effect.heat}`);
  if (effect?.rentGraceDays) chips.push(`+${effect.rentGraceDays} days to pay rent 🏠`);
  return chips;
}
