import type { EventContext, GameEvent } from '../engine/events';

/** Storylines: one choice sets a flag, and days later the story continues. */

const has = (c: EventContext, f: string) => c.flags?.[f] !== undefined;
/** Days since a flag was set (-1 if never). */
const since = (c: EventContext, f: string) => (has(c, f) ? c.day - c.flags![f] : -1);
const anyOf = (c: EventContext, ...fs: string[]) => fs.some((f) => has(c, f));
const free = (c: EventContext) => c.place !== 'home' || c.hour >= 7;

export const STORIES: GameEvent[] = [
  // ---------------- Chinedu borrows money ----------------
  {
    id: 'chinedu-borrow',
    emoji: '📞',
    title: 'Chinedu dey call',
    text: '"Guy, abeg I need ₦20k urgent. Salary delay. I go pay you back Friday, I swear."',
    trigger: 'idle',
    weight: 4,
    cooldownHours: 9999,
    when: (c) => !!c.met?.includes('chinedu') && c.day >= 3 && free(c) && !anyOf(c, 'lent-chinedu', 'chinedu-done'),
    choices: [
      { label: 'Send am ₦20,000', cost: 20000, outcomes: [{ text: '"Bros, you be real one! Friday latest." 🙏', effect: { flag: 'lent-chinedu', rel: { chinedu: 10 } } }] },
      { label: 'Send ₦5,000 make e manage', cost: 5000, outcomes: [{ text: '"Thank you, e go help small." E sound disappointed.', effect: { flag: 'chinedu-done', rel: { chinedu: 3 } } }] },
      { label: '"Guy, I no get now"', outcomes: [{ text: '"Okay o." E cut call quick 😬', effect: { flag: 'chinedu-done', rel: { chinedu: -8 } } }] },
    ],
  },
  {
    id: 'chinedu-excuse',
    emoji: '💬',
    title: 'Chinedu: "Small delay…"',
    text: '"Guy, salary never land o. Government money na wahala. Give me one more week abeg 🙏"',
    trigger: 'idle',
    weight: 40,
    cooldownHours: 9999,
    when: (c) => since(c, 'lent-chinedu') >= 3 && !has(c, 'chinedu-excuse') && free(c),
    choices: [
      { label: '"No wahala, take your time"', outcomes: [{ text: '"You too good, bros." 🫂', effect: { flag: 'chinedu-excuse', rel: { chinedu: 5 } } }] },
      { label: '"Guy, I need my money!"', outcomes: [{ text: '"I hear you. I no forget." E no happy 😐', effect: { flag: 'chinedu-excuse', rel: { chinedu: -5 } } }] },
    ],
  },
  {
    id: 'chinedu-again',
    emoji: '😅',
    title: 'Chinedu wan borrow again',
    text: '"Bros, I know say I never pay the first one… but abeg add ₦10k. Last last. Na for my landlord."',
    trigger: 'idle',
    weight: 40,
    cooldownHours: 9999,
    when: (c) => since(c, 'chinedu-excuse') >= 2 && !has(c, 'chinedu-again') && free(c),
    choices: [
      { label: 'Send am ₦10,000', cost: 10000, outcomes: [{ text: '"I go never forget this one. Watch." 🙏', effect: { flag: ['chinedu-again', 'chinedu-trust'], rel: { chinedu: 8 } } }] },
      { label: '"Pay the first one first"', outcomes: [{ text: '"Fair. I go sort am." E sound shame.', effect: { flag: 'chinedu-again', rel: { chinedu: -5 } } }] },
    ],
  },
  {
    id: 'chinedu-payback',
    emoji: '🤝',
    title: 'Chinedu don come through',
    text: '"Guy! Salary don land. And I get gist: my director need one sharp person for supply work. I don drop your name."',
    trigger: 'idle',
    weight: 50,
    cooldownHours: 9999,
    when: (c) => since(c, 'chinedu-again') >= 3 && !has(c, 'chinedu-done') && free(c),
    choices: [
      {
        label: 'Collect money + the connection',
        when: (c) => has(c, 'chinedu-trust'),
        outcomes: [{ text: 'E send ₦30,000 back plus ₦15,000 "for your patience". Then e introduce you to Alhaji Sani 💰🦵', effect: { money: 45000, meet: 'alhaji', flag: 'chinedu-done', rel: { chinedu: 15 } } }],
      },
      {
        label: 'Collect your ₦20,000',
        when: (c) => !has(c, 'chinedu-trust'),
        outcomes: [{ text: 'E pay your ₦20k complete and push your CV for ministry 📄', effect: { money: 20000, cv: 1, flag: 'chinedu-done', rel: { chinedu: 5 } } }],
      },
    ],
  },

  // ---------------- Mama ----------------
  {
    id: 'mama-sick',
    emoji: '📞',
    title: 'Mama dey call',
    text: '"My pikin, how you dey? BP dey worry me. Doctor say make I do test, ₦15,000. I no wan disturb you…"',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 9999,
    when: (c) => c.day >= 4 && free(c) && !anyOf(c, 'mama-helped', 'mama-partial', 'mama-ignored'),
    choices: [
      { label: 'Send ₦15,000', cost: 15000, outcomes: [{ text: '"God bless you, my pikin. You go go far." 🙏', effect: { flag: 'mama-helped', needs: { social: 15, fun: 5 } } }] },
      { label: 'Send ₦5,000', cost: 5000, outcomes: [{ text: '"Thank you. I go add the rest from my contribution."', effect: { flag: 'mama-partial', needs: { social: 8 } } }] },
      { label: '"Mama, I no get now"', outcomes: [{ text: '"No wahala, my pikin. God dey." Her voice dey shake 😔', effect: { flag: 'mama-ignored', needs: { fun: -10 } } }] },
    ],
  },
  {
    id: 'mama-parcel',
    emoji: '📦',
    title: 'Parcel from Mama',
    text: 'Bus driver call you: "Your mama send load." Garri, beans, palm oil, dry fish… and one note: "Chop well, my pikin." 🥹',
    trigger: 'idle',
    weight: 50,
    cooldownHours: 9999,
    when: (c) => since(c, 'mama-helped') >= 2 && !has(c, 'mama-done') && free(c),
    choices: [{ label: 'Call Mama to thank her', outcomes: [{ text: 'Una gist one hour. Your heart full 💛', effect: { pantry: 8, flag: 'mama-done', needs: { social: 25, fun: 15 } } }] }],
  },
  {
    id: 'mama-church',
    emoji: '⛪',
    title: 'Mama get connection',
    text: '"My pikin, thank you for the money. My church sister daughter dey work for embassy for Maitama. I don give her your number."',
    trigger: 'idle',
    weight: 50,
    cooldownHours: 9999,
    when: (c) => since(c, 'mama-partial') >= 2 && !has(c, 'mama-done') && free(c),
    choices: [{ label: 'Thank you, Mama!', outcomes: [{ text: 'Aisha text you: "Your mama na my mama. Come see me for embassy." 🛂', effect: { meet: 'aisha', flag: 'mama-done', needs: { social: 15 } } }] }],
  },
  {
    id: 'mama-hospital',
    emoji: '🏥',
    title: 'Mama don enter hospital',
    text: 'Your aunty call: "Your mama collapse for market. She dey hospital now. Bill na ₦30,000."',
    trigger: 'idle',
    weight: 50,
    cooldownHours: 9999,
    when: (c) => since(c, 'mama-ignored') >= 2 && !has(c, 'mama-done') && free(c),
    choices: [
      { label: 'Pay the bill', cost: 30000, outcomes: [{ text: 'Mama don stable. "I dey okay, my pikin." You promise yourself say next time you go answer 🙏', effect: { flag: 'mama-done', needs: { social: 10, fun: -10 } } }] },
      { label: 'Beg family to share the bill', outcomes: [{ text: 'Your uncles pay, but family WhatsApp group don dey talk about you 😔', effect: { money: -10000, flag: 'mama-done', needs: { social: -20, fun: -15 } } }] },
    ],
  },

  // ---------------- Garba's tip: an appointment ----------------
  {
    id: 'garba-tip',
    emoji: '🤫',
    title: 'Garba whisper you',
    text: '"Tomorrow morning, Director go interview people for contract staff. Come before 12. Dress well o, no come with slippers."',
    trigger: 'idle',
    weight: 8,
    cooldownHours: 9999,
    when: (c) => !!c.met?.includes('garba') && c.place === 'secretariat' && !anyOf(c, 'garba-appt', 'garba-done'),
    choices: [
      { label: '"I go dey there!"', outcomes: [{ text: '📌 Appointment: Federal Secretariat, tomorrow before 12 noon. No miss am!', effect: { flag: 'garba-appt', rel: { garba: 3 } } }] },
      { label: '"Tomorrow no go work for me"', outcomes: [{ text: '"Hmm. Opportunity no dey knock two times o."', effect: { flag: 'garba-done', rel: { garba: -3 } } }] },
    ],
  },
  {
    id: 'garba-interview',
    emoji: '👔',
    title: 'Director don come out',
    text: 'One man in agbada come out: "Who Garba send? Make you follow me."',
    trigger: 'idle',
    weight: 80,
    cooldownHours: 9999,
    when: (c) => since(c, 'garba-appt') === 1 && !has(c, 'garba-done') && c.place === 'secretariat' && c.hour >= 8 && c.hour < 12,
    choices: [
      {
        label: '"Na me, sir!"',
        outcomes: [
          { weight: (c) => 1 + (c.packaging ?? 0) / 15, text: 'Director like your packaging and confidence. "You fit start contract work immediately." 📄📄📄', effect: { cv: 3, flag: 'garba-done', rel: { garba: 10 } } },
          { weight: 1.5, text: 'Director look you from head to toe: "Come back when you serious." Your shirt don betray you 😩', effect: { flag: 'garba-done', needs: { fun: -15 } } },
        ],
      },
    ],
  },
  {
    id: 'garba-missed',
    emoji: '😤',
    title: 'You miss the appointment',
    text: 'Garba call: "You no come! I tell Director say my person serious. You don disgrace me."',
    trigger: 'idle',
    weight: 60,
    cooldownHours: 9999,
    when: (c) => since(c, 'garba-appt') >= 2 && !has(c, 'garba-done') && free(c),
    choices: [
      { label: '"Abeg, forgive me"', outcomes: [{ text: '"Hmm. Next time, I no go waste my mouth."', effect: { flag: 'garba-done', rel: { garba: -10 } } }] },
      { label: 'Send am ₦3,000 "for water"', cost: 3000, outcomes: [{ text: '"Okay. I go see wetin I fit do next time." 😏', effect: { flag: 'garba-done', rel: { garba: -2 } } }] },
    ],
  },

  // ---------------- Love ----------------
  {
    id: 'babe-hair',
    emoji: '🥺',
    title: 'Babe dey call',
    text: '"Babe, I need ₦20k for small something before Sunday. You know say I love you 🥺"',
    trigger: 'idle',
    weight: 4,
    cooldownHours: 120,
    when: (c) => !!c.partner && free(c),
    choices: [
      { label: 'Send ₦20,000', cost: 20000, outcomes: [{ text: '"You be the best! 😍" E send you 10 kiss emoji.', effect: { partnerLove: 10 } }] },
      { label: '"Next week, babe"', outcomes: [{ text: '"Okay o." The "o" long 😐', effect: { partnerLove: -6 } }] },
      { label: '"Na ATM I be?"', outcomes: [{ text: 'E block you for 2 hours. Wahala 😤', effect: { partnerLove: -18, needs: { fun: -5 } } }] },
    ],
  },
  {
    id: 'love-jealous',
    emoji: '😱',
    title: 'Two of them don meet',
    text: 'You dey date two people at once… and dem just see each other for Jabi Lake Mall. Both of dem dey call you now.',
    trigger: 'idle',
    weight: 6,
    cooldownHours: 96,
    when: (c) => (c.dating ?? 0) >= 2 && free(c),
    choices: [
      { label: 'Tell the truth', outcomes: [{ text: 'One of dem respect your honesty. The other one don block you everywhere.', effect: { partnerLove: -10, needs: { social: -10 } } }] },
      { label: '"Na my cousin!"', outcomes: [{ weight: 1, text: 'E work… for now 😅', effect: { needs: { fun: -5 } } }, { weight: 2, text: 'Your "cousin" post screenshot for AbujaGram 💀', effect: { partnerLove: -25, followersPct: -5, needs: { social: -15 } } }] },
    ],
  },
  {
    id: 'fake-exposed',
    emoji: '🫣',
    title: 'Your fake life don burst',
    text: '"So the money wey you dey spend for VIP, na borrow? My friend see your account balance for POS." 😶',
    trigger: 'idle',
    weight: 8,
    cooldownHours: 96,
    when: (c) => !!c.fakeLife && (c.gap ?? 0) > 30 && free(c),
    choices: [
      { label: 'Confess everything', outcomes: [{ weight: 1, text: '"At least you honest." E go take time but e forgive you.', effect: { partnerLove: -10 } }, { weight: 1, text: '"I no fit date liar." E don waka 💔', effect: { partnerLove: -40, needs: { fun: -15 } } }] },
      { label: 'Form more big man', outcomes: [{ text: 'You transfer money you no get to prove point. Now you broke AND e still no believe you 😭', effect: { money: -20000, partnerLove: -20 } }] },
    ],
  },

  // ---------------- Scam call ----------------
  {
    id: 'scam-call',
    emoji: '☎️',
    title: 'Unknown number dey call',
    text: '"Hello, this is your bank. Your BVN don block. Send the OTP wey we just send you make we unblock am."',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 240,
    when: (c) => c.money > 20000 && free(c),
    choices: [
      { label: 'Read out the OTP', outcomes: [{ text: 'Your account don drain! ₦20,000 don waka 😭 Bank go never call you for OTP.', effect: { money: -20000, needs: { fun: -25 } } }] },
      { label: '"Which bank? Which branch?"', outcomes: [{ text: 'Dem cut call. You sabi am 😎', effect: { needs: { fun: 10 } } }] },
    ],
  },
];
