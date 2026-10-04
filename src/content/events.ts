import type { GameEvent } from '../engine/events';

const outside = (p: string) => p !== 'home';
const day = (h: number) => h >= 7 && h < 20;

export const EVENTS: GameEvent[] = [
  // ---------------- Home & area ----------------
  {
    id: 'borehole-levy',
    emoji: '🚰',
    title: 'Caretaker don knock',
    text: '"Good morning o! Borehole pump don spoil. Landlord say every tenant go contribute ₦5,000."',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 96,
    when: (c) => c.place === 'home' && day(c.hour),
    choices: [
      { label: 'Pay am', cost: 5000, outcomes: [{ text: 'Caretaker don collect. Water go run by weekend (dem talk am sha).', effect: { needs: { social: 5 } } }] },
      {
        label: 'Beg am make e wait',
        outcomes: [
          { weight: 1, text: '"No wahala, by month end." You don buy time 😅', effect: { needs: { social: 3 } } },
          { weight: 1, text: '"Every time na beg!" E add ₦2,000 penalty. Wahala.', effect: { money: -7000, needs: { fun: -10 } } },
        ],
      },
      {
        label: 'Hide inside, pretend say you no dey',
        outcomes: [
          { weight: 1, text: 'E knock tire, e waka. You escape today 🙈', effect: { needs: { fun: 5 } } },
          { weight: 1, text: 'Your phone ring loud for inside. E hear am 😭 Now you pay ₦7,000.', effect: { money: -7000, needs: { social: -10 } } },
        ],
      },
    ],
  },
  {
    id: 'aedc-bill',
    emoji: '⚡',
    title: 'AEDC people for gate',
    text: 'Two AEDC staff with ladder: "Estimated bill ₦8,500. Pay now or we cut your wire."',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 120,
    when: (c) => c.place === 'home' && day(c.hour),
    choices: [
      { label: 'Pay the bill', cost: 8500, outcomes: [{ text: 'Dem give you receipt wey no get stamp. At least light no go comot.' }] },
      {
        label: 'Argue: "Na estimated billing!"',
        outcomes: [
          { weight: 1, text: 'You talk am well. Dem say make you go office. Light still dey 💪', effect: { needs: { fun: 5 } } },
          { weight: 1, text: 'Dem climb pole cut your wire 😤 No light till dem reconnect.', effect: { power: false, needs: { fun: -10 } } },
        ],
      },
    ],
  },
  {
    id: 'neighbour-party',
    emoji: '🎶',
    title: 'Neighbour dey do birthday',
    text: 'Speaker don land compound. "Na my 30th o! Come chop rice!"',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 72,
    when: (c) => c.place === 'home' && c.hour >= 17 && c.hour < 23,
    choices: [
      { label: 'Join the party', outcomes: [{ text: 'Jollof, small chops and dancing. Better night 🕺', effect: { needs: { fun: 25, social: 20, food: 20, energy: -10 }, minutes: 90 } }] },
      { label: 'Carry drink go (₦2,000)', cost: 2000, outcomes: [{ text: 'Neighbour happy die. "You be correct person!" 🍻', effect: { needs: { fun: 25, social: 30, food: 20, energy: -10 }, minutes: 90 } }] },
      { label: 'Cover head with pillow', outcomes: [{ text: 'Bass dey shake your bed till 2am 😩', effect: { needs: { energy: -10, fun: -5 } } }] },
    ],
  },

  // ---------------- Family & phone ----------------
  {
    id: 'black-tax',
    emoji: '📞',
    title: 'Mama dey call',
    text: '"My pikin, how Abuja? Your brother school fees remain ₦15,000. Na you we dey look o."',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 120,
    choices: [
      { label: 'Send full ₦15,000', cost: 15000, outcomes: [{ text: '"God go bless you, my pikin!" Mama pray for you tire 🙏', effect: { needs: { social: 25, fun: 10 } } }] },
      { label: 'Send small ₦5,000', cost: 5000, outcomes: [{ text: '"Thank you. We go manage the rest." You feel am small.', effect: { needs: { social: 10 } } }] },
      { label: '"Mama, network dey break…"', outcomes: [{ text: 'You off phone. Your mind no rest all day 😔', effect: { needs: { social: -15, fun: -10 } } }] },
    ],
  },
  {
    id: 'burial-levy',
    emoji: '⚱️',
    title: 'Family WhatsApp group',
    text: 'Uncle Emeka burial dey come. "Every Abuja person go pay ₦10,000 levy. No excuse."',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 240,
    choices: [
      { label: 'Pay the levy', cost: 10000, outcomes: [{ text: 'Your name enter "people wey don pay" list. Respect ✊', effect: { needs: { social: 15 } } }] },
      { label: 'Mute the group', outcomes: [{ text: 'Aunty don tag you 6 times. "Abuja big man no fit pay ₦10k?" 😬', effect: { needs: { social: -15 } } }] },
    ],
  },
  {
    id: 'scam-job',
    emoji: '💸',
    title: 'WhatsApp message',
    text: '"WORK FROM HOME!! Earn ₦50,000 DAILY. Pay ₦10,000 registration to start TODAY 🔥🔥"',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 168,
    choices: [
      { label: 'Pay registration', cost: 10000, outcomes: [{ text: 'Dem don block you 😭 Na scam. Abuja no be play.', effect: { needs: { fun: -20 } } }] },
      { label: 'Block am sharp sharp', outcomes: [{ text: 'You sabi road. Scammers no fit you 😎', effect: { needs: { fun: 5 } } }] },
    ],
  },
  {
    id: 'guy-sends-money',
    emoji: '🎁',
    title: 'Credit alert!',
    text: 'Your guy for London send message: "Bro/sis, I send you small thing for data. Hold body."',
    trigger: 'idle',
    weight: 1,
    cooldownHours: 240,
    choices: [{ label: 'Thank am well well', outcomes: [{ text: '₦5,000 land your account 🙌', effect: { money: 5000, needs: { fun: 15, social: 10 } } }] }],
  },
  {
    id: 'wedding-invite',
    emoji: '💍',
    title: 'Owambe invitation',
    text: 'Your friend dey marry for Gwarinpa next Saturday. "Aso-ebi na ₦15,000. Make you no disgrace me o."',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 168,
    choices: [
      { label: 'Buy the aso-ebi', cost: 15000, outcomes: [{ text: 'You go shine for that wedding 💃 People go notice you.', effect: { packaging: 6, needs: { social: 20, fun: 10 } } }] },
      { label: '"I go come with my own cloth"', outcomes: [{ text: 'Your friend reply with only "Ok." 😐', effect: { needs: { social: -10 } } }] },
    ],
  },

  // ---------------- Outside ----------------
  {
    id: 'rain',
    emoji: '🌧️',
    title: 'Rain don start!',
    text: 'Abuja sky don black. Heavy rain wan fall now now.',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 48,
    when: (c) => outside(c.place) && day(c.hour),
    choices: [
      { label: 'Stand under shade, wait', outcomes: [{ text: 'Rain fall for one hour. You gist with strangers under the shade.', effect: { minutes: 60, needs: { social: 5 } } }] },
      { label: 'Run am!', outcomes: [{ text: 'You soak like rag 😂 Your cloth don spoil small.', effect: { needs: { hygiene: -25, energy: -5 }, packaging: -2 } }] },
    ],
  },
  {
    id: 'found-money',
    emoji: '💵',
    title: 'Money for ground',
    text: 'You see ₦1,000 note for ground. Nobody dey look.',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 72,
    when: (c) => outside(c.place),
    choices: [
      {
        label: 'Pick am',
        outcomes: [
          { weight: 3, text: 'Free money! Today go better 😁', effect: { money: 1000, needs: { fun: 5 } } },
          { weight: 1, text: 'One woman shout "Na my money!" You give am back, shame catch you 🙈', effect: { needs: { social: -5 } } },
        ],
      },
      { label: 'Leave am', outcomes: [{ text: 'Your conscience clear. Maybe na juju money sef 👀' }] },
    ],
  },
  {
    id: 'old-friend',
    emoji: '🤝',
    title: 'Old school friend!',
    text: '"Ah ahn! Na you? We finish secondary school together!" Na Chinedu wey dey sit for back of class.',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 96,
    when: (c) => outside(c.place) && day(c.hour),
    choices: [
      { label: 'Make we gist small', outcomes: [{ text: 'Una gist tire. E say e dey work for one ministry. Network don open 👀', effect: { minutes: 45, needs: { social: 25, fun: 15 } } }] },
      { label: '"I dey rush, I go call you"', outcomes: [{ text: 'You collect number. You no go call am, we know 😂' }] },
    ],
  },
  {
    id: 'pickpocket',
    emoji: '👛',
    title: 'Your pocket light',
    text: 'For inside crowd, somebody brush you. You check pocket…',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 120,
    when: (c) => c.place === 'wuse' && c.money > 3000,
    choices: [
      {
        label: 'Check am quick',
        outcomes: [
          { weight: 1, text: '₦3,000 don waka 😭 Wuse no be play ground.', effect: { money: -3000, needs: { fun: -15 } } },
          { weight: 1, text: 'You hold am tight on time. Thief run 🏃 You save your money!', effect: { needs: { fun: 5 } } },
        ],
      },
    ],
  },
  {
    id: 'market-deal',
    emoji: '🍅',
    title: '"Customer, come!"',
    text: 'One mama for market: "Fine customer, I go give you tomato, pepper and rice for ₦3,000. Last price!"',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 48,
    when: (c) => c.place === 'wuse' && c.hour >= 7 && c.hour < 18,
    choices: [
      { label: 'Buy am', cost: 3000, outcomes: [{ text: 'Correct deal! Mama add extra pepper for you 🌶️', effect: { pantry: 3, needs: { social: 5 } } }] },
      { label: '"I go come back"', outcomes: [{ text: '"You no go come back, I know" 😂' }] },
    ],
  },
  {
    id: 'reception-bribe',
    emoji: '🗂️',
    title: 'Reception oga',
    text: '"Your CV? I fit carry am reach director table today… but you go drop something. ₦5,000."',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 72,
    when: (c) => c.place === 'secretariat' && c.hour >= 8 && c.hour < 15,
    choices: [
      {
        label: 'Drop the ₦5,000',
        cost: 5000,
        outcomes: [
          { weight: 1, text: 'E carry your CV enter inside. Long Leg dey work 😏', effect: { cv: 1 } },
          { weight: 1, text: 'E collect money, then e no show again 😑 Abuja!', effect: { needs: { fun: -15 } } },
        ],
      },
      { label: 'Refuse. I no dey bribe', outcomes: [{ text: 'You hold your head high. Your mama go proud of you 🙌', effect: { needs: { fun: 5 } } }] },
    ],
  },

  // ---------------- On the road ----------------
  {
    id: 'checkpoint',
    emoji: '👮',
    title: 'Police checkpoint',
    text: 'Police stop your vehicle. "Oga driver, wetin you carry? Make everybody show ID."',
    trigger: 'commute',
    weight: 4,
    cooldownHours: 6,
    choices: [
      { label: 'Show your ID, keep quiet', outcomes: [{ text: 'After 20 minutes dem wave una go.', effect: { minutes: 20 } }] },
      {
        label: 'Talk am: "Officer, we dey rush"',
        outcomes: [
          { weight: 1, text: '"Oya go." E work! 😎', effect: { needs: { fun: 5 } } },
          { weight: 1, text: '"You dey teach me work?" Dem hold una 45 minutes 😩', effect: { minutes: 45, needs: { fun: -10 } } },
        ],
      },
    ],
  },
  {
    id: 'agbero',
    emoji: '🧢',
    title: 'Agbero for motor park',
    text: '"Oga/madam, ticket! ₦300 for union." E no get any ID card.',
    trigger: 'commute',
    weight: 3,
    cooldownHours: 12,
    choices: [
      { label: 'Pay am', cost: 300, outcomes: [{ text: 'E hiss, e waka. Peace of mind na ₦300.' }] },
      {
        label: '"Which union?"',
        outcomes: [
          { weight: 1, text: 'E look you, e waka pass. You win today ✊', effect: { needs: { fun: 5 } } },
          { weight: 1, text: 'E and im boys surround you. You pay ₦700 now 😤', effect: { money: -700, needs: { fun: -10 } } },
        ],
      },
    ],
  },
  {
    id: 'trailer-fall',
    emoji: '🚛',
    title: 'Trailer don fall for expressway',
    text: 'Traffic no dey move. Somebody say trailer fall for front. Everybody don come down dey look.',
    trigger: 'commute',
    weight: 3,
    cooldownHours: 24,
    choices: [
      { label: 'Wait am out', outcomes: [{ text: 'One hour later, una move. Na Abuja we dey 😩', effect: { minutes: 60, needs: { fun: -10 } } }] },
      {
        label: 'Come down, enter okada (₦1,000)',
        cost: 1000,
        outcomes: [
          { weight: 4, text: 'Okada man fly pass the traffic. You reach on time 🏍️💨' },
          { weight: 1, text: 'Okada skid for sand! You fall, knee bruise 🤕 Chemist collect ₦2,500.', effect: { money: -2500, needs: { energy: -15, fun: -15, hygiene: -10 } } },
        ],
      },
    ],
  },
  {
    id: 'bus-breakdown',
    emoji: '🔧',
    title: 'Vehicle don knock',
    text: 'Smoke dey comot from engine. Driver: "Make everybody come down, e go soon fix."',
    trigger: 'commute',
    weight: 2,
    cooldownHours: 24,
    choices: [
      { label: 'Wait for driver', outcomes: [{ text: '"Soon" turn 40 minutes. Una later enter another bus.', effect: { minutes: 40, needs: { fun: -5 } } }] },
      { label: 'Stop another taxi (₦1,500)', cost: 1500, outcomes: [{ text: 'You comot quick. Money talk 💸' }] },
    ],
  },
  {
    id: 'accident-minor',
    emoji: '💥',
    title: 'Accident!',
    text: 'GBAM! One okada jam your vehicle for side. Glass break small. Your hand dey bleed small 😱',
    trigger: 'commute',
    weight: 2,
    cooldownHours: 48,
    choices: [
      { label: 'Go chemist (₦2,500)', cost: 2500, outcomes: [{ text: 'Chemist clean am, give you plaster. You go survive 💪', effect: { minutes: 30, needs: { energy: -10, fun: -10 } } }] },
      { label: 'Manage am, tie handkerchief', outcomes: [{ text: 'E dey pain you whole day 😣', effect: { needs: { energy: -20, fun: -15, hygiene: -15 } } }] },
    ],
  },
  {
    id: 'accident-major',
    emoji: '🚑',
    title: 'Serious accident 😱',
    text: 'Driver try overtake trailer for one-way. The vehicle somersault! Everything turn dark…',
    trigger: 'commute',
    weight: 1,
    cooldownHours: 336,
    choices: [
      {
        label: 'Wetin happen? 😨',
        outcomes: [
          { weight: 3, text: 'You wake up for General Hospital. Leg bandage, but you dey alive. Thank God 🙏 Hospital bill: ₦25,000.', effect: { money: -25000, minutes: 480, needs: { energy: -50, fun: -30, social: -10 } } },
          { weight: 2, text: 'Una all come out alive with small wounds. FRSC carry una go clinic. ₦8,000 bill.', effect: { money: -8000, minutes: 180, needs: { energy: -30, fun: -20 } } },
        ],
      },
    ],
  },
  {
    id: 'accident-witness',
    emoji: '🆘',
    title: 'Accident for road',
    text: 'One car don hit okada for front of una. The okada man dey ground, e dey shout for help.',
    trigger: 'commute',
    weight: 2,
    cooldownHours: 72,
    choices: [
      {
        label: 'Help carry am go hospital',
        outcomes: [
          { weight: 2, text: 'Una rush am go hospital. Doctor say you save im life 🙏', effect: { minutes: 90, needs: { energy: -15, social: 25, fun: 10, hygiene: -15 } } },
          { weight: 1, text: 'Im family come thank you, dem dash you ₦5,000. "God go bless you!" 🙏', effect: { money: 5000, minutes: 90, needs: { energy: -15, social: 30, fun: 15, hygiene: -15 } } },
        ],
      },
      { label: 'Call FRSC (122)', outcomes: [{ text: 'FRSC come after 20 minutes. You do your part ✊', effect: { minutes: 20, needs: { social: 10 } } }] },
      { label: 'Look the other way', outcomes: [{ text: 'Vehicle move. The man face no comot your mind 😔', effect: { needs: { fun: -15, social: -5 } } }] },
    ],
  },
];
