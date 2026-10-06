import { ride, type Interactable } from './common';
import { JAMB_FEE } from './school';

/**
 * University of Abuja, Gwagwalada: lectures, the library, the school buka and
 * the campus gate with buses back to town. Same layout as the districts:
 * three spots along the back and a motor park front right.
 */
const A: [number, number] = [-4.2, -1.3];
const B: [number, number] = [-0.6, -1.3];
const C: [number, number] = [2.8, -1.2];
const GATE: [number, number] = [4.4, 2.6];

export const CAMPUS_INTERACTABLES: Interactable[] = [
  {
    id: 'lecture-theatre',
    place: 'uniabuja',
    name: 'Lecture theatre',
    emoji: '🎓',
    label: [-4.2, 3.4, -2.8],
    activities: [
      { id: 'uni-lecture', label: 'Attend lecture (2 hrs)', doing: 'Writing notes as lecturer dey talk 📝', emoji: '📝', minutes: 120, gains: { energy: -12, fun: -5, social: 10 }, effects: { cv: 1 }, hours: [8, 17], requires: { school: 'lecture' }, spot: A },
      { id: 'uni-exam', label: 'Write level exam (3 hrs)', doing: 'Sweating for exam hall 😰', emoji: '📄', minutes: 180, gains: { energy: -25, fun: -15 }, hours: [9, 15], requires: { school: 'exam' }, spot: A },
      { id: 'lecture', label: 'Sit in for lecture (no be student)', doing: 'Hiding for back seat 👀', emoji: '👀', minutes: 120, gains: { energy: -10, fun: -5, social: 8 }, effects: { cv: 1 }, hours: [8, 17], spot: A },
    ],
  },
  {
    id: 'uni-library',
    place: 'uniabuja',
    name: 'University library',
    emoji: '📚',
    label: [-0.6, 3.6, -2.8],
    activities: [
      { id: 'library-read', label: 'Read for library (3 hrs)', doing: 'Reading with library AC 📚', emoji: '📖', minutes: 180, gains: { energy: -15, fun: -5 }, effects: { cv: 2 }, hours: [8, 22], spot: B },
      { id: 'handout', label: "Buy lecturer's handout", doing: 'Paying for handout (no choice 😅)', emoji: '📘', minutes: 15, cost: 3500, gains: {}, effects: { cv: 1 }, hours: [8, 17], spot: B },
    ],
  },
  {
    id: 'uni-buka',
    place: 'uniabuja',
    name: 'School buka',
    emoji: '🍛',
    label: [2.8, 2.6, -2.4],
    activities: [
      { id: 'uni-jollof', label: 'Jollof & plantain (student price)', doing: 'Chopping with coursemates', emoji: '🍛', minutes: 30, cost: 1200, gains: { food: 50, social: 10, fun: 5 }, hours: [7, 21], spot: C },
      { id: 'tutor', label: 'Tutor freshers (3 hrs)', doing: 'Teaching 100 level maths', emoji: '🧑🏾‍🏫', minutes: 180, pay: 6000, gains: { energy: -15, social: 15 }, hours: [10, 20], requires: { cv: 3 }, spot: C },
    ],
  },
  {
    id: 'uni-gate',
    place: 'uniabuja',
    name: 'Admin block & gate',
    emoji: '🏛️',
    label: [5.0, 2.4, 3.0],
    activities: [
      { id: 'jamb', label: 'Write JAMB (UTME) at CBT centre', doing: 'Answering 180 questions for computer 🖥️', emoji: '🖥️', minutes: 150, cost: JAMB_FEE, gains: { energy: -15, fun: -10 }, hours: [8, 15], requires: { school: 'applicant' }, spot: GATE },
      { id: 'convocation', label: 'Convocation: collect your degree 🎓', doing: 'Wearing gown, snapping with family 📸', emoji: '🎓', minutes: 180, gains: { fun: 40, social: 30 }, hours: [9, 15], requires: { school: 'convocation' }, spot: GATE },
      { id: 'hostel-gist', label: 'Gist for hostel with students', doing: 'Gisting about lecturers and crushes', emoji: '🗣️', minutes: 60, gains: { social: 30, fun: 20 }, hours: [16, 23], spot: GATE },
      ride('uni-home', 'Bus go your area (home)', '🚌', 'street', 80, 1500, GATE),
      ride('uni-airport', 'Taxi go airport', '🚕', 'airport', 25, 2500, GATE),
      ride('uni-garki', 'Bus go Garki Area 1', '🚌', 'garki', 60, 800, GATE),
      ride('uni-sec', 'Bus go Federal Secretariat', '🏛️', 'secretariat', 65, 800, GATE),
    ],
  },
];
