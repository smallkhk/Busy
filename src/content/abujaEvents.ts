import type { GameEvent } from '../engine/events';

/** Little Abuja moments at the places that never had their own: hospital, stadium, park, airport, market and the road. */
const day = (h: number) => h >= 7 && h < 20;

export const ABUJA_EVENTS: GameEvent[] = [
  {
    id: 'vip-convoy',
    emoji: '🚨',
    title: 'Convoy don block road',
    text: 'Siren everywhere! "Clear road! Clear road!" One Oga convoy of 14 cars dey pass. Police don stop all traffic.',
    trigger: 'commute',
    weight: 2,
    cooldownHours: 72,
    choices: [
      { label: 'Wait patiently', outcomes: [{ text: 'You wait 40 minutes under sun. Na Abuja life 😮‍💨', effect: { minutes: 40, needs: { fun: -8 } } }] },
      {
        label: 'Follow behind the convoy',
        outcomes: [
          { weight: 1, text: 'Your driver enter convoy tail, you reach on time 😎', effect: { needs: { fun: 10 } } },
          { weight: 1, text: 'Mobile police drag your driver comot. ₦5,000 "settlement" 😭', effect: { money: -5000, heat: 5, minutes: 30 } },
        ],
      },
    ],
  },
  {
    id: 'harmattan',
    emoji: '🌫️',
    title: 'Harmattan dust',
    text: 'Dust full everywhere, your lips don crack and your nose dey itch. Hawker dey sell face mask and Vaseline.',
    trigger: 'idle',
    weight: 1,
    cooldownHours: 120,
    when: (c) => c.place !== 'home' && c.place !== 'cabin' && c.place !== 'lagos' && day(c.hour),
    choices: [
      { label: 'Buy mask & Vaseline', cost: 800, outcomes: [{ text: 'Your face don shine like new car 😂', effect: { needs: { hygiene: 10 } } }] },
      { label: 'Manage am', outcomes: [{ text: 'You don turn ash-colour. Bath go help you later 🫠', effect: { needs: { hygiene: -12, fun: -5 } } }] },
    ],
  },
  {
    id: 'blood-donor',
    emoji: '🩸',
    title: 'Blood dey needed',
    text: 'One woman dey cry for the ward: "Abeg, my son need blood, O+. Anybody?" Nurse dey look you.',
    trigger: 'idle',
    weight: 4,
    cooldownHours: 96,
    when: (c) => c.place === 'hospital',
    choices: [
      { label: 'Donate blood', outcomes: [{ text: 'Dem take one pint. The woman hug you, Dr. Nkechi hail you. You feel weak but proud 🙏🏾', effect: { needs: { energy: -20, social: 20, fun: 10 }, rel: { nkechi: 8 } } }] },
      { label: 'Give ₦5,000 for blood bank', cost: 5000, outcomes: [{ text: '"God bless you!" The money go buy blood from bank.', effect: { needs: { social: 10 } } }] },
      { label: 'Look away', outcomes: [{ text: 'You comot quietly. E dey pain you small 😔', effect: { needs: { fun: -10 } } }] },
    ],
  },
  {
    id: 'stadium-tout',
    emoji: '🎟️',
    title: 'Super Eagles friendly today!',
    text: 'Tout dey whisper: "Bros, VIP ticket for Super Eagles match, ₦6,000 only. Gate don close o."',
    trigger: 'idle',
    weight: 4,
    cooldownHours: 96,
    when: (c) => c.place === 'stadium' && c.hour >= 12 && c.hour < 19,
    choices: [
      {
        label: 'Buy the ticket',
        cost: 6000,
        outcomes: [
          { weight: 3, text: 'Original ticket! Osimhen score two, the whole stadium shake 🦅⚽', effect: { needs: { fun: 35, social: 20 } } },
          { weight: 1, text: 'Fake ticket 😭 Gate man laugh you. You watch am for viewing centre outside.', effect: { needs: { fun: 5 } } },
        ],
      },
      {
        label: 'Climb fence',
        outcomes: [
          { weight: 1, text: 'You land inside! Best match of your life 😂', effect: { needs: { fun: 30, energy: -10 } } },
          { weight: 1, text: 'Steward catch you, carry you go police post.', effect: { heat: 10, needs: { fun: -10 }, minutes: 60 } },
        ],
      },
      { label: 'Waka pass', outcomes: [{ text: 'You hear the crowd shout from outside. Next time 🙂', effect: {} }] },
    ],
  },
  {
    id: 'park-proposal',
    emoji: '💍',
    title: 'Proposal for the park!',
    text: 'One guy don kneel down for the fountain with ring. Everybody gather. The babe dey cover face.',
    trigger: 'idle',
    weight: 4,
    cooldownHours: 120,
    when: (c) => c.place === 'park' && day(c.hour),
    choices: [
      {
        label: 'Film am for Gram',
        outcomes: [
          { weight: 2, text: 'She say YES! 😍 Your video blow, everybody dey share am.', effect: { followersPct: 6, needs: { fun: 15 } } },
          { weight: 1, text: 'She say NO and waka 😭 Your video still blow, for the wrong reason.', effect: { followersPct: 9, needs: { fun: 10 } } },
        ],
      },
      { label: 'Clap and hype them', outcomes: [{ text: '"Say yes! Say yes!" She say yes, everybody dance 🎉', effect: { needs: { social: 15, fun: 15 } } }] },
    ],
  },
  {
    id: 'airport-tout',
    emoji: '🛂',
    title: 'Fast-track man',
    text: '"Oga, you no wan queue? Give me ₦10,000, I go pass you through protocol." Im ID card dey look somehow.',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 96,
    when: (c) => c.place === 'airport',
    choices: [
      {
        label: 'Pay am',
        cost: 10000,
        outcomes: [
          { weight: 1, text: 'E carry you pass VIP door. Na real protocol 😮', effect: { needs: { fun: 10 } } },
          { weight: 2, text: 'E collect the money and vanish inside crowd 🏃🏾‍♂️💨', effect: { needs: { fun: -15 } } },
        ],
      },
      { label: '"I no dey travel today"', outcomes: [{ text: 'E hiss, find another customer 🙄', effect: {} }] },
    ],
  },
  {
    id: 'market-carry',
    emoji: '🧺',
    title: 'Mama need help',
    text: 'One market woman dey struggle with three bags of pepper. "My pikin, abeg help me carry am reach my shop."',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 72,
    when: (c) => (c.place === 'wuse' || c.place === 'nyanya' || c.place === 'mararaba') && day(c.hour),
    choices: [
      { label: 'Help her', outcomes: [{ text: 'She bless you with prayer and dash you tomatoes 🍅', effect: { pantry: 1, needs: { energy: -8, social: 12 }, rel: { iyabo: 3 } } }] },
      { label: '"Mama, I dey rush"', outcomes: [{ text: 'She shake head. "This generation…" 😅', effect: {} }] },
    ],
  },
  {
    id: 'mai-shayi-credit',
    emoji: '☕',
    title: 'Mai shayi don remember',
    text: '"My friend! That your tea and bread credit don reach ₦1,500 since last month o. Today na today."',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 168,
    when: (c) => c.place === 'street' && c.hour >= 6 && c.hour < 11,
    choices: [
      { label: 'Pay am', cost: 1500, outcomes: [{ text: '"Barka!" E add extra Lipton for your next tea ☕', effect: { needs: { social: 8 } } }] },
      { label: '"Tomorrow, I swear"', outcomes: [{ text: 'E write am for im book again. Your name don long for that book 📒', effect: { needs: { social: -5 } } }] },
    ],
  },
];
