export type Office = { name: string; title: string; emoji: string; longLeg: number; packaging: number; form: number; allowance: number; appointed?: boolean };

/** The ladder: each office needs the one before it. */
export const OFFICES: Office[] = [
  { name: 'Ward Councillor', title: 'Councillor', emoji: '🏘️', longLeg: 10, packaging: 20, form: 100000, allowance: 15000 },
  { name: 'Area Council Chairman', title: 'Chairman', emoji: '🏛️', longLeg: 25, packaging: 35, form: 500000, allowance: 40000 },
  { name: 'House of Reps member', title: 'Hon.', emoji: '🎩', longLeg: 40, packaging: 50, form: 3000000, allowance: 120000 },
  { name: 'Senator', title: 'Distinguished Senator', emoji: '🦅', longLeg: 55, packaging: 65, form: 10000000, allowance: 300000 },
  { name: 'FCT Minister', title: 'Honourable Minister', emoji: '👑', longLeg: 70, packaging: 70, form: 20000000, allowance: 600000, appointed: true },
];

export const CAMPAIGN_DAYS = 5;
export const TERM_DAYS = 30;

export type Campaign = { target: number; support: number; electionDay: number; done: Partial<Record<CampaignMove, number>> };
export type Politics = { office: number; termEnds?: number; campaign?: Campaign; votesBought?: boolean };
export const NO_POLITICS: Politics = { office: -1 };

export type CampaignMove = 'rally' | 'door' | 'elders' | 'rice';

export const MOVES: { id: CampaignMove; label: string; emoji: string; minutes: number; cost: (target: number) => number; blurb: string }[] = [
  { id: 'door', label: 'Door-to-door canvassing', emoji: '🚪', minutes: 240, cost: () => 0, blurb: 'Free, tiring, small small support' },
  { id: 'rally', label: 'Hold rally with music & DJ', emoji: '📣', minutes: 180, cost: (t) => 30000 * (t + 1) ** 2, blurb: 'Big crowd. Your Packaging decide how dem see you' },
  { id: 'elders', label: 'Lobby party elders', emoji: '🤝', minutes: 120, cost: (t) => 50000 * (t + 1) ** 2, blurb: 'Your Long Leg dey work here' },
  { id: 'rice', label: 'Share rice & "transport money"', emoji: '🍚', minutes: 150, cost: (t) => 100000 * (t + 1) ** 2, blurb: 'Plenty votes… but EFCC dey watch 👀' },
];

/** Support gained from one campaign move. */
export function moveSupport(move: CampaignMove, ctx: { packaging: number; longLeg: number }): number {
  switch (move) {
    case 'door':
      return 3;
    case 'rally':
      return Math.round(4 + ctx.packaging / 20);
    case 'elders':
      return Math.round(2 + ctx.longLeg / 8);
    case 'rice':
      return 12;
  }
}

export const startingSupport = (packaging: number) => Math.round(20 + packaging / 5);

/** Election day: your support plus some luck against the other candidates. */
export const electionWon = (support: number, luck: number) => support + (luck - 0.5) * 24 > 50;

/** For appointed office: the President's call depends on your Long Leg. */
export const appointChance = (longLeg: number) => Math.min(0.9, Math.max(0.05, (longLeg - 50) / 50));

/** Can you go for office `target` now? Returns a reason when you can't. */
export function canRun(target: number, p: Politics, ctx: { longLeg: number; packaging: number; money: number }): string | null {
  const o = OFFICES[target];
  if (!o) return 'No such office';
  if (p.campaign) return 'You dey campaign already';
  if (target > p.office + 1) return `First win ${OFFICES[target - 1].name}`;
  if (target < p.office) return 'You don pass that level';
  if (ctx.longLeg < o.longLeg) return `Need 🦵 Long Leg ${o.longLeg} (you get ${ctx.longLeg})`;
  if (ctx.packaging < o.packaging) return `Need 👔 Packaging ${o.packaging}`;
  if (ctx.money < o.form) return `Nomination form na ${o.form.toLocaleString('en-NG')}`;
  return null;
}
