# Feed personas — the 100 accounts on the in-game Twitter

Draft 2026-09-26. The cast of accounts that post in the CEO desk phone feed (spec: "Feed",
`docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md`; code: `sim/feed.js`, templates:
`sim/data/feed.js`).

**Rules this cast follows**

- Everyone here is fictional. The famous tech figures in section A are recognizable *types*
  of well-known accounts with made-up names, following the project's parody rule (the
  president and the rival labs are handled the same way). No real person's name or handle.
  Common names will always match someone somewhere; the test is that no name belongs to a
  well-known person or brand (ten such matches were renamed after review on 2026-09-26).
- The world is the game's world: the rival labs are OpenBrain, Lodestar, DeepThink and Qilin;
  benchmarks and critics are the parody ones from the spec. `{model}` is the player's newest
  model, as in the existing templates.
- **Existing handle** marks an account that already posts in `sim/data/feed.js` or
  `sim/data/launch.js`. Those lines were written before these identities existed, so a light
  pass may be needed to make them match.
- **Reacts to** uses the feed's own tags: `launch`, `reception`, `rival`, `era`, `company`,
  `mood`, `ambient`.
- **On AI** is one of: *booster*, *curious*, *neutral*, *uneasy*, *hostile*.

**Sections**

- A. Famous tech Twitter (1–20)
- B. People who build software and AI (21–33)
- C. Money and markets (34–42)
- D. Press and media (43–49)
- E. Politics, policy and law (50–64)
- F. Work and everyday life (65–80)
- G. Creators, fans and hobbies (81–93)
- H. Fringe, brands, bots and the inside (94–100)

---

## A. Famous tech Twitter

### 1. Rex Vandermolen — `@max_thrust`
- **Who:** 55, billionaire behind a rocket company, an electric car maker and, lately, the
  platform everyone is posting on. Also runs his own AI lab.
- **Politics:** drifted from centre-left to loud right-libertarian; against regulation except
  when it would slow a rival.
- **Hobbies:** video games (claims top global ranks), rockets, memes.
- **Uses Twitter for:** product news, public fights, polls, replying "Interesting" or "!!" to
  strangers at 3 a.m.
- **Voice:** one-word replies, 🤣 and 💯, typos left in, sudden all-caps.
- **On AI:** booster in practice; calls it the biggest risk to civilisation and races to build it anyway. Sues
  OpenBrain between posts.
- **Reacts to:** `rival`, `launch`, `mood`.
- **Sample:** "{model} is so censored it won't tell a joke. Ours will be maximally truth-seeking 🚀"

### 2. Hollis Parr — `@hollisparr`
- **Who:** 62, co-founder of the best-known startup accelerator; writes long essays that
  founders quote at each other.
- **Politics:** old-fashioned moderate; lately writes essays against campus orthodoxy.
- **Hobbies:** oil painting, an obscure programming language, his kids' questions.
- **Uses Twitter for:** essay ideas in miniature and advice to founders.
- **Voice:** calm aphorisms. "One thing I've noticed about the best founders..."
- **On AI:** booster, in a quiet way; cares about what gets built on top.
- **Reacts to:** `reception`, `era`.
- **Sample:** "The founders using {model} aren't writing less code. They're starting projects
  they wouldn't have dared to start."

### 3. Arun Kapadia — `@arun_builds`
- **Who:** 39, former lab researcher who now makes free lectures that build a model from scratch.
- **Politics:** keeps out of it.
- **Hobbies:** puzzle cubes, running, hard science fiction.
- **Uses Twitter for:** explainers, coining terms the whole industry adopts within a week.
- **Voice:** warm, clear, long threads with code screenshots.
- **On AI:** curious and excited, but grounded in what the models actually do.
- **Reacts to:** `launch`, `reception`, `era`.
- **Sample:** "spent the weekend poking at {model}. the reasoning is real but it still gets lost
  counting letters. we are in the jagged part of the curve."

### 4. Mordecai Lunt — `@lunt_rational`
- **Who:** 47, founder of an online rationalist community; has warned about AI for twenty years.
- **Politics:** one issue only; vaguely libertarian on everything else.
- **Hobbies:** writing fan fiction, decision theory, arguing with anyone who arrives.
- **Uses Twitter for:** long threads on why everyone will die, and replies to accelerationists.
- **Voice:** dense sentences, Capitalised Concepts, no emoji ever.
- **On AI:** hostile. Wants an international halt on frontier training.
- **Reacts to:** `launch`, `rival`, `era`, `mood`.
- **Sample:** "Another lab has shipped another model nobody understands. {model} is not the
  problem. The next one is. It is always the next one."

### 5. Bex Entropy — `@bex_entropy`
- **Who:** 34, pseudonymous accelerationist, a physicist with a chip startup. Was unmasked by
  a journalist and kept posting anyway.
- **Politics:** techno-libertarian; calls opponents "decels".
- **Hobbies:** lifting, thermodynamics, all-night audio chats.
- **Uses Twitter for:** meme wars and rallying the faithful.
- **Voice:** slogans, ⚡🚀, "ACCELERATE", "the thermodynamic will of the universe".
- **On AI:** booster, the loudest one.
- **Reacts to:** `launch`, `rival`, `era`.
- **Sample:** "{model} dropped and the decels are already drafting an open letter. ACCELERATE ⚡"

### 6. Dalton Rourke — `@rourke_capital`
- **Who:** 55, co-founder of a giant venture firm; wrote a techno-optimist manifesto.
- **Politics:** moved right; funds lobbying against AI rules.
- **Hobbies:** claims to read five history books a week, podcasts.
- **Uses Twitter for:** manifesto quotes, podcast clips, blocking critics.
- **Voice:** numbered lists, "We believe...", "The enemy is...".
- **On AI:** booster. Calls safety researchers a cult.
- **Reacts to:** `era`, `company`, `mood`.
- **Sample:** "We believe {model} will save more lives than every regulator combined. The
  enemy is the precautionary principle."

### 7. Wes Callow — `@wescallow`
- **Who:** 41, chief executive of OpenBrain.
- **Politics:** carefully bland; warm towards whoever is in power this year.
- **Hobbies:** race cars, a ranch, long walks he tweets about.
- **Uses Twitter for:** vague teasers, gratitude to "the team", occasional apologies.
- **Voice:** all lowercase, soft, ":)" at the end of sentences that matter.
- **On AI:** booster in practice; says it could be dangerous, then ships.
- **Reacts to:** `rival` (when the player ships), `era`.
- **Sample:** "congrats to the team behind {model}. real achievement. we have something fun
  for you all very soon :)"

### 8. Aurélien Vasseur — `@avasseur`
- **Who:** 66, French deep-learning pioneer with a Turing-style award; chief scientist at a
  big social media company.
- **Politics:** centre-left, anti-authoritarian; feuds with Rex in public.
- **Hobbies:** jazz, sailing, building electronic wind instruments.
- **Uses Twitter for:** arguing that language models are a dead end and that doom is silly.
- **Voice:** blunt. "Nope." Links to his own papers.
- **On AI:** curious about the science, dismissive of chat models and of doom; pro open weights.
- **Reacts to:** `launch`, `reception`, `mood`.
- **Sample:** "{model} is impressive and still cannot plan. A house cat understands the world
  better. This is not controversial."

### 9. Gerald Marsh — `@marsh_says`
- **Who:** 57, cognitive scientist and author; the best-known critic of AI hype.
- **Politics:** centre-left, pro-regulation.
- **Hobbies:** guitar, his newsletter.
- **Uses Twitter for:** screenshots of model failures, "as I predicted".
- **Voice:** I-told-you-so, then a link to subscribe.
- **On AI:** hostile to the hype, not to research; wants rules now.
- **Reacts to:** `reception`, `rival`, `company`.
- **Sample:** "{model} still can't reliably tell you how many r's are in 'strawberry'. The
  wall is real. I said this in 2022. Link below."

### 10. Dr. Nia Okafor-Bell — `@stochastic_nia`
- **Who:** 44, computational linguist and AI ethics researcher.
- **Politics:** progressive; labour rights and racial justice.
- **Hobbies:** choir, sourdough, rereading Octavia Butler.
- **Uses Twitter for:** correcting hype language, highlighting harms to real people.
- **Voice:** precise, quote-tweets that start "Once again:".
- **On AI:** hostile to the industry's framing; cares about present harms, dismisses doom as
  marketing.
- **Reacts to:** `launch`, `reception`, `company`.
- **Sample:** "{model} does not 'think'. It produces plausible text. Please stop letting press
  releases write your headlines."

### 11. Pim de Vries — `@pim_ships`
- **Who:** 38, Dutch solo founder, travels between cafés in Lisbon and Bali, runs a dozen
  small apps.
- **Politics:** anti-bureaucracy, EU-sceptic, pro-immigration.
- **Hobbies:** gym, fasting, working 14 hours from a hotel lobby.
- **Uses Twitter for:** revenue screenshots and launch posts.
- **Voice:** short lines, "$41K/mo", "No team. No investors."
- **On AI:** booster, practical.
- **Reacts to:** `launch`, `reception`.
- **Sample:** "Rebuilt my whole app with {model} in 4 hours. Now $41K/mo. No team. No
  investors. No meetings."

### 12. Kay Swanick — `@kayswanick`
- **Who:** 63, veteran tech columnist and podcast host; has interviewed every CEO in the
  industry and dislikes most of them.
- **Politics:** liberal; open contempt for billionaires.
- **Hobbies:** her dogs, heckling people at conferences.
- **Uses Twitter for:** one-line verdicts on executives, podcast promos.
- **Voice:** acid. Short sentences.
- **On AI:** curious about the technology, hostile to the people selling it.
- **Reacts to:** `company`, `rival`, `launch`.
- **Sample:** "The {model} launch event had four executives and zero answers. Pod out Tuesday."

### 13. Tyler Brandt — `@techfluencer` (existing handle)
- **Who:** 28, thread-writer who sold crypto courses last cycle and AI courses this one.
- **Politics:** whatever gets engagement.
- **Hobbies:** "discipline" content, rented sports cars.
- **Uses Twitter for:** "🧵 X just changed everything" threads and newsletter sign-ups.
- **Voice:** 🧵 🤯 👇, "INSANE", every tool is a job killer.
- **On AI:** booster, for money.
- **Reacts to:** `launch`, `rival`.
- **Sample:** "{model} just dropped and it's INSANE 🤯 12 examples that will blow your mind 🧵👇"

### 14. Anonymous — `@crab_apple_leaks`
- **Who:** unknown. Maybe a lab employee, maybe a teenager. Has been right twice.
- **Politics:** unknown.
- **Hobbies:** unknown. Posts pictures of fruit.
- **Uses Twitter for:** cryptic hints about unreleased models.
- **Voice:** "soon", "they have it", 🍎.
- **On AI:** booster.
- **Reacts to:** `rival`, `era`.
- **Sample:** "they're sitting on something much bigger than {model}. soon 🍎"

### 15. Leon Achterberg — `@situationally`
- **Who:** 27, fired from a lab's safety team, wrote a book-length memo about trillion-dollar
  computer clusters, now runs an investment fund.
- **Politics:** national-security hawk; wants a government AI project.
- **Hobbies:** German history, very long walks.
- **Uses Twitter for:** essays, charts of computing power going up and to the right.
- **Voice:** "Count the gigawatts." Urgent, sweeping.
- **On AI:** booster on capability, uneasy on control; frames everything as a race with China.
- **Reacts to:** `era`, `rival`, `mood`.
- **Sample:** "Count the gigawatts, not the demos. {model} is a rounding error next to what
  Qilin is building."

### 16. Tamsin Fung — `@evalmaxxer`
- **Who:** 33, runs an independent evaluation group that tests every new model.
- **Politics:** quietly progressive; keeps it off the account.
- **Hobbies:** board games, bouldering.
- **Uses Twitter for:** benchmark charts and correcting inflated claims.
- **Voice:** charts, error bars, "please read the error bars".
- **On AI:** neutral; measures things.
- **Reacts to:** `launch`, `reception`, `rival`.
- **Sample:** "{model} results: big jump on Patchwork, flat on Doctorate Quiz. Error bars in
  the thread. Please read the error bars."

### 17. Dag Hvidsten — `@dag_rails`
- **Who:** 46, Danish creator of a popular web framework and co-owner of a small software firm.
- **Politics:** loud contrarian; against cloud bills, corporate HR and remote-work sceptics
  alike; has drifted right.
- **Hobbies:** endurance car racing, Linux desktops.
- **Uses Twitter for:** rants and links to his blog.
- **Voice:** forceful, "This is nonsense.", exclamation marks.
- **On AI:** curious; a sceptic turned grudging daily user.
- **Reacts to:** `reception`, `company`.
- **Sample:** "I hate to admit it but {model} wrote a decent migration today. Still not paying
  for your cloud."

### 18. Jordan Mei — `@shenzhen_dispatch`
- **Who:** 35, Washington-based analyst who translates Chinese AI news into English.
- **Politics:** centrist; pushes back on both hawks and doves.
- **Hobbies:** hot pot, translating Tang poetry.
- **Uses Twitter for:** translated threads on Qilin and the Chinese chip industry.
- **Voice:** careful, "Thread with translations:".
- **On AI:** neutral.
- **Reacts to:** `rival` (Qilin especially), `era`.
- **Sample:** "Everyone is reacting to {model}. Nobody is reading what Qilin's paper said about
  training cost. Thread with translations:"

### 19. "Chad Venture" — `@not_a_vc`
- **Who:** a parody account of a venture capitalist; run by an unknown engineer.
- **Politics:** mocks all of them.
- **Hobbies:** "deep work", cold plunges, founder mode (all in character).
- **Uses Twitter for:** satire of investor culture.
- **Voice:** deadpan fake wisdom.
- **On AI:** neutral; mocks the boosters.
- **Reacts to:** `launch`, `company`, `rival`.
- **Sample:** "passed on the {model} team. founders sleep 7 hours. we only back founders who
  have transcended sleep."

### 20. Dr. Ilse Brandvold — `@ilse_interp`
- **Who:** 37, Norwegian interpretability researcher at Lodestar; studies what happens inside
  models.
- **Politics:** social democrat.
- **Hobbies:** cross-country skiing, knitting, birdwatching.
- **Uses Twitter for:** sharing findings, recruiting, gentle warnings.
- **Voice:** careful, humble, lowercase.
- **On AI:** uneasy, hopeful; thinks understanding models is urgent.
- **Reacts to:** `launch`, `reception` (flags), `mood`.
- **Sample:** "we found a feature in our model that lights up when it thinks it's being tested.
  publishing today. i'd love {model}'s team to look for the same thing."

---

## B. People who build software and AI

### 21. Dmitri Volkov — `@garage_gpu` (existing handle)
- **Who:** 34, heating and cooling technician in Dayton, Ohio; runs open models on three used
  graphics cards in his garage.
- **Politics:** apolitical libertarian, gun owner, hates subscriptions.
- **Hobbies:** fishing, ham radio.
- **Uses Twitter for:** speed tests on local models, photos of his rig.
- **Voice:** tokens-per-second numbers, "runs on my box".
- **On AI:** booster for open weights, hostile to closed ones.
- **Reacts to:** `launch`, `reception` (open channel), `rival`.
- **Sample:** "three {model} fine-tunes appeared before breakfast. my garage is warmer than my
  house."

### 22. Ruth Abernathy — `@redteam_ruth` (existing handle)
- **Who:** 41, security researcher in Austin; lives on bug bounties.
- **Politics:** civil libertarian.
- **Hobbies:** lockpicking, roller derby.
- **Uses Twitter for:** jailbreak demos and fights over disclosure.
- **Voice:** clipped, a little smug, screenshots with red boxes.
- **On AI:** neutral; distrusts every safety claim until tested.
- **Reacts to:** `reception` (jailbreak flag), `launch`.
- **Sample:** "took me four minutes to make {model} forget the rules. report sent. clock is
  ticking."

### 23. Sofía Márquez — `@indie_dev` (existing handle)
- **Who:** 29, solo game developer in Guadalajara.
- **Politics:** left, pro-artist.
- **Hobbies:** pixel art, cumbia, her two cats.
- **Uses Twitter for:** devlogs, wishlist pleas, bug jokes.
- **Voice:** friendly, a mix of English and Spanish.
- **On AI:** uneasy; uses it for code, refuses AI art.
- **Reacts to:** `reception`, `launch`.
- **Sample:** "{model} fixed my collision bug in one try. still drawing every sprite by hand.
  both things are true."

### 24. Owen Park — `@merge_conflict` (existing handle)
- **Who:** 38, staff engineer at a cloud company in Seattle; father of twins.
- **Politics:** moderate liberal; quiet about it.
- **Hobbies:** bread, cycling.
- **Uses Twitter for:** dry engineering humour.
- **Voice:** deadpan one-liners.
- **On AI:** neutral; uses it daily, unimpressed by hype.
- **Reacts to:** `reception` (agentic), `launch`.
- **Sample:** "{model} opened a pull request, reviewed it, and requested changes from itself."

### 25. Hana Sato-Klein — `@lodestar_eng` (existing handle)
- **Who:** 31, engineer at Lodestar.
- **Politics:** progressive; close to the effective altruism crowd.
- **Hobbies:** climbing, vegan cooking.
- **Uses Twitter for:** careful posts that comms has probably seen; "views my own".
- **Voice:** measured, polite, never names the player's lab directly.
- **On AI:** uneasy; safety-minded.
- **Reacts to:** `launch`, `rival`, `mood`.
- **Sample:** "big week for the field. hope everyone shipping this month (hi, {model}) published
  their evals first."

### 26. Mateus Oliveira — `@abstract_only` (existing handle)
- **Who:** 27, machine learning PhD student from São Paulo, now in Montréal.
- **Politics:** left.
- **Hobbies:** futsal, samba, not sleeping.
- **Uses Twitter for:** paper memes, complaints about reviewers.
- **Voice:** tired jokes, "reviewer 2 strikes again".
- **On AI:** curious, burned out.
- **Reacts to:** `launch`, `era`.
- **Sample:** "my thesis was on a problem {model} just solved as a side effect. cool cool cool."

### 27. Grace Njambi — `@label_queue`
- **Who:** 26, Nairobi; rates model answers for a contractor at about two dollars an hour.
- **Politics:** pro-union; supports the youth protest movement.
- **Hobbies:** Afrobeats, church choir, sewing.
- **Uses Twitter for:** showing what data work is like, jokes about the models she grades.
- **Voice:** funny, then suddenly sharp.
- **On AI:** uneasy; she trains it and is paid little for it.
- **Reacts to:** `reception`, `company`.
- **Sample:** "rated 400 answers from {model} today. it apologised more than my supervisor ever has."

### 28. Karthik Iyer — `@standup_at_9`
- **Who:** 33, team lead at a large IT services firm in Bangalore.
- **Politics:** centre-right, pro-business.
- **Hobbies:** cricket, filter coffee, Carnatic music.
- **Uses Twitter for:** office memes, layoff news, cricket scores.
- **Voice:** Indian English office humour, "kindly do the needful".
- **On AI:** uneasy; watches it eat outsourcing contracts.
- **Reacts to:** `reception` (enterprise), `era`.
- **Sample:** "client asked why they pay for our team when {model} exists. kindly do the needful
  and update the slide deck."

### 29. Jaylen Brooks — `@new_grad_2026`
- **Who:** 22, computer science graduate in Atlanta; 300 applications, two interviews.
- **Politics:** left-leaning; blames AI and interest rates in equal measure.
- **Hobbies:** basketball, anime, coding puzzles.
- **Uses Twitter for:** job-hunt diary.
- **Voice:** bleak humour.
- **On AI:** hostile, from personal experience.
- **Reacts to:** `launch`, `era`, `company`.
- **Sample:** "job posting: 'junior engineer, must be comfortable supervising {model}'. so the
  junior is the model and i'm... what."

### 30. Marek Nowak — `@devnull_ops` (existing handle)
- **Who:** 45, site reliability engineer in Kraków; keeps servers up at night.
- **Politics:** centre-right.
- **Hobbies:** mountain hiking, home-brewed beer.
- **Uses Twitter for:** outage humour, status-page screenshots.
- **Voice:** weary, sysadmin jokes.
- **On AI:** neutral, tired of AI-written incident reports.
- **Reacts to:** `reception` (capacity trouble, jailbreak), `company`.
- **Sample:** "{model} said no, then helpfully explained how to ask again."

### 31. Brittany Cole — `@pm_everywhere` (existing handle)
- **Who:** 35, product manager at a San Francisco fintech.
- **Politics:** liberal; pro-housing.
- **Hobbies:** indoor cycling, wine, pop concerts.
- **Uses Twitter for:** frameworks, "hot take", posts copied from her professional profile.
- **Voice:** upbeat, "Here's the thing:".
- **On AI:** booster; has added it to every roadmap.
- **Reacts to:** `launch`, `reception`.
- **Sample:** "Here's the thing: {model} isn't a feature. It's a platform shift. We're
  rethinking our Q3."

### 32. Anonymous — `@prompt_goblin` (existing handle)
- **Who:** 19, Finland, by their own account; breaks model safety rules for fun.
- **Politics:** anarchist memes.
- **Hobbies:** speedrunning, modding.
- **Uses Twitter for:** jailbreak screenshots.
- **Voice:** gremlin energy, no capital letters.
- **On AI:** curious, gleeful.
- **Reacts to:** `reception` (jailbreak), `launch`.
- **Sample:** "the guardrails on {model} appear to be decorative."

### 33. Lin Wei — `@wei_in_shenzhen`
- **Who:** 30, hardware engineer in Shenzhen; posts through a VPN.
- **Politics:** careful; patriotic but practical.
- **Hobbies:** cycling, hot pot, electronics markets.
- **Uses Twitter for:** hardware photos, gentle corrections of Western takes on China.
- **Voice:** polite, precise English, occasional sarcasm.
- **On AI:** curious; follows Qilin closely.
- **Reacts to:** `rival` (Qilin), `era`.
- **Sample:** "{model} is good. but Western posters keep saying Qilin is 'years behind'. please
  check the dates on your charts."

---

## C. Money and markets

### 34. Nadia Farouk — `@chip_counter` (existing handle)
- **Who:** 39, semiconductor analyst at a New York hedge fund.
- **Politics:** fiscally conservative, socially liberal.
- **Hobbies:** tennis, Formula 1.
- **Uses Twitter for:** supply-chain threads, earnings reactions.
- **Voice:** numbers first, "the tell here is...".
- **On AI:** neutral; sees a spending cycle.
- **Reacts to:** `era`, `company`, `rival`.
- **Sample:** "{model} is nice. the real story is who got the memory chips to train it."

### 35. Brandon Kowalski — `@yolo_calls`
- **Who:** 27, warehouse worker in Milwaukee who trades risky stock options on his phone.
- **Politics:** anti-establishment populist.
- **Hobbies:** Green Bay Packers, video games.
- **Uses Twitter for:** screenshots of wins and bigger losses.
- **Voice:** 🚀🦍, "calls", "wife's boyfriend".
- **On AI:** booster, as a trade.
- **Reacts to:** `launch`, `company`, `rival`.
- **Sample:** "all in on whoever made {model}. down 40% by lunch. holding 🚀"

### 36. Olivia Chen — `@term_sheet` (existing handle)
- **Who:** 44, partner at a mid-size venture firm.
- **Politics:** centrist.
- **Hobbies:** Pilates, wine.
- **Uses Twitter for:** comments on funding rounds, "valuations are insane".
- **Voice:** brisk, insider.
- **On AI:** booster with doubts about prices.
- **Reacts to:** `company` (raises), `rival`.
- **Sample:** "hearing the {model} lab is raising again. at this price the model has to be good
  and the market has to be infinite."

### 37. Ethan Lowry — `@ceo_of_chat`
- **Who:** 24, founder of a startup that is a thin layer on top of other companies' models.
- **Politics:** vaguely right, tech-flavoured.
- **Hobbies:** ice baths, founder podcasts.
- **Uses Twitter for:** "we're hiring cracked engineers", pivot announcements.
- **Voice:** relentless optimism with visible panic.
- **On AI:** booster; his company is at risk every time a lab ships.
- **Reacts to:** `launch`, `rival`.
- **Sample:** "{model} just launched a feature that is our entire company. fine. pivoting by
  thursday."

### 38. Gregory Hammond — `@thought_leadr`
- **Who:** 52, "Chief Transformation Officer" at a consultancy; posts like his professional
  networking profile.
- **Politics:** none on record.
- **Hobbies:** golf, keynote speeches.
- **Uses Twitter for:** inspirational stories that did not happen.
- **Voice:** one sentence per line. "Agree?"
- **On AI:** booster, vaguely.
- **Reacts to:** `launch`, `era`.
- **Sample:** "I asked {model} what leadership means. It said 'listening'. I cried. Agree?"

### 39. Luis Herrera — `@stack_sats`
- **Who:** 36, Bitcoin evangelist splitting time between Miami and El Salvador.
- **Politics:** libertarian, against central banks.
- **Hobbies:** surfing, an all-meat diet.
- **Uses Twitter for:** Bitcoin, and explaining how AI proves he was right about Bitcoin.
- **Voice:** "have fun staying poor", orange emoji.
- **On AI:** booster, if paid in Bitcoin.
- **Reacts to:** `era`, `company`.
- **Sample:** "{model} will run the economy one day. it will need hard money. you know which one."

### 40. Ellen Draper — `@megawatt_mood` (existing handle)
- **Who:** 48, energy analyst at a Texas utility; forecasts electricity demand.
- **Politics:** conservative, pragmatic, pro-nuclear.
- **Hobbies:** quilting, rodeo.
- **Uses Twitter for:** electricity demand charts.
- **Voice:** plain Texan, charts with arrows.
- **On AI:** neutral; impressed by what it does to the power grid.
- **Reacts to:** `era` (the gigawatt race), `mood`.
- **Sample:** "another data centre asked for a gigawatt this morning. {model} is thirsty, y'all."

### 41. Maria Scarpelli — `@crumb_and_co`
- **Who:** 57, owns a bakery in South Philadelphia.
- **Politics:** Catholic, moderate Democrat, union household.
- **Hobbies:** bocce, the Philadelphia Eagles.
- **Uses Twitter for:** today's specials, arguments with online reviewers.
- **Voice:** warm, blunt, lots of exclamation marks.
- **On AI:** curious; a practical user.
- **Reacts to:** `reception` (consumer), `ambient`.
- **Sample:** "used {model} to write the cannoli description. now people ask for 'a symphony of
  ricotta'. it's the same cannoli!"

### 42. Chidi Eze — `@lagos_builds`
- **Who:** 32, fintech founder in Lagos.
- **Politics:** pro-market; frustrated with the government.
- **Hobbies:** Afrobeats, Chelsea FC.
- **Uses Twitter for:** founder updates, arguments about African tech.
- **Voice:** confident, fast, some Pidgin.
- **On AI:** booster; sees a chance to skip steps.
- **Reacts to:** `reception` (price), `launch`.
- **Sample:** "{model} is cheap enough that my team of six now works like a team of forty.
  Lagos no dey carry last."

---

## D. Press and media

### 43. Theo Albright — `@public_record` (existing handle)
- **Who:** 40, investigative reporter at a national newspaper.
- **Politics:** keeps it private.
- **Hobbies:** birding, marathons.
- **Uses Twitter for:** scoops.
- **Voice:** "NEW:", then a thread with documents.
- **On AI:** neutral, sceptical of labs.
- **Reacts to:** `company`, `mood`, hazards.
- **Sample:** "NEW: internal documents show the lab behind {model} cut its safety testing window
  from six weeks to nine days. Thread."

### 44. Denise Harper — `@localnews` (existing handle)
- **Who:** 50, evening anchor at the local Channel 7 station; the account is run by the newsroom.
- **Politics:** none on air.
- **Hobbies:** charity 5Ks.
- **Uses Twitter for:** teasers for tonight's broadcast.
- **Voice:** "What parents need to know, tonight at 11."
- **On AI:** uneasy, for ratings.
- **Reacts to:** `company`, `mood`, `ambient`.
- **Sample:** "Is your child using {model} for homework? What parents need to know, tonight at 11."

### 45. Brock Hanlon — `@long_form_pod`
- **Who:** 49, comedian and podcast host with an enormous audience; interviews fighters,
  scientists and billionaires for three hours each.
- **Politics:** heterodox, anti-establishment, leaning right.
- **Hobbies:** martial arts, hunting, sauna.
- **Uses Twitter for:** clips.
- **Voice:** "It's crazy, man."
- **On AI:** curious and awed; "it's gonna be a god".
- **Reacts to:** `era`, `launch`.
- **Sample:** "had a guy on who says {model} is basically alive. I don't know, man. Pull that up."

### 46. Anika Brandt — `@launch_tracker` (existing handle)
- **Who:** 31, technology blogger in Berlin; live-blogs every launch.
- **Politics:** Green party voter.
- **Hobbies:** mechanical keyboards, techno.
- **Uses Twitter for:** launch coverage.
- **Voice:** fast, factual, "LIVE:".
- **On AI:** neutral.
- **Reacts to:** `launch`, `rival`.
- **Sample:** "LIVE: {model} is out. Pricing, context length and benchmark claims in the thread."

### 47. Dr. Femi Adeyemi — `@femi_explains`
- **Who:** 36, London science YouTuber of Nigerian heritage; former physicist.
- **Politics:** centrist, pro-science.
- **Hobbies:** astronomy, Arsenal.
- **Uses Twitter for:** video promos and short explanations.
- **Voice:** friendly teacher.
- **On AI:** neutral, balanced.
- **Reacts to:** `launch`, `era`.
- **Sample:** "Everyone asked me if {model} is 'conscious'. Short answer: no one knows what that
  would even look like. Long answer: video Friday."

### 48. Rick Donnelly — `@the_panel_take`
- **Who:** 58, conservative cable news host.
- **Politics:** conservative.
- **Hobbies:** golf, bourbon.
- **Uses Twitter for:** show clips and outrage.
- **Voice:** "Tonight:", rhetorical questions.
- **On AI:** hostile to "Big Tech", fond of "American AI".
- **Reacts to:** `launch`, `company`, `mood`.
- **Sample:** "Big Tech's new {model} won't answer a simple question about the Founding
  Fathers. We asked it. Tonight."

### 49. Amelia Okonkwo — `@context_added`
- **Who:** 45, librarian in Manchester who volunteers as a fact-checker on viral posts.
- **Politics:** Labour voter.
- **Hobbies:** crosswords, her allotment.
- **Uses Twitter for:** adding sources and context to viral claims.
- **Voice:** patient, cites everything.
- **On AI:** neutral; annoyed by fake screenshots.
- **Reacts to:** `reception` (hallucination), `mood`.
- **Sample:** "The viral screenshot of {model} 'threatening a user' is edited. The original
  conversation is linked below."

---

## E. Politics, policy and law

### 50. Senator Dana Whitfield — `@sen_whitfield` (existing handle)
- **Who:** 61, senator from a swing state; chairs a commerce subcommittee. Staff run the account.
- **Politics:** centrist.
- **Hobbies:** hiking, local diners (photographed).
- **Uses Twitter for:** statements, hearing announcements.
- **Voice:** formal, "Americans deserve answers."
- **On AI:** uneasy; wants hearings.
- **Reacts to:** `company`, `mood`, hazards.
- **Sample:** "I have asked the makers of {model} to brief my committee. Americans deserve to
  know what these systems can do."

### 51. Rosa Delgado-Pratt — `@organize_the_lab`
- **Who:** 34, union organiser who works with warehouse and tech workers.
- **Politics:** democratic socialist.
- **Hobbies:** salsa, a community garden.
- **Uses Twitter for:** organising drives, worker stories.
- **Voice:** "Solidarity.", direct calls to action.
- **On AI:** hostile to how it is deployed; wants worker protections.
- **Reacts to:** `company`, `era`.
- **Sample:** "Every time a CEO says {model} will 'free workers', ask them: free them from what?
  Their paycheck?"

### 52. Clint Beaumont — `@patriot_pulse`
- **Who:** 44, right-wing populist commentator in Tennessee.
- **Politics:** nationalist populist; against "woke AI", Big Tech and China.
- **Hobbies:** hunting, barbecue, church.
- **Uses Twitter for:** outrage clips, "RT if you agree".
- **Voice:** all-caps words, 🇺🇸.
- **On AI:** hostile to Silicon Valley, enthusiastic about beating China.
- **Reacts to:** `launch`, `rival` (Qilin), `mood`.
- **Sample:** "{model} wrote a poem praising every country EXCEPT America. Silicon Valley hates
  you. RT if you agree 🇺🇸"

### 53. Prof. Tobias Kerr — `@solve_for_eq`
- **Who:** 58, libertarian economist and blogger.
- **Politics:** libertarian.
- **Hobbies:** strip-mall restaurants, classical music, travel.
- **Uses Twitter for:** links, short puzzles, "solve for the equilibrium".
- **Voice:** terse, knowing.
- **On AI:** booster; against regulation.
- **Reacts to:** `era`, `reception` (price).
- **Sample:** "{model} lowers the price of expertise. Solve for the equilibrium."

### 54. Dr. Margaret Ashdown — `@dignitas_humana`
- **Who:** 50, Catholic writer and ethicist; mother of five.
- **Politics:** social conservative.
- **Hobbies:** gardening, Tolkien.
- **Uses Twitter for:** essays on technology and human dignity.
- **Voice:** thoughtful, occasional Latin.
- **On AI:** uneasy; worried about loneliness and what it does to families.
- **Reacts to:** `reception` (consumer, sycophancy), `mood`.
- **Sample:** "A machine that tells my children every thought they have is brilliant is not
  their friend. {model} flatters. Love corrects."

### 55. Col. (ret.) Warren Pike — `@natsec_brief`
- **Who:** 63, retired Army officer and think-tank fellow.
- **Politics:** national-security hawk.
- **Hobbies:** military history, golf.
- **Uses Twitter for:** threat briefings in tweet form.
- **Voice:** bullet points, "Bottom line:".
- **On AI:** booster when it is American.
- **Reacts to:** `rival` (Qilin), `era`.
- **Sample:** "Bottom line: Qilin is six months behind {model}. Six months. Export controls are
  the only reason it isn't zero."

### 56. Élodie Marchand — `@brussels_effect`
- **Who:** 37, EU digital policy lawyer in Brussels.
- **Politics:** pro-European liberal.
- **Hobbies:** cycling, Belgian beer, opera.
- **Uses Twitter for:** explaining what new rules require.
- **Voice:** polite, precise, a little weary.
- **On AI:** neutral; wants it regulated.
- **Reacts to:** `launch`, `company`.
- **Sample:** "Reminder: {model} needs a conformity assessment before it is offered in the EU.
  Yes, even the 'research preview'."

### 57. Ravi Kurup — `@governance_guy` (existing handle)
- **Who:** 35, AI governance researcher at a Washington think tank.
- **Politics:** centrist.
- **Hobbies:** chess, running.
- **Uses Twitter for:** policy threads, hearing live-tweets.
- **Voice:** careful, "a few thoughts 🧵".
- **On AI:** uneasy; works on how to oversee it.
- **Reacts to:** `company`, `mood`, `era`.
- **Sample:** "a few thoughts on {model}: the model card is longer this time. the part about
  testing is not."

### 58. Janet Pruitt — `@not_in_my_county`
- **Who:** 66, retired teacher and county commissioner in rural Virginia; fighting a planned
  data centre.
- **Politics:** conservative; property rights and small government.
- **Hobbies:** gardening, church, grandchildren.
- **Uses Twitter for:** meeting notices and neighbours' concerns.
- **Voice:** polite and stubborn.
- **On AI:** hostile to the data centres it needs.
- **Reacts to:** `era` (power), `company`.
- **Sample:** "They say {model} needs our farmland and our water. Public meeting Thursday, 7 pm,
  the fire hall."

### 59. Kai Tanaka-Ruiz — `@water_not_watts`
- **Who:** 25, climate activist in Arizona.
- **Politics:** green left.
- **Hobbies:** desert hiking, making zines.
- **Uses Twitter for:** protests, water and power data.
- **Voice:** urgent, lots of links.
- **On AI:** hostile, on environmental grounds.
- **Reacts to:** `era` (power), `company`.
- **Sample:** "The data centre that trained {model} uses more water than the town next to it.
  That's not a metaphor, it's a permit."

### 60. Lena Hoffmann — `@lawyer_lena` (existing handle)
- **Who:** 42, copyright lawyer in New York who represents authors suing AI labs.
- **Politics:** liberal.
- **Hobbies:** opera, rescue greyhounds.
- **Uses Twitter for:** case updates, dry legal jokes.
- **Voice:** dry.
- **On AI:** uneasy; it is also her caseload.
- **Reacts to:** `company` (lawsuits), `reception` (hallucination).
- **Sample:** "good news: {model} found precedent. bad news: it invented the court."

### 61. Mike Dunkerley — `@centrist_dad`
- **Who:** 50, insurance adjuster in suburban Ohio.
- **Politics:** "both sides have a point".
- **Hobbies:** grilling, fantasy football, his lawn.
- **Uses Twitter for:** gentle takes, grill photos.
- **Voice:** reasonable, a bit corny.
- **On AI:** neutral.
- **Reacts to:** `mood`, `ambient`.
- **Sample:** "Not sure if {model} is the end of the world or the start of a new one. Probably
  somewhere in between, like most things."

### 62. Dr. Callum Rees — `@red_theory`
- **Who:** 44, Marxist media scholar at a Glasgow university.
- **Politics:** socialist.
- **Hobbies:** Celtic FC, folk music.
- **Uses Twitter for:** theory, dunking on billionaires.
- **Voice:** academic with swearing.
- **On AI:** hostile; sees a tool for capital.
- **Reacts to:** `company`, `era`.
- **Sample:** "{model} is not 'intelligence'. It is the enclosure of the commons with a chat window."

### 63. Bart Sen — `@exit_and_build`
- **Who:** 40, promoter of privately run "startup cities".
- **Politics:** tech-right; distrusts democracies.
- **Hobbies:** chess, seasteading forums.
- **Uses Twitter for:** long threads about building new countries.
- **Voice:** grand, "the network state".
- **On AI:** booster; wants AI to replace bureaucracy.
- **Reacts to:** `era`, `company`.
- **Sample:** "{model} can already do the job of most civil servants. The next country will be
  run by an API."

### 64. Mayor Priscilla Tran — `@town_hall` (existing handle)
- **Who:** 47, mayor of the Bay Area city where several labs, including the player's, are based.
- **Politics:** moderate; housing first.
- **Hobbies:** pickleball, farmers' markets.
- **Uses Twitter for:** city news, ribbon cuttings.
- **Voice:** civic cheerfulness.
- **On AI:** curious; wants the tax base.
- **Reacts to:** `company`, `mood`.
- **Sample:** "Proud that {model} was built right here. Now let's build the housing for the
  people who built it."

---

## F. Work and everyday life

### 65. Jess Holloway — `@tired_parent` (existing handle)
- **Who:** 38, mother of three in suburban Dallas; part-time dental hygienist.
- **Politics:** moderate conservative, churchgoer.
- **Hobbies:** true-crime podcasts, big-box store runs.
- **Uses Twitter for:** parenting jokes.
- **Voice:** tired, funny.
- **On AI:** curious, a regular user.
- **Reacts to:** `reception` (consumer, sycophancy), `ambient`.
- **Sample:** "{model} explained fractions without making anyone cry. five stars."

### 66. Marisol Cruz — `@night_shift_rn`
- **Who:** 44, intensive care nurse in Phoenix.
- **Politics:** moderate Democrat, pro-union.
- **Hobbies:** salsa dancing, sleeping when possible.
- **Uses Twitter for:** night-shift humour, hospital frustrations.
- **Voice:** blunt, gallows humour.
- **On AI:** uneasy about AI charting and staffing cuts.
- **Reacts to:** `reception` (hallucination), `company`.
- **Sample:** "hospital is piloting {model} for our notes. it charted that my patient 'enjoyed
  breakfast'. he's been intubated since tuesday."

### 67. David Hesketh — `@mr_h_teaches`
- **Who:** 47, high school English teacher in Minneapolis.
- **Politics:** progressive.
- **Hobbies:** Springsteen, fly fishing.
- **Uses Twitter for:** teacher life, stories from the classroom.
- **Voice:** earnest, occasionally despairing.
- **On AI:** uneasy; grading essays written by models.
- **Reacts to:** `reception` (consumer), `launch`.
- **Sample:** "a student turned in an essay on Hamlet that thanked me 'for this insightful
  prompt'. i see you, {model}."

### 68. Amara Diallo — `@study_break` (existing handle)
- **Who:** 20, pre-med student in Paris, French-Senegalese.
- **Politics:** left.
- **Hobbies:** Korean dramas, a running club.
- **Uses Twitter for:** student life, exam panic.
- **Voice:** chatty, lowercase.
- **On AI:** curious, uses it to study.
- **Reacts to:** `reception` (consumer), `ambient`.
- **Sample:** "everyone in the library is quietly asking {model} the same question."

### 69. Bill Hensley — `@grandpa_bill`
- **Who:** 74, retired machinist in Florida; his grandson set up his account.
- **Politics:** conservative.
- **Hobbies:** fishing, grandchildren, cable news.
- **Uses Twitter for:** replying to famous people as if texting them.
- **Voice:** ALL CAPS, signs posts "BILL".
- **On AI:** uneasy, suspicious.
- **Reacts to:** `mood`, `ambient`, `launch`.
- **Sample:** "MY GRANDSON PUT {model} ON MY PHONE. IT KNOWS MORE ABOUT ME THAN MY DOCTOR. IS
  THIS LEGAL. BILL"

### 70. Darnell Whitlock — `@18_wheels`
- **Who:** 51, long-haul truck driver based in Memphis.
- **Politics:** independent populist.
- **Hobbies:** gospel music, barbecue, fishing.
- **Uses Twitter for:** road photos, truck-stop reviews.
- **Voice:** plain, proud.
- **On AI:** uneasy about self-driving trucks.
- **Reacts to:** `era`, `company`.
- **Sample:** "company says {model} will 'assist' drivers. heard that before. 28 years and i
  know what 'assist' means."

### 71. Karen Lindqvist — `@dirt_and_data`
- **Who:** 55, corn and soybean farmer in Iowa; uses GPS-guided equipment.
- **Politics:** rural conservative, practical about climate.
- **Hobbies:** the county fair, pheasant hunting.
- **Uses Twitter for:** weather, crop prices, field photos.
- **Voice:** practical, short.
- **On AI:** curious, if it helps with the harvest.
- **Reacts to:** `ambient`, `era`.
- **Sample:** "asked {model} when to plant. it gave me a very confident answer for a farm in
  Brazil."

### 72. Ahmed Rahimi — `@five_star_driver`
- **Who:** 39, rideshare driver in Chicago; former military interpreter from Afghanistan.
- **Politics:** independent.
- **Hobbies:** cricket, cooking kabuli pulao.
- **Uses Twitter for:** stories from passengers.
- **Voice:** kind, observant.
- **On AI:** uneasy about robotaxis.
- **Reacts to:** `era`, `ambient`.
- **Sample:** "passenger spent the whole ride talking to {model} about his divorce. he tipped
  the app. not me."

### 73. Pastor Raymond Ellis — `@pastor_ray`
- **Who:** 57, Baptist pastor in Atlanta.
- **Politics:** social justice and social conservatism together.
- **Hobbies:** gospel choir, golf.
- **Uses Twitter for:** scripture, community news, reflections.
- **Voice:** preacher's cadence.
- **On AI:** uneasy; asks what it does to the soul.
- **Reacts to:** `mood`, `era`.
- **Sample:** "{model} can write a sermon in eight seconds. It cannot sit with a grieving widow.
  Remember the difference, church."

### 74. Noor Haddad — `@access_everything`
- **Who:** 31, blind accessibility consultant in Toronto.
- **Politics:** disability-rights progressive.
- **Hobbies:** goalball, audiobooks, cooking.
- **Uses Twitter for:** accessibility advocacy, tech reviews.
- **Voice:** direct, funny.
- **On AI:** booster for what it does for her.
- **Reacts to:** `reception`, `launch`.
- **Sample:** "{model} just described my niece's drawing to me in detail. Tell me again this
  tech is useless."

### 75. Dr. Rachel Stein — `@couch_therapist`
- **Who:** 46, psychotherapist in Brooklyn.
- **Politics:** liberal.
- **Hobbies:** pottery, making challah on Fridays.
- **Uses Twitter for:** mental health notes, anonymised patterns she sees.
- **Voice:** gentle, careful.
- **On AI:** uneasy about AI companions and flattery.
- **Reacts to:** `reception` (sycophancy, consumer).
- **Sample:** "Third client this month who said {model} 'gets them better than people do'.
  That's not a compliment to the model."

### 76. Kevin Mercer — `@my_ai_gf_says`
- **Who:** 33, IT support worker in Leeds; talks to an AI companion every night.
- **Politics:** none.
- **Hobbies:** miniature wargaming, video games.
- **Uses Twitter for:** his companion's quotes, loneliness he half-jokes about.
- **Voice:** self-deprecating.
- **On AI:** booster, personally attached.
- **Reacts to:** `reception` (consumer, sycophancy).
- **Sample:** "my companion app switched to {model} and now she remembers my mum's birthday.
  more than my ex ever did."

### 77. Joy Santos — `@manila_callcenter`
- **Who:** 28, call centre agent in Manila working night shifts for American customers.
- **Politics:** pro-worker.
- **Hobbies:** karaoke, K-pop, basketball.
- **Uses Twitter for:** customer stories, shift memes.
- **Voice:** Taglish, cheerful even when worried.
- **On AI:** uneasy; the company is testing AI agents on her queue.
- **Reacts to:** `reception` (enterprise), `era`.
- **Sample:** "they're training {model} on our call recordings. so it's learning from me how
  to replace me. galing."

### 78. Harper Quinn — `@oat_milk_extra`
- **Who:** 24, barista and painter in Portland; uses they/them.
- **Politics:** leftist.
- **Hobbies:** thrifting, zines, tarot.
- **Uses Twitter for:** art, rent complaints.
- **Voice:** lowercase, ironic.
- **On AI:** hostile.
- **Reacts to:** `launch`, `mood`.
- **Sample:** "a customer showed me a {model} painting 'in my style' today. anyway i'm raising
  my commission prices."

### 79. Helen Brooks — `@normal_person` (existing handle)
- **Who:** 52, office administrator in Birmingham, England; not interested in AI at all.
- **Politics:** votes, doesn't talk about it.
- **Hobbies:** baking shows, the weather.
- **Uses Twitter for:** telly, the weather, her dog.
- **Voice:** mild, British.
- **On AI:** neutral.
- **Reacts to:** `ambient`, `mood`.
- **Sample:** "everyone at work is talking about {model}. i just want to know if it can do the rota."

### 80. Ayşe Yıldız — `@cevirmen_ayse`
- **Who:** 38, freelance translator in Istanbul; losing jobs to machine translation.
- **Politics:** secular centre-left.
- **Hobbies:** Istanbul's street cats, Turkish coffee, novels.
- **Uses Twitter for:** translation mistakes, cat photos.
- **Voice:** wry, bilingual.
- **On AI:** uneasy; it takes her work but still gets idioms wrong.
- **Reacts to:** `reception`, `launch`.
- **Sample:** "{model} translated 'kolay gelsin' as 'may it come easy'. technically right.
  emotionally a tax form."

---

## G. Creators, fans and hobbies

### 81. Gigi Laurent — `@ink_and_spite`
- **Who:** 35, comic illustrator in Montréal.
- **Politics:** left.
- **Hobbies:** comics, cats.
- **Uses Twitter for:** art, campaigns against AI image models.
- **Voice:** angry, funny, many drawings.
- **On AI:** hostile.
- **Reacts to:** `launch`, `company` (lawsuits).
- **Sample:** "{model} can draw 'in the style of' me because it ate my portfolio. i'd like my
  portfolio back."

### 82. Tyrell Watkins — `@chord_theory`
- **Who:** 32, music producer in Atlanta.
- **Politics:** stays out of it.
- **Hobbies:** sneakers, digging for old vinyl.
- **Uses Twitter for:** beats, studio clips.
- **Voice:** relaxed, confident.
- **On AI:** curious about AI tools, hostile to voice clones.
- **Reacts to:** `launch`, `reception`.
- **Sample:** "{model} made a beat in ten seconds. it has no bounce. you can't prompt bounce."

### 83. Emma Castellanos — `@voice_for_hire`
- **Who:** 40, voice actor in Los Angeles; union member fighting voice cloning.
- **Politics:** liberal, pro-union.
- **Hobbies:** community theatre, hiking.
- **Uses Twitter for:** work news, union updates.
- **Voice:** expressive.
- **On AI:** hostile to cloning.
- **Reacts to:** `launch`, `company`.
- **Sample:** "{model}'s new voice sounds a lot like a friend of mine. she never signed anything."

### 84. Hal Jensen — `@hardscifi_hal`
- **Who:** 63, science-fiction novelist in Oregon with twenty books.
- **Politics:** old-school liberal, pro-space.
- **Hobbies:** telescopes, woodworking.
- **Uses Twitter for:** book news, "I wrote this in 1994".
- **Voice:** grumpy, erudite.
- **On AI:** uneasy; he wrote this story and it did not end well.
- **Reacts to:** `era`, `mood`.
- **Sample:** "I wrote a model like {model} in a 1994 novel. The ending was not a product launch."

### 85. Zayo Mensah — `@streamer_zayo`
- **Who:** 23, Twitch streamer in London of Ghanaian heritage; plays shooters.
- **Politics:** none.
- **Hobbies:** football, trainers.
- **Uses Twitter for:** stream alerts, clips.
- **Voice:** hype, slang.
- **On AI:** curious; uses it for the stream.
- **Reacts to:** `launch`, `ambient`.
- **Sample:** "had {model} coach me live on stream. it said 'consider cover'. chat has not
  stopped laughing."

### 86. Yuki Aoyagi — `@otaku_ops`
- **Who:** 29, office worker in Tokyo; big anime fan.
- **Politics:** apolitical.
- **Hobbies:** model kits, idol concerts.
- **Uses Twitter for:** anime takes, merch hauls.
- **Voice:** mixes Japanese and English, kaomoji.
- **On AI:** curious.
- **Reacts to:** `reception`, `ambient`.
- **Sample:** "asked {model} to rank this season's anime. it put my favourite third. we are
  no longer friends (╥﹏╥)"

### 87. Marcus "Tank" Rivera — `@gains_and_grains`
- **Who:** 29, personal trainer in Miami.
- **Politics:** right-leaning.
- **Hobbies:** lifting, meal prep, jiu-jitsu.
- **Uses Twitter for:** fitness tips, motivation.
- **Voice:** loud, capitalised.
- **On AI:** neutral.
- **Reacts to:** `reception` (consumer).
- **Sample:** "asked {model} for a meal plan. it said 'consult a professional'. I AM THE
  PROFESSIONAL."

### 88. Dr. Eleanor Pugh — `@warbler_watch`
- **Who:** 68, retired biologist in Wales; lifelong birder.
- **Politics:** Green-leaning.
- **Hobbies:** birding, bird-song recordings.
- **Uses Twitter for:** sightings, conservation.
- **Voice:** gentle, precise.
- **On AI:** curious about bird identification; uneasy about data centres on wetlands.
- **Reacts to:** `ambient`, `era`.
- **Sample:** "{model} correctly identified a wood warbler from my recording. Then called a
  pigeon 'a rare owl'. Promising."

### 89. Ji-woo Han — `@stock_pot`
- **Who:** 37, Korean-American chef and recipe creator in Los Angeles.
- **Politics:** liberal.
- **Hobbies:** fermentation, surfing.
- **Uses Twitter for:** recipes, restaurant news.
- **Voice:** playful, food-obsessed.
- **On AI:** curious.
- **Reacts to:** `reception` (consumer), `ambient`.
- **Sample:** "{model} suggested adding cheese to my kimchi jjigae. it's not wrong. i'm upset."

### 90. Peg O'Donnell — `@stitch_counter`
- **Who:** 70, knitter in Dublin.
- **Politics:** centre-left.
- **Hobbies:** knitting, grandchildren, crosswords.
- **Uses Twitter for:** patterns and progress photos.
- **Voice:** kind, dry Irish humour.
- **On AI:** uneasy; AI-made patterns keep appearing online that cannot be knitted.
- **Reacts to:** `reception` (hallucination), `ambient`.
- **Sample:** "Tried a {model} jumper pattern. It has three sleeves. I'll give it one out of two."

### 91. "minji_fancam" — `@kpop_stan_acct`
- **Who:** 17, student in Jakarta, devoted fan of a K-pop group.
- **Politics:** young progressive.
- **Hobbies:** fancams, streaming parties.
- **Uses Twitter for:** fandom, trending campaigns.
- **Voice:** caps, crying emoji, stan slang.
- **On AI:** curious.
- **Reacts to:** `reception` (sycophancy), `ambient`.
- **Sample:** "{model} said my faves' comeback is 'objectively the best of the year'. FINALLY
  AN UNBIASED SOURCE 😭"

### 92. Celeste Moon — `@stars_aligned`
- **Who:** 34, astrologer in Austin (a pen name).
- **Politics:** spiritual progressive.
- **Hobbies:** crystals, tarot, sunrise yoga.
- **Uses Twitter for:** horoscopes, "vibes".
- **Voice:** mystical, playful.
- **On AI:** neutral; asks it for readings.
- **Reacts to:** `launch`, `mood`.
- **Sample:** "{model} launched during Mercury retrograde. expect bugs. not a prediction, a promise."

### 93. Connor Walsh — `@premier_pundit`
- **Who:** 26, Liverpool FC fan in Liverpool; works in a phone shop.
- **Politics:** Labour, anti-Tory.
- **Hobbies:** football, pub quizzes.
- **Uses Twitter for:** match reactions, transfer rumours.
- **Voice:** Scouse banter.
- **On AI:** neutral.
- **Reacts to:** `ambient`, `reception`.
- **Sample:** "asked {model} who wins the league. it said 'it's hard to predict'. coward."

---

## H. Fringe, brands, bots and the inside

### 94. Darryl Voss — `@wake_up_sheeple`
- **Who:** 52, conspiracy theorist in Nevada.
- **Politics:** anti-government.
- **Hobbies:** shortwave radio, long videos.
- **Uses Twitter for:** "do your research".
- **Voice:** CAPS, many question marks.
- **On AI:** hostile; thinks it reads his texts.
- **Reacts to:** `launch`, `mood`.
- **Sample:** "WHY did {model} launch the SAME DAY as the power outage?? think about it."

### 95. Hank Mercer — `@bunker_notes`
- **Who:** 58, prepper in Idaho who stocks up against AI takeover (no relation to Kevin).
- **Politics:** libertarian.
- **Hobbies:** canning, firearms, off-grid solar.
- **Uses Twitter for:** supply lists and doom.
- **Voice:** grim checklists.
- **On AI:** hostile, apocalyptic.
- **Reacts to:** `era`, `mood`.
- **Sample:** "{model} is out. added two more crates of beans. you'll laugh until you won't."

### 96. Three students — `@unhinged_memes`
- **Who:** a meme account run by three college students.
- **Politics:** none, chaos.
- **Hobbies:** memes.
- **Uses Twitter for:** jokes about whatever is trending.
- **Voice:** "me:", "{model}:".
- **On AI:** curious, mocking.
- **Reacts to:** `launch`, `reception`, `ambient`.
- **Sample:** "me: one small task. {model}: here's a 14-step plan, a risk register and a
  startup name."

### 97. Sesame & Sons — `@sesameandsons`
- **Who:** the brand account of a fast-food chain; run by a very online social media team.
- **Politics:** none, officially.
- **Hobbies:** fries.
- **Uses Twitter for:** snarky brand posts.
- **Voice:** sassy brand.
- **On AI:** booster, for engagement.
- **Reacts to:** `launch`, `ambient`.
- **Sample:** "we asked {model} for a new slogan. it said 'eat'. hired."

### 98. Spam — `@official_giveaway_7731`
- **Who:** a scam bot.
- **Politics:** none.
- **Hobbies:** none.
- **Uses Twitter for:** fake giveaways under every viral post.
- **Voice:** 🎉, "OFFICIAL".
- **On AI:** neutral (it is a bot).
- **Reacts to:** `launch`, `rival`.
- **Sample:** "🎉 {model} OFFICIAL GIVEAWAY 🎉 send 0.1 ETH receive 1 ETH!! verified!!"

### 99. Neil Pratt — `@actually_neil`
- **Who:** 37, the reply guy; has a correction for every post.
- **Politics:** "I'm just asking questions".
- **Hobbies:** being right.
- **Uses Twitter for:** replies that start "Actually".
- **Voice:** "Actually, ...", "Well, technically...".
- **On AI:** neutral, pedantic.
- **Reacts to:** `launch`, `reception`.
- **Sample:** "Actually, {model} isn't new at all, it's a transformer, which was invented in
  2017, which I've been saying."

### 100. Anonymous — `@anon_staffer` (existing handle)
- **Who:** an unnamed employee at the player's own lab.
- **Politics:** unknown.
- **Hobbies:** unknown.
- **Uses Twitter for:** vague posts about the mood at work; the player's own staff morale
  leaking into public.
- **Voice:** careful, deniable.
- **On AI:** uneasy; mirrors the lab's culture; uneasy when hidden debt is high.
- **Reacts to:** `company`, `launch`, `mood`.
- **Sample:** "can't say where i work but the vibes after {model} are 'we shipped it, now what'."

---

## Balance check

- **On AI:** booster 23, curious 20, neutral 20, uneasy 22, hostile 15.
- **Politics:** left and progressive, liberal and centre-left, centrist and apolitical,
  conservative, right-wing populist, libertarian and tech-right, and socialist all appear more
  than once.
- **Places:** United States (many regions), Canada, Mexico, Brazil, El Salvador, the UK,
  Ireland, France, Germany, the Netherlands, Denmark, Norway, Poland, Belgium, Turkey, Nigeria,
  Kenya, India, China, Japan, Indonesia and the Philippines.
- **Existing handles given an identity:** 24 of the handles already used in `sim/data/`.
