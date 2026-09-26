# Research

Research behind the Game Night design, produced 2026-09-24/25 by research subagents and
synthesized into one report. Treat it as **unverified raw research**: most sources were read
only through search-result snippets, and those claims carry ⚠️ inline.

## Reading order

1. `ai-lab-mechanics/report.md` — the synthesis: Game Dev Tycoon's mechanics, real
   training/safety/governance dynamics, the compute race, lab finances, pacing and US–China,
   advisor-based hidden risk, and a transfer map to game mechanics.
2. `ai-lab-mechanics/notes/` — the eight raw research notes the report was built from, each
   with its own coverage statement.
3. `training-options/report.md` — pretraining, midtraining, post-training and
   evaluation/release decisions with realistic options, serving cost and pricing, model
   naming; Part 2 is the game's recipe menu, servingCost formula and era locks. Its four notes
   in `training-options/notes/` read most primary technical reports directly, so this is
   better sourced than `ai-lab-mechanics/notes/training_decisions.md`, which it supersedes.
4. `compute-mechanics/report.md` — how to gather compute in the game (2026-09-25): real deal
   structures and numbers (take-or-pay, prepayment, equity-for-compute, cost per gigawatt, lead
   times), games with similar mechanics, and five candidate designs with a per-era calibration
   table. Its four notes in `compute-mechanics/notes/` read a few primary sources in full (AMD's
   warrant filing, Microsoft's and NVIDIA's announcements, four Epoch AI pages); most other
   figures are snippet-level and carry ⚠️. It deepens `ai-lab-mechanics/notes/compute_race.md`.
5. `runway-history/runway_history.md` — OpenAI and Anthropic cash-runway history and real
   "ran out of money" endings (Inflection, Adept, Character.AI, Stability AI), used to
   calibrate the out-of-money ending.
6. `realtime-time-flow/report.md` — turning the 20 turns into a running clock (2026-09-26):
   how Game Dev Tycoon's time works (it has no speed buttons), how real-time-with-pause games
   run a clock over a fixed tick, every turn assumption in our code with file:line citations,
   and four designs with a ship-by-the-deadline verdict. See `realtime-time-flow/README.md`.
7. `event-cards/README.md` — how games present events, dilemmas and warnings (Game Dev Tycoon
   first), what our specs and sim already decide, and the event-card decisions put to the owner
   (2026-09-26).

8. `finance-planning/README.md`: game finance screens and real labs' compute plans (2026-09-25),
   behind the finance planner mockups. Subagent output; paywalled figures are second-hand.

9. `lab-boards/real-lab-boards-2026-09-26.md`: who sits on the OpenAI and Anthropic boards (and why Google
   DeepMind, Meta and xAI have none that can remove a leader), what each kind of member pushes on, and seven board
   archetypes for the game. Subagent output; several sources partly read, flagged ⚠️ inline.
10. `feed-dead-buttons.md` — how games treat controls that do nothing on fake websites and
   social feeds (2026-09-26); Football Manager's manual read in full, the rest mostly summaries.
11. `recursive-self-improvement/README.md` — how the labs describe and measure AI automating AI
   research (2026-09-26): Anthropic's "When AI builds itself" essay and automation index, the
   RSP, OpenAI and Google DeepMind thresholds, share-of-code figures, METR's measured speedups,
   and how other games model a self-accelerating loop. Start with its verified-rows table.

## Notable catches

- `ai-lab-mechanics/notes/training_decisions.md` read every source only as a snippet; its
  numbers are directional.
- The report's "Source quality" section lists claims not to state as fact (e.g., a reported
  collapse of a September 2026 pacing truce, a Sora app closure, several 2026 revenue and
  burn figures).
- Taiwan and TSMC risk was never researched.
- Compute: the cancelled Abilene expansion is 600 MW in `compute-mechanics/notes/` but 2.1 GW
  in `ai-lab-mechanics/notes/compute_race.md`; the size of the cut is uncertain.
