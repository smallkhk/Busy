# ABUJA LIFE — Game Design & Build Spec (v0.1)

> *"Everybody for Abuja come from somewhere. Na wetin you do when you land matter."*

---

## 1. The Pitch

**Abuja Life** is a text-driven life simulator set in Nigeria's Federal Capital Territory. You arrive in Abuja with a bag, small money and a plan. Then you try to build a life in a city where **who you know matters as much as what you know**, rent is paid two years upfront, and the distance between Maitama and Mararaba is way more than kilometres.

### Why this is NOT a copy of a Lagos game

Lagos games are about **hustle and chaos**. Abuja is a different city with different rules, and the game is built around them:

| Lagos vibe | Abuja Life vibe (our core) |
|---|---|
| Hustle hard, street smart | **Connection ("Long Leg")**: access beats effort |
| Born in the city | **Arrival**: you're a migrant; everyone is from somewhere |
| Traffic everywhere | **Satellite-town commute**: where you can afford to live decides how much life you get |
| Market & street economy | **Government economy**: ministries, contracts, budgets, politics seasons |
| Loud flex | **Packaging**: looking rich vs being rich (the famous Abuja "fake life") |
| Landlord wahala | **Demolition & 2-year rent**: you can lose your shop/house to a task force |

**Three signature systems no other Naija life sim does:** Long Leg (Connection), Packaging vs Reality, and the Commute Map. Every feature should feed one of these.

---

## 2. Core Loop

```
Start turn (1 turn = 1 month in v1, see §6)
 → Pay bills (rent due? school fees? family requests?)
 → Spend Time Points on actions (work, network, hustle, rest, flex…)
 → 0–2 random events fire (choices with consequences)
 → End month: salary, stats update, commute drain, age
 → Check milestones / endings
```

The player always has **more things to do than Time Points to do them**. That tension is the game.

---

## 3. Stats

### Primary stats (0–100)
| Stat | Meaning | Main drains / gains |
|---|---|---|
| **Health** ❤️ | Body | Commute, stress, bad food, hospital |
| **Happiness** 😊 | Mind | Owambe, relationships, debt, failure |
| **Smarts** 🧠 | Education/skills | School, courses, reading, experience |
| **Long Leg** 🦵 | Connections & access | Networking, owambe, church/mosque, alumni, favours |
| **Packaging** 👔 | How rich you *look* | Clothes, car, phone, address, social media |
| **Street Cred / Integrity** ⚖️ | Reputation for honesty (−100..+100) | Bribes, "sorting", keeping promises |

### Resources
- **Naira (₦)**: cash
- **Debt**: loan apps, cooperative, family, "I go pay you Friday"
- **Time Points (TP)**: per month budget (default 10; commute reduces it)
- **Energy**: soft cap on actions per month; low Health = less Energy

### The Packaging Gap (signature mechanic)
`Gap = Packaging − RealWealthScore`
- A big positive gap opens doors (dates, deals, invitations) **and** raises the risk of "exposure" events (car repossessed, landlord drama in public, borrowed outfit caught).
- A negative gap (rich but humble) = fewer doors, but safer and Integrity bonuses.

### Long Leg (signature mechanic)
- Contacts are actual **NPCs** with a `relationship` score and an `influence` tier (1–5).
- Your Long Leg stat = weighted sum of your best contacts.
- Many outcomes check Long Leg: job offers, contract approval, getting a demolition notice "reviewed", visa appointment, getting out of trouble.
- Contacts **ask for favours back**. Ignore them and they cool off. Help them and you might pay a price (Integrity hit, money, risk).

---

## 4. Character Creation: "How You Take Land Abuja"

Pick an **Arrival Path**. It sets starting age, money, stats and story. This replaces the "born at age 0" opening that other life sims use.

| Arrival Path | Age | ₦ Start | Notes |
|---|---|---|---|
| **UniAbuja Fresher** | 17 | ₦80k | Hostel life, 4–5 year degree, ASUU strike events |
| **NYSC Posting** | 23 | ₦120k | Kubwa camp → PPA posting. Can get retained or not |
| **Job Transfer** | 28 | ₦600k | Has a job already, but Abuja rent shock |
| **Hustler with Bag** | 20 | ₦35k | Hardest. Sleeps at a cousin's place in Nyanya |
| **Big Man Pikin** | 21 | ₦2.5m | Easy money, high Packaging, low Smarts. Family expectations |

Also choose:
- **Name, gender, look** (simple avatar)
- **State of origin** → flavours dialogue and gives one starting contact (e.g., your state's liaison office or a "brother" from home)
- **Faith** (Christian / Muslim / Other / None) → unlocks church/mosque networking and related events
- **Starting trait** (pick 1): *Sharp Mouth* (+Long Leg gain), *Book Worm* (+Smarts), *Fine Boy/Fine Girl* (+Packaging, +dating), *Strong Heart* (+Health), *Honest Pikin* (+Integrity, bribes cost more Happiness)

---

## 5. The Map: Abuja Districts

Where you live sets **rent**, **commute cost**, **Packaging bonus** and **event pool**.

| Tier | Areas | Rent/yr (placeholder ₦) | Commute TP cost | Packaging | Flavour |
|---|---|---|---|---|---|
| 1 | Maitama, Asokoro | 15m–40m | 0 | +25 | Embassies, ministers, silence |
| 2 | Wuse 2, Jabi, Guzape, Katampe | 6m–15m | 1 | +15 | Lounges, Jabi Lake, new money |
| 3 | Gwarinpa, Life Camp, Utako, Garki | 2.5m–6m | 2 | +8 | Estate life, "family man" zone |
| 4 | Kubwa, Lugbe, Dutse, Karu, Jikwoyi | 600k–2m | 3 | +2 | Long commute, community, markets |
| 5 | Nyanya, Mararaba, Masaka, Zuba | 250k–700k | 4 | 0 | Nasarawa/Niger border, Karu bridge wahala |

**Rent rules (Abuja realism):**
- Landlords demand **1–2 years upfront** + agent fee (10%) + legal fee (10%) + caution fee.
- Moving is a big money event. Being unable to renew = forced move down a tier, or squatting with family.

**Commute mechanic:**
- Each month, commute cost is deducted from Time Points and Health.
- Owning a car reduces TP cost by 1 but adds fuel + maintenance costs + FRSC/VIO events.
- Bolt/taxi = money for time. Bus/keke from Nyanya = cheap but drains Health.

**Places (action locations, unlocked over time):**
Wuse Market, Area 1 Market (Garki), Utako Market, Kado Fish Market, Jabi Lake Mall, Millennium Park, Federal Secretariat, National Assembly, the Embassy district, Nnamdi Azikiwe Airport, the train station (Abuja–Kaduna line), suya spots, lounges in Wuse 2, church/mosque, the National Hospital, private clinic.

---

## 6. Time System

- **1 turn = 1 month.** Abuja life runs on monthly salary + yearly rent, so monthly turns make both feel real.
- Default life length: arrival → age ~70 (around 500–600 turns). To keep it fast:
  - **"Skip month"**: auto-resolve with default actions (work + rest).
  - **"Fast forward 6 months"**: available once life is stable (no rent due, no active crisis).
- **Calendar events:** December (Detty-December-Abuja edition, family visits, end-of-year budget rush), Sallah and Christmas, budget season (ministries spend before the year ends), **election years every 4 in-game years** (politics season).

---

## 7. Actions (spend Time Points)

| Category | Actions |
|---|---|
| **Work** | Go to work, overtime, ask for promotion, look for job, side hustle |
| **Network** 🦵 | Attend owambe, visit "oga" at home, church/mosque fellowship, alumni meeting, lounge night, golf (late game), "see somebody" at the ministry |
| **Self** | Gym, read/course, hospital checkup, rest, therapy (rare unlock), pray |
| **Money** | Save, invest (T-bills, land, crypto, Ponzi 😬), borrow (loan app, cooperative, family), lend |
| **Flex** 👔 | Buy clothes, upgrade phone, buy/rent a car, post on social media, host a party |
| **Love** | Date, dating apps, meet the family, marry, have kids, divorce |
| **Family** | Send money home ("black tax"), visit the village, sponsor a sibling |
| **Shady** ⚖️ | Bribe, inflate a contract, "sort" an exam, fake document. Risky, Integrity hit, chance of EFCC/ICPC-style investigation |
| **Big Moves** | Buy land (Lugbe? Kuje? Watch for fake C of O), build a house, start a company, contest an election, japa |

---

## 8. Careers

Every career has **levels**, a **salary curve**, **Long Leg requirements** and its own **event pool**.

### 8.1 Civil Service (the Abuja classic)
- Grade Levels **GL 01 → GL 17 → Director → Permanent Secretary**.
- Entry needs: degree + Long Leg ≥ 30 (or pass the exam *and* get lucky).
- Low salary, **high stability**, big pension, "allowances", travel per diem.
- Events: salary delay, IPPIS issues, "verification exercise", posting to a far agency, office politics, budget-season "opportunities" (Integrity test).

### 8.2 Contractor
- Register a company → bid for government contracts.
- **Contracts need Long Leg + a front-loaded cost** (mobilisation, "PR", registration).
- Big payouts, but **payment delays** (you may wait 6–24 months), cash-flow crises, and audit risk.
- Signature tension: do you deliver quality or cut corners?

### 8.3 Politics
Ward councillor → Area Council chairman (AMAC, Bwari, Kuje, Gwagwalada, Kwali, Abaji) → House of Reps → Senate → Minister.
- Needs Long Leg, money and a party.
- Campaign = money sink. Godfather NPCs offer support with strings attached.
- Win = huge Long Leg and Packaging. Lose = debt + "enemies".
- **All politicians, parties and godfathers are fictional.**

### 8.4 NGO / International Org / Consultant
- Needs high Smarts + good English/proposal-writing.
- Dollar-pegged pay, donor funding cycles (contract can end suddenly).
- Opens embassy contacts → easier japa.

### 8.5 Tech
- Remote job, startup, freelancing. Abuja's growing tech scene (hubs, co-working).
- Income in dollars possible; NEPA/AEDC light and internet events matter a lot.

### 8.6 Trader
- Shop at Wuse/Utako/Area 1 market. Stock management mini-loop.
- **Demolition risk** (task force, illegal structures), FCT "environment" enforcement, market fires.

### 8.7 Transport
- Bolt/taxi driver (car-hire purchase), keke (restricted zones!), interstate bus.
- Events: city-centre keke/okada restrictions, VIO, fuel price jumps.

### 8.8 Professional
- Lawyer (Law School → chambers → SAN; courts are in Abuja, so big cases), Doctor (National Hospital, then japa temptation), Journalist (press gallery at National Assembly), Real Estate Agent (Abuja's real cash machine), Banker.

### 8.9 Security & Uniform
- Police, military (Mogadishu Barracks), FRSC, Immigration, Customs. Integrity tests are very common.

---

## 9. Signature Event Systems

### 9.1 Demolition Notice 🏚️
- Any shop, house or land in a "risky" area can get a notice ("X" painted on the wall).
- Options: fight it in court (money + time), use Long Leg, relocate, or ignore and pray.

### 9.2 Black Tax / Family Requests 👨‍👩‍👧
- Family members send requests: school fees, hospital, "your uncle's burial", "we are building the village house".
- Refusing hurts Happiness and family relationship. Paying drains money.
- Rich players get **more** requests (scaled to Packaging, not real wealth, so the Packaging Gap hurts here).

### 9.3 Japa Track ✈️
- Steps: passport (Immigration events) → proof of funds → embassy appointment (wait time reduced by Long Leg/NGO contacts) → interview (Smarts + documents + RNG) → leave.
- Japa = **soft ending**: game summarises your life, then option to continue in "Diaspora Mode" (later version).

### 9.4 Politics Season 🗳️
- Every 4 years: prices go up, "stomach infrastructure" handouts, rallies, road closures, people recruiting you.
- Choices: stay neutral, pick a side (rewards if they win, punishment if they lose), run yourself.

### 9.5 Land Scam 📜
- Buying land in fast-growing areas: chance the C of O is fake, someone else owns it, or it lies on a planned road.
- Due diligence (lawyer + AGIS search) costs money but cuts risk.

### 9.6 The Owambe Economy 🎉
- Weddings, burials, naming ceremonies, birthdays. Going = Long Leg + Happiness, costs money (aso-ebi!). Not going = relationships cool off.

---

## 10. Events

### 10.1 Event schema (data-driven)

```ts
type Event = {
  id: string;                 // "rent_landlord_increase_01"
  title: string;
  text: string;               // supports {name}, {area}, {landlord} placeholders
  weight: number;             // base probability weight
  cooldownMonths?: number;
  once?: boolean;
  conditions?: Condition[];   // e.g. { stat: "money", op: ">", value: 500000 }
  tags: string[];             // "rent", "civil_service", "politics_season"…
  choices: Choice[];
};

type Choice = {
  label: string;
  requires?: Condition[];     // greyed out if not met (show why)
  outcomes: Outcome[];        // weighted random outcomes
};

type Outcome = {
  weight: number;
  text: string;
  effects: Effect[];          // { stat: "happiness", delta: -10 }, { flag: "has_car" }, { addContact: "oga_ministry" }
  followUp?: string;          // event id to chain
};
```

### 10.2 Event pools
`arrival`, `housing`, `commute`, `work_<career>`, `money`, `love`, `family`, `health`, `politics_season`, `december`, `shady`, `japa`, `demolition`, `land`, `owambe`, `random_abuja`.

**v1 target:** 120 events. **Launch target:** 300+.

### 10.3 Sample events (tone reference)

**Agent Wahala** (`housing`)
> The agent show you one room self-contain for Kubwa. "Na ₦900k per year, two years upfront, plus agency, legal, and caution." You check am: no water, the window no close.
- *Pay am, at least na roof.* → −₦2.3m, Happiness −5
- *Price am down.* → Long Leg/Smarts check: 50% −20%, 50% agent vex and comot
- *Keep looking.* → +1 month at cousin's place, family relationship −5

**Long Leg Test** (`civil_service`)
> Recruitment don open for one federal agency. Your oga for church say "Bring your CV come, I go see wetin I fit do."
- *Bring the CV.* → requires Long Leg ≥ 25: 60% job offer GL 08; he go ask you for favour later
- *Apply the normal way.* → Smarts check, 15% chance
- *Ignore, I no dey beg.* → Integrity +5

**Packaging Exposure** (`flex`, needs Packaging Gap > 30)
> The Benz you dey use for Instagram, the owner don come carry am for Jabi Lake Mall car park, in front of your date.
- *Laugh am off.* → Packaging −15, date relationship −20
- *Say na your driver dey carry am go service.* → Smarts check; fail = Packaging −25

**Karu Bridge Morning** (`commute`, lives in tier 5)
> 5:30am you don dey bus stop. 8:40am you still dey Karu bridge. Oga don call you three times.
- *Waka enter Bolt.* → −₦6k, on time
- *Wait am out.* → Health −3, boss relationship −5

**Budget Season** (`civil_service`, month = Nov/Dec)
> Director call you: "We need to spend this money before December, or e go return to treasury. You understand?"
- *I understand, oga.* → +₦1.5m, Integrity −20, investigation risk +10%
- *Do am by the book.* → Integrity +10, director relationship −15
- *Report am.* → Integrity +25, 50% promoted/50% transferred to Abaji office

**Task Force Notice** (`demolition`, owns shop)
> You see red "X" for your shop wall for Utako. "Remove within 7 days."
- *Find lawyer.* / *Call your Long Leg.* / *Pack your goods now.* / *Ignore am.*

**Village People Request** (`family`)
> Uncle call: "Your cousin don enter university. You be the Abuja person, na you we dey look."
- *Pay full school fees.* / *Send small something.* / *Switch off phone for one week.*

**Election Year Recruitment** (`politics_season`)
> One aspirant boys come your street dey share rice and ₦5k. "Oga want make you be ward coordinator."
- *Collect the rice, ignore the rest.* / *Join the campaign.* / *Refuse the whole thing.*

---

## 11. Relationships & Family
- NPCs: parents, siblings, partner, kids, friends, boss, contacts (the Long Leg network).
- Dating via owambe, church/mosque, work, apps, lounge.
- Marriage needs: family introduction, bride price/traditional wedding (cost scales by state of origin & Packaging), white wedding (optional).
- Kids: school fees are a major money sink (private schools in Abuja = serious money). Kids can grow up into **heirs** (v2: continue playing as your child).

---

## 12. Economy (all numbers are tunable placeholders)

| Item | ₦ |
|---|---|
| Minimum wage / month | 70,000 |
| Civil servant GL 08 / month | 180,000 |
| Civil servant GL 14 / month | 550,000 |
| Director / month | 900,000 + allowances |
| NGO officer / month | 600,000–1,500,000 |
| Remote tech dev / month | 800,000–4,000,000 |
| Bolt trip city centre | 3,000–8,000 |
| Fuel / litre | 1,000 (events move it) |
| Aso-ebi | 25,000–150,000 |
| Used Corolla | 7m–12m |
| Plot of land, Kuje | 3m–8m |
| Plot of land, Guzape | 150m+ |

**Balancing goals:**
- Hustler path should be tough but able to reach tier 3 housing by age ~35 with good play.
- Shady paths pay faster but have compounding risk (investigation, enemies, Integrity locks some endings).
- Pure Packaging play should crash eventually unless backed by real income.

All economy values live in one config file (`economy.ts`) for easy tuning and inflation events.

---

## 13. Endings & Achievements

**Endings** (when you die, japa, or retire):
- Life summary: net worth, house, highest title, kids, Integrity, Long Leg, "how people remember you".
- An **epitaph line** generated from your stats ("E get money but nobody trust am", "Honest man wey Abuja no fit spoil").

**Titles/achievements (sample):**
- *Landlord*: own a house in Abuja
- *Long Leg Pro*: Long Leg 90+
- *Japa Master*: emigrate
- *Perm Sec*: reach Permanent Secretary
- *Distinguished Senator*
- *From Mararaba to Maitama*: start tier 5, live in tier 1
- *Clean Hands*: retire with Integrity 80+
- *Fake Life*: Packaging Gap > 60 for 2 years without exposure
- *Demolished*: lose property to the task force (sad achievement 😂)

---

## 14. UI / UX

Mobile-first, one-hand play.

**Screens**
1. **Splash / Menu**: New life, Continue, Settings, Achievements
2. **Arrival**: path picker → character setup
3. **Main (Month view)**: header (name, age, month, ₦, area); stats bars; Time Points left; big **"Next Month"** button
4. **Action tabs**: Work · Network · Money · Love · Flex · Big Moves
5. **Event modal**: text, choices (locked choices show why), outcome card
6. **Contacts**: Long Leg list (influence tier, relationship, pending favours)
7. **Map**: districts, move house, places
8. **Life log**: timeline of key events (shareable)
9. **Ending screen**: summary + **share card image** (for WhatsApp/IG/X; this is the viral loop)

**Style:** clean, green-white-green accents (not flag-heavy), Abuja skyline silhouette (Aso Rock, Zuma Rock, National Mosque/Ecumenical Centre shapes). Optional language toggle: **English / Pidgin**.

---

## 15. Tech Stack & Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | **React + TypeScript + Vite** | Fast, huge ecosystem |
| State | **Zustand** | Simple, serialisable for saves |
| Styling | **Tailwind CSS** | Fast mobile UI |
| Content | TS/JSON data files (`/content/events/*.ts`) | Writers can add events without touching the engine |
| Save | localStorage (v1) → cloud (v2, Supabase/Firebase) | Start simple |
| PWA | vite-plugin-pwa | Installable, offline play |
| Mobile store | **Capacitor** wrapper → Play Store / App Store | Same codebase |
| Hosting | Vercel / Netlify / Cloudflare Pages | Free tier is enough to start |
| Analytics | Privacy-friendly (Plausible/PostHog) | Learn which events people love |
| Tests | Vitest | Engine logic: effects, conditions, economy |

**Folder layout**
```
src/
  engine/        # pure TS, no React: turn loop, conditions, effects, RNG (seeded)
  content/
    events/      # one file per pool
    careers/
    districts.ts
    economy.ts
    strings/     # en.ts, pcm.ts (Pidgin)
  store/         # zustand game state + save/load + versioned migrations
  ui/            # screens & components
  assets/
```

**Engine rules**
- The engine is **pure and deterministic** given a seed, so it's testable and bugs are reproducible.
- Every save has a `version` field so new updates don't break old saves.
- Content is validated at build time (event ids unique, follow-ups exist, conditions valid).

---

## 16. Roadmap

### Phase 0: Prototype (week 1)
Engine + 1 arrival path (NYSC) + 3 careers (Civil Service, Trader, Bolt) + 3 districts + 40 events + save/load. **Goal: it's fun for 20 minutes.**

### Phase 1: MVP / Soft launch (weeks 2–4)
All 5 arrival paths, 6 careers, all 5 tiers, Long Leg contacts, Packaging Gap, black tax, demolition, 120 events, endings, share card, PWA. Launch on web, share with friends, collect feedback.

### Phase 2: Public launch (month 2)
300+ events, politics season, japa track, land system, Pidgin toggle, achievements, Play Store build, analytics.

### Phase 3: Grow (month 3+)
Cloud saves, heir/generation mode, Diaspora mode, weekly "Abuja news" event packs, cosmetics/IAP or rewarded ads, community-submitted events.

---

## 17. Publishing Checklist
- [ ] **Name check:** search "Abuja Life" on Play Store/App Store/socials; secure domain (e.g. `abujalife.app` / `.ng`) and handles
- [ ] Original art & copy only. **Don't reuse text, UI, art or code from Lagos Life or BitLife**
- [ ] Privacy policy (needed for Play Store and Nigeria's **NDPA 2023**)
- [ ] Age rating questionnaire (simulated gambling/alcohol/crime themes affect rating)
- [ ] Google Play developer account ($25 one-time); Apple ($99/yr) later
- [ ] Monetisation: start free; add rewarded ads ("watch ad to get ₦ loan") or a one-time "Premium" (no ads + extra careers)
- [ ] Payments for Nigerian users: Paystack/Flutterwave for web; store billing in app stores

---

## 18. Content Guidelines
- **Satire, not defamation:** no real living politicians, officials, celebrities or companies portrayed doing wrong. Use fictional names for people, parties and companies.
- Real places are fine (districts, markets, landmarks) and they make it feel real.
- Sensitive topics (insecurity on highways, kidnapping, ethnic/religious tension): handle carefully. Show the risk, don't glorify it, and never mock any tribe or religion.
- Crime paths always have consequences. The game comments on the system, it doesn't teach crime.
- Pidgin should sound natural. Have Abuja natives review strings.

---

## 19. Open Questions (owner to decide)
1. Final name: **Abuja Life**, or something more unique (e.g. *FCT: Long Leg*, *Abuja Dey Hot*, *Take Land Abuja*)?
2. Default language: English with Pidgin flavour, or full Pidgin by default?
3. Turn length: monthly (current spec) or yearly (faster, less detail)?
4. Art: pure text/emoji UI, or commission illustrations?
5. Monetisation preference: ads, one-time premium, or free forever?
