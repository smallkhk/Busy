import type { Activity } from './common';

/** Civil service ladder. `shifts` = office shifts needed at the grade below before you can apply. */
export const GRADES = [
  { title: 'GL 04 · Contract staff', pay: 18000, shifts: 0, longLeg: 0, packaging: 0 },
  { title: 'GL 07 · Admin officer', pay: 28000, shifts: 8, longLeg: 20, packaging: 15 },
  { title: 'GL 10 · Senior officer', pay: 42000, shifts: 15, longLeg: 35, packaging: 25 },
  { title: 'GL 14 · Assistant Director', pay: 70000, shifts: 25, longLeg: 50, packaging: 40 },
  { title: 'Director', pay: 120000, shifts: 40, longLeg: 70, packaging: 55 },
];

export const OFFICE_SHIFT_ID = 'contract';

/** Pay for an activity, given your civil service grade. */
export const payFor = (a: Activity, grade = 0) => (a.id === OFFICE_SHIFT_ID ? GRADES[grade].pay : a.pay ?? 0);

/** Why you can't be promoted yet, or null. */
export function promotionBlock(grade: number, shifts: number, longLeg: number, packaging: number): string | null {
  const next = GRADES[grade + 1];
  if (!next) return 'You don reach the top. Na minister remain 😏';
  if (shifts < next.shifts) return `Do ${next.shifts - shifts} more office shift${next.shifts - shifts > 1 ? 's' : ''}`;
  if (longLeg < next.longLeg) return `Need 🦵 Long Leg ${next.longLeg} (you get ${longLeg})`;
  if (packaging < next.packaging) return `Need 👔 Packaging ${next.packaging}`;
  return null;
}
