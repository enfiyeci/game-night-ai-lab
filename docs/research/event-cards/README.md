# Event cards and warnings

Research for plan 2B Task 8 (advisors, warnings and event cards), produced on 2026-09-26 by four
research subagents and one synthesis pass. It covers how Game Dev Tycoon and similar games
present events, dilemmas and warnings, and what this repo's specs, plans and sim already decide.
Treat it as raw research: claims read only through search snippets or failed fetches carry ⚠️.

## Reading order

1. `report.md`: the synthesis, ending with "Implications for Game Night" and a merged coverage
   section.
2. `notes/our_plans_and_sim.md`: what the spec, plans 2B/2C/2E/2G and the sim decide, with the
   full inventory of 36 event rows. It is the best-sourced note (repo files read directly).
3. `notes/game_dev_tycoon_and_game_dev_story.md`, `notes/dilemma_card_formats.md` and
   `notes/warning_patterns.md`: the three game surveys, each with its own coverage statement.
4. `suggestions-2026-09-26.html`: the seven decisions put to the owner, built from the above.

## Notable catches

- Every Fandom wiki page returned HTTP 402, so the Frostpunk, FTL, Chirper and Two Point
  Hospital details rest on search summaries.
- Whether Game Dev Tycoon pauses time during a pop-up is unconfirmed; Game Dev Story's event
  presentation is barely documented anywhere.
- Plan 2C's "Deferred balance work" section is on `main` only (commit `799368d`), not on
  `ui`. The orchestrator read it there; it has nothing on events.
- The plans note's prose list of rows with a warning step is off (it says "seven planted" but
  names eight, and leaves out `siteOpposition`, which its own table marks). The data has 14 such
  rows, checked by loading both data files.
