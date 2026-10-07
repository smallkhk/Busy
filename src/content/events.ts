import type { GameEvent } from '../engine/events';
import { STORIES } from './stories';
import { ABUJA_EVENTS } from './abujaEvents';
import { BENIN_EVENTS } from './beninEvents';
import { LAGOS_EVENTS } from './lagosCity';

const outside = (p: string) => p !== 'home';
const day = (h: number) => h >= 7 && h < 20;

const BASE_EVENTS: GameEvent[] = [
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
    id: 'landlord-rent',
    emoji: '👴🏾',
    title: 'Landlord don land',
    text: '"My friend, your rent don pass due date. I no be Father Christmas o. When you dey pay?"',
    trigger: 'idle',
    weight: 50,
    cooldownHours: 48,
    when: (c) => !!c.rentOverdue && (c.place === 'home' || c.place === 'street'),
    choices: [
      {
        label: '"Baba, abeg give me one week"',
        outcomes: [
          { weight: 3, text: '"Na last warning be this o!" E give you 7 more days.', effect: { rentGraceDays: 7, needs: { social: -5 } } },
          { weight: 2, text: '"No more story! Pay or pack!" E no gree 😬', effect: { needs: { fun: -10 } } },
        ],
      },
      { label: 'Promise to pay today (open phone → 🏠 Rent)', outcomes: [{ text: 'E fold hand dey wait. Better pay before e lock your door 🔒' }] },
      { label: 'Jump fence, avoid am', outcomes: [{ text: 'You escape… for now. Compound people don dey look you 👀', effect: { needs: { social: -10, fun: -5 } } }] },
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
      { label: 'Buy the aso-ebi', cost: 15000, outcomes: [{ text: 'You go shine for that wedding 💃 People go notice you.', effect: { packaging: 6, needs: { social: 20, fun: 10 }, meet: 'alhaji' } }] },
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
      { label: 'Make we gist small', outcomes: [{ text: 'Una gist tire. E say e dey work for one ministry. Network don open 👀', effect: { minutes: 45, needs: { social: 25, fun: 15 }, meet: 'chinedu' } }] },
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

  // ---------------- Long Leg ----------------
  {
    id: 'chinedu-loan',
    caller: 'Chinedu 🧑🏾‍💼',
    emoji: '🧑🏾‍💼',
    title: 'Chinedu dey call',
    text: '"Guy, salary never enter. Abeg borrow me ₦10,000, I go pay back end of month. You know say I get you."',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 240,
    // Comes back now and then, once the big Chinedu story don finish
    when: (c) => !!c.met?.includes('chinedu') && c.flags?.['chinedu-done'] !== undefined,
    choices: [
      { label: 'Send am ₦10,000', cost: 10000, outcomes: [{ text: '"You be real one!" Chinedu no go forget this 🤝', effect: { rel: { chinedu: 20 }, needs: { social: 10 } } }] },
      { label: '"I no get o"', outcomes: [{ text: '"No wahala." Im voice change small 😐', effect: { rel: { chinedu: -15 } } }] },
    ],
  },
  {
    id: 'alhaji-errand',
    emoji: '✉️',
    title: 'Alhaji need help',
    text: '"My boy, carry this envelope go one oga for ministry. No open am o. I go settle you ₦15,000."',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 168,
    when: (c) => !!c.met?.includes('alhaji') && c.hour >= 8 && c.hour < 17,
    choices: [
      {
        label: 'Carry am go',
        outcomes: [
          { weight: 3, text: 'You deliver am quiet quiet. Alhaji happy, e settle you 💰', effect: { money: 15000, minutes: 120, rel: { alhaji: 15 } } },
          { weight: 1, text: 'EFCC dey wait for the office 😱 Dem question you 3 hours before dem release you. Alhaji no pick your call again.', effect: { minutes: 180, needs: { fun: -30, energy: -15 }, rel: { alhaji: -10 } } },
        ],
      },
      { label: '"Alhaji, I no fit"', outcomes: [{ text: '"Hmm. Okay." Alhaji no too like am 😶', effect: { rel: { alhaji: -10 } } }] },
    ],
  },
  {
    id: 'garba-gist',
    emoji: '👳🏾‍♂️',
    title: 'Mallam Garba get gist',
    text: '"Ranka dede! Dem go soon do recruitment for one agency. If you get ₦2,000 for my tea, I go tell you who to see."',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 120,
    when: (c) => !!c.met?.includes('garba') && c.place === 'secretariat',
    choices: [
      { label: 'Buy am tea (₦2,000)', cost: 2000, outcomes: [{ text: 'E give you name and office number. Information na power 📄', effect: { cv: 1, rel: { garba: 10 } } }] },
      { label: '"Next time, Mallam"', outcomes: [{ text: '"Allah ya kiyaye." E smile, but e no talk again.', effect: { rel: { garba: -5 } } }] },
    ],
  },
  {
    id: 'estate-meeting',
    emoji: '🏘️',
    title: 'Compound meeting',
    text: 'Tenants dey meet about security and light. "Everybody must attend!"',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 168,
    when: (c) => c.place === 'home' && c.hour >= 17 && c.hour < 21,
    choices: [
      { label: 'Attend am', outcomes: [{ text: 'Long meeting, but you know everybody now. The lawyer for flat 3 like how you talk 👀', effect: { minutes: 60, needs: { social: 20 }, meet: 'ade' } }] },
      { label: 'Pretend say you dey sleep', outcomes: [{ text: 'Dem don choose you for security levy committee for your absence 😂', effect: { needs: { social: -5 } } }] },
    ],
  },

  // ---------------- AbujaGram & fake life ----------------
  {
    id: 'exposed',
    emoji: '💀',
    title: 'Dem don expose you!',
    text: 'Somebody screenshot your post put am for AbujaGram: "This one dey form big boy/big girl, but e dey owe rent 😂😂". E don go viral.',
    trigger: 'idle',
    weight: 6,
    cooldownHours: 96,
    when: (c) => (c.gap ?? 0) > 30 && (c.followers ?? 0) >= 50,
    choices: [
      {
        label: 'Post "Haters go hate 😎"',
        outcomes: [
          { weight: 1, text: 'People like your confidence. Clout na clout 💅', effect: { followersPct: 10, needs: { fun: 10 } } },
          { weight: 2, text: 'Dem drag you worse. Comment section don turn war 💀', effect: { followersPct: -40, packaging: -10, needs: { fun: -20, social: -10 } } },
        ],
      },
      { label: 'Deactivate account for one week', outcomes: [{ text: 'You hide. Gist go die down… small small.', effect: { followersPct: -15, packaging: -8, needs: { social: -10 } } }] },
      { label: 'Confess: "I dey hustle, I no go lie"', outcomes: [{ text: 'Some people respect am. Some unfollow. Your mind don free 🙏', effect: { followersPct: -20, packaging: -15, needs: { fun: 10 } } }] },
    ],
  },
  {
    id: 'gram-dm',
    emoji: '💌',
    title: 'DM don land',
    text: '"Hi dear 😘 I like your page. I be oil and gas CEO, I wan sponsor your trip to Dubai. Send ₦20,000 for visa processing."',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 168,
    when: (c) => (c.followers ?? 0) >= 150,
    choices: [
      { label: 'Send the ₦20,000', cost: 20000, outcomes: [{ text: 'The "CEO" don block you. Dubai don cancel 😭', effect: { needs: { fun: -25 } } }] },
      { label: 'Screenshot am, post am', outcomes: [{ text: 'Your followers laugh tire 😂 Content na content.', effect: { followersPct: 8, needs: { fun: 10 } } }] },
    ],
  },

  // ---------------- Night life ----------------
  {
    id: 'lounge-bill',
    emoji: '🧾',
    title: 'Bill wahala',
    text: 'Waiter drop bill: ₦45,000. "Na the bottle wey your table order." You no order any bottle 😳',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 72,
    when: (c) => c.place === 'lounge' && c.hour >= 19,
    choices: [
      { label: 'Pay make shame no catch you', cost: 45000, outcomes: [{ text: 'Your account cry, but your packaging still dey 💅', effect: { packaging: 3, needs: { fun: -10 } } }] },
      {
        label: 'Call manager',
        outcomes: [
          { weight: 2, text: 'Manager check: na another table bill. "Sorry sir/ma!" Dem dash you free drink 🍹', effect: { needs: { fun: 15 } } },
          { weight: 1, text: 'Bouncers carry you outside like bag of rice 😭 Everybody dey video.', effect: { packaging: -12, followersPct: -10, needs: { fun: -25, social: -15 } } },
        ],
      },
    ],
  },
  {
    id: 'money-rain',
    emoji: '💸',
    title: 'Big man dey spray',
    text: 'One Alhaji don climb chair dey spray dollar for dance floor. Money dey rain 💵💵',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 96,
    when: (c) => c.place === 'lounge' && c.hour >= 20,
    choices: [
      { label: 'Gather some', outcomes: [{ text: 'You pack ₦12,000 worth. Nobody see you… you hope 👀', effect: { money: 12000, packaging: -3, needs: { fun: 10 } } }] },
      { label: 'Dance near am, form big', outcomes: [{ text: 'E notice you, e collect your number. "Call me tomorrow." 📞', effect: { needs: { fun: 15, social: 10 }, meet: 'alhaji' } }] },
    ],
  },

  // ---------------- Ego Loan ----------------
  {
    id: 'loan-shame',
    emoji: '📲',
    title: 'Ego Loan don vex',
    text: 'Ego Loan don send message to everybody for your phone: "This person dey owe us money. Tell am make e pay before we post am." 😭',
    trigger: 'idle',
    weight: 40,
    cooldownHours: 48,
    when: (c) => !!c.loanOverdue,
    choices: [
      { label: 'Pay the loan now', outcomes: [{ text: 'You don clear am. Make una no hear "loan app" again for your mouth.', effect: { payLoan: true } }] },
      { label: 'Ignore dem', outcomes: [{ text: 'Your contacts dey call you dey ask question. Shame catch you 🙈', effect: { relAll: -8, packaging: -5, needs: { social: -15, fun: -10 } } }] },
    ],
  },

  // ---------------- Business & office ----------------
  {
    id: 'pos-fake-alert',
    emoji: '📲',
    title: 'Fake alert for your POS',
    text: 'Your POS girl call you: "Oga/madam, one man show me transfer of ₦25,000, I give am cash. The money no land!" 😭',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 120,
    when: (c) => !!c.owned?.includes('pos'),
    choices: [
      { label: 'Absorb the loss', outcomes: [{ text: 'You don learn. "Confirm alert before you pay" don paste for wall now.', effect: { money: -25000, needs: { fun: -15 } } }] },
      {
        label: 'Report for police station',
        outcomes: [
          { weight: 1, text: 'Police trace the account! Dem recover ₦20,000 (dem collect ₦5,000 for "fuel").', effect: { money: -5000, minutes: 180 } },
          { weight: 2, text: 'Police say "we go call you." Dem never call. Money don go.', effect: { money: -25000, minutes: 180, needs: { fun: -20 } } },
        ],
      },
    ],
  },
  {
    id: 'task-force-shop',
    emoji: '🚧',
    title: 'Task force for Wuse!',
    text: 'Environment task force dey market: "Your shop extension block walkway. We go demolish am today!" Red X don land for your wall.',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 168,
    when: (c) => !!c.owned?.includes('provision'),
    choices: [
      { label: 'Settle them (₦30,000)', cost: 30000, outcomes: [{ text: 'Dem clean the X with rag. "We no see anything." 😑', effect: { needs: { fun: -10 } } }] },
      { label: 'Argue: "I get permit!"', outcomes: [
        { weight: 1, text: 'Your permit correct! Dem waka go another shop. ✊', effect: { needs: { fun: 10 } } },
        { weight: 2, text: 'Dem lock your shop. You go pay fine and wait 3 days 😤', effect: { money: -15000, closeBusiness: { id: 'provision', days: 3 }, needs: { fun: -20 } } },
      ] },
    ],
  },
  {
    id: 'staff-theft',
    emoji: '🕵🏾',
    title: 'Staff don dey chop your money',
    text: 'Your account no balance. Your manager don dey "manage" the business money for im pocket.',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 240,
    when: (c) => !!c.owned?.some((id) => id === 'catering' || id === 'logistics'),
    choices: [
      { label: 'Sack am', outcomes: [{ text: 'You sack am. Business slow small while you find another person.', effect: { money: -20000, needs: { fun: -10 } } }] },
      { label: 'Give am last warning', outcomes: [
        { weight: 1, text: 'E change! Business don dey balance now.', effect: { needs: { fun: 5 } } },
        { weight: 1, text: 'E carry ₦60,000 run comot Abuja 😭', effect: { money: -60000, needs: { fun: -25 } } },
      ] },
    ],
  },
  {
    id: 'oga-birthday',
    emoji: '🎂',
    title: 'Director birthday',
    text: 'Office WhatsApp: "Our amiable Director birthday na Friday. Each staff ₦10,000 contribution." Everybody dey watch who go pay.',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 336,
    when: (c) => (c.grade ?? -1) >= 1,
    choices: [
      { label: 'Pay ₦10,000', cost: 10000, outcomes: [{ text: 'Director see your name for list. E smile at you for corridor 😏', effect: { packaging: 3, needs: { social: 10 } } }] },
      { label: '"Salary never enter"', outcomes: [{ text: 'Your name dey "never pay" list. Promotion go dey look you from far 👀', effect: { needs: { social: -10 } } }] },
    ],
  },

  // ---------------- Car ----------------
  {
    id: 'car-knock',
    emoji: '🔧',
    title: 'Your car don dey make noise',
    text: 'Engine dey knock, AC no dey cold, and one light don show for dashboard. Mechanic say "na small thing… ₦60,000".',
    trigger: 'idle',
    weight: 8,
    cooldownHours: 48,
    when: (c) => c.carCondition !== undefined && c.carCondition < 40,
    choices: [
      { label: 'Carry am go mechanic (₦60,000)', cost: 60000, outcomes: [{ text: 'Mechanic change plug, oil and "something". Car dey purr like cat now 🐈', effect: { carRepair: true } }] },
      { label: 'Manage am small', outcomes: [{ text: 'You turn up music make you no hear the knock 🎶😅', effect: { needs: { fun: -10 } } }] },
    ],
  },
  {
    id: 'vio',
    emoji: '🦺',
    title: 'VIO don stop you',
    text: '"Oga, your particulars. Where your fire extinguisher? Your C-caution? This one na serious offence o!"',
    trigger: 'commute',
    weight: 6,
    cooldownHours: 24,
    when: (c) => !!c.trip?.startsWith('drive-'),
    choices: [
      { label: 'Show everything, calm down', outcomes: [
        { weight: 2, text: 'Everything complete. "Oya go." You no even sweat 😎', effect: { minutes: 15 } },
        { weight: 1, text: 'Extinguisher don expire. Dem tow you go office, ₦15,000 fine 😤', effect: { money: -15000, minutes: 120, needs: { fun: -20 } } },
      ] },
      { label: 'Find "something" for dem (₦5,000)', cost: 5000, outcomes: [{ text: 'Dem wave you go with big smile. Abuja road 😑' }] },
    ],
  },

  {
    id: 'biz-inspector',
    emoji: '🧑🏾‍⚕️',
    title: 'Health inspector don come',
    text: '"We dey check food businesses. Where your certificate? Your kitchen no clean o."',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 168,
    when: (c) => !!c.owned?.some((id) => ['foodstall', 'shawarma', 'restaurant', 'pharmacy', 'catering'].includes(id)),
    choices: [
      { label: 'Pay for proper certificate', cost: 25000, outcomes: [{ text: 'Certificate don hang for wall. Customers trust you more 📜', effect: { needs: { fun: 5 } } }] },
      { label: 'Argue with am', outcomes: [{ weight: 1, text: 'E collect small "consideration" and go.', effect: { money: -10000 } }, { weight: 1, text: 'E seal your shop for 2 days 🔒', effect: { closeBusiness: { id: 'restaurant', days: 2 }, needs: { fun: -15 } } }] },
    ],
  },
  {
    id: 'biz-staff-wahala',
    emoji: '😤',
    title: 'Staff wahala',
    text: 'Your workers dey vex: "Oga, salary small. Everything don cost for market. Add us something or we go strike."',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 240,
    when: (c) => (c.owned?.length ?? 0) >= 2,
    choices: [
      { label: 'Give them bonus', cost: 30000, outcomes: [{ text: 'Dem happy. "Oga na correct person!" Work go better 💪🏾', effect: { needs: { social: 10 } } }] },
      { label: '"Who no like am fit go"', outcomes: [{ weight: 1, text: 'Dem grumble but dem stay.', effect: { needs: { social: -5 } } }, { weight: 1, text: 'Two of dem resign same day. Business slow for one week 😩', effect: { money: -40000, needs: { fun: -15 } } }] },
    ],
  },
  {
    id: 'biz-investor',
    emoji: '🦄',
    title: 'Investor dey interested',
    text: 'One investor from Lagos see your tech startup: "I fit put ₦5M for 20% equity. Today only."',
    trigger: 'idle',
    weight: 4,
    cooldownHours: 336,
    when: (c) => !!c.owned?.includes('tech'),
    choices: [
      { label: 'Take the money', outcomes: [{ text: '₦5,000,000 don land your account. You go post am for LinkedIn 🚀', effect: { money: 5000000, packaging: 5 } }] },
      { label: '"My startup worth pass that"', outcomes: [{ weight: 1, text: 'E double the offer! ₦10M 😱🚀', effect: { money: 10000000, packaging: 8 } }, { weight: 2, text: 'E waka. Your startup still dey burn money 🔥', effect: { needs: { fun: -10 } } }] },
    ],
  },
  {
    id: 'biz-land-dispute',
    emoji: '🏚️',
    title: 'Omo onile / land wahala',
    text: 'Some people show for your estate project: "This land na our papa own. Pay us or no building go stand."',
    trigger: 'idle',
    weight: 4,
    cooldownHours: 336,
    when: (c) => !!c.owned?.some((id) => id === 'realestate' || id === 'construction'),
    choices: [
      { label: 'Settle them', cost: 500000, outcomes: [{ text: 'Dem collect and disappear. Work continue 🏗️' }] },
      { label: 'Call your Long Leg', when: (c) => (c.longLeg ?? 0) >= 40, outcomes: [{ text: 'One call to the right office. Police clear the site. 🫡', effect: { heat: 3 } }] },
      { label: 'Go court', outcomes: [{ text: 'Case go take months. Site don close small 😩', effect: { money: -200000, needs: { fun: -20 } } }] },
    ],
  },
  {
    id: 'omo-onile',
    emoji: '🏚️',
    title: 'Omo onile for your land!',
    text: 'Your site manager call: "Some boys don block the land for Kuje. Dem say na dem papa land, and you go \'settle\' them or no block go stand."',
    caller: 'Site manager 👷🏾',
    trigger: 'idle',
    weight: 8,
    cooldownHours: 168,
    when: (c) => !!c.landAt?.includes('kuje'),
    choices: [
      { label: 'Settle them', cost: 300000, outcomes: [{ text: 'Dem collect and disappear. Work continue 🧱' }] },
      { label: 'Call your Long Leg', when: (c) => (c.longLeg ?? 0) >= 30, outcomes: [{ text: 'One call to the Area Council. Police clear them sharp sharp 🫡', effect: { heat: 2 } }] },
      { label: 'Show them your C of O', outcomes: [{ weight: 1, text: '"Na paper be this?" Dem laugh, but chief later warn them. Dem go 😮‍💨', effect: { minutes: 120 } }, { weight: 1, text: 'Dem scatter your blocks! ₦150,000 damage 😤', effect: { money: -150000, needs: { fun: -20 } } }] },
    ],
  },
  {
    id: 'burglary',
    emoji: '🦹🏾',
    title: 'Thief don enter your house!',
    text: 'Your neighbour call: "Your door dey open! Somebody carry things comot from your room."',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 336,
    when: (c) => c.place !== 'home' && c.place !== 'street' && c.hour >= 10 && c.hour < 17 && !c.homeUps?.includes('cctv') && (c.homeUps?.length ?? 0) >= 2,
    choices: [
      { label: 'Rush go house', outcomes: [{ text: 'Dem carry your phone charger, small cash and your perfume 😭 ₦35,000 loss.', effect: { money: -35000, minutes: 60, needs: { fun: -25 } } }] },
      { label: 'Call police', outcomes: [{ weight: 1, text: 'Police come with "investigation fee" ₦5,000. Dem never find anything.', effect: { money: -40000, needs: { fun: -20 } } }, { weight: 1, text: 'Police catch the thief for junction! Dem return your things 🙌🏾', effect: { needs: { fun: 10 }, heat: -3 } }] },
    ],
  },
  // ---------------- Hospital ----------------
  {
    id: 'doctors-strike',
    emoji: '🪧',
    title: 'Doctors don go strike',
    text: 'Notice for gate: "Resident doctors on indefinite strike." Only one nurse dey, and she dey charge "consultation" ₦5,000 make she help you.',
    trigger: 'idle',
    weight: 4,
    cooldownHours: 168,
    when: (c) => c.place === 'hospital',
    choices: [
      { label: 'Pay the nurse (₦5,000)', cost: 5000, outcomes: [{ text: 'She check you well and give you prescription. God bless nurses 🙏', effect: { needs: { energy: 10 } } }] },
      { label: 'Go private hospital instead', outcomes: [{ text: 'Private hospital collect ₦25,000 but dem attend to you sharp sharp.', effect: { money: -25000, minutes: 90, needs: { energy: 15 } } }] },
    ],
  },

  // ---------------- Police ----------------
  {
    id: 'police-stop',
    emoji: '👮',
    title: 'Police stop: "Oga, park well!"',
    text: 'Police wave your vehicle to the side. "Where you dey go? Wetin you carry? Show us your documents."',
    trigger: 'commute',
    weight: 5,
    cooldownHours: 8,
    choices: [
      {
        label: 'Show documents, calm down',
        outcomes: [
          { weight: (c) => Math.max(0.5, 4 - (c.heat ?? 0) / 25), text: 'Everything correct. "Oya go. Safe journey." 👍🏾', effect: { minutes: 15, heat: -3 } },
          { weight: (c) => 0.5 + (c.heat ?? 0) / 25, text: '"Wait… your name dey our list." Dem carry you go station 2 hours before dem release you 😩', effect: { minutes: 120, needs: { fun: -20, energy: -10 }, heat: 5 } },
        ],
      },
      {
        label: 'Explain yourself: "Officer, I be honest worker"',
        outcomes: [
          { weight: (c) => 0.5 + (c.packaging ?? 0) / 25, text: 'Your packaging talk for you. "Ah, sorry sir. Go ahead." 😎', effect: { needs: { fun: 5 } } },
          { weight: 2, text: '"You dey form smart?" Dem search your bag finish. 40 minutes waste.', effect: { minutes: 40, needs: { fun: -10 }, heat: 3 } },
        ],
      },
      {
        label: 'Call somebody (use your 🦵 Long Leg)',
        when: (c) => (c.longLeg ?? 0) >= 10,
        outcomes: [
          { weight: (c) => (c.longLeg ?? 0) / 10, text: 'One phone call. Officer face change: "Ah! Na Oga person? Sorry sir!" 🫡', effect: { needs: { fun: 15 }, heat: -10 } },
          { weight: 1, text: 'Your person no pick call 😭 Police laugh you, hold you 1 hour.', effect: { minutes: 60, needs: { social: -5 }, heat: 5 } },
        ],
      },
      {
        label: 'Give them "something"',
        cost: 2000,
        outcomes: [
          { weight: 4, text: '"God bless you." Dem wave you go. Na so the system be 😑', effect: { heat: 2 } },
          { weight: 1, text: 'Na anti-corruption sting! 📹 Dem carry you go station. ₦20,000 fine.', effect: { money: -20000, minutes: 180, needs: { fun: -20 }, heat: 20 } },
        ],
      },
      {
        label: 'Refuse: "I know my rights"',
        outcomes: [
          { weight: (c) => ((c.heat ?? 0) < 50 ? 2 : 0.5), text: '"This one sabi law." Dem wave you go 😂', effect: { needs: { fun: 10 }, heat: 2 } },
          { weight: (c) => 1 + (c.heat ?? 0) / 20, text: 'Dem carry you enter van. 3 hours for cell before your guy bail you with ₦10,000.', effect: { money: -10000, minutes: 180, needs: { fun: -25, energy: -15 }, heat: 15 } },
        ],
      },
    ],
  },
  {
    id: 'police-night',
    emoji: '🔦',
    title: 'Night patrol',
    text: 'Patrol van flash torch for your face. "Wetin you dey do outside this time? Unlock your phone make we check."',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 24,
    when: (c) => c.place !== 'home' && c.place !== 'lounge' && (c.hour >= 22 || c.hour < 5),
    choices: [
      {
        label: 'Unlock phone, let dem check',
        outcomes: [
          { weight: 3, text: 'Dem scroll your gallery, laugh at your memes, dem go. 😮‍💨', effect: { minutes: 30, heat: -2 } },
          { weight: (c) => 0.5 + (c.heat ?? 0) / 20, text: 'Dem see crypto app. "Na Yahoo boy be this!" You pay ₦30,000 before dem free you.', effect: { money: -30000, minutes: 90, needs: { fun: -25 }, heat: 10 } },
        ],
      },
      {
        label: 'Refuse: "Na my privacy"',
        outcomes: [
          { weight: 1, text: '"Oya, go house now now!" You waka fast 😅', effect: { heat: 5 } },
          { weight: (c) => 1 + (c.heat ?? 0) / 25, text: 'Dem detain you overnight 😭 Mosquito for cell no small.', effect: { minutes: 360, needs: { energy: -30, fun: -30, hygiene: -20 }, heat: 10 } },
        ],
      },
      {
        label: 'Call somebody (use your 🦵 Long Leg)',
        when: (c) => (c.longLeg ?? 0) >= 10,
        outcomes: [
          { weight: (c) => (c.longLeg ?? 0) / 10, text: '"Oga don talk. Go home safe, sir." 🫡', effect: { heat: -5 } },
          { weight: 1, text: 'Network bad. Dem collect ₦5,000 "for fuel" before you go.', effect: { money: -5000, heat: 3 } },
        ],
      },
      {
        label: 'Run 🏃🏾',
        outcomes: [
          { weight: 1, text: 'You escape inside street corner! But dem don snap your face 📸', effect: { needs: { energy: -15, fun: 10 }, heat: 25 } },
          { weight: 1, text: 'Dem catch you. Detention till morning plus ₦15,000.', effect: { money: -15000, minutes: 480, needs: { energy: -40, fun: -30 }, heat: 20 } },
        ],
      },
    ],
  },
  {
    id: 'raid',
    emoji: '🚨',
    title: 'Police don come your house',
    text: 'Police van park for your gate. Neighbours dey peep. "We dey look for you. You go follow us go station."',
    trigger: 'idle',
    weight: 25,
    cooldownHours: 72,
    when: (c) => (c.heat ?? 0) >= 80 && (c.place === 'home' || c.place === 'street'),
    choices: [
      { label: 'Follow dem quietly', outcomes: [{ text: 'Dem question you 6 hours. No evidence, dem release you. Your name cool small.', effect: { minutes: 360, needs: { energy: -30, fun: -30, social: -10 }, heat: -40 } }] },
      {
        label: 'Call Barrister Ade',
        cost: 20000,
        when: (c) => !!c.met?.includes('ade'),
        outcomes: [{ text: 'Barrister land with big English: "Where is your warrant?" Dem apologise and comot 😎', effect: { heat: -50, rel: { ade: 5 } } }],
      },
      { label: 'Settle am', cost: 50000, outcomes: [{ text: '"We no see you today." Dem comot. Heat cool small.', effect: { heat: -30 } }] },
      {
        label: 'Call somebody big (🦵 Long Leg)',
        when: (c) => (c.longLeg ?? 0) >= 30,
        outcomes: [{ text: 'One call. The DPO himself call back to apologise 🫡', effect: { heat: -60, needs: { fun: 10 } } }],
      },
    ],
  },

  // ---------------- On the road ----------------
  {
    id: 'go-slow',
    emoji: '🚗',
    title: 'Go-slow',
    text: 'Traffic don hold. Motor no dey move at all. Hawkers dey sell everything from gala to phone charger.',
    trigger: 'commute',
    weight: 6,
    cooldownHours: 6,
    choices: [
      { label: 'Wait patiently', outcomes: [{ text: '50 minutes later, una move. Abuja road 😮‍💨', effect: { minutes: 50, needs: { fun: -10 } } }] },
      { label: 'Buy gala & La Casera', cost: 600, outcomes: [{ text: 'Gala for traffic na Nigerian culture 🍞', effect: { minutes: 50, needs: { food: 15, fun: 5 } } }] },
      {
        label: 'Come down, trek the rest',
        when: (c) => !c.trip?.startsWith('drive-'),
        outcomes: [{ text: 'You waka pass the go-slow. Sweat don soak your shirt 🥵', effect: { minutes: 20, needs: { energy: -15, hygiene: -10 } } }],
      },
    ],
  },
  {
    id: 'driver-cancel',
    emoji: '📵',
    title: 'Driver don cancel',
    text: 'After you wait 15 minutes, driver cancel: "Sorry, I no dey go that side again."',
    trigger: 'commute',
    weight: 5,
    cooldownHours: 12,
    when: (c) => !!c.trip?.startsWith('hail-'),
    choices: [
      { label: 'Book another one', outcomes: [{ text: 'Second driver come. 20 minutes don waste.', effect: { minutes: 20, needs: { fun: -10 } } }] },
      { label: 'Rate am 1 star 😤', outcomes: [{ text: 'You feel better small. You still wait 20 minutes.', effect: { minutes: 20, needs: { fun: 3 } } }] },
    ],
  },
  {
    id: 'driver-extra',
    emoji: '💸',
    title: 'Driver wan increase money',
    text: '"Oga, traffic too much. Add ₦1,500 or I drop you here."',
    trigger: 'commute',
    weight: 4,
    cooldownHours: 12,
    when: (c) => !!c.trip?.startsWith('hail-'),
    choices: [
      { label: 'Add the money', cost: 1500, outcomes: [{ text: 'E carry you reach with gospel music 🎶' }] },
      {
        label: 'Refuse: "Na the app price!"',
        outcomes: [
          { weight: 1, text: 'E grumble but e carry you go 😤', effect: { needs: { fun: -5 } } },
          { weight: 1, text: 'E drop you for roadside. You trek the rest 🥵', effect: { minutes: 40, needs: { energy: -15, hygiene: -10 } } },
        ],
      },
    ],
  },
  {
    id: 'bus-gist',
    emoji: '🗣️',
    title: 'Gist inside bus',
    text: 'The person wey sit near you start gist. "Abeg, which side you dey work?"',
    trigger: 'commute',
    weight: 4,
    cooldownHours: 24,
    when: (c) => !c.trip?.startsWith('hail-') && !c.trip?.startsWith('drive-'),
    choices: [
      {
        label: 'Gist am well',
        outcomes: [
          { weight: 1, text: 'Na Chinedu! Your old classmate. "Guy! Long time!" 🤝', effect: { meet: 'chinedu', needs: { social: 15 } } },
          { weight: 1, text: 'She be HR for the mall. She collect your number 📱', effect: { meet: 'okafor', needs: { social: 15 } } },
          { weight: 2, text: 'Na network marketing e dey do 😂 "You go like to be your own boss?"', effect: { needs: { social: 5, fun: 5 } } },
        ],
      },
      { label: 'Plug earpiece, ignore am', outcomes: [{ text: 'Afrobeats carry you reach 🎧', effect: { needs: { fun: 5 } } }] },
    ],
  },
  {
    id: 'fuel-scarcity',
    emoji: '⛽',
    title: 'Fuel don finish',
    text: 'Your fuel light don show. The filling station queue long reach expressway.',
    trigger: 'commute',
    weight: 4,
    cooldownHours: 48,
    when: (c) => !!c.trip?.startsWith('drive-'),
    choices: [
      { label: 'Join the queue (8 litres)', cost: 8000, outcomes: [{ text: '90 minutes for queue. At least na correct fuel.', effect: { minutes: 90, fuel: 8, needs: { fun: -15 } } }] },
      {
        label: 'Buy black market jerrycan',
        cost: 12000,
        outcomes: [
          { weight: 3, text: 'Boy pour am inside your tank sharp sharp. You move 🏃🏾', effect: { fuel: 8 } },
          { weight: 1, text: 'Na adulterated fuel! Engine dey knock 😩', effect: { carWear: 15, fuel: 8, needs: { fun: -15 } } },
        ],
      },
      { label: 'Beg passer-by for small fuel', outcomes: [{ text: 'One okada man siphon 2 litres give you. "God go bless you, my brother." 🙏', effect: { minutes: 45, fuel: 2, needs: { social: 10, fun: -5 } } }] },
    ],
  },
  {
    id: 'flood',
    emoji: '🌊',
    title: 'Flood don cover road',
    text: 'Rain water don cover the road reach knee. Vehicles dey park for side dey wait.',
    trigger: 'commute',
    weight: 12,
    cooldownHours: 12,
    when: (c) => c.weather === 'rain' || c.weather === 'storm',
    choices: [
      { label: 'Wait make water go down', outcomes: [{ text: 'One hour later, water reduce. Una pass slowly 🐢', effect: { minutes: 60, needs: { fun: -10 } } }] },
      { label: 'Pay boys to push the vehicle', cost: 1500, outcomes: [{ text: 'Area boys push una pass the water like champions 💪🏾', effect: { minutes: 20 } }] },
      {
        label: 'Come down, waka inside the water',
        when: (c) => !c.trip?.startsWith('drive-'),
        outcomes: [{ text: 'Water reach your knee. Your shoe don spoil 😭', effect: { minutes: 25, needs: { hygiene: -30, fun: -10 }, packaging: -2 } }],
      },
    ],
  },
  {
    id: 'rain-soak',
    emoji: '🌧️',
    title: 'Rain don catch you',
    text: 'Heavy rain start suddenly. You no carry umbrella and everybody dey run.',
    trigger: 'idle',
    weight: 10,
    cooldownHours: 12,
    when: (c) => (c.weather === 'rain' || c.weather === 'storm') && c.place !== 'home' && c.place !== 'lounge',
    choices: [
      { label: 'Buy umbrella from hawker', cost: 2500, outcomes: [{ text: 'Umbrella na ₦2,500 when rain dey fall. Business sense 😂☂️' }] },
      { label: 'Hide under shop shade', outcomes: [{ text: 'You and 10 strangers squeeze under one shade 30 minutes. New friends 😅', effect: { minutes: 30, needs: { social: 10 } } }] },
      { label: 'Waka inside the rain', outcomes: [{ text: 'You soak finish. Your packaging don wash away 🥶', effect: { needs: { hygiene: -25, fun: -5 }, packaging: -2 } }] },
    ],
  },
  {
    id: 'roof-leak',
    emoji: '💧',
    title: 'Roof dey leak',
    text: 'Storm dey blow. Water dey drop for your bed from roof. Drip… drip… drip…',
    trigger: 'idle',
    weight: 10,
    cooldownHours: 48,
    when: (c) => c.weather === 'storm' && c.place === 'home',
    choices: [
      { label: 'Put bucket, manage am', outcomes: [{ text: 'Bucket full two times. You no sleep well 😩', effect: { needs: { energy: -15, fun: -10 } } }] },
      { label: 'Call carpenter to patch am', cost: 6000, outcomes: [{ text: 'Carpenter climb roof inside rain. Leak don stop 🔨', effect: { needs: { fun: 5 } } }] },
    ],
  },
  {
    id: 'nnpc-queue',
    emoji: '⛽',
    title: 'Wahala for fuel queue',
    text: 'One Prado driver jump queue for front of everybody. Drivers don start to shout. Attendant say "fuel fit finish anytime o!"',
    trigger: 'idle',
    weight: 6,
    cooldownHours: 24,
    when: (c) => c.place === 'garki' && c.hour >= 7 && c.hour < 19,
    choices: [
      { label: 'Join the shouting', outcomes: [{ weight: 1, text: 'Everybody shout am down. E go back to the end 😂', effect: { needs: { fun: 15, social: 10 } } }, { weight: 1, text: 'E bodyguard come down. Everybody quiet 😶', effect: { needs: { fun: -10 } } }] },
      { label: 'Mind your business', outcomes: [{ text: 'You scroll phone, wait your turn. Wise.', effect: { minutes: 15 } }] },
    ],
  },
  {
    id: 'jerrycan-raid',
    emoji: '🚔',
    title: 'Task force raid!',
    text: 'Task force van don land Nyanya roadside. Jerrycan boys dey run. One officer point at you: "You dey buy illegal fuel?"',
    trigger: 'idle',
    weight: 5,
    cooldownHours: 48,
    when: (c) => c.place === 'nyanya',
    choices: [
      { label: '"Me? I just dey pass"', outcomes: [{ weight: 2, text: 'E believe you. You waka quick 😅' }, { weight: 1, text: '"Na wetin all of una dey talk." ₦10,000 fine.', effect: { money: -10000, heat: 5 } }] },
      { label: 'Run with the boys 🏃🏾', outcomes: [{ text: 'You escape, but your heart dey beat like drum 🥁', effect: { needs: { energy: -15, fun: 5 }, heat: 8 } }] },
    ],
  },
  {
    id: 'road-works',
    emoji: '🚧',
    title: 'Road construction',
    text: 'Construction company don close one lane. Diversion dey carry everybody round.',
    trigger: 'commute',
    weight: 3,
    cooldownHours: 24,
    choices: [{ label: 'Endure am', outcomes: [{ text: 'You reach 35 minutes late. "Na for our good," dem talk.', effect: { minutes: 35, needs: { fun: -5 } } }] }],
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

export const EVENTS: GameEvent[] = [...BASE_EVENTS, ...ABUJA_EVENTS, ...BENIN_EVENTS, ...LAGOS_EVENTS, ...STORIES];
