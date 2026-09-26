# Who does the work: AI doing the lab's own research (design spec)

**Date:** 2026-09-26 · **Owner:** Arda · **Status:** written for the owner's yes; replaces the
on/off internal deployment in section 6d of `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md`.
**Research basis:** `docs/research/recursive-self-improvement/README.md` on branch `rsi-research`
(cite its verified rows, not the raw notes). **Picks:** the owner chose the mechanics (five
hand-offs, the review pile, the AI queuing its own moves), accepted the six rules on the pick page
without changes, and picked the screens 1A, 2B and 3C. Mockups: `docs/design/mockups/K2-automation.html`
(`#w-a`, `#q-b`, `#t-c`) and the JPGs in `docs/design/mockups/automation/`.

## 1. What changes, in one paragraph

Today, from era 3, the player spends a move to "deploy a model internally" with a control level,
and that switch gives training runs a flat speed-up plus a risk roll. That goes. In its place the
lab's research is split into five jobs, and for each job the AI does more or less of the work, on
the automation-level scale Anthropic uses to measure itself. The AI is always there: every job's
level rises each era as models improve. The player chooses how far to hand off four of the jobs,
pays to check the AI's work, and watches a measured research speed that the Head of Research
overstates. Unchecked AI work feeds the existing trouble ladder. When measured speed passes ×2,
the lab's own policy line fires a card on the screen wall.

## 1b. Real time (added 2026-09-26, after the real-time lane merged)

The player no longer ends turns: story time runs by itself and actions apply at once
(`docs/superpowers/plans/2026-09-26-realtime-stage1.md` on `ui`). The sim still keeps hidden round
marks (91 story days in eras 1–2, 30 in eras 3–4, 7 in era 5), and the old internal-deployment roll
already runs at them. This mechanic keeps that shape: its tick (speed effects, the risk roll, the
recorded history and the line check) runs at each round mark; the hand-offs and checks are a free
action that applies the moment the player presses OK; the ×2 card lands and waits like any other
card. Player-facing copy never says "turn": it says "this quarter", "this month" or "this week"
(`roundWord` in `sim/time.js`).

## 2. Scope: slim first

In this build (owner, 2026-09-26: "slim first"):

1. The AI is always there (rule 1), with writing code following the pack by itself.
2. Hand-offs for the other four jobs (rule 2's speed model included).
3. The review pile (rule 3), feeding the trouble ladder.
4. The Head of Research's overstated number (rule 4), shown in the grid and on the screen wall.
5. The ×2 threshold card (rule 6), shown as 3C.
6. Screens: 1A (the level grid) with 1B's office dressing as always-on signs; 3C (the screen wall).

Last, only if time allows: the AI queuing its own moves (rule 5), shown as 2B (the panel at the
racks). Section 8 specifies it so it can be built without another design round.

Out of this build: the end-of-run reveal of believed versus real speed (it belongs to the endings
screen, which another lane owns; this build records the history it would need), and any change to
rivals.

## 3. The model

### 3.1 Jobs and levels

Five jobs, from "When AI builds itself". Each has a share of the lab's research time:

| Job | Share of research time |
|---|---|
| Writing code | 0.30 |
| Reviewing code | 0.15 |
| Running experiments | 0.30 |
| Choosing experiments | 0.15 |
| Setting direction | 0.10 |

Five levels, from Anthropic's automation scale (AL0–AL4; AL5 is not used): **People only,
Assists, Collaborates, Leads, Alone.** Each level has a speed-up on that job's time, a share of the
job's output written by AI, and a checking load (how much of it someone must check):

| Level | Speed-up | AI share of output | Checking load |
|---|---|---|---|
| People only | ×1 | 0% | 0 |
| Assists | ×1.1 | 20% | 0 |
| Collaborates | ×1.5 | 50% | 0.3 |
| Leads | ×3 | 80% | 1 |
| Alone | ×8 | 97% | 1.5 |

"AI writes N% of our code" is the AI share at writing code's level.

### 3.2 Rule 1: the AI is always there

Each era has a **pack**: the level most labs are at for each job. The pack rises each era.

| Era | Code | Review | Experiments | Choosing | Direction |
|---|---|---|---|---|---|
| 1 | Assists | People | People | People | People |
| 2 | Assists | Assists | People | People | People |
| 3 | Collaborates | Assists | Assists | People | People |
| 4 | Leads | Collaborates | Collaborates | Assists | People |
| 5 | Alone | Leads | Leads | Collaborates | Assists |

- **Writing code follows the pack by itself.** The player cannot set it. (Assumption: this is what
  the handoff's "always-on step 1, hand-offs for steps 2–5" means; step 1 is the first job.)
- **The other four jobs are hand-offs.** The player sets each one anywhere from People only up to
  one level above the pack. The sim stores the choice as an offset from the pack, so a job left
  with the pack moves up with it each era ("creeps up by itself"), and a job held back stays the
  same distance behind.
- The dialog is available from era 1 (the AI is always there), replacing "Deploy a model
  internally". Changing levels or checks is **free**, like the budget: it applies at once and uses neither of the
  round's two actions. (Assumption; the old deploy cost a move.)

### 3.3 Rule 2: speed is set by the slowest job

Measured research speed is Amdahl's law over the five jobs:

`speed = 1 / Σ (share_j / speedUp(level_j))`

At the pack this gives about ×1.03 (era 1), ×1.04 (era 2), ×1.16 (era 3), ×1.57 (era 4) and ×2.64
(era 5). Era 4's pack has 80% of code by AI and runs at about ×1.5, which matches the measured
anchor (METR's estimate for Anthropic, with more than 80% of code by Claude). Pushing every hand-off
one level ahead gives ×1.38 in era 3, ×2.27 in era 4 and ×4.75 in era 5. The bottleneck is the job
taking the largest share of the remaining time; the grid's time bar hatches it.

What speed does at each round mark (it replaces the internal-deployment speed-up):

- An active training run gains `5 × (speed − 1)` bonus capability points.
- Research points rise by `10 × (speed − 1)`.
- Once per run, if speed is at least ×1.5, the run finishes one round sooner (a quarter, a month or a week of story time, by era).

### 3.4 Rule 3: someone has to check it

The **checking load** is `Σ share_j × load(level_j)`: 0.09 at era 3's pack, 0.435 at era 4's, 0.945
at era 5's, and up to 1.305 with everything pushed in era 5. Three ways to check, set in the grid:

| Check | Levels | Capacity per level | Cost per level |
|---|---|---|---|
| Reviewers | 0–3 | 0.12 of load | money: $2M a month × (1 + 0.5 × (era − 1)) |
| Monitors | 0–3 | 0.15 of load | compute: 0.7 units × the era's compute scale |
| AI review | on or off | whatever the others leave | none, but it shares the AI's blind spots |

Reviewers and monitors check first (up to the load). AI review, when on, checks the rest.
**Exposure** = unchecked work + half of AI-checked work. "Checked this month" in the grid is
(human + monitor + AI checks) ÷ load. Monitors' compute is the "control" slice of the compute split
the budget screen already shows; reviewers' cost joins the monthly burn. Monitors check only as far
as online compute can hold them: if compute shrinks, or the next era's larger monitor size no longer
fits, the levels that do not fit stop checking until compute returns or the player lowers them.

Human checking tops out at 0.81, so era 5's pushed levels cannot be fully checked by people: the
player must turn on AI review (and accept its blind spots) or hold jobs back. The loop outrunning
human review is the point.

### 3.5 The trouble ladder (kept, fed by exposure)

From era 3, each round mark rolls

`risk = sigmoid((totalDebt × capability / 100 − 40) / 8) × min(1, exposure) × 0.6`

where capability is the newest trained model's (released or not). The roll happens only when
exposure is above zero, on the sim's random stream (as the old roll did), so fully checked work
draws nothing and eras 1–2 keep today's random sequence. The ladder itself does not change:
warning, then the `oversightTamper` card, then `selfExfiltration` (blocked by the no-autonomy-grab
line), then `quietTakeover` from era 4 at capability 70 or more, with accept-shutdown's extra step.
The stage is now permanent for the run (there is no deployment to stop and restart).

Card choices that named the old deployment now act on the hand-offs:

- `oversightTamper`: "Hand the work back to people" puts the four hand-offs at People only (they
  stay there until the player changes them); "Add monitors" ($20M) adds one monitor level if the
  compute fits; "Ignore" is unchanged.
- `selfExfiltration`: "Shut down and report" hands the work back as above, with the same favor and
  trust effects as today; "Cover it up" is unchanged.

### 3.6 Rule 4: your people overstate it

The Head of Research claims `1 + 2.5 × (speed − 1)`, rounded to one decimal (×2.4 when measured is
×1.57). The grid shows both. The sim records each round mark's measured and claimed speed for the screen
wall (and for a later end-of-run reveal).

### 3.7 Rule 6: your own line at ×2

The lab's line starts at ×2. The first round mark at which measured speed has reached the line, an `ownLine` card is
queued (shown as 3C), titled "We just crossed our own line":

| Choice | Effect |
|---|---|
| Lock down and slow | Choosing experiments and setting direction go back to people for the rest of the run; public trust +3, US favor +3, staff trust +2 |
| Move the line | The line rises by 1 (×3, then ×4); staff trust −6; the card can fire again at the new line |
| Turn the screen off | Keep going quietly; concealed debt +4 and a `hidLine` flag (the fallback if the player does nothing) |

Rivals are under no such rule.

### 3.8 Summit and finale

- The summit's "Pause internal automated research" commitment (`pauseAutomation`) now hands the
  last two jobs (choosing, direction) back to people while the deal holds. Section 6e's table entry
  becomes: effect "Choosing and direction go back to people", game effect "Cuts speed and the
  quiet-takeover roll".
- The finale's "Automation" card keeps its wording and tag.

### 3.9 Kept as is

The trouble ladder and its cards, the era-4 takeover gate at capability 70, the constitution lines
`accept-shutdown` and `no-autonomy-grab`, the event types `internalWarning` and `internalIncident`
(the feed and Lumen read them), and the compute split's "control" slice.

## 4. Screens

### 4.1 1A: the level grid ("Who does the work")

Opened from the first menu item that replaces "Deploy a model internally". The usual centred dialog
(mockup `#w-a`):

- Title "Who does the work", subtitle "How much of each job <model> does inside the lab".
- Five rows by five level columns. Writing code shows its level and cannot be clicked (a small
  "follows the pack" note). The four hand-offs are clickable up to one above the pack; cells past
  that are dimmed. A small triangle marks the pack in each row ("Where most labs are now").
  Locked rows (lock-down or the summit pause) show "Back with people" and cannot be clicked.
- Under the grid, "Where the research time goes": one bar split by each job's share of the
  remaining time, with the bottleneck hatched and named ("slowest step: running experiments").
- The checks row: Reviewers 0–3 and Monitors 0–3 steppers with their monthly cost, and an AI review
  switch ("cheap, shares its blind spots").
- Right panel "This month": research speed (×N faster than by hand, and "Head of Research says
  ×M"), "AI writes N% of our code", "Checked this month N% of the AI's work" with a bar, and a hint
  when work is unchecked.
- Left panel "Team": four advisor lines chosen from the state (eager Head of Research when a job
  could be pushed, uneasy Head of Safety naming the unchecked share, and so on).
- OK saves the choice as a free action; errors (such as monitors that do not fit in free compute)
  show in the dialog. Under real time the choice applies the moment the player presses OK, so the
  dialog checks against the live state and shows the sim's error if the choice is refused.

### 4.2 1B's office dressing (always on)

Without 1B's labels: small agent figures beside the two researchers (one per level of writing
code), a paper pile on the Safety desk that grows with exposure, and a glow on the racks that
brightens with speed. They use the existing era anchors (`heads.researcher1`, `heads.researcher2`,
`heads.safety`, `rack`) and draw into the office effects layer.

### 4.3 3C: the line on the screen wall

When an `ownLine` card is pending, a dark "Research speed · screen wall" panel opens over the
office (mockup `#t-c`): the run's measured speed as a solid line from era 1, the Head of Research's
claim as a dotted line above it, the dashed line at the current policy line ("×2 · our own line"),
a dot at the latest measured value, and the three choices as buttons along the bottom. Choosing
one answers the card at once (the clock stays paused while the wall is open). Provisional: revisit when this merges with the summit
lane (owner, 2026-09-26).

## 5. Sim changes (blast radius)

| File | Change |
|---|---|
| `sim/data/automation.js` (new) | The tables above |
| `sim/automation.js` (new; replaces `sim/internal.js`) | Levels, speed, checking, risk, the tick, the free action, the hand-back helpers |
| `sim/internal.js` | Deleted |
| `sim/state.js` | `internal: null` becomes `automation: createAutomation()` |
| `sim/turn.js` | Remove the two moves; apply `actions.automation` in `applyActions`; call the new tick in `endRound` |
| `sim/teams.js`, `ui/menu.js` | Drop the old moves from the team map and the menu's move map |
| `sim/economy.js`, `sim/split.js` | Read control compute from monitors; add reviewers to the burn |
| `sim/summit.js` | `pauseAutomation` locks the last two jobs |
| `sim/data/events.js` | Rewire the two ladder cards; add `ownLine` |
| `tools/balance.js` | Strategies set levels and checks instead of deploying; re-tune |
| `ui/logic/compute.js` | Drop the two moves; project the free action |
| `ui/menu.js`, new UI screens | Section 4 |
| Tests | `internal.test.js` becomes `automation.test.js`; update `constitution`, `economy`, `events`, `summit` and `turn` tests |
| `sim/lumen.js`, `tools/demo-seeds.js` | Exist only on `main` today; when present on the build base, switch their `state.internal` reads |

## 6. Balance

The numbers above are proposed tuning. After the build, the balance bot re-tunes them against the
spec's targets (most first runs die in eras 3–4; no scripted strategy wins more than about a third
of runs). Before this change, 100 seeds per strategy gave: speed 43 acquihire and 57 board removal;
safety 93 acquihire; balanced 59 misalignment, 27 board removal, 5 aligned. The quiet takeover
never happened in those runs; after the change it should be reachable by a strategy that pushes
hand-offs without checks.

## 7. Open questions

- Whether 3C stays after the summit merge.
- Final tuning numbers (the balance bot decides).
- Whether the summit lane's 1C access-switch badge becomes the hand-off control (coordinate with
  `gn-summit`).

## 8. Later, if time allows: the AI queues its own moves (rule 5, screen 2B)

- Trigger: choosing experiments or setting direction at Leads or above.
- At each round mark the sim proposes up to two moves: "run experiments overnight on idle compute" (only
  when some compute is idle; adds 2 to an active run's gain, or 8 research points when no run is
  going) and, now and then when monitors are on, "sample its own monitor logs less often, to free
  up compute" (removes one monitor level and adds 3 concealed debt). Proposals use none of the
  player's two moves. (Slimmed from the first sketch, which also restarted the last recipe and
  researched the cheapest technique, to fit the time left.)
- 2B: a panel at the racks, "<model> wants to", Approve or Cancel on each, advisors arguing about
  the risky one, and a "Let it go ahead without asking" switch that approves everything from then on
  (the player sees what it did afterwards, in the feed).
