import type { Activity, Interactable, Place } from './common';
import { poolMatch, ride, tableGame } from './common';
import { JAMB_FEE } from './school';

/**
 * University of Abuja is three layers:
 * - `uniabuja`: the main gate on the city grid, with buses and taxis.
 * - `campus`: the big compound inside the wall: Senate, faculties, lecture
 *   theatre, library, cafeteria, Student Union, hostels, chapel, mosque,
 *   sports field and bookshop.
 * - `lt` and `unilib`: inside the lecture theatre and the library.
 * Every one is its own multiplayer room, so students meet there.
 */

/** Walk in or out of a building. */
const door = (id: string, label: string, to: Place, spot: [number, number], emoji = '🚪'): Activity => ({ id, label, doing: label, emoji, minutes: 2, gains: {}, travelTo: to, spot });

// ---------------- Campus layout (local coordinates of the `campus` place) ----------------
export const CAMPUS = {
  gate: [0, 12] as [number, number],
  senate: [0, -20] as [number, number],
  lt: [-12, -8] as [number, number],
  library: [12, -8] as [number, number],
  field: [0, -6] as [number, number],
  science: [-26, -12] as [number, number],
  engineering: [-26, -1] as [number, number],
  law: [26, -12] as [number, number],
  medicine: [26, -1] as [number, number],
  cafeteria: [-12, 6] as [number, number],
  sub: [12, 6] as [number, number],
  boys: [-27, 10] as [number, number],
  girls: [27, 10] as [number, number],
  chapel: [-14, -22] as [number, number],
  mosque: [14, -22] as [number, number],
  bookshop: [6, 11] as [number, number],
};
/** Where you stand to use a building: just in front of it (toward the gate). */
const front = (p: [number, number], d = 3.2): [number, number] => [p[0], p[1] + d];
const label = (p: [number, number], h = 4.5): [number, number, number] => [p[0], h, p[1]];

export const CAMPUS_INTERACTABLES: Interactable[] = [
  // ---------------- Main gate (on the city grid) ----------------
  {
    id: 'uni-gate',
    place: 'uniabuja',
    name: 'UniAbuja main gate',
    emoji: '🎓',
    label: [0, 4.2, 4.2],
    activities: [
      door('enter-campus', 'Enter campus', 'campus', [0, 5.2], '🎓'),
      ride('uni-home', 'Bus go your area (home)', '🚌', 'street', 80, 1500, [4.4, 5.2]),
      ride('uni-airport', 'Taxi go airport', '🚕', 'airport', 25, 2500, [4.4, 5.2]),
      ride('uni-garki', 'Bus go Garki Area 1', '🚌', 'garki', 60, 800, [4.4, 5.2]),
      ride('uni-sec', 'Bus go Federal Secretariat', '🏛️', 'secretariat', 65, 800, [4.4, 5.2]),
    ],
  },

  // ---------------- Inside the compound ----------------
  {
    id: 'campus-gate',
    place: 'campus',
    name: 'Main gate',
    emoji: '🚪',
    label: label(CAMPUS.gate, 3.6),
    activities: [door('leave-campus', 'Comot from campus', 'uniabuja', CAMPUS.gate)],
  },
  {
    id: 'senate',
    place: 'campus',
    name: 'Senate building',
    emoji: '🏛️',
    label: label(CAMPUS.senate, 7.5),
    activities: [
      { id: 'jamb', label: 'Write JAMB (UTME) at CBT centre', doing: 'Answering 180 questions for computer 🖥️', emoji: '🖥️', minutes: 150, cost: JAMB_FEE, gains: { energy: -15, fun: -10 }, hours: [8, 15], requires: { school: 'applicant' }, spot: front(CAMPUS.senate, 4) },
      { id: 'convocation', label: 'Convocation: collect your degree 🎓', doing: 'Wearing gown, snapping with family 📸', emoji: '🎓', minutes: 180, gains: { fun: 40, social: 30 }, hours: [9, 15], requires: { school: 'convocation' }, spot: front(CAMPUS.senate, 4) },
      { id: 'see-vc', label: 'Queue to see the VC (complain about result)', doing: 'Waiting for VC office 😮‍💨', emoji: '🗂️', minutes: 120, gains: { energy: -10, fun: -15, social: 5 }, effects: { cv: 1 }, hours: [9, 15], spot: front(CAMPUS.senate, 4) },
    ],
  },
  {
    id: 'lt-door',
    place: 'campus',
    name: 'Lecture Theatre (LT 1000)',
    emoji: '🎓',
    label: label(CAMPUS.lt, 5.2),
    activities: [door('enter-lt', 'Enter the lecture theatre', 'lt', front(CAMPUS.lt, 4))],
  },
  {
    id: 'lib-door',
    place: 'campus',
    name: 'University library',
    emoji: '📚',
    label: label(CAMPUS.library, 5.6),
    activities: [door('enter-lib', 'Enter the library', 'unilib', front(CAMPUS.library, 4))],
  },
  {
    id: 'faculty-science',
    place: 'campus',
    name: 'Faculty of Science',
    emoji: '🔬',
    label: label(CAMPUS.science),
    activities: [
      { id: 'tutorial', label: 'Tutorial with coursemates', doing: 'Solving past questions as a group 🧮', emoji: '🧮', minutes: 90, gains: { energy: -8, social: 20 }, effects: { cv: 1, meet: 'tunde' }, hours: [9, 18], spot: [CAMPUS.science[0] + 5, CAMPUS.science[1]] },
      { id: 'lab', label: 'Practical in the lab', doing: 'Mixing chemicals with lab coat 🥼', emoji: '🥼', minutes: 120, gains: { energy: -10, fun: 5 }, effects: { cv: 2 }, hours: [9, 15], spot: [CAMPUS.science[0] + 5, CAMPUS.science[1]] },
    ],
  },
  {
    id: 'faculty-eng',
    place: 'campus',
    name: 'Faculty of Engineering',
    emoji: '🏗️',
    label: label(CAMPUS.engineering),
    activities: [
      { id: 'workshop', label: 'Engineering workshop', doing: 'Welding for workshop 🔥', emoji: '🔧', minutes: 120, gains: { energy: -15, hygiene: -10 }, effects: { cv: 2 }, hours: [9, 15], spot: [CAMPUS.engineering[0] + 5, CAMPUS.engineering[1]] },
    ],
  },
  {
    id: 'faculty-law',
    place: 'campus',
    name: 'Faculty of Law',
    emoji: '⚖️',
    label: label(CAMPUS.law),
    activities: [
      { id: 'moot', label: 'Moot court practice', doing: 'Arguing pretend case with wig 👨🏾‍⚖️', emoji: '⚖️', minutes: 120, gains: { energy: -10, social: 15, fun: 5 }, effects: { cv: 2, meet: 'amaka' }, hours: [10, 17], spot: [CAMPUS.law[0] - 5, CAMPUS.law[1]] },
    ],
  },
  {
    id: 'faculty-med',
    place: 'campus',
    name: 'College of Health Sciences',
    emoji: '🩺',
    label: label(CAMPUS.medicine),
    activities: [
      { id: 'anatomy', label: 'Anatomy class (no faint o)', doing: 'Looking at skeleton 💀', emoji: '💀', minutes: 120, gains: { energy: -12, fun: -5 }, effects: { cv: 2 }, hours: [9, 15], spot: [CAMPUS.medicine[0] - 5, CAMPUS.medicine[1]] },
      { id: 'campus-clinic', label: 'Campus clinic check-up', doing: 'Nurse dey check your BP', emoji: '🩺', minutes: 45, cost: 1000, gains: { energy: 5 }, effects: { cure: ['malaria'] }, hours: [8, 20], spot: [CAMPUS.medicine[0] - 5, CAMPUS.medicine[1]] },
    ],
  },
  {
    id: 'cafeteria',
    place: 'campus',
    name: 'Cafeteria',
    emoji: '🍛',
    label: label(CAMPUS.cafeteria, 3.8),
    activities: [
      { id: 'uni-jollof', label: 'Jollof & plantain (student price)', doing: 'Chopping with coursemates', emoji: '🍛', minutes: 30, cost: 1200, gains: { food: 50, social: 10, fun: 5 }, hours: [7, 21], spot: front(CAMPUS.cafeteria) },
      { id: 'tutor', label: 'Tutor freshers (3 hrs)', doing: 'Teaching 100 level maths', emoji: '🧑🏾‍🏫', minutes: 180, pay: 6000, gains: { energy: -15, social: 15 }, hours: [10, 20], requires: { cv: 3 }, spot: front(CAMPUS.cafeteria) },
    ],
  },
  {
    id: 'sub',
    place: 'campus',
    name: 'Student Union Building (SUB)',
    emoji: '🎤',
    label: label(CAMPUS.sub, 4),
    activities: [
      { id: 'debate', label: 'Debate club meeting', doing: 'Arguing "Is NEPA better than generator?" 🎤', emoji: '🎤', minutes: 90, gains: { social: 25, fun: 15 }, effects: { meet: 'amaka', packaging: 1 }, hours: [16, 20], spot: front(CAMPUS.sub) },
      poolMatch('pool-sub', 500, front(CAMPUS.sub)),
      { id: 'table-tennis', label: 'Play table tennis', doing: 'Smashing ball 🏓', emoji: '🏓', minutes: 45, gains: { fun: 25, energy: -8, social: 10 }, hours: [10, 22], spot: front(CAMPUS.sub) },
      { id: 'dept-party', label: 'Departmental party (Friday night)', doing: 'Dancing with coursemates 🪩', emoji: '🪩', minutes: 180, cost: 2000, gains: { fun: 45, social: 35, energy: -20 }, effects: { meet: 'tunde' }, hours: [19, 24], spot: front(CAMPUS.sub) },
    ],
  },
  {
    id: 'hostel-boys',
    place: 'campus',
    name: 'Boys hostel',
    emoji: '🏠',
    label: label(CAMPUS.boys, 5.5),
    activities: [
      { id: 'hostel-gist', label: 'Gist for hostel with students', doing: 'Gisting about lecturers and crushes', emoji: '🗣️', minutes: 60, gains: { social: 30, fun: 20 }, hours: [16, 24], spot: [CAMPUS.boys[0] + 5, CAMPUS.boys[1]] },
      tableGame('whot', 'whot-hostel', 300, [CAMPUS.boys[0] + 5, CAMPUS.boys[1]]),
      { id: 'hostel-nap', label: 'Rest for friend room', doing: 'Sleeping on friend mattress 😴', emoji: '😴', minutes: 120, gains: { energy: 35 }, hours: [0, 24], spot: [CAMPUS.boys[0] + 5, CAMPUS.boys[1]] },
    ],
  },
  {
    id: 'hostel-girls',
    place: 'campus',
    name: 'Girls hostel',
    emoji: '🏠',
    label: label(CAMPUS.girls, 5.5),
    activities: [
      { id: 'hostel-visit', label: 'Visit girls hostel (before 7pm o)', doing: 'Waiting at porters lodge 🙈', emoji: '🙈', minutes: 60, gains: { social: 25, fun: 15 }, hours: [12, 19], spot: [CAMPUS.girls[0] - 5, CAMPUS.girls[1]] },
    ],
  },
  {
    id: 'sports-field',
    place: 'campus',
    name: 'Sports field',
    emoji: '⚽',
    label: label(CAMPUS.field, 2.2),
    activities: [
      { id: 'campus-ball', label: 'Play ball with students', doing: 'Playing 5-a-side ⚽', emoji: '⚽', minutes: 90, gains: { fun: 30, social: 20, energy: -25, hygiene: -20 }, effects: { fitness: 3 }, hours: [6, 19], spot: [CAMPUS.field[0] + 7, CAMPUS.field[1]] },
    ],
  },
  {
    id: 'chapel',
    place: 'campus',
    name: 'Chapel of Grace',
    emoji: '⛪',
    label: label(CAMPUS.chapel, 5.5),
    activities: [
      { id: 'fellowship', label: 'Fellowship service', doing: 'Singing in fellowship 🙌🏾', emoji: '🙌🏾', minutes: 90, gains: { social: 20, fun: 15 }, hours: [16, 20], spot: front(CAMPUS.chapel) },
    ],
  },
  {
    id: 'campus-mosque',
    place: 'campus',
    name: 'Campus mosque',
    emoji: '🕌',
    label: label(CAMPUS.mosque, 5.5),
    activities: [
      { id: 'campus-prayer', label: 'Pray for campus mosque', doing: 'Praying with brothers 🤲🏾', emoji: '🤲🏾', minutes: 30, gains: { social: 12, fun: 8 }, hours: [5, 21], spot: front(CAMPUS.mosque) },
    ],
  },
  {
    id: 'bookshop',
    place: 'campus',
    name: 'Bookshop & photocopy',
    emoji: '📘',
    label: label(CAMPUS.bookshop, 3),
    activities: [
      { id: 'handout', label: "Buy lecturer's handout", doing: 'Paying for handout (no choice 😅)', emoji: '📘', minutes: 15, cost: 3500, gains: {}, effects: { cv: 1 }, hours: [8, 17], spot: front(CAMPUS.bookshop, 2) },
      { id: 'photocopy', label: 'Photocopy past questions', doing: 'Waiting for photocopy machine', emoji: '🖨️', minutes: 20, cost: 500, gains: {}, effects: { cv: 1 }, hours: [8, 18], spot: front(CAMPUS.bookshop, 2) },
    ],
  },

  // ---------------- Inside the lecture theatre ----------------
  {
    id: 'lt-seats',
    place: 'lt',
    name: 'Lecture seats',
    emoji: '📝',
    label: [0, 2.6, 1.5],
    activities: [
      { id: 'uni-lecture', label: 'Attend lecture (2 hrs)', doing: 'Writing notes as lecturer dey talk 📝', emoji: '📝', minutes: 120, gains: { energy: -12, fun: -5, social: 10 }, effects: { cv: 1 }, hours: [8, 17], requires: { school: 'lecture' }, spot: [1.5, 1.6] },
      { id: 'lecture', label: 'Sit in for lecture (no be student)', doing: 'Hiding for back seat 👀', emoji: '👀', minutes: 120, gains: { energy: -10, fun: -5, social: 8 }, effects: { cv: 1 }, hours: [8, 17], spot: [5.5, 4.6] },
    ],
  },
  {
    id: 'lt-exam',
    place: 'lt',
    name: 'Exam hall desks',
    emoji: '📄',
    label: [-5.5, 2.6, 2.5],
    activities: [
      { id: 'uni-exam', label: 'Write level exam (3 hrs)', doing: 'Sweating for exam hall 😰', emoji: '📄', minutes: 180, gains: { energy: -25, fun: -15 }, hours: [9, 15], requires: { school: 'exam' }, spot: [-5.5, 3.2] },
    ],
  },
  {
    id: 'lt-exit',
    place: 'lt',
    name: 'Door',
    emoji: '🚪',
    label: [7.5, 2.6, 5.4],
    activities: [door('leave-lt', 'Go back outside', 'campus', [7.5, 5.2])],
  },

  // ---------------- Inside the library ----------------
  {
    id: 'lib-tables',
    place: 'unilib',
    name: 'Reading tables',
    emoji: '📖',
    label: [-2, 2.4, 1],
    activities: [
      { id: 'library-read', label: 'Read for library (3 hrs)', doing: 'Reading with library AC 📚', emoji: '📖', minutes: 180, gains: { energy: -15, fun: -5 }, effects: { cv: 2 }, hours: [8, 22], spot: [-2, 1.8] },
      { id: 'group-study', label: 'Group study (whisper o)', doing: 'Reading with coursemates 🤫', emoji: '🤫', minutes: 90, gains: { social: 15, energy: -8 }, effects: { cv: 1, meet: 'amaka' }, hours: [10, 20], spot: [-2, 1.8] },
    ],
  },
  {
    id: 'lib-desk',
    place: 'unilib',
    name: 'Librarian desk',
    emoji: '🗂️',
    label: [5, 2.4, -1],
    activities: [
      { id: 'borrow-book', label: 'Borrow textbook', doing: 'Filling library card', emoji: '📕', minutes: 15, gains: {}, effects: { cv: 1 }, hours: [8, 18], spot: [5, 0] },
      { id: 'e-library', label: 'Use e-library computers', doing: 'Reading journals online 💻', emoji: '💻', minutes: 60, gains: { energy: -5, fun: 5 }, effects: { cv: 1 }, hours: [8, 20], spot: [5, 0] },
    ],
  },
  {
    id: 'lib-exit',
    place: 'unilib',
    name: 'Door',
    emoji: '🚪',
    label: [7.5, 2.4, 5],
    activities: [door('leave-lib', 'Go back outside', 'campus', [7.5, 4.8])],
  },
];

/** The campus and its insides all count as being at UniAbuja (for rides, the map and school). */
export const CAMPUS_PLACES: Place[] = ['campus', 'lt', 'unilib'];
