import type { Activity } from '../content/activities';
import { formatMinutes, formatNaira } from '../engine/clock';
import { NEED_META, type NeedKey } from '../engine/needs';
import { durationAt, type BlockState } from '../store/game';

/** One-line summary under an activity button: time, price, pay and effects. */
export function activityDetail(a: Activity, s: BlockState): string {
  const mins = durationAt(a, s.time, s.area);
  return [
    formatMinutes(mins) + (mins > a.minutes ? ' 🚗' : ''),
    a.pay ? `Pay ${formatNaira(a.pay)}` : a.cost ? formatNaira(a.cost) : 'Free',
    a.requiresPower && !s.power ? '+ ₦1,000 gen' : '',
    a.usesPantry ? `-${a.usesPantry} 🧺` : '',
    ...Object.entries(a.gains).map(([k, v]) => `${v! > 0 ? '+' : ''}${v} ${NEED_META[k as NeedKey].emoji}`),
    a.effects?.packaging ? `+${a.effects.packaging} 👔` : '',
    a.effects?.pantry ? `+${a.effects.pantry} 🧺` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
