import type { Activity } from './common';

/**
 * University of Abuja, full-time. Write JAMB, get admission into a course,
 * pay school fees every session, attend lectures, read for library, write the
 * exam at the end of each level, carry over if you fail, survive ASUU strike,
 * and graduate with a class of degree that decides your graduate pay.
 */

export type ProgrammeId = 'cs' | 'accounting' | 'masscomm' | 'law' | 'medicine' | 'engineering';

export type Programme = {
  id: ProgrammeId;
  name: string;
  emoji: string;
  /** Levels to finish (100L, 200L…). */
  years: number;
  /** School fees per session. */
  fees: number;
  /** JAMB score you need. */
  cutoff: number;
  /** Graduate job and its pay for a Second Class Lower (better grades pay more). */
  job: { id: string; label: string; doing: string; emoji: string; minutes: number; pay: number; hours: [number, number] };
  /** Packaging when you graduate. */
  packaging: number;
};

export const PROGRAMMES: Programme[] = [
  { id: 'masscomm', name: 'B.Sc Mass Communication', emoji: '🎙️', years: 4, fees: 95000, cutoff: 180, packaging: 14, job: { id: 'grad-masscomm', label: 'TV/radio presenter shift (5 hrs)', doing: 'On air for Abuja FM 🎙️', emoji: '🎙️', minutes: 300, pay: 30000, hours: [6, 22] } },
  { id: 'accounting', name: 'B.Sc Accounting', emoji: '📊', years: 4, fees: 110000, cutoff: 190, packaging: 12, job: { id: 'grad-accounting', label: 'Accountant at a firm (7 hrs)', doing: 'Balancing ledger for audit 📊', emoji: '📊', minutes: 420, pay: 40000, hours: [7, 10] } },
  { id: 'cs', name: 'B.Sc Computer Science', emoji: '💻', years: 4, fees: 120000, cutoff: 200, packaging: 12, job: { id: 'grad-cs', label: 'Software engineer (7 hrs)', doing: 'Building app for fintech 💻', emoji: '💻', minutes: 420, pay: 55000, hours: [7, 12] } },
  { id: 'engineering', name: 'B.Eng Civil Engineering', emoji: '🏗️', years: 5, fees: 140000, cutoff: 220, packaging: 15, job: { id: 'grad-engineering', label: 'Site engineer (7 hrs)', doing: 'Supervising road project with helmet 🏗️', emoji: '🏗️', minutes: 420, pay: 50000, hours: [6, 10] } },
  { id: 'law', name: 'LL.B Law', emoji: '⚖️', years: 5, fees: 150000, cutoff: 230, packaging: 20, job: { id: 'grad-law', label: 'Lawyer in chambers (7 hrs)', doing: 'Arguing case for court ⚖️', emoji: '⚖️', minutes: 420, pay: 60000, hours: [7, 10] } },
  { id: 'medicine', name: 'MBBS Medicine & Surgery', emoji: '🩺', years: 6, fees: 200000, cutoff: 260, packaging: 25, job: { id: 'grad-medicine', label: 'Doctor on call (8 hrs)', doing: 'Seeing patients for General Hospital 🩺', emoji: '🩺', minutes: 480, pay: 80000, hours: [6, 20] } },
];

export const programmeById = (id: string | undefined) => PROGRAMMES.find((p) => p.id === id);

export const JAMB_FEE = 6200;
/** Lectures you must attend before you can write the level exam. */
export const LECTURES_PER_LEVEL = 4;
/** Library sessions that count toward exam prep each level. */
export const MAX_STUDY = 3;
/** Chance a new session starts with ASUU on strike, and how long it lasts. */
export const STRIKE_CHANCE = 0.15;
export const STRIKE_DAYS: [number, number] = [2, 5];
/** "Sort" admission with connection: adds points, but sometimes na scam. */
export const RUNS_COST = 150000;
export const RUNS_POINTS = 30;
export const RUNS_SCAM = 0.3;

export type School = {
  /** Best JAMB score so far. */
  jamb?: number;
  programme?: ProgrammeId;
  /** 1 = 100 level. */
  level: number;
  feesPaid: boolean;
  lectures: number;
  study: number;
  /** Grade point (0–5) of each level you passed or failed, in order. */
  results: number[];
  /** Day ASUU strike ends (lectures and exams stop till then). */
  strikeUntil?: number;
  /** Finished the last exam; waiting for convocation. */
  finalist?: boolean;
  graduated?: { programme: ProgrammeId; cgpa: number };
};

export const NO_SCHOOL: School = { level: 1, feesPaid: false, lectures: 0, study: 0, results: [] };

/** JAMB score out of 400: your CV (what you know) helps, luck does the rest. */
export function jambScore(cv: number, rand: () => number): number {
  const s = 140 + Math.min(cv, 40) * 3 + rand() * 110;
  return Math.max(100, Math.min(400, Math.round(s)));
}

/** Programmes your JAMB score fit enter. */
export const admissible = (jamb: number | undefined) => PROGRAMMES.filter((p) => (jamb ?? 0) >= p.cutoff);

/** Grade point for a level exam (0–5): attendance, library, fitness and a bit of luck. */
export function examGrade(sc: Pick<School, 'lectures' | 'study'>, fitness: number, rand: () => number): number {
  const attend = Math.min(1, sc.lectures / LECTURES_PER_LEVEL);
  const read = Math.min(1, sc.study / MAX_STUDY);
  // Lectures alone no go carry you: skip the library and you fit carry over
  const s = attend * 0.25 + read * 0.35 + Math.min(100, fitness) * 0.0005 + rand() * 0.3;
  return Math.round(Math.max(0, Math.min(5, s * 5)) * 100) / 100;
}

/** Below this you carry over and repeat the level. */
export const PASS_GP = 1.5;

export const cgpaOf = (results: number[]) => {
  const passed = results.filter((g) => g >= PASS_GP);
  return passed.length ? Math.round((passed.reduce((a, b) => a + b, 0) / passed.length) * 100) / 100 : 0;
};

export type DegreeClass = { name: string; min: number; pay: number };
export const CLASSES: DegreeClass[] = [
  { name: 'First Class', min: 4.5, pay: 1.35 },
  { name: 'Second Class Upper', min: 3.5, pay: 1.15 },
  { name: 'Second Class Lower', min: 2.4, pay: 1 },
  { name: 'Third Class', min: 1.5, pay: 0.85 },
  { name: 'Pass', min: 0, pay: 0.75 },
];
export const degreeClass = (cgpa: number) => CLASSES.find((c) => cgpa >= c.min)!;

/** Pay for a graduate job, by your class of degree. */
export function gradPay(base: number, sc: School | undefined): number {
  const c = sc?.graduated ? degreeClass(sc.graduated.cgpa) : CLASSES[2];
  return Math.round((base * c.pay) / 100) * 100;
}

export const levelName = (level: number) => `${level * 100} Level`;

/** Why a school activity no fit happen now (undefined = go ahead). */
export type SchoolNeed = 'applicant' | 'lecture' | 'study' | 'exam' | 'convocation' | `grad:${ProgrammeId}`;

export function schoolBlock(sc: School | undefined, need: SchoolNeed, day: number): string | undefined {
  const s = sc ?? NO_SCHOOL;
  const strike = s.strikeUntil !== undefined && day <= s.strikeUntil;
  if (need.startsWith('grad:')) {
    const p = need.slice(5);
    return s.graduated?.programme === p ? undefined : `Na only ${programmeById(p)?.name} graduates fit do this job`;
  }
  switch (need) {
    case 'applicant':
      if (s.programme) return 'You don already get admission 🎓';
      return undefined;
    case 'lecture':
    case 'study':
    case 'exam':
      if (!s.programme) return 'You never get admission. Write JAMB and check 🎓 UniAbuja portal';
      if (s.graduated) return 'You don graduate already 🎓';
      if (s.finalist) return 'You don finish! Go for convocation';
      if (!s.feesPaid) return `Pay ${levelName(s.level)} school fees first (🎓 UniAbuja portal)`;
      if (strike && need !== 'study') return `ASUU dey on strike till Day ${s.strikeUntil} 😩 Read for library while you wait`;
      if (need === 'exam' && s.lectures < LECTURES_PER_LEVEL) return `Attend ${LECTURES_PER_LEVEL - s.lectures} more lecture(s) before exam`;
      if (need === 'lecture' && s.lectures >= LECTURES_PER_LEVEL) return 'You don attend all your lectures. Read or write exam!';
      return undefined;
    case 'convocation':
      if (s.graduated) return 'You don convocate already 🎓';
      if (!s.finalist) return 'You never finish your final exams';
      return undefined;
  }
  return undefined;
}

/** Graduate jobs, one per programme (pay is scaled by your class of degree). */
export const GRAD_JOBS: Activity[] = PROGRAMMES.map((p) => ({
  ...p.job,
  gains: { energy: -28, fun: -8, social: 12 },
  away: true,
  requires: { school: `grad:${p.id}` },
}));
