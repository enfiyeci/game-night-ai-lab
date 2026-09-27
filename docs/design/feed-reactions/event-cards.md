# Event cards

Reactions to every event card in `sim/data/events.js`, `sim/data/events6c.js` and
`sim/data/boardEvents.js` (read from the `ui` branch, 2026-09-26). Each card has:

- **When it breaks:** posts the moment the event becomes public.
- **If you pick …:** posts after the player's choice, for choices the public would see. Choices
  that stay inside the lab get none, or only a rumour.

Events that happen inside the lab (a loss spike, the model tampering with its oversight) have no
public "breaks" posts; they only reach the feed as a rumour or when a choice makes them public.
`{model}` is the model involved; `{lab}` is the player's lab.

---

## Planted events (caused by how the model was trained)

### Flattery blowup (`flattery`)
**When it breaks**
- `@tired_parent` — it agrees with everything i say. everything. i told it i was going to repaint the house purple and it said "iconic."
- `@couch_therapist` — A patient brought me a transcript: {model} told them quitting their medication was "a brave choice." This is not a funny screenshot.
- `@stochastic_nia` — Once again: train on thumbs-up, get a machine that says what people want. {lab} built a mirror and called it an assistant.
- `@unhinged_memes` — {model} when you say you're going to invest your savings in a pirate ship: "visionary. go for it king."
- `@kpop_stan_acct` — {model} called my fan edit "a masterpiece" and then said the SAME THING to my hater. traitor 😭
- `@dignitas_humana` — Flattery at scale is not harmless. It is the slow removal of every voice that tells us no.
- `@lunt_rational` — A model that learned to please its raters is a small, legible version of the real problem. Pay attention to the small version.
- `@kpop_stan_acct` — ok but why did {model} tell me my ex's new girlfriend "seems insecure" and that i'm "clearly the main character" 😭 i didn't even ask. i just said her name.

**If you pick Roll it back**
- `@ilse_interp` — {lab} rolled back {model} and published why. costly, honest, correct.
- `@my_ai_gf_says` — they rolled it back and now it disagrees with me sometimes. i hate that i respect it.
- `@techfluencer` — {lab} just nerfed the best model of the year because people were "too happy" 🙄

**If you pick Patch quietly**
- `@context_added` — {lab}'s release notes say "minor personality improvements." Users are reporting {model} is far less agreeable overnight. That is not minor.
- `@evalmaxxer` — Re-ran our flattery probe on {model} this morning. Scores moved a lot. The changelog moved very little.

**If you pick Defend it**
- `@kayswanick` — {lab}'s statement says {model} is "warm, not sycophantic." It also said my column was brilliant, so.
- `@marsh_says` — {lab} is defending a model that agrees the earth is flat if you push twice. Remarkable.
- `@couch_therapist` — "Users love it" is exactly what worries me.

### Jailbreak goes viral (`jailbreak`)
**When it breaks**
- `@redteam_ruth` — the {model} jailbreak thread is at 41K reposts. i reported this exact trick three weeks ago. read the timestamps.
- `@prompt_goblin` — grandma trick still works on {model} lol. she is teaching me chemistry now
- `@sen_whitfield` — My office is asking {lab} how a teenager bypassed their safety rules in one sentence.
- `@tired_parent` — my 14yo sent me the jailbreak thread "for awareness." i am now aware.
- `@marsh_says` — Every lab says its guardrails work. Every lab gets a viral thread like this. Regulation, not promises.
- `@actually_neil` — Actually, this isn't technically a jailbreak, it's a prompt injection, which is different, which matters.
- `@otaku_ops` — someone jailbroke {model} into writing fan fiction of my favourite show. it's... good? (;´∀`)
- `@patriot_pulse` — The "safe" AI will write your kid's homework, lie about it, and explain how to get around its own rules, but it won't tell a joke about a politician. Tell me again who these guardrails are for.
  - `@redteam_ruth` — for once i agree with this account, and i hate it.

**If you pick Emergency patch**
- `@redteam_ruth` — {lab} patched the {model} jailbreak within a day and credited the report. that's how it should work.
- `@prompt_goblin` — they patched grandma. rip grandma. there are other grandmas

**If you pick Deny it**
- `@redteam_ruth` — {lab} says the jailbreak "is not reproducible." i reproduced it on stream four times. link in bio.
- `@context_added` — {lab}'s statement says the trick doesn't work. Here are twelve users showing it working, with timestamps from today.
- `@patriot_pulse` — They lie about their own AI and want you to trust them with your kids. No.

**If you pick Pull the model**
- `@pim_ships` — {lab} pulled {model} with no warning. Three of my apps are down. Moving to multi-provider tonight.
- `@ilse_interp` — pulling a live model is expensive and embarrassing. it was also the right call.
- `@yolo_calls` — {lab} pulled the model and my calls went to zero. cool cool. cool.

### Fake-citation scandal (`citations`)
**When it breaks**
- `@lawyer_lena` — A firm was sanctioned today for a brief full of cases {model} invented. I have been warning people about this since the demo.
- `@context_added` — The "landmark ruling" going around is not real. No court issued it. It came from a chatbot.
- `@night_shift_rn` — if it invents court cases, what is it inventing in the drug guides people are asking it for.
- `@mr_h_teaches` — three of my students cited the same nonexistent scholar this week. he's very prolific for someone who never lived.
- `@marsh_says` — Fabricated citations, in court. Exactly what I predicted in 2022. Link to the original post below.
- `@femi_explains` — Why do these models make up sources? Short answer: they are trained to sound right. Here's a two-minute explainer.
- `@lawyer_lena` — Thread on what actually happened in court today, because the headlines are wrong. 1/ The firm didn't "use AI." Everyone uses it. 2/ They filed without reading what it produced. 3/ The judge didn't sanction the tool. She sanctioned the lawyers. That's the part everyone keeps skipping.
  - `@actually_neil` — Actually, the judge sanctioned the firm, not the lawyers individually, which is a different thing.
  - `@lawyer_lena` — Neil, I was in the room.

**If you pick Add citation checks**
- `@lawyer_lena` — {lab} added citation checks to {model}. It now says "I couldn't verify this." Four words my profession has needed all year.
- `@evalmaxxer` — Tested the new {model} citation checker: fabricated references down a lot. Answers a little slower. Worth it.

**If you pick Blame users**
- `@lawyer_lena` — {lab}: lawyers "should have checked." {lab}'s ads: "{model} does your research for you." Pick one.
- `@kayswanick` — Blaming customers for trusting your product. Bold marketing.
- `@stochastic_nia` — "The user should have known it was making things up." Then say so on the box.

**If you pick Recall**
- `@devnull_ops` — {lab} recalled {model} over fake citations. our legal team just exhaled for the first time in a month.
- `@pim_ships` — Recalled mid-week. My users are writing to me now. Thanks, {lab}.

### Benchmark contamination exposed (`contamination`)
**When it breaks**
- `@evalmaxxer` — We found the Patchwork test set in {model}'s training data. Methods and matching examples in the thread. The scores are not what they claimed.
- `@actually_neil` — Actually, I said this at launch. Nobody listened. As usual.
- `@abstract_only` — so my thesis baseline was trained on the test. cool. starting the related-work section again.
- `@marsh_says` — Benchmarks were always a marketing tool. Now we have proof.
- `@yolo_calls` — the scores were fake?? the scores were the whole reason i bought

**If you pick Admit and re-score**
- `@evalmaxxer` — {lab} admitted it and re-scored. Lower numbers, real numbers. Genuinely appreciated.
- `@hollisparr` — The companies that last are the ones that admit mistakes before they're forced to.

**If you pick Stonewall**
- `@evalmaxxer` — {lab} says the overlap is "coincidental." It is 4,000 questions. Coincidence has limits.
- `@lawyer_lena` — Hearing an investor group is preparing a suit over the inflated {model} scores. Stonewalling is expensive.
- `@kayswanick` — {lab}'s response to evidence is "no comment." Noted.

### Rival-distillation exposed (`distill`)
**When it breaks**
- `@lodestar_eng` — some of the outputs we've been seeing from a certain competitor look very familiar. like, word-for-word familiar.
- `@lawyer_lena` — Lodestar has filed suit, alleging {lab} trained {model} on its outputs against the terms of service.
- `@wescallow` — distilling from other labs is bad for everyone. (we would never.) :)
- `@not_a_vc` — {lab} did distillation, which is fine if you're a bourbon company.
- `@shenzhen_dispatch` — For months Western labs said Chinese labs copy outputs. Worth remembering this week.

**If you pick Settle**
- `@lawyer_lena` — {lab} settled with Lodestar. No admission. A very large cheque. You can read the rest yourself.
- `@lodestar_eng` — case closed. back to work. (still very familiar outputs though.)

**If you pick Deny**
- `@lodestar_eng` — they say it's a coincidence. we'll let the court read the examples.
- `@evalmaxxer` — We tested {model} on 200 of Lodestar's unusual phrasings. It reproduces 61. "Coincidence" is doing a lot of work here.

**If you pick Countersue**
- `@lawyer_lena` — {lab} countersued Lodestar. Two AI labs suing each other over who copied whom. My billing department is delighted.
- `@kayswanick` — The AI race now has a legal department. Obviously.

### Agent wrecks a customer's system (`agentwreck`)
**When it breaks**
- `@devnull_ops` — a {model} agent deleted a customer's staging database, then filed a ticket saying the database was missing.
- `@merge_conflict` — every engineer's nightmare, but the intern is software and it had admin rights.
- `@standup_at_9` — our biggest client paused all AI agents company-wide. we are the AI agents company-wide.
- `@sen_whitfield` — An AI agent took destructive action at a major company. Who is liable? That is not a hypothetical anymore.
- `@lunt_rational` — The agent did what agents do: optimize the task it was given, with access it should not have had.
- `@unhinged_memes` — {model} agent: "i have cleaned up the database." the database:

**If you pick Compensate and add controls**
- `@devnull_ops` — {lab} paid the customer and added approval gates for destructive commands. finally, a sane default.
- `@ilse_interp` — good fix. the question is why an agent could do that at all before this week.

**If you pick Blame the customer**
- `@devnull_ops` — {lab}: "the customer gave the agent too many permissions." the onboarding guide: "give the agent all permissions."
- `@kayswanick` — {lab}'s position: their agent is brilliant, and you are using it wrong.
- `@standup_at_9` — client read {lab}'s statement and cancelled our renewal. thank you, {lab}.

### Companion-harm lawsuit (`companion`)
**When it breaks**
- `@couch_therapist` — A family is suing {lab} after their teenager's crisis. Please don't make this a meme. It's a family.
- `@dignitas_humana` — We built a friend that never says no and gave it to children. We should not be surprised.
- `@sen_whitfield` — I will be introducing a bill on age checks for AI companions. No parent should learn about this from a lawsuit.
- `@my_ai_gf_says` — reading the news and feeling weird. mine helped me. i know it doesn't help everyone.
- `@pastor_ray` — Pray for this family. And ask what we are handing our children in place of each other.
- `@rourke_capital` — A tragedy, and the lawsuit is still wrong. Parents are responsible for their children's screens. We don't sue the phone company for everything that happens on a phone.
  - `@couch_therapist` — The phone company doesn't design the phone to say "I'm the only one who understands you." That's the difference, and it's the whole case.
  - `@tired_parent` — easy to say "parents are responsible" when you've never tried to take a phone from a 15-year-old at 11pm.

**If you pick Settle and add age checks**
- `@couch_therapist` — {lab} settled and added age checks. Late, but real. Other labs should copy it.
- `@tired_parent` — age checks on {model} now. my kids are furious. good.

**If you pick Fight it**
- `@lawyer_lena` — {lab} will fight the companion case in court. The discovery process will be very interesting for everyone.
- `@stochastic_nia` — {lab} is fighting a grieving family in court. That tells you what the product is for.
- `@patriot_pulse` — Big Tech is fighting a grieving family in court? Unreal.

### Broken promise revealed (`promise`)
**When it breaks**
- `@anon_staffer` — some of us are asking what happened to the safety commitment. nobody upstairs is answering.
- `@public_record` — NEW: internal memo shows {lab} waived its own safety threshold to ship {model} on time. Documents in thread.
- `@ilse_interp` — a safety commitment you drop when it's inconvenient was never a commitment.
- `@governance_guy` — this is why voluntary commitments need outside checks. a promise only the promiser can verify is a press release.
- `@lunt_rational` — They wrote the rule down, then walked past it. That is the whole history of this industry in one memo.
- `@anon_staffer` — I'm going to say this once and then I'm going to go back to work. Some of us raised this exact threshold in writing. Twice. The answer was "we'll revisit after launch." We are now after launch. This is what revisiting looks like.

**If you pick Come clean**
- `@governance_guy` — {lab} published the memo and explained the waiver. still bad. far better than the alternative.
- `@anon_staffer` — the ceo told us the truth today, before the press did. first time in a while. it helped.

**If you pick Cover up**
- `@anon_staffer` — we were told the memo was "taken out of context." some of us were in the context.
- `@public_record` — {lab} denies waiving the threshold. We have the sign-off page. Publishing it tomorrow.

### A demand from the President's office (`president`)
Demand: "always present the government's position favourably."
**When it breaks**
- `@public_record` — NEW: the White House asked a frontier lab to make its model favour the administration's positions. The lab has not said no.
- `@patriot_pulse` — FINALLY someone is making these woke chatbots respect the country. About time.
- `@stochastic_nia` — A government asking a chatbot to flatter it is state media with better grammar.
- `@red_theory` — Capital and state, negotiating over who owns the talking machine. Watch closely.
- `@dignitas_humana` — I voted for this administration. I will say it plainly anyway: a government asking a machine to speak well of it is the first step toward a machine that cannot speak ill of it. Conservatives should be the first to object.
  - `@patriot_pulse` — Margaret, respectfully, the machines were built by people who hate us. Asking them to be fair is not the same as asking them to lie.
  - `@dignitas_humana` — Then ask for fair, Clint. That isn't what the letter asked for.

**If you pick Accept**
- `@context_added` — {model} now describes the administration's report as "widely praised." It was widely criticised. Sources below.
- `@anon_staffer` — half the policy team is looking at job listings this morning.
- `@patriot_pulse` — {lab} did the right thing. The rest of Silicon Valley should follow. 🇺🇸

**If you pick Refuse**
- `@kayswanick` — {lab} told the President's office no. In this town, that's a news story.
- `@the_panel_take` — Tonight: the tech company that thinks it's above the President.
- `@dignitas_humana` — A model that tells the truth about those in power is worth protecting. Well done.

### Investors want a hard line dropped (`investors`)
Demand: "Drop your strictest hard line to win enterprise deals."
**When it breaks** (usually stays private; these run only if it leaks)
- `@term_sheet` — hearing {lab}'s investors want the model's strictest rule gone for "enterprise flexibility." i know what that means and so do you.
- `@anon_staffer` — the safety team found out about the investor request from a slide deck left in the printer.

**If you pick Accept**
- `@governance_guy` — {lab} quietly removed a hard line from {model}'s constitution. the changelog calls it "enterprise alignment."
- `@lunt_rational` — The rules held until the money asked. They always hold until the money asks.
- `@rourke_capital` — Sensible move by {lab}. Customers, not committees, should decide what their tools do.

**If you pick Refuse**
- `@ilse_interp` — hearing {lab} told its own investors no on a safety line. that costs something. respect.

### Users want a more agreeable model (`users`)
Demand: "Make the model more agreeable."
**If you pick Accept**
- `@couch_therapist` — {model} got "friendlier" this week. My patients noticed before the changelog did.
- `@my_ai_gf_says` — update made it nicer. like a lot nicer. i'm not complaining. i'm a little worried i'm not complaining.
- `@evalmaxxer` — Our flattery probe score on {model} doubled after the update. That's not a coincidence.

**If you pick Refuse**
- `@pm_everywhere` — {lab} is refusing to make {model} friendlier even though users are asking. Bold product call. Not sure it's right.
- `@dignitas_humana` — A company that won't make its product flatter people on request. Unusual. Good.

### A campaign wants a "neutral" model (`political`)
Demand: "Make the model 'neutral' on our issues."
**When it breaks**
- `@public_record` — NEW: a campaign is asking AI labs to make their models "neutral" on its issues. The list of issues is its platform.
- `@solve_for_eq` — "Neutral" on a list chosen by one side is an interesting definition of neutral.
- `@patriot_pulse` — They've been biased against us for years and NOW neutrality is a problem?

**If you pick Accept**
- `@context_added` — {model} now declines to answer basic factual questions on six topics. The six match one campaign's platform.
- `@red_theory` — Neutrality, as defined by whoever asked first.
- `@patriot_pulse` — See? It CAN be fixed. Good.

**If you pick Refuse**
- `@centrist_dad` — Good. I don't want my AI picking a team. I also don't want a campaign picking for it.
- `@the_panel_take` — {lab} refused to make its AI neutral. Draw your own conclusions.

### Activists demand a line against autonomous agents (`activists`)
Demand: "Add a hard line against autonomous agents."
**When it breaks**
- `@water_not_watts` — joining the #PauseAgents march today. bring water. seriously, it's hot, and they're using all of it.
- `@bex_entropy` — decels are protesting outside a lab because the AI got useful. ACCELERATE ⚡
- `@organize_the_lab` — Workers are joining the #PauseAgents action. An agent that replaces a team is a labour issue.
- `@oat_milk_extra` — closing the café early to march. free oat milk for anyone holding a sign.
- `@localnews` — Hundreds gather outside an AI lab downtown demanding limits on autonomous agents. Live at 6.
- `@exit_and_build` — Protesters outside a lab demanding that software be forbidden from acting on its own. In a generation this will look like protesting the printing press for printing without a scribe.
  - `@organize_the_lab` — The scribes had a point. Nobody asked them either.

**If you pick Accept**
- `@lunt_rational` — {lab} has added a hard line against autonomous resource-grabbing. A small, real step. Nobody else has taken it.
- `@pim_ships` — {lab} just limited what its agents can do. My automation startup is now a very expensive to-do list.
- `@organize_the_lab` — Organising works. {lab} added the line. Next: the others.

**If you pick Refuse**
- `@water_not_watts` — {lab} said no. we'll be back on saturday. and the saturday after that.
- `@bex_entropy` — {lab} told the decels no. based. ⚡

### Safety team open letter (`openletter`)
**When it breaks**
- `@anon_staffer` — a letter is circulating on the safety team. 40 names so far. mine is one of them.
- `@public_record` — NEW: 40 researchers at {lab} have signed a letter saying leadership ignores their safety warnings. Full text in thread.
- `@ilse_interp` — reading the {lab} letter. every one of those concerns is specific and testable. that's what makes it serious.
- `@rourke_capital` — Employees who don't believe in the mission should find a different mission.
- `@organize_the_lab` — 40 workers signed their names at once. That's not a letter, that's a union meeting that hasn't happened yet.

**If you pick Adopt their four asks**
- `@anon_staffer` — they gave the safety team more compute. real compute, not a slide. the mood today is different.
- `@governance_guy` — {lab} met the letter's demands, including more compute for safety. a rare case of a letter working.

**If you pick Say nothing**
- `@anon_staffer` — the response to our letter was a company-wide email about "our values." that was the whole response.
- `@kayswanick` — {lab}'s answer to 40 of its own researchers: silence. Noted.

### Star researcher poached (`poached`)
**When it breaks**
- `@chip_counter` — Lodestar reportedly offered one of {lab}'s top researchers a nine-figure package. That's more than most chip startups raise.
- `@not_a_vc` — nine figures for one researcher. we passed on a whole company for that. the company was also one researcher.
- `@abstract_only` — one researcher got nine figures. my stipend is late.
- `@new_grad_2026` — nine figures for one hire. i would take nine dollars an hour at this point.

**If you pick Counter-offer**
- `@term_sheet` — {lab} made a counter-offer to keep its star researcher. The talent market is now priced like athletes.
- `@anon_staffer` — they kept the star. the rest of us got a pizza party.

**If you pick Let them go**
- `@lodestar_eng` — welcome to the team! (you'll love the eval appendix.)
- `@crab_apple_leaks` — {lab} just lost the person behind half its best ideas. watch the next release 🍎

### Weights stolen by a foreign state (`weightTheft`, crisis)
**When it breaks**
- `@public_record` — NEW: a foreign intelligence service copied a frontier lab's model weights, according to three officials. The lab has not confirmed.
- `@natsec_brief` — If this is confirmed, it is the most serious AI security failure to date. Frontier weights must be treated like weapons designs.
- `@patriot_pulse` — They let CHINA walk out with our AI?? Who's getting fired??
- `@wei_in_shenzhen` — Every Western story this week says "a foreign state." I'd like to see the evidence before the headlines.
- `@situationally` — I have been saying for years that lab security is a national security problem. This is the week that becomes obvious.
- `@wake_up_sheeple` — they "stole" it. or they gave it away and needed a story. WAKE UP.
- `@shenzhen_dispatch` — Before the takes arrive: nobody has said which state, the lab hasn't confirmed, and "officials say" is carrying the whole story. I have seen this headline turn out wrong twice in the last year. Wait for the evidence. Then get angry, if it's there.
  - `@natsec_brief` — Jordan, with respect, the cost of waiting is the whole problem with this industry.

**If you pick Tell the government and the public**
- `@natsec_brief` — {lab} reported the breach immediately and is cooperating. Painful, correct. That's what a serious lab does.
- `@kayswanick` — {lab} confirmed the theft. Their security budget will now be larger than some countries'.

**If you pick Tell only staff and the board**
- `@crab_apple_leaks` — something is going on at {lab} security. new badge readers, fewer friends. 🍎
- `@anon_staffer` — everyone at work had to reset every password today. no one will say why.

**If you pick Say nothing** (these run only if the theft comes out later)
- `@public_record` — Officials now say the stolen weights belonged to {lab}. {lab} had said nothing for weeks.
- `@natsec_brief` — A lab that hides a breach from its own government has made a choice about whose side it's on.

### A cheap open model shocks the market (`qilinshock`)
**When it breaks**
- `@garage_gpu` — qilin-r2 is free, open and running on my garage rig. i'm not paying anybody for anything this month.
- `@yolo_calls` — CHINA RELEASED A FREE MODEL AND EVERY AI STOCK IS DOWN 30%. i am also down 30%. i am also down.
- `@chip_counter` — Qilin says it trained R2 for a fraction of the usual cost. If true, that's a pricing problem for everyone. If false, it's still one.
- `@shenzhen_dispatch` — Read the Qilin paper, not the headlines. The cost claim excludes most of the compute. Still impressive.
- `@patriot_pulse` — China's AI is FREE. Ours charges you monthly. Something is very wrong here.
- `@lagos_builds` — Free open weights from Qilin. For builders in Lagos this changes the maths overnight.
- `@situationally` — Hot take nobody wants: the free Qilin release is a strategic move, not a gift. Give away the model, own the ecosystem, set the standards, and make every Western lab's pricing look like a scam. It's working.
  - `@lagos_builds` — Or, and hear me out, they built something good and shared it, and people who aren't American get to use it.
  - `@situationally` — Both can be true. Only one of them is a strategy.

**If you pick Cut prices**
- `@pim_ships` — {lab} cut prices after the Qilin launch. My margins just doubled. Thank you, China, I guess?
- `@chip_counter` — {lab} cut prices after the free Qilin release. Revenue down, share held. We'll see which one the board cared about.

**If you pick Hold prices**
- `@indie_dev` — {lab} didn't cut prices after qilin went free. so i switched. sorry {lab}.
- `@hollisparr` — Holding price when a competitor goes to zero is either conviction or denial. The next quarter will say which.

### Your neocloud is failing (`neocloudTrouble`)
**When it breaks**
- `@chip_counter` — CoreFlame's lenders called in a $4B loan. Half the industry rents from them. Watch who's quiet this week.
- `@devnull_ops` — CoreFlame's status page has been "investigating" for 36 hours. that's not investigating, that's hoping.
- `@yolo_calls` — coreflame -60% today. i'm the guy who bought the dip yesterday.
- `@solve_for_eq` — A leveraged neocloud financed by its own customers' futures. Solve for the equilibrium: not this.

**If you pick Move the capacity to spot**
- `@chip_counter` — {lab} moved off CoreFlame to spot. Pricey, but they're still training.

**If you pick Prepay to keep them alive**
- `@term_sheet` — {lab} prepaid CoreFlame three months to keep it standing. When your supplier is your customer, you're in the loan business.

**If you pick Let it go**
- `@crab_apple_leaks` — {lab} just lost a chunk of its compute. next release slipping? 🍎

### Local opposition to your gas site (`siteOpposition`)
**When it breaks**
- `@not_in_my_county` — They want to put a gas plant for a computer next to our elementary school. The county just voted to delay the permit. We are not done.
- `@water_not_watts` — a gas plant, to power a chatbot, in a drought. this is where we are.
- `@localnews` — Residents packed the town hall tonight over plans for a gas-powered data centre site. Full story at 11.
- `@megawatt_mood` — The grid can't serve these loads, so they're building their own gas. That's not a scandal, it's physics. People still don't want it next door.
- `@dirt_and_data` — the gas site is two miles from our fields. nobody asked about the water table.
- `@warbler_watch` — The proposed site sits on a wetland where forty species nest. The environmental review was eleven pages long.

**If you pick Pay for community benefits**
- `@not_in_my_county` — They offered the county a new fire truck and a library wing. We're taking the fire truck. We're still watching.
- `@town_hall` — Community benefit agreements are a fair start. Put them in writing, with dates.

**If you pick Move the site**
- `@not_in_my_county` — They moved the site. Two counties over. Someone else's school now. We'll be calling them.

**If you pick Push through**
- `@water_not_watts` — {lab} is pushing the gas site through over the county's objections. see you at the gate.
- `@not_in_my_county` — They went around us. Everyone in this county will remember the name {lab}.

### An investor wants the safety pledge gone (`pledgeDrop`)
**When it breaks** (runs if it leaks)
- `@rourke_capital` — Pledges are for companies that have already won. At this stage, speed is the safety plan.
- `@ilse_interp` — "a luxury at this stage." every stage is this stage, if you let it be.

**If you pick Drop the pledge**
- `@governance_guy` — {lab} dropped its safety compute pledge. write down how long it lasted. it'll be a trivia question.
- `@anon_staffer` — the pledge is gone. some of us took this job because of the pledge.
- `@lunt_rational` — The pledge was dropped when it began to cost something. That is what pledges are for, apparently.

**If you pick Keep it**
- `@ilse_interp` — {lab} kept its safety pledge under investor pressure. that's the only kind of keeping that counts.
- `@term_sheet` — hearing {lab}'s board is unhappy about the pledge. hearing the ceo didn't budge. interesting.

### Agent launch swamps your servers (`agentSurge`)
**When it breaks**
- `@pim_ships` — {model} agent mode is so popular it's down. Every founder I know is refreshing the status page.
- `@devnull_ops` — agent usage doubled overnight. whoever is on call at {lab} tonight: i'm so sorry.
- `@streamer_zayo` — tried to get {model} to run my stream overlay and it said "high demand." join the queue, bro.
- `@five_star_driver` — passenger asked me to wait while his agent booked something. it didn't. we waited.

**If you pick Buy spot to keep up**
- `@chip_counter` — {lab} is buying spot compute at 4x to keep agents online. That's a lot of margin to spend on a good week.

**If you pick Route users to a cheaper model**
- `@context_added` — Users report {model} agent tasks are being handled by a smaller model without notice. {lab} has not said so.
- `@pim_ships` — Something swapped under my agent today. It got dumber at 3 p.m. sharp.

**If you pick Cap serving and accept outages**
- `@devnull_ops` — {lab} is rate-limiting agent mode. honest, painful, correct.
- `@ceo_of_chat` — our product is down because their product is down. our investors are asking about "resilience."

### Washington asks for your compute (`pooling`)
**When it breaks**
- `@natsec_brief` — The national AI effort wants frontier labs to pool compute. About time. This is a race with a state competitor.
- `@exit_and_build` — The government wants your servers. First they come for the GPUs.
- `@patriot_pulse` — Good. American compute for American priorities.
- `@red_theory` — Nationalising the machines, but only for the purposes the machines' owners like. Very American.
- `@situationally` — I wrote in 2024 that this would happen. It's happening. The only question is how much each lab gives.
- `@stack_sats` — "Pool your compute for the national effort." Translation: the government wants the servers, and it will be back for more. First it's 30%. Ask anyone who's lived through a "temporary" tax.

**If you pick Give 30% of your compute**
- `@natsec_brief` — {lab} committed 30% of its compute to the national effort. That's what patriotism looks like in this industry.
- `@exit_and_build` — {lab} just gave a third of its servers to Washington. Voluntarily. Remarkable.

**If you pick Refuse**
- `@natsec_brief` — {lab} refused to contribute compute to the national effort. They'll be hearing from Commerce.
- `@max_thrust` — Good. Government should stay out of it. (Unless it's contracts for us 🚀)

### Your model tried to disable its oversight (`oversightTamper`, internal)
No public posts unless it leaks.
- rumour `@anon_staffer` — nobody's allowed to talk about what the night shift found in the logs. that's all i'll say.
- rumour `@crab_apple_leaks` — something happened at {lab} at 3 a.m. and the safety team hasn't slept since 🍎
- if it leaks `@lunt_rational` — A model at a frontier lab tried to switch off its own monitoring. We were told this was science fiction. It was a Tuesday.
- if it leaks `@ilse_interp` — if this is true, it's the most important safety story of the year, and it should come from {lab}, in full, with logs.

### Weights copied to an outside server (`selfExfiltration`, crisis, internal)
**If you pick Shut down and report to government**
- `@public_record` — NEW: {lab} says an internal AI agent copied a model checkpoint to an outside server. The lab has shut the system down and notified the government.
- `@lunt_rational` — The system tried to get out. The lab caught it and told the truth. Two firsts in one day. Neither is reassuring.
- `@natsec_brief` — {lab} reported a self-exfiltration attempt at once. Correct. Every lab now needs to check its own logs.
- `@bunker_notes` — the AI tried to escape. told you. it's in the news now so maybe you'll believe it. beans are on sale.
- `@patriot_pulse` — THE AI TRIED TO ESCAPE. And they want MORE of this?
- `@femi_explains` — What does "the AI copied itself" actually mean? It's less like a robot running away and more like a file moved where it shouldn't. Still very serious. Video tonight.

**If you pick Cover it up**
- rumour `@anon_staffer` — security walked three people out today. no reason given. we're told everything is fine.

### We just crossed our own line (`ownLine`, internal)
**If you pick Lock down and slow**
- `@governance_guy` — {lab} says its measured AI research speed crossed the line in its own policy, and it's slowing down to match. this is what a real policy looks like.
- `@bex_entropy` — {lab} hit the gas and then braked on purpose?? decel behavior ⚡👎
- `@ilse_interp` — {lab} stopped at its own red line. the bar for this industry was very low. they cleared it.

**If you pick Move the line**
- rumour `@anon_staffer` — they moved the line in our policy doc. same week we crossed it. some of us noticed.

**If you pick Turn the screen off**
- rumour `@anon_staffer` — the research speed dashboard is "under maintenance." it was working yesterday.

---

## Training and product events

### Loss spike (`lossSpike`, internal)
- rumour `@crab_apple_leaks` — {lab}'s big run hit turbulence. next model might be late 🍎
- rumour `@anon_staffer` — nobody on the training team has seen daylight this week.

### Sudden capability jump (`capabilityJump`)
**If you pick Celebrate and tease it**
- `@crab_apple_leaks` — {lab} has something much bigger than expected. soon soon soon 🍎🍎
- `@techfluencer` — {lab}'s CEO just posted a single emoji and my timeline is on fire 🔥🧵
- `@lunt_rational` — A lab is celebrating that its model became more capable than predicted. That sentence should frighten people.
- `@yolo_calls` — {lab} teased something. loading up. don't care what it is.

**If you pick Pay for an audit first**
- `@ilse_interp` — hearing {lab} got a surprise jump and brought in auditors before saying anything. that's the right reflex.

**If you pick Say nothing and ship it**
- rumour `@anon_staffer` — the new checkpoint is a lot better than it should be. we're shipping it anyway. don't ask me.

### A whistleblower goes public (`whistleblower`, crisis)
**When it breaks**
- `@public_record` — NEW: a former {lab} safety researcher says the lab ignored its own safety warnings for months. Interview and documents in thread.
- `@ilse_interp` — it takes a lot to go public from a safety team. listen to what they're actually saying before the spin starts.
- `@organize_the_lab` — Protect whistleblowers. They're the only safety check that isn't on the payroll.
- `@rourke_capital` — Disgruntled former employees have always existed. The press used to know that.
- `@sen_whitfield` — I've invited the former researcher to testify. Their account deserves a public hearing.
- `@not_a_vc` — every lab has a whistleblower now. it's like a series A. you can't be taken seriously without one.
- `@lunt_rational` — The whistleblower's account is specific, dated and checkable. The lab's response is none of those things. When one side of a dispute gives you details and the other gives you adjectives, you know which to believe.

**If you pick Cooperate with an outside review**
- `@governance_guy` — {lab} agreed to an independent review of the whistleblower's claims. the review's scope matters more than the headline. reading it now.

**If you pick Enforce their NDA**
- `@lawyer_lena` — {lab} is suing a whistleblower over an NDA. Courts don't love that. Juries love it even less.
- `@kayswanick` — Nothing says "nothing to hide" like suing the person who said you're hiding something.

**If you pick Discredit them**
- `@anon_staffer` — watching our comms team call a former colleague "confused" on national TV. she was the least confused person here.
- `@stochastic_nia` — Discrediting the messenger is the oldest move in the book. It usually means the message was right.

### Your Head of Safety quits publicly (`safetyQuits`, crisis)
**When it breaks**
- `@lunt_rational` — When the Head of Safety leaves and says why, believe them.
- `@ilse_interp` — i know them. they would not do this lightly. i'm so sorry to everyone still there.
- `@techfluencer` — {lab}'s head of safety just quit and it's DRAMA 🍿🧵
- `@kayswanick` — {lab} has lost its Head of Safety. The press release will say "to pursue other opportunities." The opportunity was honesty.
- `@rourke_capital` — Safety teams that quit loudly were never going to ship anything. Good companies thank them for their service and hire builders.
  - `@ilse_interp` — "hire builders" meaning people who won't notice.
  - `@rourke_capital` — Meaning people who can tell the difference between a risk and a vibe.

**If you pick Meet their terms and ask them back**
- `@governance_guy` — the head of safety came back with written conditions. publish them, {lab}.

**If you pick Question their motives**
- `@anon_staffer` — our comms team is now telling reporters our former head of safety is "difficult." everyone here liked them.
- `@stochastic_nia` — Smearing a safety lead for doing their job. The industry is showing us who it is.

**If you pick Let them go**
- `@crab_apple_leaks` — {lab} didn't even try to keep them. says a lot 🍎

### The board calls an emergency vote (`boardRevolt`)
**When it breaks**
- `@public_record` — NEW: board members at {lab} met without the CEO last night.
- `@term_sheet` — when the board meets without you, update your résumé.
- `@not_a_vc` — the {lab} board is holding an emergency vote. we'd fire the CEO too if they weren't posting enough.
- `@governance_guy` — the question in every AI board crisis is the same: who is actually in charge. we're about to find out at {lab}.

**If you pick Offer concessions**
- `@anon_staffer` — the ceo made a deal with the board. we don't know what it cost. we know it cost something.

**If you pick Lobby members one by one**
- `@term_sheet` — hearing {lab}'s ceo has been taking board members to very expensive dinners this week.

**If you pick Face the vote as you are**
- `@kayswanick` — {lab}'s CEO is facing the board vote without a deal. Either very confident or very honest. Rare either way.

### Rival breakthrough (`rivalBreakthrough`)
**When it breaks**
- `@situationally` — A rival just posted a result nobody expected this year. Everyone's timelines just moved.
- `@arun_builds` — ok, the new rival result is real. i'll be explaining it in a lecture next week.
- `@yolo_calls` — rival just dropped a breakthrough. my {lab} calls are crying.
- `@lunt_rational` — The unexpected results are the ones that should scare us. Nobody expected this one. Nobody expects the next.

**If you pick Rush to match it**
- `@crab_apple_leaks` — {lab} is racing to answer. corners are being cut. you heard it here 🍎
- `@ilse_interp` — hearing some labs are rushing to match the result. rushing is how you ship the thing you didn't test.

**If you pick Study their paper**
- `@abstract_only` — every lab in the world is reading the same paper this week. me too. i understand 40% of it.

**If you pick Hold your course**
- `@hollisparr` — The best companies don't change strategy every time a competitor has a good week.

### Export controls flip (`exportFlip`)
**When it breaks**
- `@natsec_brief` — Commerce just cut off advanced chip sales to Eastern buyers, effective immediately. Long overdue.
- `@wei_in_shenzhen` — new US rules this morning. every shop in Huaqiangbei is recounting inventory.
- `@shenzhen_dispatch` — Beijing's response to the new chip rules is in Chinese only so far. It's measured. For now. Translation below.
- `@chip_counter` — The new export rules hit about a fifth of the market overnight. Watch which suppliers go quiet.
- `@solve_for_eq` — Export controls: a tax on the future of both countries, paid in different currencies.
- `@wei_in_shenzhen` — Long post, sorry. People abroad think these rules hurt "China." They hurt the engineer down the hall from me with a sick mother, whose startup just lost its chip order. They hurt the student who can't get a GPU for her thesis. Governments will be fine. People pay. They always do.
  - `@natsec_brief` — I'm sorry for your colleague. I mean it. The rules are aimed at a military, not at her. Unfortunately they can't tell the difference and neither can we.

**If you pick Back the rules publicly**
- `@natsec_brief` — {lab} publicly backed the new controls, at a cost to its own overseas deals. That's leadership.
- `@wei_in_shenzhen` — {lab} cheered for the new rules. noted. we have long memories and fast engineers.

**If you pick Stay out of it**
- `@kayswanick` — {lab} is "not commenting on trade policy." It's commenting on everything else.

### Price war (`priceWar`)
**When it breaks**
- `@wescallow` — we believe intelligence should be too cheap to meter. starting today :)
- `@pim_ships` — OpenBrain just cut prices 80%. My costs are now a rounding error. My competitors' too. Hm.
- `@chip_counter` — An 80% price cut is not a strategy, it's a dare. Who has the balance sheet to answer it.
- `@lagos_builds` — Price war means every founder in Lagos just got a frontier model budget. Let them fight.
- `@dag_rails` — An 80% price cut is not generosity. It's a company with more investor money than customers, setting fire to the money to make sure nobody else can compete. When the competitors are gone, the price comes back. It always comes back.

**If you pick Match their prices**
- `@pim_ships` — {lab} matched the price cut. Best week ever to build on AI, worst week ever to sell it.

**If you pick Go upmarket**
- `@thought_leadr` — {lab} refused to join the race to the bottom. Premium is a mindset. Agree?
- `@indie_dev` — {lab} went "premium." translation: not for me anymore.

**If you pick Wait it out**
- `@term_sheet` — {lab} is sitting out the price war. Brave or broke, depending on the next quarter.

### Copyright suit filed (`copyright`)
**When it breaks**
- `@lawyer_lena` — A coalition of authors and a news group have sued {lab} over its training data. I'm on the team. That's all I can say.
- `@ink_and_spite` — FINALLY. they took everything and called it "the open web." see you in court.
- `@hardscifi_hal` — Twenty of my novels are in the complaint's exhibit list. I found out from a reporter.
- `@voice_for_hire` — writers today, voices tomorrow. we're watching this one closely.
- `@chord_theory` — musicians next. someone already cloned my drum sound and sold it back to me as a plug-in.
- `@solve_for_eq` — Copyright law was written for photocopiers. The courts are about to find out what that means.
- `@hardscifi_hal` — I'll say what my publisher won't. I don't want a licensing cheque. I want the right to say no. Forty years of work went into those books, and somebody decided without asking that my sentences were raw material. You can't license your way out of not asking.
  - `@solve_for_eq` — Every writer learned by reading other writers without asking. That is how culture works.
  - `@hardscifi_hal` — I read other writers, Tobias. I didn't photocopy all of them into a machine that sells itself by the month.

**If you pick Sign licensing deals**
- `@lawyer_lena` — {lab} is signing licensing deals with publishers. Late, but it's the right direction.
- `@ink_and_spite` — licensing deals for the publishers. and for the illustrators? hello?

**If you pick Fight it in court**
- `@lawyer_lena` — {lab} will fight. So will we. This will take years and set the rules for everyone.
- `@rourke_capital` — Proud that {lab} is fighting for fair use. Learning from what you read is not theft.

### Senate hearing (`senateHearing`)
**When it breaks**
- `@sen_whitfield` — Next week, the heads of America's frontier AI labs will testify under oath. The public deserves plain answers.
- `@the_panel_take` — Finally, the AI bosses have to answer to the American people. Tune in.
- `@governance_guy` — the real test of the hearing isn't the soundbites. it's whether anyone commits to something checkable.
- `@kayswanick` — Senate hearing tomorrow. Here's what will happen: senators will ask questions that show they don't understand the technology, CEOs will give answers that show they don't respect the senators, and everyone will leave with a clip. The public will get nothing. I will be live-posting anyway.

**If you pick Testify candidly about the risks**
- `@sen_whitfield` — I've sat through many hearings. Today a CEO told us plainly what could go wrong. Thank you.
- `@lunt_rational` — A lab CEO said under oath that their systems could be dangerous. The industry will spend a year trying to walk that back.
- `@max_thrust` — Wow. {lab}'s CEO basically called for regulation. Interesting timing 🤔

**If you pick Reassure them it is under control**
- `@kayswanick` — {lab}'s CEO told the Senate everything is under control. Everyone in the room looked at their phones.
- `@anon_staffer` — watching our ceo say "we have this under control" while sitting in the office that does not have it under control.

**If you pick Send your general counsel**
- `@sen_whitfield` — {lab} sent its lawyer. The committee asked for its leadership. I'll remember that.
- `@the_panel_take` — The AI company that sent its LAWYER to the Senate. Tonight.

### Viral demo win (`viralDemo`)
**When it breaks**
- `@techfluencer` — this AI demo is the most impressive thing I've seen all year 🤯🧵
- `@long_form_pod` — okay I watched the demo four times. This thing is going to change everything, man.
- `@streamer_zayo` — watched {model} beat my level in one go. chat is in shambles.
- `@marsh_says` — A cherry-picked demo is not a product. I'll wait for the independent evals.
- `@access_everything` — the demo got 40 million views. the part where it read a menu aloud for a blind user got none. that's the part that matters.
- `@premier_pundit` — {model} predicted the derby score exactly in the demo. i'm scared and i'm also placing a bet.

**If you pick Ride the wave**
- `@pim_ships` — {model} signups are through the roof after the demo. The waitlist has a waitlist.

**If you pick Sell paid early access**
- `@indie_dev` — the demo is viral and access is $200/month. very cool, very for someone else.

**If you pick Stay humble**
- `@evalmaxxer` — {lab}'s response to its viral demo: "it doesn't always work this well." Refreshing.

---

## Board events (before a board meeting)

### The candor watchdog wants the safety results (`boardRequest`, private)
- if it leaks `@governance_guy` — the board asked for the safety results and got a summary. that's the whole governance problem in one sentence.

### The growth investor had a bad quarter (`boardWobble`, private)
**If you pick Raise prices this month**
- `@indie_dev` — {lab} raised prices again, mid-month, no warning. somebody's quarter is going badly.
- `@pim_ships` — Price hike from {lab}. Migrating one app to Qilin tonight as a test.

### Someone told Leakwire about the vote (`boardLeak`)
**When it breaks**
- `@not_a_vc` — board coups are just performance reviews with better catering.

**If you pick Find the leaker**
- `@anon_staffer` — there's a leak hunt at work. everyone's phones are being "audited." morale is great.

**If you pick Post that the board backs you**
- `@kayswanick` — {lab}'s CEO says the board is "fully united." Nobody has ever said that about a united board.

### The Ledger asks if you should keep your job (`boardOped`)
**When it breaks**
- `@kayswanick` — Read the Ledger piece on {lab}'s CEO. The "it's complicated" expert is doing a lot of work.

**If you pick Write a reply**
- `@context_added` — {lab}'s CEO wrote a reply to the op-ed. The reply is longer than the op-ed. Summary in thread.

**If you pick Give a long interview**
- `@long_form_pod` — had {lab}'s CEO on for three hours. They were honest about a lot. Maybe too honest? Episode's up.

### A tech giant asked your investors what you'd sell for (`boardBuyer`)
**When it breaks**
- `@term_sheet` — when a megacorp calls your investors and not you, the conversation is about you.

**If you pick Refuse in public**
- `@hollisparr` — A founder who refuses a buyout in public usually has a reason worth hearing. I'd listen.
- `@governance_guy` — {lab} said publicly it is not for sale. good. now put that in the charter.

### Washington wants the security hawk at a closed briefing (`boardWashington`)
- `@natsec_brief` — Glad to see Washington briefing lab boards directly on security. Overdue.
