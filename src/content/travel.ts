import { ride, type Interactable } from './common';

/** Places you reach from the Kubwa bus stop. Coordinates match the scenes in src/world/places/. */
export const TRAVEL_INTERACTABLES: Interactable[] = [
  // ---------------- Wuse Market ----------------
  {
    id: 'foodstuff',
    place: 'wuse',
    name: 'Foodstuff stall',
    emoji: '🧺',
    label: [-3.2, 2.5, -2.6],
    activities: [
      { id: 'foodstuff-big', label: 'Buy foodstuff (6 meals)', doing: 'Pricing rice, beans & pepper', emoji: '🧺', minutes: 30, cost: 9000, gains: { social: 8 }, effects: { pantry: 6 }, hours: [7, 18], spot: [-3.2, -1.4] },
      { id: 'foodstuff-small', label: 'Buy small foodstuff (2 meals)', doing: 'Buying small small', emoji: '🍅', minutes: 15, cost: 3500, gains: { social: 4 }, effects: { pantry: 2 }, hours: [7, 18], spot: [-3.2, -1.4] },
    ],
  },
  {
    id: 'okrika',
    place: 'wuse',
    name: 'Okrika (thrift) stall',
    emoji: '👕',
    label: [1.6, 2.5, -2.6],
    activities: [
      { id: 'okrika-shirt', label: 'Okrika shirt (first grade)', doing: 'Digging okrika bale', emoji: '👕', minutes: 20, cost: 7000, gains: { fun: 5 }, effects: { packaging: 6 }, hours: [8, 18], spot: [1.6, -1.4] },
      { id: 'okrika-shoe', label: 'Okrika shoe', doing: 'Testing shoe size', emoji: '👞', minutes: 20, cost: 14000, gains: { fun: 5 }, effects: { packaging: 10 }, hours: [8, 18], spot: [1.6, -1.4] },
    ],
  },
  {
    id: 'zobo',
    place: 'wuse',
    name: 'Zobo & puff-puff',
    emoji: '🥤',
    label: [-1.6, 2.0, 1.2],
    activities: [
      { id: 'zobo', label: 'Zobo & puff-puff', doing: 'Drinking cold zobo', emoji: '🥤', minutes: 15, cost: 800, gains: { food: 15, fun: 10 }, hours: [8, 19], spot: [-1.6, 0.0] },
    ],
  },
  {
    id: 'alabaru',
    place: 'wuse',
    name: 'Wheelbarrow',
    emoji: '🛒',
    label: [5.4, 1.8, 0.2],
    activities: [
      { id: 'alabaru', label: 'Alabaru: carry load for customers', doing: 'Pushing wheelbarrow round Wuse', emoji: '🛒', minutes: 240, pay: 6500, gains: { energy: -35, hygiene: -20, fun: -5 }, hours: [7, 15], away: true, spot: [4.8, 0.2] },
    ],
  },
  {
    id: 'wuse-park',
    place: 'wuse',
    name: 'Wuse motor park',
    emoji: '🚌',
    label: [-5.6, 2.8, 3.0],
    activities: [
      ride('wuse-kubwa', 'Bus go your area (home)', '🚌', 'street', 60, 700, [-5.0, 2.2]),
      ride('wuse-jabi', 'Taxi go Jabi Lake Mall', '🚕', 'jabi', 25, 2500, [-5.0, 2.2]),
      ride('wuse-sec', 'Bus go Federal Secretariat', '🏛️', 'secretariat', 30, 500, [-5.0, 2.2]),
    ],
  },

  // ---------------- Jabi Lake Mall ----------------
  {
    id: 'cinema',
    place: 'jabi',
    name: 'Cinema',
    emoji: '🎬',
    label: [-6.4, 3.1, -2.3],
    activities: [
      { id: 'movie', label: 'Watch new Nollywood movie', doing: 'Watching movie for cinema', emoji: '🍿', minutes: 150, cost: 5000, gains: { fun: 50, social: 10 }, hours: [10, 23], spot: [-6.4, -1.6] },
    ],
  },
  {
    id: 'foodcourt',
    place: 'jabi',
    name: 'Food court',
    emoji: '🌯',
    label: [-4.75, 3.1, -2.3],
    activities: [
      { id: 'shawarma', label: 'Shawarma & chapman', doing: 'Enjoying shawarma', emoji: '🌯', minutes: 30, cost: 6500, gains: { food: 50, fun: 15 }, hours: [9, 22], spot: [-4.75, -1.6] },
      { id: 'icecream', label: 'Ice cream', doing: 'Licking ice cream', emoji: '🍦', minutes: 15, cost: 3000, gains: { food: 10, fun: 15 }, hours: [9, 22], spot: [-4.75, -1.6] },
    ],
  },
  {
    id: 'boutique',
    place: 'jabi',
    name: 'Mall shops',
    emoji: '🛍️',
    label: [-3.1, 3.1, -2.3],
    activities: [
      { id: 'designer', label: 'Designer shirt', doing: 'Trying clothes for fitting room', emoji: '👔', minutes: 30, cost: 35000, gains: { fun: 10 }, effects: { packaging: 18, meet: 'okafor' }, hours: [9, 21], spot: [-3.1, -1.6] },
      { id: 'perfume', label: 'Fine perfume', doing: 'Testing perfume', emoji: '🧴', minutes: 15, cost: 15000, gains: { hygiene: 10, fun: 5 }, effects: { packaging: 8 }, hours: [9, 21], spot: [-3.1, -1.6] },
      { id: 'phoneshop', label: 'Sales rep for phone shop', doing: 'Selling phones for mall', emoji: '📱', minutes: 360, pay: 13000, gains: { energy: -22, social: 15, fun: -5 }, hours: [9, 15], requires: { packaging: 25 }, away: true, spot: [-3.1, -1.6] },
    ],
  },
  {
    id: 'lakeside',
    place: 'jabi',
    name: 'Lakeside',
    emoji: '🌊',
    label: [3.0, 1.5, -2.4],
    activities: [
      { id: 'stroll', label: 'Waka by the lake', doing: 'Enjoying lake breeze', emoji: '🌊', minutes: 45, gains: { fun: 15, social: 5 }, hours: [6, 20], spot: [3.0, -1.7] },
      { id: 'selfie', label: 'Snap selfie for AbujaGram', doing: 'Posing for camera', emoji: '🤳', minutes: 10, cost: 200, gains: { fun: 5 }, effects: { packaging: 1 }, hours: [6, 20], spot: [3.0, -1.7] },
    ],
  },
  {
    id: 'jabi-park',
    place: 'jabi',
    name: 'Taxi park',
    emoji: '🚕',
    label: [4.8, 2.0, 3.0],
    activities: [
      ride('jabi-kubwa', 'Taxi go your area (home)', '🚕', 'street', 45, 3500, [4.4, 2.4]),
      ride('jabi-wuse', 'Taxi go Wuse Market', '🚕', 'wuse', 25, 2500, [4.4, 2.4]),
      ride('jabi-sec', 'Taxi go Federal Secretariat', '🏛️', 'secretariat', 20, 2500, [4.4, 2.4]),
    ],
  },

  // ---------------- Federal Secretariat ----------------
  {
    id: 'ministry',
    place: 'secretariat',
    name: 'Ministry entrance',
    emoji: '🏛️',
    label: [0, 3.3, -2.8],
    activities: [
      { id: 'cv', label: 'Submit CV for ministry', doing: 'Waiting for oga for reception', emoji: '📄', minutes: 60, gains: { energy: -5, fun: -5 }, effects: { cv: 1 }, hours: [8, 15], spot: [0, -1.8] },
      { id: 'contract', label: 'Contract staff (GL 04) shift', doing: 'Working for ministry', emoji: '🗂️', minutes: 480, pay: 18000, gains: { energy: -30, fun: -15, social: 10 }, hours: [8, 10], requires: { cv: 3 }, away: true, spot: [0, -1.8] },
    ],
  },
  {
    id: 'buka',
    place: 'secretariat',
    name: 'Buka',
    emoji: '🍛',
    label: [-5.5, 2.3, 1.2],
    activities: [
      { id: 'beans', label: 'Rice & beans + dodo', doing: 'Chopping for buka', emoji: '🍛', minutes: 25, cost: 1800, gains: { food: 45, social: 10 }, effects: { meet: 'garba' }, hours: [8, 17], spot: [-4.8, 0.6] },
      { id: 'biscuit', label: 'Pure water & biscuit', doing: 'Managing biscuit', emoji: '🍪', minutes: 5, cost: 300, gains: { food: 8 }, hours: [7, 19], spot: [-4.8, 0.6] },
    ],
  },
  {
    id: 'bizcentre',
    place: 'secretariat',
    name: 'Business centre',
    emoji: '🖨️',
    label: [-2.6, 2.1, 2.6],
    activities: [
      { id: 'typist', label: 'Typing & photocopy for applicants', doing: 'Typing application letters', emoji: '⌨️', minutes: 180, pay: 5500, gains: { energy: -12, fun: -8, social: 5 }, hours: [8, 15], spot: [-2.6, 1.8] },
    ],
  },
  {
    id: 'sec-bus',
    place: 'secretariat',
    name: 'Bus stop',
    emoji: '🚏',
    label: [5.2, 2.5, 3.2],
    activities: [
      ride('sec-kubwa', 'Bus go your area (home)', '🚌', 'street', 75, 900, [4.6, 2.6]),
      ride('sec-wuse', 'Bus go Wuse Market', '🚌', 'wuse', 30, 500, [4.6, 2.6]),
      ride('sec-jabi', 'Taxi go Jabi Lake Mall', '🚕', 'jabi', 20, 2500, [4.6, 2.6]),
    ],
  },
];
