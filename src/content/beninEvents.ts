import type { GameEvent } from '../engine/events';

/** Things wey fit happen to you for Benin City (they only fire there). */
const day = (h: number) => h >= 7 && h < 19;

export const BENIN_EVENTS: GameEvent[] = [
  {
    id: 'benin-red-mud',
    emoji: '🌧️',
    title: 'Rain don turn the ground red',
    text: 'Small rain fall and the Benin red earth don turn to red mud. Your shoe and trouser don change colour.',
    trigger: 'idle',
    weight: 3,
    cooldownHours: 72,
    city: 'benin',
    when: (c) => day(c.hour),
    choices: [
      { label: 'Buy rubber slippers', cost: 500, outcomes: [{ text: 'You save your shoe. Smart move 😎', effect: { needs: { fun: 5 } } }] },
      { label: 'Waka like that', outcomes: [{ text: 'Red mud reach your knee 😂 Bath go cost you.', effect: { needs: { hygiene: -15 } } }] },
    ],
  },
  {
    id: 'benin-procession',
    emoji: '👑',
    title: "The Oba's procession",
    text: "Drums dey sound. Chiefs in red coral beads dey pass with the royal procession. Everybody don stop to greet.",
    trigger: 'idle',
    weight: 2,
    cooldownHours: 120,
    city: 'benin',
    when: (c) => c.hour >= 9 && c.hour < 17,
    choices: [
      { label: 'Kneel and greet: "Oba gha to kpere!"', outcomes: [{ text: 'One chief nod at you. You feel the history for your body 🙏🏾', effect: { needs: { social: 15, fun: 10 }, packaging: 2, rel: { osagie: 5 } } }] },
      { label: 'Bring out phone to film', outcomes: [{ text: '"No photo here!" Guard collect your phone, give you back after with warning 😬', effect: { needs: { fun: -10 }, minutes: 20 } }] },
    ],
  },
  {
    id: 'benin-native-doctor',
    emoji: '🪬',
    title: 'Native doctor for road',
    text: '"My son, I see money for your face. Bring ₦5,000, I go do special charm for you. Your business go boom!"',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 120,
    city: 'benin',
    when: (c) => day(c.hour),
    choices: [
      { label: 'Pay am', cost: 5000, outcomes: [{ text: 'E give you small calabash. Nothing change, but e sweet you 😂', effect: { needs: { fun: 8 } } }] },
      { label: '"I don get my God, thank you"', outcomes: [{ text: 'E laugh, "Your own dey come!" and waka 🚶🏾', effect: {} }] },
    ],
  },
  {
    id: 'benin-keke-charge',
    emoji: '🛺',
    title: 'Keke man don add money',
    text: '"Oga, na ₦600 o, because of fuel price." Na ₦300 you know am before.',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 72,
    city: 'benin',
    choices: [
      { label: 'Pay am, no wahala', cost: 300, outcomes: [{ text: 'E thank you, play Edo music for you 🎶', effect: { needs: { fun: 5 } } }] },
      {
        label: 'Argue am',
        outcomes: [
          { weight: 1, text: '"Okay okay, bring ₦400." You win small 😏', effect: { money: -100, needs: { fun: 5 } } },
          { weight: 1, text: 'E drop you halfway. You trek the rest under sun 🥵', effect: { needs: { energy: -10, hygiene: -5 }, minutes: 25 } },
        ],
      },
    ],
  },
  {
    id: 'benin-wedding',
    emoji: '💒',
    title: 'Edo traditional wedding',
    text: 'Your new friend invite you to im sister traditional wedding this evening. "Wear something nice, and bring envelope o!"',
    trigger: 'idle',
    weight: 2,
    cooldownHours: 168,
    city: 'benin',
    when: (c) => c.hour >= 10 && c.hour < 17,
    choices: [
      { label: 'Go with ₦5,000 envelope', cost: 5000, outcomes: [{ text: 'Coral beads, owo soup, highlife music! You dance tire 💃🏾', effect: { needs: { fun: 35, social: 30, food: 30, energy: -15 } } }] },
      { label: 'Give excuse', outcomes: [{ text: 'You stay back. Next day you see the pictures, regret catch you 😅', effect: { needs: { social: -5 } } }] },
    ],
  },
];
