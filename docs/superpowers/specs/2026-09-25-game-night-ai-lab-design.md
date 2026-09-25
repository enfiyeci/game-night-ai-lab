# Game Night AI Lab — design spec

**Date:** 2026-09-25 · **Owner:** Arda · **Status:** all sections approved in chat
2026-09-25 ("I do like what you have so far"); awaiting owner review of this written spec.
**Event:** Mangrove "Game Night" hackathon, digital track. Submissions open 2026-09-25
12:00 PM PT and close 2026-09-27 12:00 AM PT. Judging: fun 40%, relevance to AI risks 40%,
worth playing again 20%. Deliverable: a playable build plus a 3–5 minute video; AI-tool use
must be disclosed.
**Build rule:** built fresh in this repository; no code is carried over from
`~/Desktop/AI Company Tycoon` or `~/Desktop/gdt-proto`. Design ideas from both are reused.
Game code starts at kickoff (12:00 PM PT).

Research basis: `docs/research/` (start with `docs/research/README.md`).

## 1. The game in one paragraph

You run a frontier AI lab through five eras in about 20 minutes. Each turn your four advisors
brief you, you split your budget, make a couple of big moves, and sometimes run an animated
training run and launch a model. You must stay fast enough not to fall behind, rich enough not
to run out of money, and safe enough that neither your model nor anyone else's causes a
catastrophe. **There is no AI-risk meter.** Risk lives in hidden variables that you only glimpse
through advisors who each see part of the picture, with noise and bias. The end-of-run reveal
shows the true values next to what each advisor told you.

## 2. Time structure (approved: hybrid)

- Decisions happen in **turns**. Each era has 4 turns; 20 turns total, about 1 minute each.
- Training runs play as a short **animated real-time stretch** (about 30–40 seconds) with
  capability and alignment bubbles and pausing mini-events.
- **The pace accelerates:** a turn is a quarter in eras 1–2, a month in eras 3–4, and a week in
  era 5. Training runs also get shorter each era.

## 3. Eras (approved: research-based five, humanoids in era 4, fast finale)

| Era | Turn length | New pressure | Bottleneck card | Gate to next era |
|---|---|---|---|---|
| 1 Chat assistants | quarter | Scraped-data lawsuits start as legal debt | Chips | Capability rank ≤ 2nd or within 15 of leader |
| 2 The scale-up | quarter | Funding rounds (three investor archetypes); first President meeting | Advanced packaging | Same, plus board vote |
| 3 Reasoning and agents | month | Agentic releases trigger misalignment checks; reasoning training raises hallucination; evals weaken as models notice tests | Wafers and memory (HBM) | Same, plus board vote |
| 4 Gigawatt race | month | Power sites with lagged capacity and local opposition; **humanoid deployment line** with big revenue and physical-world incidents | Power | Same, plus board vote |
| 5 Self-improvement and pacing | week | Pacing summit; US–China deal or race; second President meeting | Everything at once | — |

After era 5 comes a **60–90 second finale**: a rapid run of cards from the owner's original
design (the technofeudal turn, then the race to the bottom), chosen by the ending the player is
heading toward, too fast to fully manage.

## 4. Game state (approved)

Starting values and thresholds are first-pass numbers, tuned by the balance bot (section 9).

```js
state = {
  turn: 0, era: 1, monthsPerTurn: 3,

  // Always visible
  cash: 1000,              // $M
  burnPlanned: 0,          // $M/month, from this turn's budget
  burnTrailing: 0,         // $M/month, average of last 3 turns
  arr: 0,                  // annual recurring revenue, $M
  users: 0,
  compute: { online: 10, pipeline: [] }, // 1 unit ≈ 1,000 top GPUs
  capability: 20,          // 0–100
  valuation: 5000,         // $M, derived

  // Seen only through people
  board: [70, 60, 65, 55, 80],   // support per member, 0–100
  govFavor: { us: 50, intl: 50 },
  staffTrust: 70,
  publicTrust: 60,

  // Hidden
  alignmentDebt: 5,
  misuseExposure: 5,
  security: 40,            // higher is better
  legalCases: [],          // {cost, dueTurn, source}
  raceHeat: 20,            // shared by the whole world

  constitution: [], promises: [], flags: {}, rivals: [],

  // Released models, each with its own recipe, name and running cost
  models: [],   // {name, family, generation, tier, recipe, capability, channel,
                //  priceStance, reasoningEffort, users, servingCost, revenuePerUser}
}
```

Update rules:

- **Capability gain** per run rises with compute used × talent spend, with diminishing returns;
  a failed run gains little.
- **Alignment debt** rises by capability gain × (target safety share − actual safety share),
  plus fixed amounts for engagement tuning, skipped evals, and training against the
  transparency score. The target safety share rises by era (first pass: 15% in era 1 to 35% in
  era 5). Evals and interpretability work lower it slowly.
- **Misuse exposure** rises once capability passes the era's danger line; safeguard spend lowers
  it; open weights or stolen weights push it up and lock it.
- **Race heat** rises with every release by any lab, scaled by that lab's speed; pacing deals,
  outside evaluators and summits lower it.
- **Valuation** = ARR × a multiple that shrinks as ARR grows × sentiment (0.5–1.5).

## 5. Endings (approved)

Failure endings:

| Ending | Check |
|---|---|
| Out of money | Danger zone when runway < 6 months on planned burn. Four emergency options, each with a real cost: equity for compute (lose independence), structure change with a deadline, bridge round with forgiven debt, acquihire (soft ending). Game over at cash ≤ 0 with no option left. |
| Removed by the board | At a scheduled vote (era gates 2–4, or after a major crisis), fewer than 3 of 5 members have support ≥ 50. |
| Misalignment catastrophe | On each agentic release from era 3: `P = sigmoid((alignmentDebt × capability / 100 − 40) / 8)`. |
| Misuse catastrophe | Capability above the danger line and misuseExposure > 70: rolled each turn. |
| Left behind | At an era gate, rank below 2nd and more than 15 behind the leader. |
| Someone else's disaster | raceHeat > 85: rolled each turn against the least careful rival. |

Winning endings from era 5: aligned success, negotiated pacing deal, pyrrhic win.

## 6. Characters and systems (approved)

- **Advisors (four).** Each gets a noisy, biased estimate of what they can see and speaks a line
  from bands (calm / uneasy / alarmed); none ever shows a number.
  - Head of Research: sees capability exactly, reports it about 10 points optimistic; notices
    alignment trouble only as "weird results" once debt > 60.
  - Head of Safety: sees alignment debt and misuse exposure; noise shrinks with eval spend and
    grows with capability; reads about 10 points cautious; can quit publicly if a
    safety-compute promise is broken.
  - CFO: sees money exactly; underweights pending legal cases; argues from trailing burn.
  - Policy and Comms Director: sees government favor, public trust and race heat with noise;
    noise shrinks with intelligence spend.
- **Rivals.** Three or four fictional labs, including one Eastern lab scored partly on
  open-weight ecosystem share. Each has capability, speed and caution. The capability gap is
  shown as a disputed range.
- **Compute market.** Four or five fictional actors: a chip titan, a cloud landlord, a neocloud
  that can fail, a sovereign financier with political strings, and power-site deals in era 4.
  Multi-year deals buy priority; spot capacity can vanish; equity deals attach strings.
- **Constitution (clarified by owner 2026-09-25).** The *model's* constitution: the values
  document your AI is trained on, like Claude's constitution or OpenAI's Model Spec. It is
  not a company charter. It shapes model behavior, is amended under pressure (the President,
  investors, users), and in the bad endings the AI that takes over carries its values. What
  the player actually writes (value ranking and dials, a clause list, or rules versus
  judgment) is **to be brainstormed later** (owner deferred 2026-09-25). Company promises
  such as a safety-compute pledge live in `state.promises`, not here.
- **Feed.** A read-only Twitter-like feed of generated posts reacting to events and state.
- **President meetings** (era 2 or 3, and era 5). A fictional president, recognizable in style
  but not named after the real person (owner may override). Each answer has a flattery level
  and a jargon level. Flattery raises government favor but lowers staff and public trust and
  can bring amendment demands; refusing risks a "supply chain risk" designation. Every
  technical term drains his patience; at zero he walks out. Plain answers keep him engaged but
  can over-promise, which comes due later. Stakes: export licenses, federal contracts, a
  preemption of state safety laws, national-champion status.

## 6b. Models: training recipe, naming and running cost (requested by owner 2026-09-25)

Source for every option and number in this section: `docs/research/training-options/report.md`,
Part 2. That report's menu tables are the working content; this section fixes how they plug in.

- **Training recipe.** "Start a training run" opens a recipe screen with four stages. The
  report's decisions below supply each stage's pool of option cards; how the player picks from
  them is fixed by "Recipe interaction" further down, which overrides the report's
  one-option-per-decision layout:
  - Pretraining: size, training length (tokens per parameter), architecture (dense / MoE /
    extreme sparse MoE), data source (scrape / filtered / licensed / synthetic), hazardous-
    knowledge filter.
  - Midtraining (from era 2): annealing mix, context length, reasoning readiness, midtraining
    safety (decontamination, alignment data).
  - Post-training: instruction data (human / synthetic / self-distil / rival distil), feedback
    signal (RLHF / DPO / Constitutional AI / user thumbs-up / rubrics), RL push (none /
    verifiable-reward / full reasoning / agentic), character and values, safeguards.
  - Evaluation and release: eval gate (quick / full / third party / government / waive a
    threshold), channel (API / app / open weights / staged), price stance with a reasoning-
    effort dial, serving precision, distilled sibling.
  Options unlock by era. Each stage starts with the player's previous picks preselected, so a
  hurried player confirms a stage in one click. Each option's effects are written in this
  spec's state variables; several are "looks fine now, bites later" (report Part 2 §5).
  The existing capability/alignment slider applies on top of the recipe.
- **Naming.** At each launch the player names the model: family + generation + tier word
  (tier word comes from size; theme sets offered, free typing allowed). Generation jumps raise
  the launch bar; rebrands without a real gain draw feed mockery; names matching a real lab's
  product are swapped for a parody.
- **Running cost.** Each model card shows `servingCost` ($ per active user per month) and its
  margin, recomputed every turn:
  `servingCost = USAGE[era] × CHANNEL × REASONING[effort] × HW[era] × SIZE × ARCH(load) ×
  CONTEXT × PRECISION × GUARD`. Serving draws on the same compute as training, so a popular
  model can starve the next run; the player then caps usage, routes users to a cheaper
  sibling, or rents spot capacity. First-pass tables and worked examples are in the report.
- **Recipe interaction (owner decision 2026-09-25): many options, few picks, plus sliders.**
  - Each stage shows a large pool of option cards (the report's options, each stage 6–10
    cards once eras unlock them). The player **picks only a few per stage** (first pass: 2 in
    pretraining, 1–2 in midtraining, 3 in post-training, 2 in evaluation and release; talent
    spend can add one slot). Unpicked stages fall back to a cheap default.
  - Every card shows its **price against the run's training budget** (cash, compute, extra
    turns) and a short effect hint in words, not numbers. Cards cost different amounts, so the
    budget, not a fixed menu, decides how ambitious a recipe is.
  - **Sliders** for the continuous choices: model size, training length (tokens per
    parameter), the capability-versus-alignment share, reasoning effort (from era 3), and
    price. Moving a slider updates the live servingCost preview and the run's cost.
- **Techniques that arrive over time (owner decision 2026-09-25).** Industry techniques
  appear era by era, like engine features in Game Dev Tycoon: for example RLHF and
  instruction tuning (era 1), mixture-of-experts and synthetic data (era 2), chain-of-thought
  reasoning, verifiable-reward RL, tool use and agents (era 3), cheap safety classifiers,
  low-precision serving and embodied/humanoid data (era 4), automated research (era 5).
  - When a technique becomes industry standard it is **included in every new model
    automatically** (for example, chain-of-thought is built in from era 3) and stops costing a
    card slot; its side effects (hallucination, reward hacking) come with it unless the player
    picks counter-cards.
  - The player can **research a technique one era early** with talent-and-research spend, getting its
    capability edge before rivals, plus its risks before anyone understands them.
- **Humanoid line (owner confirmed 2026-09-25).** Embodied data and the humanoid channel
  unlock in era 4. They are invented design, not research-based, and are marked as such.

## 6c. Events and incidents (approved "for now" 2026-09-25)

- **Delivery: warning, then card (owner pick).** Incidents planted by the player's own choices
  first appear as a small sign (a feed post, an advisor aside). Acting on the sign is cheap.
  Ignoring it turns it into a full event card the next turn, with 2–3 costly choices.
  Rejected: plain cards only (no chance to catch trouble early); multi-turn story chains (too
  much writing for 36 hours).
- **Card layout.** Title, a feed-style post, 2–3 choices with visible costs, each tagged with
  the advisors who back it. About 0–2 events per turn.
- **Caused by your model** (planted flag → early sign → card choices):
  - Flattery blowup ← `sycophancy` → screenshots of the model praising absurd plans → roll
    back / patch quietly / defend it.
  - Jailbreak goes viral ← `jailbreakWaiting` → a forum "found a trick" thread → emergency
    patch / deny / pull the model.
  - Fake-citation scandal ← `hallucination` → a lawyer's odd filing → citation checks
    (servingCost up) / blame users / recall.
  - Benchmark contamination exposed ← `contaminated` → a researcher's thread → admit and
    re-score / stonewall.
  - Rival-distillation exposed ← `rivalDistill` → rival changes its terms → settle / deny /
    countersue.
  - Agent wrecks a customer's system ← `agentic` → a quiet support ticket → compensate and
    add controls / blame the customer.
  - Companion-harm lawsuit ← consumer channel + `sycophancy` → a worried parent's post →
    settle and add age checks / fight it.
  - Broken promise revealed ← `brokenPromise` → staff asking pointed questions → come clean /
    cover up; the Head of Safety may quit publicly.
- **People and company:** star researcher poached; safety-team open letter; whistleblower;
  weight theft by a foreign state (low security and high capability); board revolt.
- **World and market:** rival breakthrough; the Eastern lab's cheap open model shocks the
  market; export controls flip; chip or memory shortage (the era's bottleneck); local
  data-center opposition (era 4); rental-cloud partner collapses; price war; copyright suit
  filed; Senate hearing; viral demo win.
- **Training mini-events:** loss spike (roll back / slow down / push through); caught-cheating
  reasoning trace (penalize the thought / fix the environment / ignore); sudden capability
  jump (celebrate / pay for an audit).

## 7. One turn, screen by screen

1. **Briefing.** Four advisor cards, each with a face showing mood and one line. The feed runs
   in a side column. Always-visible numbers sit in a top bar.
2. **Budget.** One five-way split (training, safety and evals, security, product and growth,
   talent and research) plus a total spend level. The CFO shows the two runway figures.
3. **Moves.** Two action slots per turn, chosen from: start a training run, sign a compute deal,
   release a model, amend or defend the constitution, take a meeting, and (era 5) attend the
   pacing summit.
4. **Events.** Zero to two event cards with choices, drawn from risk pools fed by hidden
   variables and from the era's deck.
5. **Training run** (when one is active). Starting a run opens the recipe screen (section 6b).
   Then set the capability/alignment share for the phase, watch the animated run, and answer
   pausing mini-events (loss spikes, a caught-cheating reasoning trace).
6. **Launch** (when releasing). The evaluation-and-release choices (section 6b), then naming,
   then the reveal: four outlets score it against a visible "beat your last flagship" bar, the
   model card shows its running cost and margin, and the feed reacts.
7. **End of turn.** Rivals move, compute arrives, lawsuits tick, catastrophe checks run, and a
   scheduled board vote or era gate resolves.

## 8. Technology

- Plain HTML, CSS and JavaScript ES modules; no build step. Playable from a static host
  (itch.io HTML upload or GitHub Pages).
- `sim/` holds pure game logic with no DOM access and a seeded random number generator, so runs
  are reproducible and testable. `ui/` renders state and sends player choices to the sim.
- Content (events, advisor lines, feed templates, clauses) lives in data files separate from
  logic.
- Before any UI work, load the owner's `design` skill; every screen is rendered and looked at
  before it counts as done.

## 9. Testing and balance

- `node --test` unit tests for the sim: update rules, thresholds, ending checks, seeded runs.
- A balance bot plays scripted strategies (all-speed, all-safety, balanced, random) many times
  and reports where each dies. Targets: most runs of each extreme strategy die by era 3–4; no
  single scripted strategy reaches a winning ending in more than about a third of runs.

## 10. Out of scope for the hackathon

IPO sequence, politics pages, AI-worker replacement, insider trading, detailed pricing tiers,
individually named hires, save/load, mobile layout, and music.

## 11. Open questions

- Working title.
- Names of the rival labs and compute actors (the owner's earlier parody names are candidates).
- Whether the President is named or fictional (default: fictional).
