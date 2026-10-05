import { genCostFor } from '../content/homeup';
import type { Activity } from '../content/activities';
import { payFor } from '../content/career';
import { formatMinutes, formatNaira } from '../engine/clock';
import { NEED_META, type NeedKey } from '../engine/needs';
import { costAt, durationAt, type BlockState } from '../store/game';

/** One-line summary under an activity button: time, price, pay and effects. */
export function activityDetail(a: Activity, s: BlockState): string {
  const mins = durationAt(a, s.time, s.area, s);
  const price = costAt(a, s);
  return [
    formatMinutes(mins) + (mins > a.minutes ? ' 🚗' : ''),
    payFor(a, s.grade) ? `Pay ${formatNaira(payFor(a, s.grade))}` : price ? formatNaira(price) + (price > (a.cost ?? 0) ? ' 📈' : price < (a.cost ?? 0) ? ' 📉' : '') : 'Free',
    a.requiresPower && !s.power && genCostFor(s.homeUps) ? `+ ${formatNaira(genCostFor(s.homeUps))} gen` : '',
    a.usesPantry ? `-${a.usesPantry} 🧺` : '',
    ...Object.entries(a.gains).map(([k, v]) => `${v! > 0 ? '+' : ''}${v} ${NEED_META[k as NeedKey].emoji}`),
    a.effects?.packaging ? `+${a.effects.packaging} 👔` : '',
    a.effects?.pantry ? `+${a.effects.pantry} 🧺` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
