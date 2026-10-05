import type { Activity } from './common';

export type CourseId = 'degree' | 'coding' | 'tailoring' | 'mechanic';

export type Course = { id: CourseId; name: string; emoji: string; fee: number; classes: number; minutes: number; where: string; unlocks: string };

export const COURSES: Course[] = [
  { id: 'tailoring', name: 'Tailoring apprenticeship', emoji: '🧵', fee: 60000, classes: 6, minutes: 180, where: 'Madam Grace shop, Garki', unlocks: 'Tailor job (₦12k) and 20% off clothes for Drip' },
  { id: 'mechanic', name: 'Mechanic training', emoji: '🔧', fee: 40000, classes: 5, minutes: 180, where: 'Mechanic village, Garki', unlocks: 'Mechanic job (₦11k) and half-price car service' },
  { id: 'coding', name: 'Coding bootcamp', emoji: '💻', fee: 150000, classes: 8, minutes: 180, where: 'Tech hub, Utako', unlocks: 'Remote developer gig (₦45k per day)' },
  { id: 'degree', name: 'Part-time degree (B.Sc)', emoji: '🎓', fee: 250000, classes: 12, minutes: 240, where: 'University of Abuja (evening)', unlocks: 'Bank graduate trainee job (₦35k) and +10 Packaging' },
];

export const courseById = (id: string) => COURSES.find((c) => c.id === id);

/** One class: away for a few hours, tiring, a little social. */
export const CLASS_ACTIVITIES: Activity[] = COURSES.map((c) => ({
  id: `class-${c.id}`,
  label: `${c.name}: attend class`,
  doing: `In class: ${c.name}`,
  emoji: c.emoji,
  minutes: c.minutes,
  gains: { energy: -15, fun: -5, social: 8 },
  hours: c.id === 'degree' ? [16, 19] : [8, 16],
  away: true,
  requires: { course: c.id },
}));

/** Jobs you only get with a finished course. */
export const SKILL_JOBS: Activity[] = [
  { id: 'tailor-job', label: 'Sew clothes for customers (5 hrs)', doing: 'Sewing on the machine 🧵', emoji: '🧵', minutes: 300, pay: 12000, gains: { energy: -15, fun: -5, social: 8 }, hours: [8, 17], away: true, requires: { skill: 'tailoring' } },
  { id: 'mechanic-job', label: 'Fix cars for the village (5 hrs)', doing: 'Under a car with spanner 🔧', emoji: '🔧', minutes: 300, pay: 11000, gains: { energy: -25, hygiene: -30, social: 6 }, hours: [8, 16], away: true, requires: { skill: 'mechanic' } },
  { id: 'dev-job', label: 'Remote developer gig (6 hrs)', doing: 'Shipping code for foreign client 💻', emoji: '💻', minutes: 360, pay: 45000, gains: { energy: -25, fun: -5 }, hours: [8, 22], away: true, requires: { skill: 'coding' } },
  { id: 'bank-job', label: 'Bank graduate trainee (7 hrs)', doing: 'Counting money for banking hall 🏦', emoji: '🏦', minutes: 420, pay: 35000, gains: { energy: -28, fun: -10, social: 12 }, hours: [7, 9], away: true, requires: { skill: 'degree' } },
];

// ---------------- Gym & fitness ----------------
export const GYM_FEE = 25000;
export const GYM_DAYS = 30;

export const GYM_WORKOUT: Activity = {
  id: 'gym-workout',
  label: 'Gym workout (1.5 hrs)',
  doing: 'Lifting weights, sweating 💪🏾',
  emoji: '🏋🏾',
  minutes: 90,
  gains: { energy: -20, hygiene: -25, fun: 10 },
  hours: [5, 22],
  away: true,
  requires: { gym: true },
  effects: { fitness: 4 },
};

export type FitnessLevel = { min: number; name: string; emoji: string };
export const FITNESS_LEVELS: FitnessLevel[] = [
  { min: 0, name: 'Couch potato', emoji: '🛋️' },
  { min: 25, name: 'Getting there', emoji: '🚶🏾' },
  { min: 50, name: 'Fit', emoji: '🏃🏾' },
  { min: 75, name: 'Gym rat', emoji: '💪🏾' },
];
export const fitnessLevel = (f: number) => [...FITNESS_LEVELS].reverse().find((l) => f >= l.min)!;

/** Fit people get tired slower at work: energy cost cut by up to 30%. */
export const workEnergyFactor = (fitness: number) => 1 - Math.min(100, Math.max(0, fitness)) * 0.003;
/** Fit people fall sick less: up to 60% of sickness avoided. */
export const sickDodge = (fitness: number) => Math.min(100, Math.max(0, fitness)) * 0.006;
