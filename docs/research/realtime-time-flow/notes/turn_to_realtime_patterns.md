# Turn-to-Real-Time Patterns: A Catalogue for Small Web Games

Research scope: how games structure flowing time (real time with pause, "RTwP") versus discrete
turns, and how designers convert turn-based systems into flowing time — aimed at a browser AI-lab
management sim currently built as 20 discrete turns (4 per era × 5 eras, turn length 3/3/1/1/0.25
months by era), 2 player "moves" per turn, a per-turn budget, and an "End turn" resolution step.

Source-quality note up front: some findings below come only from WebSearch's own summarized
answer over multiple pages (search snippets + an aggregation step), not from a full read of any
one page by me. Per the research constraints, every such claim is marked ⚠️ **(search-summary
only)** rather than presented as an ordinary sourced fact, because I did not read that source page
end to end myself — I only saw what the search tool chose to surface. Claims backed by a page I
fetched and read in full are marked as ordinary sourced facts with a URL.

---

## Key Question 1: Paradox games — ticks, speeds, monthly pulses, auto-pause, and action caps without a turn budget

### Takeaway
Paradox grand-strategy titles are turn-based systems in disguise: a fixed simulation tick (one
hour in Hearts of Iron IV; commonly described as one day in EU4/CK3/Stellaris) resolves
automatically at a player-chosen cadence ("speed 1–5"), so the game *feels* like flowing real time
while the underlying engine still processes discrete, deterministic steps — exactly the pattern
most relevant to a developer who wants to keep a discrete simulation core. Player action is capped
not by a turn budget but by construction/recruitment time, cooldowns, cost-and-upkeep economics,
and (in CK3) automatic pausing whenever a decision-bearing event fires.

### Cited Findings
- Hearts of Iron IV's simulation tick is one in-game hour; a Paradox developer diary reports the
  1936 scenario's per-tick simulation cost dropped from a 15 ms to a 10 ms average, i.e., roughly
  42–64 in-game hours simulated per real second depending on optimization — a direct look at how
  "speed" is really "how many discrete ticks we can process per real second." — [Steam: Hearts of Iron IV Developer Diary | Performance](https://steamcommunity.com/games/394360/announcements/detail/3740859408917364815) ⚠️ (search-summary only — I did not fetch this page directly, only saw the search tool's extracted summary)
- In Stellaris, at normal speed roughly 1 real second = 1 in-game day, all months are fixed at 30
  days (360-day year), so 10 in-game years pass in about one real hour at normal speed; at the
  fastest speed roughly 1 second = 2 in-game days. — [Steam Community discussions on Stellaris speed](https://steamcommunity.com/app/281990/discussions/0/133261907130714227/) ⚠️ (search-summary only)
- Stellaris auto-pauses on many events by default and lets the player toggle "Event auto-pause" per
  message category in Settings → Messages; in multiplayer, only the host can change game speed, but
  any player can pause. — [Steam Community: Auto-pause unpausing?](https://steamcommunity.com/app/281990/discussions/0/357286033299834552/); [Paradox Forums: New game option: Auto-pause](https://forum.paradoxplaza.com/forum/threads/new-game-option-auto-pause.1170486/) ⚠️ (search-summary only)
- In Crusader Kings III, decision-bearing events automatically pause the game in singleplayer (but
  not in multiplayer, where the game keeps running while one player is prompted); a colored speed
  indicator shows green (running), red (manually paused), or a striped caution icon (auto-paused by
  an event), with an audio cue. — [Paradox Forums: Is Autopause on Events a setting?](https://forum.paradoxplaza.com/forum/threads/is-autopause-on-events-a-setting.1445451/) ⚠️ (search-summary only)
- CK3 players commonly run at speed 3 during setup or when juggling multiple ongoing activities, and
  speed 5 when nothing urgent is happening, pausing manually to manage characters/decisions — i.e.,
  the speed dial itself becomes the player's main "pacing" input, not a fixed turn length. — [Paradox Forums: How fast do you play?](https://forum.paradoxplaza.com/forum/threads/how-fast-do-you-play.1520770/page-2) ⚠️ (search-summary only)
- A recurring, load-bearing failure mode: as a CK3 (and EU4) campaign progresses, the amount of
  simulated content per tick grows (more characters, more provinces, more events), so processing
  time increasingly limits actual speed regardless of the speed setting selected — pausing becomes
  more frequent and each pause/recompute takes longer, producing a slow creeping slowdown across a
  campaign's lifetime that many players only notice well into the late game. — [Paradox Forums: How fast do you play? (p.2)](https://forum.paradoxplaza.com/forum/threads/how-fast-do-you-play.1520770/page-2) ⚠️ (search-summary only)
- EU4's speed 5 removes the game's speed cap entirely and runs "as fast as the CPU can process it,"
  meaning the practical ceiling on flow speed is hardware, not a designed cap. — [Steam Community: Any way to make EU4 max speed even faster?](https://steamcommunity.com/app/236850/discussions/0/3247565033764795981/) ⚠️ (search-summary only)

### Inferences
- The core transferable idea for a small web sim: keep a fixed, deterministic "tick" (the existing
  discrete turn resolution logic can *be* the tick), and let "speed" simply mean "how often the
  client fires that tick function," from 0× (paused) up to some max multiplier. This requires no
  rewrite of the simulation, only a scheduler around it.
- Cooldowns/build-time/cost replace a "2 moves per turn" cap naturally: if an action currently
  costs one of 2 turn-moves, in a ticking system it could instead take N ticks to complete (a
  project queue) or cost a resource that only regenerates at a fixed rate per tick — this is
  exactly what Paradox games do with construction queues, recruitment time, and mana/currency
  accrual instead of an action-point turn budget.
- Auto-pause-on-decision is the single most important usability mechanism carried over from
  Paradox design and is cheap to implement: any event/decision the player must respond to should
  hard-pause the clock, not just notify.

### Gaps
- ⚠️ I could not confirm the exact "how many ticks per in-game day" number for EU4 or CK3 from a
  primary source — the dedicated Paradox forum thread titled "Four ticks per day" (which likely
  contains the authoritative discussion) returned only a Cloudflare bot-check page when fetched, so
  I could not read it and have excluded any numeric claim from it. The claims above about EU4/CK3/
  Stellaris cadence come only from secondhand Steam-forum discussion, not an official wiki page or
  developer diary I could read myself.
- I did not find primary-source detail on how monthly/yearly "pulses" (e.g., monthly income,
  yearly aging checks) are layered on top of the base tick — this is referenced in general Paradox
  community knowledge but I have no directly-read citation for it, so it is omitted rather than
  asserted.

---

## Key Question 2: Other management sims with a clock — speeds, auto-pause, unit of time

### Takeaway
Across Frostpunk, Two Point Hospital, Prison Architect, and RimWorld, the pattern is consistent:
2–4 discrete speed multipliers (including pause) applied to a fixed underlying tick, with the
"unit of time" varying by game (RimWorld: real ticks at 60/sec baseline; Frostpunk/Two Point/Prison
Architect: an abstracted day-cycle), and orders/queuing remaining available while paused so pause
never blocks the player from acting — only from watching things resolve.

### Cited Findings
- RimWorld's tick is fixed regardless of speed: 2,500 ticks make one in-game hour, and at "Normal"
  speed the game runs 60 ticks per real second — so one in-game day (24 hours = 60,000 ticks) takes
  about 16 minutes 40 seconds of real time at Normal. Speed multipliers are Pause (×0), Normal (×1),
  Fast (×3), Superfast (×6), and a Dev-mode-only ×15; one "unit of work" for colonists is
  approximately 60 ticks (~1 real second at Normal), with a "rare tick" every 250 ticks (~4.16 s)
  and a "long tick" every 2,000 ticks (~33.33 s) used for periodic checks. — [RimWorld Wiki: Time](https://rimworldwiki.com/wiki/Time) (read in full)
- RimWorld lets the player issue orders while time is fully stopped — pause is a tactical tool for
  reading a raid or medical emergency and queuing responses, not merely a menu-freeze — and the
  game has configurable pause-on-event preferences so major threats or incoming letters can
  auto-stop time. — [Steam Community: What keeps making my game pause?](https://steamcommunity.com/app/294100/discussions/0/1744480967028550929/) ⚠️ (search-summary only)
- Two Point Hospital exposes Pause / Normal / Fast via keyboard (Space to pause) or mouse buttons,
  and on console via joystick clicks that cycle Slow/Normal/Fast; player styles range from staying
  in Fast constantly to spending most of the game paused while positioning individual units. — [Gamer Tweak: How to Speed Up Time In Two Point Hospital](https://gamertweak.com/how-to-speed-up-time-in-two-point-hospital/) ⚠️ (search-summary only)
- Prison Architect's Pause setting stops all simulation but still lets the player queue
  construction/management tasks; the game offers roughly 2× and up to 5× speed multipliers for
  waiting out slow periods (e.g., workers finishing jobs). — [Prison Architect Wiki: Clock](https://prison-architect.fandom.com/wiki/Clock) ⚠️ (search-summary only)
- Frostpunk ships Pause/Play/Fast-forward controls, and un-pausing resumes whatever speed the
  player had previously selected (rather than defaulting to Normal). — [Nexus Mods: Frostpunk Time Control](https://www.nexusmods.com/frostpunk/mods/2?tab=posts) ⚠️ (search-summary only)
- Frostpunk deliberately resets speed to Normal (and pauses) for any triggered story
  event/decision, and additionally forces a return to Normal speed at in-game 5 a.m. each day as a
  built-in reminder to check the day's temperature forecast and other priorities — described by the
  developers as an intentional anti-miss-important-things mechanism, not a bug, despite persistent
  player requests (echoed across several Steam discussion threads) for an option to disable the
  speed reset. — [Steam Community: Please stop resetting my defined game speed](https://steamcommunity.com/app/323190/discussions/0/1696045708643572493/); [Steam Community: A better and more straightforward PAUSE mechanic](https://steamcommunity.com/app/323190/discussions/1/3211505894148824611/) ⚠️ (search-summary only)
- Mini Metro lets the player stop time at any point by clicking the clock, then freely edit lines
  and reroute trains while paused, before resuming — an explicit design choice, per an essay on the
  game's mechanics, to strip out mechanical/reflex stress and leave "pure strategic decision-making"
  as the actual test of skill. — [Medium: Mini Metro and Mini Motorways: The Art of Elegant Constraint Optimization](https://medium.com/gaming-is-good/mini-metro-and-mini-motorways-the-art-of-elegant-constraint-optimization-2571a32fdfe2) ⚠️ (search-summary only)
- Kairosoft's tycoon-style titles (Game Dev Story and siblings) commonly offer a speed-priority
  toggle (prioritize speed vs. prioritize graphical detail) and a "high-speed mode," but in most
  titles the high-speed mode is deliberately gated (unavailable on a first playthrough, unlocked
  from a second playthrough onward, and in later titles gated behind in-app purchase) — an explicit
  pacing lever used to slow new players down on their first run. — [Pocket Tactics: The PT History Lesson Vol. 5 – Kairosoft](https://www.pockettactics.com/kairosoft-history) ⚠️ (search-summary only)

### Inferences
- The "resume previous speed after unpause / after an event" behavior (Frostpunk) is a small but
  high-value UX detail: it avoids punishing the player for engaging with an event by dropping them
  back to 1× every time.
- Kairosoft's "fast mode is a second-playthrough unlock" is a deliberate pacing tool worth
  considering for a lab-sim: gate the top speed tier until the player has cleared the tutorial/first
  era, so new players aren't tempted to blow past content they haven't learned yet.
- None of these games use a hard per-tick action cap analogous to "2 moves per turn" — all of them
  replace it with construction/queue time, so the equivalent conversion for the AI-lab game is to
  turn "2 moves per turn" into "at most N concurrent in-progress projects" or "each action takes M
  ticks to complete, consuming a slot."

### Gaps
- I did not find a primary developer statement (dev blog/GDC talk) explaining *why* Frostpunk chose
  the 5 a.m. forced-Normal-speed mechanic beyond the community's own characterization of developer
  intent relayed secondhand in Steam discussion threads — this is community estimate, not a
  directly-sourced developer quote.

---

## Key Question 3: Hybrid designs — WeGo/simultaneous turns, ticking real-time-under-turns, and turn↔real-time conversions during development

### Takeaway
The most directly relevant precedent for "keep a discrete simulation, make it feel like flowing
time" is the WeGo/simultaneous-turn family (Frozen Synapse, Combat Mission), which resolves
committed orders over a fixed real-time window rather than instantly — and FTL, which literally
switches between a turn-based overworld and a pausable-real-time combat mode within the same game.
On the "converted during development" question, the best-documented case runs opposite to the
brief's direction (real-time prototype converted to turn-based, for Civilization) and shows the
same complexity-overload problem the brief is trying to avoid recreating in reverse; Phantom
Brigade is the clearest documented case of a modern game deliberately building a turn-plan/
real-time-resolve hybrid instead of shipping either pure form.

### Cited Findings
- In Frozen Synapse, players get unlimited real time to plan orders (waypoints, stance, speed,
  default reactions) for their whole squad during a planning phase, then hit "Execute," at which
  point both sides' orders play out simultaneously over a fixed ~5-second window of simulated time
  — nobody moves first, and both plans can collide in ways neither player fully controls. — [Wikipedia: Frozen Synapse](https://en.wikipedia.org/wiki/Frozen_Synapse) ⚠️ (search-summary only)
- Simultaneous-order resolution ("WeGo") traces to the 1959 board game Diplomacy, where players
  write orders that are revealed and resolved together rather than in visible alternating turns;
  the pattern was carried into computer wargames including Combat Mission, Frozen Synapse, and
  Atlas Reactor because it mirrors real command structures (a commander issues orders, then learns
  the outcome, rather than reacting turn-by-turn). — [Lines of Battle: Simultaneous Turns in Strategy Games](https://linesofbattle.net/simultaneous-turns) (read in full)
- FTL: Faster Than Light is turn-based/node-based while navigating the sector map, but switches to
  pausable real-time during combat: the player can pause mid-fight to survey the ship and crew,
  redirect power, reposition crew, and queue weapon fire, then unpause to let it play out — pause
  abuse for crew/weapon management is described as essential to successful play, not an edge case. — [Wikipedia: FTL: Faster Than Light](https://en.wikipedia.org/wiki/FTL:_Faster_Than_Light); [Game Design Strategies: FTL – Designer Review](https://gamedesignstrategies.wordpress.com/2012/09/29/ftl-faster-than-light-designer-review/) ⚠️ (search-summary only)
- Documented case of a *real-time-to-turn-based* conversion during development: Sid Meier
  originally prototyped the original Civilization as a real-time simulation extending Will Wright's
  SimCity to a global scale; players were overwhelmed by the number of interacting systems (
  diplomacy, trade, combat, research, barbarians) that SimCity never had to juggle in real time, so
  Meier rebuilt the prototype as turn-based — a decision credited with producing the "just one more
  turn" hook, because turn-based play let each player set their own pace (a veteran plays fast, a
  newcomer takes their time on each turn) in a way flowing time could not. — [Designer Notes: GD Column 8 — Turn-Based vs. Real-Time](https://www.designer-notes.com/game-developer-column-8-turn-based-vs-real-time/) (read in full)
- The same article states real-time is generally preferred for multiplayer because "waiting for
  another player to finish his turn is anathema to fun," which is why turn-based multiplayer stays
  a niche category — relevant if this AI-lab sim ever adds a multiplayer/shared mode. — [Designer Notes: GD Column 8 — Turn-Based vs. Real-Time](https://www.designer-notes.com/game-developer-column-8-turn-based-vs-real-time/) (read in full)
- A second, independent article on the same topic lists specific failed turn/real-time hybrids as a
  cautionary note: Civilization III's optional "turnless mode" and X-COM: Apocalypse's simultaneous
  real-time option are both cited as hybrids that struggled to balance the two paradigms well,
  versus successful hybrids like StarCraft (real-time with deliberately limited unit-selection/
  micromanagement) and Europa Universalis (real-time with flexible speed controls). — [Game Developer: Turn-Based vs Real-Time](https://www.gamedeveloper.com/design/turn-based-vs-real-time) (read in full)
- Phantom Brigade uses a "semi-real-time" system: turns are divided into a few-seconds-long
  segment; the player predicts enemy behavior and sets up mech commands for that segment, which
  then plays out in real time with full procedural, directional damage. Developer Adelaide Jenkins
  said the explicit design goal was to "capture that energy you get in a mecha anime ... but have
  that actually be the gameplay," contrasting it with games like Front Mission 4 where dramatic
  mech combat was confined to non-interactive cutscenes while the actual gameplay stayed
  conventionally turn-based. — [Wikipedia: Phantom Brigade](https://en.wikipedia.org/wiki/Phantom_Brigade) (read in full)

### Inferences
- The WeGo pattern (plan with no time pressure → resolve over a fixed window) is probably the
  single best structural match for a management sim that wants "flowing time" without giving up a
  deterministic simulation step: the player's current "2 moves + budget, then End Turn" flow could
  become "plan freely while paused, then press Resume, and the plan resolves over the next N
  ticks/days," which is functionally identical to what the game already does, just relabeled and
  no longer gated behind an explicit End-Turn button.
- The Civilization case is a cautionary mirror image: real-time overwhelmed players once enough
  interacting systems were live simultaneously. An AI-lab sim already has multiple systems
  (budget, projects, staff, eras) — the same overload risk applies going turn→real-time as applied
  going real-time→turn in Meier's prototype, which argues for auto-pause-on-decision (see Q1/Q4) as
  a mandatory mitigation, not an optional polish item.
- Phantom Brigade's "plan in a paused/slowed state, resolve over a short real-time window, repeat"
  loop is close to a template: era-turns could become "windows" of fixed real-time length that the
  clock flows through, while individual player actions still resolve at fixed points (start of
  window = old "turn start," window's end = old "End turn").

### Gaps
- ⚠️ I found no documented case of a shipped small commercial game explicitly restructuring an
  existing turn-based prototype into flowing real time mid-development (the reverse direction the
  brief asks about) with a public postmortem describing what broke. The closest documented material
  is Civilization's reverse conversion (real-time → turn-based) and Phantom Brigade's ground-up
  hybrid design (never a pure turn-based build that was converted). This is a genuine gap, not an
  oversight — a targeted follow-up search on GDC Vault talks specifically about "converting turn
  systems to real time" would be the next step if more time were available.
- I did not confirm details of Civilization's multiplayer timed-turn system (simultaneous
  turns with a countdown clock) from a primary source within budget; it is mentioned in general
  strategy-game community knowledge but I have no citation to include here, so it is omitted.

---

## Key Question 4: Replacing the per-turn action cap

### Takeaway
Every real-time/RTwP management sim reviewed here replaces a turn-based "N actions per turn" cap
with one or more of: (a) resources that accrue continuously per tick and are spent on demand
(mana/money/research points), (b) fixed build/train/research durations that occupy a
slot/queue, (c) a hard cap on concurrently active projects or workers, and (d) cooldowns on
individual actions. None of the sources reviewed describe a discrete "moves per turn" counter
surviving a conversion to flowing time unmodified.

### Cited Findings
- RimWorld colonists consume roughly one "unit of work" per ~60 ticks (~1 real second at Normal
  speed) — i.e., action throughput is capped by how much simulated labor-time a task requires, not
  by a turn-action counter — and the player's real lever is reordering/prioritizing the work queue
  rather than spending a fixed number of moves. — [RimWorld Wiki: Time](https://rimworldwiki.com/wiki/Time) (read in full)
- Paradox games cap the player primarily through economics and duration: constructing something or
  moving an army takes a computable number of ticks/days (movement speed is determined by hardcoded
  inter-province distance, so an ordered move reports back exactly which future day it will
  complete), and diplomatic/military actions draw down accruing resources (mana points, manpower,
  treasury) rather than an action-per-turn counter. — [search-tool synthesis over Paradox forum results](https://forum.paradoxplaza.com/forum/threads/is-it-turn-based-real-time-or-real-time-with-pause.913904/) ⚠️ (search-summary only — general characterization, not fetched)
- Prison Architect's Pause mode explicitly still allows queuing construction/management tasks —
  i.e., "pause" is decoupled from "the player cannot act," which matters because it means the
  action-cap in these games is about resource/time cost, not about disabling input while stopped. — [Prison Architect Wiki: Clock](https://prison-architect.fandom.com/wiki/Clock) ⚠️ (search-summary only)

### Inferences
- For this specific game, the cleanest conversion of "2 moves per turn" is to make each action
  occupy one of a small number of concurrent "project slots" that clears after a fixed number of
  ticks (mirroring the existing era-turn-length variation: 3-month projects vs. 0.25-month
  projects would simply take proportionally more or fewer ticks to resolve), while the per-turn
  budget becomes a per-tick or per-month accrual rate that the player spends against a running
  balance rather than a balance that resets every turn.
- Because the source game already varies turn length by era (3, 3, 1, 1, 0.25 months), the tick
  length itself is a natural pacing lever already present in the design — this maps directly onto
  the "seconds-per-day changes over the game" pattern discussed in Key Question 5, rather than
  requiring a new mechanic.

### Gaps
- I do not have a directly-read primary source specifically enumerating Paradox's cooldown/mana
  systems (e.g., EU4 "monarch points," CK3 "renown/piety accrual rates") — the claim above is
  characterized conservatively and flagged as a search-summary synthesis rather than presented as
  a verified fact with specific numbers.

---

## Key Question 5: Events and decisions when time is running

### Takeaway
Auto-pause-on-decision is close to universal across the RTwP games surveyed (Stellaris, CK3,
RimWorld, Frostpunk all do it, configurably), and is treated by their communities as necessary
rather than optional — the alternative (letting the clock run through an unanswered decision) is
consistently reported as a source of player frustration or missed content, not a viable relaxed
default.

### Cited Findings
- Stellaris: event auto-pause is on by default for many message categories and independently
  toggleable per category in Settings → Messages, functionally letting a player convert the game
  into "pseudo-turn-based" by pausing on every notification if desired. — [Steam Community: Auto-pause unpausing?](https://steamcommunity.com/app/281990/discussions/0/357286033299834552/) ⚠️ (search-summary only)
- CK3 auto-pauses on decision-bearing events in singleplayer only (not multiplayer, where the
  clock keeps running for other players while one is prompted), with a distinct caution-icon
  speed-indicator state (plus an audio cue) to signal "auto-paused," separate from "manually
  paused." — [Paradox Forums: Is Autopause on Events a setting?](https://forum.paradoxplaza.com/forum/threads/is-autopause-on-events-a-setting.1445451/) ⚠️ (search-summary only)
- RimWorld has configurable pause-on-event preferences so a major threat, an incoming letter, or
  another notable incident can auto-stop time and pull player focus to the alert. — [Steam Community: What keeps making my game pause?](https://steamcommunity.com/app/294100/discussions/0/1744480967028550929/) ⚠️ (search-summary only)
- Frostpunk both auto-pauses and resets speed to Normal for triggered story events, and separately
  forces the clock back to Normal speed at in-game 5 a.m. daily specifically to prompt the player to
  check upcoming weather/temperature and other priorities before the day's decisions lock in —
  described by the developers as intentional, not a bug, despite sustained player requests to make
  it optional. — [Steam Community: Please stop resetting my defined game speed](https://steamcommunity.com/app/323190/discussions/0/1696045708643572493/) ⚠️ (search-summary only)

### Inferences
- For a small solo-dev web game, auto-pause-on-decision is a cheap, high-leverage feature relative
  to its payoff: it is the mechanism every reviewed game uses to guarantee the player never
  "misses" a decision purely because the clock was running, without requiring any inbox/queue UI.
- An inbox/notification-tray pattern (distinct from hard auto-pause) was not found documented in
  any of the sources fetched in full for this brief; it appears to be more common in idle/mobile
  games than in the specific RTwP titles surveyed here, so it is not asserted as a validated
  pattern — see Gaps.

### Gaps
- ⚠️ I did not find a primary or fully-read source describing a "decisions queue in an inbox that
  the player can address on their own schedule while time keeps running" pattern (as opposed to
  hard auto-pause) in any of the specific games searched. This is a real gap: the brief specifically
  asked about inbox/notification-tray-style decision queuing, and I could not verify a concrete
  example within the tool budget for this pass.

---

## Key Question 6: Pacing across the game — does the meaning of a tick change, and is there fast-forward-to-next-event?

### Takeaway
The clearest documented example of *speed itself* becoming the difficulty/pacing lever rather than
a fixed constant is Kairosoft's gating of high-speed mode behind a first playthrough; Paradox
games instead let processing cost (not a designed cap) create natural late-game slowdown, which
their own communities describe as an unintended pacing problem rather than a designed one. I did
not find confirmed examples of "seconds-per-day" being deliberately changed era-to-era as a
designed pacing tool (as opposed to happening as an unplanned performance side-effect).

### Cited Findings
- Kairosoft games commonly restrict their fastest simulation-speed mode to unlock only after a
  first playthrough (and in later titles, gate it further behind in-app purchase), using top speed
  itself as a controlled unlock rather than making it available from turn/day one. — [Pocket Tactics: The PT History Lesson Vol. 5 – Kairosoft](https://www.pockettactics.com/kairosoft-history) ⚠️ (search-summary only)
- Both CK3 and EU4 communities report that per-tick processing cost climbs as a campaign
  progresses (more characters/provinces/events to evaluate each tick), so the same nominal "speed
  5" setting delivers less and less real-time throughput deeper into a game — an emergent,
  unplanned slowdown that compounds late-game, rather than a designed pacing curve. — [Paradox Forums: How fast do you play? (p.2)](https://forum.paradoxplaza.com/forum/threads/how-fast-do-you-play.1520770/page-2) ⚠️ (search-summary only)
- I found no evidence in any source fetched or searched for this brief of a "fast-forward to next
  event/decision" button (skip the clock straight to the next thing requiring player attention)
  in any of Frostpunk, RimWorld, Two Point Hospital, Prison Architect, Stellaris, CK3, or EU4 — the
  closest analog documented is simply running at maximum speed and letting auto-pause-on-event stop
  the clock when something arrives, rather than a dedicated "skip to next decision" control.

### Inferences
- Because the source game already changes its unit of time by era (3 → 3 → 1 → 1 → 0.25 months
  per turn), it already has, by construction, exactly the "does the meaning of a tick change over
  the game" pacing tool this question asks about — the open design question is whether real-time
  seconds-per-tick should also shrink alongside in-game-months-per-tick as the game progresses (so
  each era takes roughly the same amount of real wall-clock time), or whether shrinking the in-game
  time-per-tick alone is enough to keep pacing brisk late-game. None of the sources reviewed
  directly answer this because none of them vary their base tick length by story stage the way this
  game already does — this is a genuinely open design question rather than a documented pattern.
- The absence of a documented "skip to next event" control across every game reviewed is itself
  informative: the dominant mitigation for "nothing happening right now" is Speed 5 / uncapped
  speed, not a directed skip. A small web game could differentiate itself by adding a "fast-forward
  to next decision" control, since no precedent for it was found (positive: it may be an
  underexplored, easy win; caution: this is inference from absence of evidence, not a documented
  best practice, so treat it as an idea to prototype and test rather than a validated pattern).

### Gaps
- ⚠️ I could not confirm from any primary source whether any of the surveyed games deliberately
  changes real-time-seconds-per-simulated-day as a function of game progress (as opposed to a fixed
  cadence undermined by rising processing cost). This is the single largest unresolved question
  under Key Question 6 and would benefit from a dedicated follow-up pass (e.g., searching GDC talks
  on "pacing curves" in city-builders/4X games specifically).

---

## Key Question 7: Usability pitfalls of real-time-with-pause and mitigations

### Takeaway
The recurring, community-documented pitfalls are: (1) missed events when the clock runs past
something important, (2) "always playing paused" (RTwP becomes a de facto turn-based game anyway
because players pause constantly, undermining the intended flow feel), and (3) processing-cost
slowdown compounding over a playthrough. The consistently reported mitigation across every game
surveyed is configurable auto-pause-on-event, not any accessibility-specific redesign — I found no
sources in this pass discussing RTwP accessibility (e.g., for players with slower reaction times or
motor/cognitive access needs) specifically.

### Cited Findings
- Frostpunk's forced return to Normal speed at in-game 5 a.m., and its pause-and-reset-to-Normal
  behavior on every triggered event, are explicitly the developers' answer to "missed events" — and
  are simultaneously the community's top complaint, because players who prefer a different default
  speed have it overridden on every event and every morning. This is a clean documented example of
  the anti-missed-events mitigation directly causing the "annoying interruption" pitfall as a side
  effect. — [Steam Community: Please stop resetting my defined game speed](https://steamcommunity.com/app/323190/discussions/0/1696045708643572493/); [Steam Community: A better and more straightforward PAUSE mechanic](https://steamcommunity.com/app/323190/discussions/1/3211505894148824611/) ⚠️ (search-summary only)
- CK3 players self-report gravitating to low speeds (3) during any period with multiple ongoing
  activities and pausing manually to manage characters, effectively turning RTwP into a
  self-imposed turn-based cadence during the busiest stretches of play — i.e., "always playing
  paused" is a real, self-reported player behavior in this genre, not a hypothetical risk. — [Paradox Forums: How fast do you play?](https://forum.paradoxplaza.com/forum/threads/how-fast-do-you-play.1520770/page-2) ⚠️ (search-summary only)
- The "turnless mode" hybrid in Civilization III and the simultaneous real-time option in X-COM:
  Apocalypse are both cited by a design-focused article as hybrids that struggled to balance
  turn-based depth against real-time pacing, offered as cautionary examples rather than models to
  copy. — [Game Developer: Turn-Based vs Real-Time](https://www.gamedeveloper.com/design/turn-based-vs-real-time) (read in full)
- General design writing on turn-based vs. real-time trade-offs states plainly that turn-based
  formats let each player set their own pace and are more approachable for exactly this reason,
  while real-time removes that self-pacing freedom — implying that any RTwP system inherits some of
  this same accessibility gap for players who need more time, unless auto-pause and manual pause
  are both generous and easy to reach. — [Designer Notes: GD Column 8 — Turn-Based vs. Real-Time](https://www.designer-notes.com/game-developer-column-8-turn-based-vs-real-time/) (read in full)

### Inferences
- The Frostpunk case is the clearest evidence-based warning for this project: an aggressive,
  non-optional auto-pause/speed-reset mechanic will reliably generate sustained player complaints
  even when it is working exactly as designed to prevent missed content. The mitigation is to make
  auto-pause-on-event non-optional (protect against missed decisions) but make the *speed reset
  after resolving it* optional (resume previous speed), which is closer to what RimWorld and
  Frostpunk's "resume previous speed" behavior already does for manual pause.
- "Always playing paused" suggests that for a management sim with meaningful per-decision depth
  (like this AI-lab game, which already has explicit "moves"), the honest expectation should be
  that engaged players will spend much of their session paused, planning — which argues for
  investing UI/UX effort in a good paused-planning experience (queuing multiple actions before
  resuming) rather than in making the flowing-time view itself richer, since that's where the
  genre's own players actually spend their time.

### Gaps
- ⚠️ I found no sources in this pass — from either full reads or search summaries — specifically
  addressing RTwP accessibility for players with slower reaction times, motor impairments, or
  cognitive load concerns. This was explicitly asked in the brief and is a genuine, unaddressed gap
  in the research; a follow-up search specifically for "game accessibility real-time pause" or
  academic game-accessibility literature (e.g., work referencing the "Game Accessibility
  Guidelines" project) would be the next step.

---

## Patterns most applicable to a small turn-based web sim becoming real time (ranked)

1. **Keep the discrete tick as the simulation step; vary only how often it's called.** The
   Paradox/RimWorld pattern: the existing "resolve turn" function becomes the tick handler, called
   on a scheduler at a chosen multiplier (0×/pause, 1×, 2×, 4×...). *Tradeoff:* this is the lowest-risk,
   least-rewrite option for a solo dev under deadline, but it inherits Paradox's own failure mode —
   per-tick cost can grow as game state accumulates (more staff, more projects, more eras unlocked),
   causing unplanned late-game slowdown unless tick cost is kept flat or budgeted (RimWorld sources: [RimWorld Wiki: Time](https://rimworldwiki.com/wiki/Time); CK3 slowdown reports: [Paradox Forums](https://forum.paradoxplaza.com/forum/threads/how-fast-do-you-play.1520770/page-2) ⚠️ search-summary).

2. **Auto-pause-on-decision, resume-previous-speed-after.** Near-universal across Stellaris, CK3,
   RimWorld, and Frostpunk; the single highest-value, lowest-effort usability feature to carry over.
   *Tradeoff:* implemented too aggressively (Frostpunk's forced speed-reset-at-5am) it becomes the
   top community complaint even while doing its job — so pause the clock unconditionally on any
   decision, but let the player's chosen speed persist across the pause rather than resetting it
   (Frostpunk sources: [Steam Community](https://steamcommunity.com/app/323190/discussions/0/1696045708643572493/) ⚠️ search-summary; CK3: [Paradox Forums](https://forum.paradoxplaza.com/forum/threads/is-autopause-on-events-a-setting.1445451/) ⚠️ search-summary).

3. **Replace the 2-moves-per-turn cap with concurrent project slots + a per-tick accrual budget.**
   Instead of "2 moves, then End Turn," give the player N concurrent action/project slots that each
   occupy ticks proportional to the era's turn-length (3 months in era 1 = many ticks; 0.25 months
   in era 5 = few ticks), and let the per-turn budget become a per-tick/per-month accrual the player
   spends against a running balance. *Tradeoff:* this changes the game's core resource-pacing feel
   (a running balance is harder to reason about at a glance than "you have 2 moves left"), so it
   needs a clear UI (a queue/slots panel) to avoid feeling like an unbounded, disorienting economy —
   this is the RimWorld/Paradox "queue and accrue, don't ration by turn" pattern (sources: [RimWorld Wiki: Time](https://rimworldwiki.com/wiki/Time); general Paradox characterization ⚠️ search-summary).

4. **WeGo-style "plan while paused, resolve over a fixed window" as the smallest possible
   structural change.** Keep almost the current turn structure, but stop gating it behind an
   explicit "End Turn" button: let the player plan freely while the clock sits paused (equivalent
   to today's turn), then hit "Resume" to let the plan play out over a fixed number of ticks
   (equivalent to today's turn length), after which the clock auto-pauses again for the next
   planning phase. *Tradeoff:* lowest implementation risk of all patterns here (it's almost a
   re-skin of the existing End-Turn flow with a clock visual instead of a button), but it risks
   *not* delivering the "organic flowing time" feeling the owner explicitly wants (Game Dev
   Tycoon-style), since the game would still visually snap between discrete plan/resolve phases
   rather than showing continuous movement most of the time (sources: Frozen Synapse/WeGo: [Lines of Battle](https://linesofbattle.net/simultaneous-turns) (read in full); [Wikipedia: Frozen Synapse](https://en.wikipedia.org/wiki/Frozen_Synapse) ⚠️ search-summary).

5. **Segment-based hybrid (Phantom Brigade style): short real-time-resolved windows, replanned
   continuously.** Divide each era-turn's real months into several few-seconds-to-few-minutes
   real-time "windows"; each window plays out with visible motion/animation, then briefly pauses
   for the player to issue the next window's commands, closer to actually feeling like flowing time
   with checkpoints rather than a single instant resolve. *Tradeoff:* highest production cost of the
   patterns listed — it requires the simulation to expose meaningful mid-window state (things
   visibly progressing) rather than only start/end deltas, which is a bigger rewrite than a solo
   dev under deadline may have time for (source: [Wikipedia: Phantom Brigade](https://en.wikipedia.org/wiki/Phantom_Brigade), read in full).

6. **Full continuous RTwP with no residual "turn" concept at all** (pure Paradox/Frostpunk model:
   any tick can be extended by any duration, actions cost accruing resources with no queue-slot
   structure). *Tradeoff:* closest to the owner's explicit Game-Dev-Tycoon reference and the most
   "organic," but the highest risk for a one-person team under deadline — it requires redesigning
   the budget system (per-turn budget → per-tick accrual), the action-cap system (2 moves → some
   cooldown/queue system), and probably a good amount of UI (speed controls, event queue, auto-
   pause settings) essentially from scratch, and inherits every pitfall documented in Key Question 7
   (missed events, "always playing paused," late-game slowdown) that the other, lower-risk patterns
   above only partially inherit (sources throughout Key Questions 1–2 and 7 above).

---

## Coverage statement

**Sources fetched and read in full (WebFetch, full page content reviewed by me):**
- [RimWorld Wiki: Time](https://rimworldwiki.com/wiki/Time) — read in full; concrete tick/speed
  numbers confirmed directly from the page content.
- [Lines of Battle: Simultaneous Turns in Strategy Games](https://linesofbattle.net/simultaneous-turns) — read in full.
- [Designer Notes: GD Column 8 — Turn-Based vs. Real-Time](https://www.designer-notes.com/game-developer-column-8-turn-based-vs-real-time/) — read in full.
- [Game Developer: Turn-Based vs Real-Time](https://www.gamedeveloper.com/design/turn-based-vs-real-time) — read in full.
- [Wikipedia: Phantom Brigade](https://en.wikipedia.org/wiki/Phantom_Brigade) — read in full.

**Sources that could not be reached / read (fetch attempted and failed):**
- Paradox Forums: ["Four ticks per day"](https://admin-forum.paradoxplaza.com/forum/threads/four-ticks-per-day.1505480/page-2) — WebFetch returned only a Cloudflare
  bot-check interstitial ("Validating browser…"); the actual discussion content was never
  retrieved. Any numeric claim from this thread was excluded from these notes rather than guessed.
- [TV Tropes: Real-Time with Pause](https://tvtropes.org/pmwiki/pmwiki.php/Main/RealTimeWithPause) — WebFetch returned an HTTP 403 Forbidden; no content was retrieved from
  this page, and no claims in these notes are attributed to it beyond what appeared in the earlier
  WebSearch snippet (which itself is marked as search-summary-only where used).

**Sources known only through WebSearch's own synthesized summary (search snippets + the tool's
aggregation), not independently fetched or read by me in full — every claim drawn from these is
marked ⚠️ inline above, and this list is provided as the single place to see them all together:**
Steam Community discussion threads on EU4 (movement speed cap, max speed), CK3 (autopause,
play-speed habits, late-game slowdown), Stellaris (day/second ratio, auto-pause settings, host-only
speed control), RimWorld (pause-on-event preferences), Frostpunk (pause/speed-reset behavior,
5 a.m. reset), Two Point Hospital (speed controls), Prison Architect Fandom wiki ("Clock" page),
Nexus Mods (Frostpunk time-control mod description), Pocket Tactics (Kairosoft history), Medium
(Mini Metro design essay), and the Steam "Hearts of Iron IV Developer Diary | Performance"
announcement. Paradox Forums thread "Is it turn-based, real-time or real-time with pause?" was
used only as a general-characterization citation and was likewise not independently fetched.
Wikipedia's Frozen Synapse and FTL: Faster Than Light pages were cited from WebSearch's summary
only, not independently fetched (though the Lines of Battle and Designer Notes / Game Developer
articles that cover much of the same ground were fetched and read in full, which partially
corroborates the Frozen Synapse and FTL characterizations above).

**Topics searched with no usable/relevant results (queries returned off-topic or generic
material, and are noted as gaps rather than filled with a low-confidence claim):**
- A dedicated developer postmortem describing a shipped small game's mid-development conversion
  from a turn-based prototype to flowing real time (the reverse of the Civilization case) —
  not found within budget.
- Civilization's multiplayer timed-turn/simultaneous-turn-with-countdown system — not confirmed
  from a primary source.
- A documented "inbox / notification tray" decision-queuing pattern (as distinct from hard
  auto-pause) in any specific shipped game — not found within budget.
- Whether any surveyed game deliberately varies real-time-seconds-per-simulated-day as a designed
  pacing curve (as opposed to an unplanned processing-cost slowdown) — not found within budget.
- RTwP accessibility literature (reaction time, motor, or cognitive access) — a search specifically
  worded around "Big Pharma" (the management-sim game) returned entirely unrelated pharmaceutical-
  industry business results and was abandoned rather than force-fit into these notes; Big Pharma
  (the game) and Software Inc./Startup Company were not otherwise covered in this pass.
