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
  /** Ego Loan repayment date don pass. */
  loanOverdue?: boolean;
  /** Id of the trip in progress, for commute events. */
  trip?: string;
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
};

export type Outcome = { weight?: number; text: string; effect?: Effect };
export type Choice = { label: string; cost?: number; outcomes: Outcome[] };

export type GameEvent = {
  id: string;
  emoji: string;
  title: string;
  text: string;
  /** 'idle' fires while you dey free; 'commute' fires in the middle of a road trip. */
  trigger: 'idle' | 'commute';
  weight: number;
  when?: (c: EventContext) => boolean;
  /** Game hours before it can fire again. */
  cooldownHours?: number;
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

export function resolveChoice(choice: Choice, rand: Rand = Math.random): Outcome {
  return weighted(choice.outcomes, (o) => o.weight ?? 1, rand) ?? choice.outcomes[0];
}

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
  if (effect?.rentGraceDays) chips.push(`+${effect.rentGraceDays} days to pay rent 🏠`);
  return chips;
}
