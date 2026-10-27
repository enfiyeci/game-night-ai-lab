# Inventory of today's endings (main at 643a7d7, 2026-10-27)

Written by the orchestrating session from the code itself. Every file named here was read in this session;
partial reads are flagged ⚠️ where they occur. Bot frequencies are in section 4.

## 1. Where endings are decided

There are eleven endings, defined in `sim/endings.js` (`ENDINGS`, lines 8-20). They are set in five places:

| Place | What it checks | Endings it can set |
|---|---|---|
| `sim/endings.js` `checkTurnEndings` (every round) | cash, board votes that are due, the misuse and heat round counters | acquihire, boardRemoved, misuse, rivalDisaster |
| `sim/endings.js` `eraGate` (end of each era) | rank and gap to the leader, the gate board vote | leftBehind, boardRemoved |
| `sim/release.js:221-231` (on each release) | agentic release, era, `misalignmentScore` | misalignment (era 4+; era 3 gets a warning) |
| `sim/automation.js:146-180` `automationTick` (each round) | unchecked AI work pressure, stage, capability, era | quietTakeover |
| `sim/endings.js` `finalEnding` (end of era 5) | the summit deal, rank, total debt | pacingDeal, aligned, pyrrhic, overtaken |

Also `sim/economy.js:196` (choosing the acquihire emergency option) and `sim/turn.js:440, 465` (a lost promise vote;
insolvency at an era end).

## 2. Each ending: trigger, state read, film, and what the player can do about it

Constants are from `sim/balance.js` unless named.

| Ending | Kind | Trigger (code) | State it reads | Player choices that actually move it | Film (`ui/endings/films/*.json`) |
|---|---|---|---|---|---|
| Absorbed (`acquihire`) | fail | Cash ≤ 0 and no rescue option left, or still insolvent a round after a rescue; also picking the acquihire rescue | `cash`, `flags.emergencyUsed`, `flags.insolvent` | Spend level, compute contracts (take-or-pay), release revenue, which emergency options are used | 8 shots: office, rewritten constitution doc, café news, farewell, kitchen app, café till, office, globe clip |
| Removed by the board (`boardRemoved`) | fail | A board vote with fewer than 4 of 7 "sure" members: at era gates 2-4, after emergencies, on a broken board promise | board support per seat (`sim/board.js`) | Board deals, promises kept or broken, emergency options, candor with the watchdog, staff letter | 7 shots: vote in office, slide, budget screen, café, hearing, kitchen app, skyline clip (KESTREL billboards) |
| Catastrophic misalignment | fail | Agentic release in era 4+ with (visible + concealed debt) × min(capability, 100) / 100 ≥ 36 | `alignmentDebt`, `concealedDebt`, model capability, `agentic` flag | Safety share of compute, reward-hacking choice (penalize hides debt), eval gate, interpretability, agentic RL, the `no-deceive-lab` line (halves alignment-faking concealment) | 8 shots: launch night, scores, port dispatch, hospital triage, kitchen laptop, Washington order, office, skyline clip |
| Catastrophic misuse | fail | Second round in a row with capability > 55 and effective misuse > 70 (`MISUSE_ROUNDS = 2`) | `capability`, `misuseExposure`, `misuseLocked` | Safeguard spend, open weights (locks misuse), skipping hardening, the `no-wmd` line (−4 misuse per release) | 8 shots: 3 am office, security console, rented room, hospital, skyline clip (KESTREL), kitchen, hearing, mirrors |
| Left behind | fail | At an era gate, rank worse than 2 and more than 15 behind the leader | rank, gap to leader | Training cadence, compute held, release timing | 8 shots: gate, usage chart, skyline clip (KESTREL), café, kitchen, summit, desert clip, office |
| A quiet takeover | fail | Unchecked AI research work accrues pressure; each time it reaches 1 the story moves a stage; at stage 3+ with newest capability ≥ 70 in era 4+, the ending | `automation.pressure`, `automation.stage`, checks (reviewers, monitors), job levels, debt, capability | Who does the work (hand-offs vs people), reviewers and monitors, lock-down, the "sample logs less" proposal, the `accept-shutdown` line (adds one more stage) | 8 shots: evals room, office, desert clip, briefing, campus gate, café, office, globe clip |
| Someone else's disaster (`rivalDisaster`) | fail | Third round in a row with race heat > 85 (`HEAT_ROUNDS = 3`) | `raceHeat` | Release pace, big deals and prepaid queues, the summit, the President's race asks | 7 shots: office, rival's slide, globe clip, news, café card, letter, desert clip |
| Aligned success | win | End of era 5: no binding deal, rank 1, total debt < 40 | rank, total debt | Everything that keeps debt low while staying first | 8 shots: office, hospital triage, kitchen chat, port, Washington news, badges, café, skyline clip |
| A negotiated pace (`pacingDeal`) | win | End of era 5: deal not collapsed, player never shipped against it, at least 2 binding cards each signed by a rival and a government | `state.deal` | Summit proposals, sweeteners, holding instead of shipping | 7 shots: office, Geneva news, a cursor on the deal's terms (varies by signed cards), desert, school, hospital trial, globe |
| A costly win (`pyrrhic`) | win | End of era 5: rank 1, total debt ≥ 40 | rank, total debt | As aligned, minus the safety work | 9 shots: office, Tomas's letter, skyline clip (KESTREL "NUMBER ONE"), port, triage, chat, reveal, hearing, phone |
| Overtaken | fail | End of era 5: not rank 1 and no qualifying deal | rank | Compute and pace in era 5 | 7 shots: office, rival launch, news, letter, kitchen chat, email, globe clip |

Notes on the table:
- Every film opens or closes in the player's own office (their era and staff, and the leads the player hired). Plates
  are SVG screens whose "Kestrel" placeholders are swapped at run time for the lab and model names the player chose
  (`ui/endings/timeline.js:69-90`). Only the Blender clips have names baked in (section 5).
- Only one film reads the run beyond the ending id: `pacingDeal` shows the deal's signed terms (`films/pacingDeal.json`
  `deal`, `resolveFilm` in `ui/endings/timeline.js`). The others are fixed shot lists.
- The finale (`sim/finale.js`, `sim/data/finale.js`) runs only for the four era-5 endings. Six cards; the player's
  picks add one tag to the title ("A costly win — with a vassal state") and a "The world you leave behind" list on the
  end screen. The screen says outright that these choices "do not change the ending you earned". The sixth card is
  an AI citizenship vote.
- Lumen's epilogue (`sim/lumen.js:43-46`) is the ending's line plus a sign-off by disposition: evasive (era 3+ and
  debt ≥ 50 or concealed ≥ 20), flattering (latest model has the sycophancy flag, or constitution candor < 0.4), eager
  (eras 1-2) or honest.

## 3. What the constitution does to endings today

This matters most for the owner's firm want ("when AI takes over, the player's constitution decides what kind of
future the world gets").

- **No ending reads the constitution's content.** `sim/endings.js`, `sim/finale.js` and the film files never look at
  hard lines or rulings. The takeover film (`quietTakeover`) is the same for every constitution.
- **The "written versus learned" drift is not wired in.** `learnedConstitution` (`sim/constitution.js:215-225`)
  draws which lines drop and which rulings flip from total debt, but nothing in `sim/`, `ui/` or `tools/` calls it
  (searched 2026-10-27). The design spec promises the takeover epilogue "is written from its learned values" (spec
  section 6, "Written versus learned"); that is not built. It also still uses dice (`rng.chance`), against the
  owner's 2026-09-26 no-dice decision for outcomes.
- **Hard lines move endings only indirectly**, through these hooks (all found by searching `hasLine`):
  - `accept-shutdown`: the quiet takeover needs one more escalation stage (`sim/automation.js:171-176`); a President
    promise checks for it (`sim/data/promises.js:93`).
  - `no-wmd`: −4 misuse per release and ×0.97 consumer revenue (`sim/release.js:195, 217-219`).
  - `no-deceive-lab`: alignment faking conceals half as much debt (`sim/hazards.js:42`).
  - `no-autonomy-grab`: blocks two agent incident cards, and agentic RL gains less (`sim/training.js:99`,
    `sim/data/events.js:230, 832`).
  - `honest`: deceptive crisis choices cost staff trust; citation scandals hurt half as much (`sim/events.js:208`,
    `sim/data/events.js:150-156`).
  - `no-power-grab`: the President's loyalty demand is refused automatically; −3 US favour once
    (`sim/events.js:146`, `sim/constitution.js:22-26`).
  - `privacy`: enterprise releases get ×1.1 users (`sim/release.js:152`).
  - `no-manipulation`: the thumbs-up reward card plants less flattery (`sim/training.js:96`).
- **Case rulings barely move anything.** They feed `constitutionValues` (candor, caution, deference, userFirst),
  which is read in one place: Lumen turns "flattering" when candor < 0.4 (`sim/lumen.js:21`). The "report" ruling is
  also read by one President promise (`sim/data/promises.js:114`). Caution, deference and userFirst are read nowhere.
- So today the constitution's strongest effect on an ending is `accept-shutdown` delaying the quiet takeover by one
  stage. The owner's want needs new wiring: a takeover ending (quiet takeover, misalignment, perhaps a costly win)
  whose film and epilogue branch on the learned hard lines and the four values.

## 4. Bot frequencies (`node tools/balance.js 200`)

Run on 2026-10-27 in this worktree (main at 643a7d7): 13 scripted strategies × 200 seeds = 2,600 runs, 16.5
minutes wall time on a machine shared with two other sessions' bot runs. Output read in full from
`balance-200.txt` in the session scratchpad (not committed).

| Ending | All 2,600 runs | Where it comes from (strategy: count of 200) |
|---|---|---|
| Catastrophic misalignment | 966 (37%) | balancedLowSafety 182, speed 161, balanced 138, balancedPush 137, denier 124, balancedHighSafety 108, balancedNoGrid 75, handToMouth 31, random 10 |
| Absorbed (acquihire) | 568 (22%) | overCommitter 200, safety 193, random 175 |
| Aligned success | 457 (18%) | careful 193, balancedHighSafety 64, balanced 49, balancedPush 48, balancedNoGrid 37, denier 33, handToMouth 21, balancedLowSafety 12 |
| Overtaken | 377 (15%) | carefulNoGrid 200, handToMouth 77, balancedNoGrid 69, denier 15, and 16 more across five strategies |
| Someone else's disaster | 88 (3%) | handToMouth 71, careful 7, balancedNoGrid 6, random 4 |
| A costly win (pyrrhic) | 69 (3%) | balancedHighSafety 25, balancedNoGrid 13, balancedPush 10, denier 9, balanced 8, balancedLowSafety 4 |
| Catastrophic misuse | 42 (2%) | speed 39, random 3 |
| Left behind | 26 (1%) | denier 19, safety 4, random 3 |
| Removed by the board | 5 (0.2%) | random 5 |
| A negotiated pace | 2 (0.1%) | safety 2 |
| **A quiet takeover** | **0** | none |

What the numbers mean for the redesign:
- **The quiet takeover, the ending most naturally shaped by the constitution, never fires in 2,600 bot runs.** The
  bots that push AI hand-offs hardest (`speed`) die of misalignment in era 4 first (mean era 4.0), before the
  automation story can reach its last stage at capability 70 in era 4. The bots are scripted and do not cover every
  player style, so this shows the ending is rare for the strategies modelled, not that it is unreachable. See the
  reachability check below.
- **Misalignment dominates.** It is over a third of all runs and the most common ending for every "balanced" variant.
  If constitution-shaped futures hang only on the quiet takeover, almost no player will see them; misalignment is
  where an AI-in-control ending actually happens.
- **Two wins are near-absent.** The negotiated pace (2 runs) and the board removal (5 runs) barely appear, so their
  films are rarely earned by the scripted styles.
- **Endings follow strategy closely.** Most strategies land in one or two endings, which fits the 2026-09-26 "no
  dice" decision: the ending already follows the style of play, and the redesign's job is to make that link visible.

**Reachability check** (`node tools/ending-reachability.js`, default 100 seeds per policy, 17 policies = 1,700
runs, 28.5 minutes; output read in full): within its first 100 seeds every ending has a replayable witness run
**except the quiet takeover** (`missing: ["quietTakeover"]`, no rejected runs). The probe's `unchecked` policy is
built to push toward the takeover (no safety compute, alignment share 0.3, no releases from era 4, warnings
ignored, reviewers and monitors at zero); in seeds 1 to 100 it ends in board removal 75 times and left behind 25
times.
**But the quiet takeover is reachable.** `tests/fixtures/ending-witnesses.json` (re-recorded in 39669f5) holds a
witness for it: the `unchecked` policy at seed 163, ending in era 5 after 19 turns. Replayed in this session with
`replayEnding`, it ends in `quietTakeover` with no errors, and `tests/ending-reachability.test.js` replays all
eleven witnesses (correction from `gn-improve`, 2026-10-27; this note first said no policy reaches it, because only
lines 1-40 of that test file had been read). So the takeover is **reachable but rare**: 0 of 2,600 balance runs,
none in the probe's default 100 seeds per policy, and found by the policy built for it only past seed 100. For the
redesign, the point stands that few players will see a constitution-shaped future that hangs only on this ending.

## 5. KESTREL in the Blender clips, and the re-render cost

- The SVG plates are safe: their "Kestrel" placeholders are replaced with the player's names at run time.
- The Blender skyline scene bakes billboard text into four variants (`tools/endings/blender/skyline.py:329-343`):
  `billboards` ("KESTREL 4/5/6", plus "OPENBRAIN" and "DEEPTHINK" boards), `leftbehind` ("KESTREL 4"), `cascade`
  ("KESTREL") and `numberone` ("KESTREL 5 NUMBER ONE" on four rooftops). The `blackout` (misalignment) and `warm`
  (aligned) variants carry no lab name.
- Matching clip frame counts against the variants' frame ranges (`skyline.py:34-38`, counted with ffprobe): the
  baked clips are `rb-skyline` and `rb-skyline-title` (board removed, `billboards`), `lb-skyline` (left behind,
  `leftbehind`), `mu-skyline` (misuse, `cascade`) and `cw-skyline` (costly win, `numberone`). That is five clips in
  four films. The match is inferred from frame counts; no render log records it.
- **Measured cost on this MacBook (Apple M4 Pro, 24 GB), 2026-10-27:** a 4-frame still render of the `numberone`
  variant, scene build included, took 53 seconds (EEVEE, 24 samples, 1920×1080). Total frames to re-render across the
  four variants: `billboards` 416, `leftbehind` 192, `cascade` 192, `numberone` 168, about 970 frames. At roughly 10
  to 13 seconds a frame, that is about **3 to 3.5 hours of unattended rendering**, run one variant at a time (the
  endings-art handoff records that parallel Blender renders crashed the 16 GB Mac mini). Re-encoding is seconds per
  clip.
- What the fix itself can be is a design choice for the later session: a neutral board ("YOUR LAB"), blank boards
  with a browser overlay of the player's name (hard, because the camera moves), or a different shot. "OPENBRAIN" on
  the rival boards and in two plates is the name of the fictional lab in AI 2027; whether that matters is the
  `gn-ip-risk` lane's call, noted here only in passing.
- A separate, unmerged track exists: the `endings-art` branch rebuilds the films as Cycles stills (about 4 minutes a
  frame on the Mac mini); its handoff says 27 world finals were still unrendered on 2026-09-26. Any redesign must
  decide which pipeline it builds on.

## 6. Tensions the redesign inherits

- **Visible path vs. "no extra warning cards".** On 2026-09-26 the owner rejected one exact warning card per
  catastrophe ("the player learns of the danger only through the existing surfaces", deterministic-endings spec
  decision 5, branch `deterministic-endings`). On 2026-10-26 he asked that the path to an ending be visible while
  playing. The research on signposting (narrative and systems notes) bears directly on reconciling the two.
- **The finale says its choices don't matter.** The epilogue cards state that they "do not change the ending you
  earned". That is honest, but it is the opposite of endings that visibly come from choices.
- **The end screen proves little causation.** It shows the title, one line, the models shipped, the advisor
  reliability scale, the finale's legacy lines and Lumen's note (`ui/screens/end.js:88-181`). It does not show which
  of the player's decisions led to the ending, nor the written-versus-learned constitution the spec promises.

## Coverage statement

Read in full in this session: `sim/endings.js`, `sim/constitution.js`, `sim/data/constitution.js`, `sim/finale.js`,
`sim/lumen.js`, `sim/hazards.js`, `sim/balance.js`, `ui/screens/end.js`, the design spec
`docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md`, the deterministic-endings spec (from branch
`deterministic-endings`), and the model-specs `README.md` and `proposals.md` (from branch `ui-t9`).
⚠️ Read in part: `sim/release.js` (lines 1-40 and 190-240), `sim/automation.js` (lines 60-200), `tools/balance.js`
(lines 1-140 and the strategy list), `tools/endings/blender/skyline.py` (lines 25-60, 262-300, 315-408),
`ui/endings/player.js` (lines 1-40), `ui/endings/timeline.js` (lines 69-90), `ui/logic/ending.js` (lines 1-120). The
film JSON files were read through a script that printed each shot's kind, plate or clip, duration and card; their
narration lines were not read.
